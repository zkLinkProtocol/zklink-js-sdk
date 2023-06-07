import { ErrorCode } from '@ethersproject/logger'
import { BigNumber } from 'ethers'
import { AbstractJSONRPCTransport, DummyTransport, HTTPTransport, WSTransport } from './transport'
import {
  AccountBalances,
  AccountState,
  Address,
  ContractInfo,
  Tokens,
  TransactionReceipt,
  TxEthSignature,
} from './types'
import { TokenSet, sleep } from './utils'

const EthersErrorCode = ErrorCode

export class Provider {
  contractInfo: ContractInfo[]
  public tokenSet: TokenSet

  // For HTTP provider
  public pollIntervalMilliSecs = 2000
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
    rpcTimeout?: number,
    pollIntervalMilliSecs?: number
  ): Promise<Provider> {
    const transport = new HTTPTransport(address, rpcTimeout)
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

  // return transaction hash (e.g. 0xdead..beef)
  async submitTx({
    tx,
    signature,
  }: {
    tx: any
    signature?: TxEthSignature
    fastProcessing?: boolean
  }): Promise<string> {
    return await this.transport.request('sendTransaction', [tx, signature])
  }

  async getContractInfo(): Promise<ContractInfo[]> {
    if (!this.contractInfo?.length) {
      this.contractInfo = await this.transport.request('getSupportChains', [])
    }
    return this.contractInfo
  }

  async getContractInfoByChainId(chainId: number): Promise<ContractInfo> {
    const contractInfo = await this.getContractInfo()
    return contractInfo.find((v) => v.chainId === chainId)
  }

  async getTokens(): Promise<Tokens> {
    return await this.transport.request('getSupportTokens', [])
  }

  async updateTokenSet(): Promise<void> {
    const updatedTokenSet = new TokenSet(await this.getTokens())
    this.tokenSet = updatedTokenSet
  }

  async getState(address: Address): Promise<AccountState> {
    try {
      return await this.transport.request('getAccount', [address])
    } catch (e) {
      if (e?.jrpcError?.code === 201) {
        return {
          id: null,
          address: address,
          nonce: 0,
          pubKeyHash: '0x0000000000000000000000000000000000000000',
          accountType: 'unknown',
        }
      }
      throw e
    }
  }

  async getBalance(
    accountId: number,
    subAccountId?: number
  ): Promise<{
    balances: AccountBalances
  }> {
    const params = [accountId]
    if (typeof subAccountId === 'number') {
      params.push(subAccountId)
    }
    return await this.transport.request('getAccountBalances', [...params])
  }

  // get transaction status by its hash (e.g. 0xdead..beef)
  async getTxReceipt(txHash: string): Promise<TransactionReceipt> {
    const result = await this.transport.request('getTransactionByHash', [txHash, false])
    return result?.receipt
  }

  async getBlockInfo(): Promise<{
    lastBlockNumber: number
    timestamp: number
    committed: number
    verified: number
  }> {
    return await this.transport.request('getLatestBlockNumber', [])
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
        const transactionStatus = await this.getTxReceipt(hash).catch((e) => {})
        const notifyDone = transactionStatus && transactionStatus?.executed
        if (notifyDone) {
          return transactionStatus
        } else {
          await sleep(this.pollIntervalMilliSecs)
        }
      }
    }
  }

  async getTransactionFee(tx: any): Promise<BigNumber> {
    const transactionFee = await this.transport.request('estimateTransactionFee', [tx])
    return transactionFee
  }

  async disconnect() {
    return await this.transport.disconnect()
  }
}
