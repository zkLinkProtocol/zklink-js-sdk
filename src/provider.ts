import { AbstractJSONRPCTransport, DummyTransport, HTTPTransport, WSTransport } from './transport'
import { BigNumber, Contract, ethers } from 'ethers'
import {
  AccountBalances,
  AccountState,
  Address,
  ChangePubKeyFee,
  ContractAddress,
  Fee,
  LegacyChangePubKeyFee,
  Network,
  PriorityOperationReceipt,
  TokenAddress,
  TokenLike,
  Tokens,
  TransactionReceipt,
  TxEthSignature,
} from './types'
import { isTokenETH, sleep, SYNC_GOV_CONTRACT_INTERFACE, TokenSet } from './utils'
import { ErrorCode } from '@ethersproject/logger'

const EthersErrorCode = ErrorCode

export class Provider {
  contractAddress: ContractAddress[] = []
  public tokenSet: TokenSet

  // For HTTP provider
  public pollIntervalMilliSecs = 500
  public chainId: number

  private constructor(public transport: AbstractJSONRPCTransport) {}

  /**
   * @deprecated Websocket support will be removed in future. Use HTTP transport instead.
   */
  static async newWebsocketProvider(address: string): Promise<Provider> {
    const transport = await WSTransport.connect(address)
    const provider = new Provider(transport)
    provider.tokenSet = new TokenSet(await provider.getTokens())
    return provider
  }

  static async newHttpProvider(
    address: string = 'http://127.0.0.1:3030',
    pollIntervalMilliSecs?: number
  ): Promise<Provider> {
    const transport = new HTTPTransport(address)
    const provider = new Provider(transport)
    if (pollIntervalMilliSecs) {
      provider.pollIntervalMilliSecs = pollIntervalMilliSecs
    }
    provider.tokenSet = new TokenSet(await provider.getTokens())
    return provider
  }

  /**
   * Provides some hardcoded values the `Provider` responsible for
   * without communicating with the network
   */
  static async newMockProvider(
    network: string,
    ethPrivateKey: Uint8Array,
    getTokens: Function
  ): Promise<Provider> {
    const transport = new DummyTransport(network, ethPrivateKey, getTokens)
    const provider = new Provider(transport)
    provider.tokenSet = new TokenSet(await provider.getTokens())
    return provider
  }

  // return transaction hash (e.g. sync-tx:dead..beef)
  async submitTx({
    tx,
    signature,
  }: {
    tx: any
    signature?: TxEthSignature
    fastProcessing?: boolean
  }): Promise<string> {
    return await this.transport.request('tx_submit', [tx, signature])
  }

  // Requests `zkSync` server to execute several transactions together.
  // return transaction hash (e.g. sync-tx:dead..beef)
  async submitTxsBatch(
    transactions: { tx: any; signature?: TxEthSignature }[],
    ethSignatures?: TxEthSignature | TxEthSignature[]
  ): Promise<string[]> {
    let signatures: TxEthSignature[] = []
    // For backwards compatibility we allow sending single signature as well
    // as no signatures at all.
    if (ethSignatures == undefined) {
      signatures = []
    } else if (ethSignatures instanceof Array) {
      signatures = ethSignatures
    } else {
      signatures.push(ethSignatures)
    }
    return await this.transport.request('submit_txs_batch', [transactions, signatures])
  }

  async getContractAddress(linkChainId: number): Promise<ContractAddress> {
    if (this.contractAddress[linkChainId]) {
      return this.contractAddress[linkChainId]
    }
    this.contractAddress[linkChainId] = await this.transport.request('contract_address', [
      linkChainId,
    ])
    return this.contractAddress[linkChainId]
  }

  async getTokens(): Promise<Tokens> {
    return await this.transport.request('tokens', [])
  }

  async updateTokenSet(): Promise<void> {
    const updatedTokenSet = new TokenSet(await this.getTokens())
    this.tokenSet = updatedTokenSet
  }

