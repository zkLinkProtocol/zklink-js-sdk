import { AbstractJSONRPCTransport, DummyTransport, HTTPTransport, WSTransport } from './transport'
import { BigNumber } from 'ethers'
import {
  AccountBalances,
  AccountState,
  Address,
  BlockInfo,
  ContractInfo,
  PriorityOperationReceipt,
  Tokens,
  TransactionReceipt,
  TxEthSignature,
} from './types'
import { sleep, TokenSet } from './utils'
import { ErrorCode } from '@ethersproject/logger'

const EthersErrorCode = ErrorCode

export class Provider {
  contractInfo: ContractInfo[]
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
    await provider.getContractInfo()
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

  async getContractInfo(): Promise<ContractInfo[]> {
    if (!this.contractInfo?.length) {
      this.contractInfo = await this.transport.request('get_support_chains', [])
    }
    return this.contractInfo
  }

  async getContractInfoByChainId(chainId: number): Promise<ContractInfo> {
    const contractInfo = await this.getContractInfo()
    return contractInfo.find((v) => v.chainId === chainId)
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

  async getBalance(
    accountId: number,
    subAccountId?: number
  ): Promise<{
    balances: AccountBalances
  }> {
    const params = []
    if (accountId) {
      params.push(accountId)
    }
    if (typeof subAccountId === 'number') {
      params.push(subAccountId)
    } else {
      params.push(null)
    }
    return await this.transport.request('account_balances', [...params])
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

  async getBlockInfo(): Promise<{
    lastBlockNumber: number
    timestamp: number
    committed: number
    verified: number
  }> {
    return await this.transport.request('block_info', [])
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

  async notifyTransaction(hash: string, action: 'COMMIT' = 'COMMIT'): Promise<TransactionReceipt> {
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
        const notifyDone = transactionStatus.executed && transactionStatus.success
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

  async disconnect() {
    return await this.transport.disconnect()
  }
}