  async getState(address: Address): Promise<AccountState> {
    return await this.transport.request('account_info_by_address', [address])
  }
  async getStateById(accountId: number): Promise<AccountState> {
    return await this.transport.request('account_info_by_id', [accountId])
  }

  async getBalance(accountId: number, subAccountId: number): Promise<AccountBalances> {
    return await this.transport.request('account_balances', [accountId, subAccountId])
  }

  async getSubAccountState(address: Address, subAccountId: number): Promise<AccountState> {
    return await this.transport.request('sub_account_info', [address, subAccountId])
  }

  // get transaction status by its hash (e.g. 0xdead..beef)
  async getTxReceipt(txHash: string): Promise<TransactionReceipt> {
    return await this.transport.request('tx_info', [txHash])
  }

  async getPriorityOpStatus(
    linkChainId: number,
    serialId: number
  ): Promise<PriorityOperationReceipt> {
    return await this.transport.request('ethop_info', [linkChainId, serialId])
  }

  async getConfirmationsForEthOpAmount(): Promise<number> {
    return await this.transport.request('get_confirmations_for_eth_op_amount', [])
  }

  async getEthTxForWithdrawal(withdrawal_hash: string): Promise<string> {
    return await this.transport.request('get_eth_tx_for_withdrawal', [withdrawal_hash])
  }

  async notifyPriorityOp(
    linkChainId: number,
    serialId: number,
    action: 'COMMIT' | 'VERIFY'
  ): Promise<PriorityOperationReceipt> {
    if (this.transport.subscriptionsSupported()) {
      return await new Promise((resolve) => {
        const subscribe = this.transport.subscribe(
          'ethop_subscribe',
          [serialId, action],
          'ethop_unsubscribe',
          (resp) => {
            subscribe
              .then((sub) => sub.unsubscribe())
              .catch((err) => console.log(`WebSocket connection closed with reason: ${err}`))
            resolve(resp)
          }
        )
      })
    } else {
      while (true) {
        const priorOpStatus = await this.getPriorityOpStatus(linkChainId, serialId)
        const notifyDone =
          action === 'COMMIT'
            ? priorOpStatus.block && priorOpStatus.block.committed
            : priorOpStatus.block && priorOpStatus.block.verified
        if (notifyDone) {
          return priorOpStatus
        } else {
          await sleep(this.pollIntervalMilliSecs)
        }
      }
    }
  }

  async notifyTransaction(hash: string, action: 'COMMIT' | 'VERIFY'): Promise<TransactionReceipt> {
    if (this.transport.subscriptionsSupported()) {
      return await new Promise((resolve) => {
        const subscribe = this.transport.subscribe(
          'tx_subscribe',
          [hash, action],
          'tx_unsubscribe',
          (resp) => {
            subscribe
              .then((sub) => sub.unsubscribe())
              .catch((err) => console.log(`WebSocket connection closed with reason: ${err}`))
            resolve(resp)
          }
        )
      })
    } else {
      while (true) {
        const transactionStatus = await this.getTxReceipt(hash)
        const notifyDone =
          action == 'COMMIT'
            ? transactionStatus.failReason ||
              (transactionStatus.block && transactionStatus.block.committed)
            : transactionStatus.failReason ||
              (transactionStatus.block && transactionStatus.block.verified)
        if (notifyDone) {
          return transactionStatus
        } else {
          await sleep(this.pollIntervalMilliSecs)
        }
      }
    }
  }

  async getTransactionFee(tx: any): Promise<BigNumber> {
    const transactionFee = await this.transport.request('get_tx_fee', [tx])
    return transactionFee
  }

  async getTokenPrice(tokenLike: TokenLike): Promise<number> {
    const tokenPrice = await this.transport.request('get_token_price', [tokenLike])
    return parseFloat(tokenPrice)
  }

  async disconnect() {
    return await this.transport.disconnect()
  }
}
