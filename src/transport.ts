import Axios from 'axios'
import * as ethers from 'ethers'
import { BigNumber } from 'ethers'
import * as websocket from 'websocket'
import { Signer } from './signer'
import { PubKeyHash } from './types'
import WebSocketAsPromised = require('websocket-as-promised')

const W3CWebSocket = websocket.w3cwebsocket

export abstract class AbstractJSONRPCTransport {
  abstract request(method: string, params): Promise<any>
  subscriptionsSupported(): boolean {
    return false
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async subscribe(
    subMethod: string,
    subParams,
    unsubMethod: string,
    cb: (data: any) => void
  ): Promise<Subscription> {
    throw new Error('subscription are not supported for this transport')
  }
  abstract disconnect()
}

// Has jrpcError field which is JRPC error object.
// https://www.jsonrpc.org/specification#error_object
export class JRPCError extends Error {
  constructor(message: string, public jrpcError: JRPCErrorObject) {
    super(message)
  }
}
export interface JRPCErrorObject {
  code: number
  message: string
  data: any
}

class Subscription {
  constructor(public unsubscribe: () => Promise<void>) {}
}

export class HTTPTransport extends AbstractJSONRPCTransport {
  public constructor(public address: string, public rpcTimeout: number = 30000) {
    super()
  }

  // JSON RPC request
  async request(method: string, params = null): Promise<any> {
    const request = {
      id: 1,
      jsonrpc: '2.0',
      method,
      params,
    }
    const CancelToken = Axios.CancelToken
    const source = CancelToken.source()
    const timeout = setTimeout(() => {
      source.cancel('JRPC Timeout')
    }, this.rpcTimeout)
    const response = await Axios.post(this.address, request, {
      cancelToken: source.token,
    }).then((resp) => {
      return resp.data
    })
    clearTimeout(timeout)
    if ('result' in response) {
      return response.result
    } else if ('error' in response) {
      throw new JRPCError(
        `zkLink API response error: code ${response.error.code}; message: ${response.error.message}`,
        response.error
      )
    } else {
      throw new Error('Unknown JRPC Error')
    }
  }

  async disconnect() {}
}

/**
 * @deprecated Websocket support will be removed in future. Use HTTP transport instead.
 */
export class WSTransport extends AbstractJSONRPCTransport {
  ws: WebSocketAsPromised
  private subscriptionCallback: Map<string, (data: any) => void>

  private constructor(public address: string) {
    super()
    this.ws = new WebSocketAsPromised(address, {
      createWebSocket: (url) => new W3CWebSocket(url),
      packMessage: (data) => JSON.stringify(data),
      unpackMessage: (data) => JSON.parse(data as string),
      attachRequestId: (data, requestId) => Object.assign({ id: requestId }, data), // attach requestId to message as `id` field
      extractRequestId: (data) => data && data.id,
    })

    this.subscriptionCallback = new Map()

    // Call all subscription callbacks
    this.ws.onUnpackedMessage.addListener((data) => {
      if (data.params && data.params.subscription) {
        const params = data.params
        if (this.subscriptionCallback.has(params.subscription)) {
          this.subscriptionCallback.get(params.subscription)(params.result)
        }
      }
    })
  }

  static async connect(address = 'ws://127.0.0.1:3031'): Promise<WSTransport> {
    const transport = new WSTransport(address)
    await transport.ws.open()
    return transport
  }

  subscriptionsSupported(): boolean {
    return true
  }

  async subscribe(
    subMethod: string,
    subParams,
    unsubMethod: string,
    cb: (data: any) => void
  ): Promise<Subscription> {
    const req = { jsonrpc: '2.0', method: subMethod, params: subParams }
    const sub = await this.ws.sendRequest(req)

    if (sub.error) {
      throw new JRPCError('Subscription failed', sub.error)
    }

    const subId = sub.result
    this.subscriptionCallback.set(subId, cb)

    const unsubscribe = async () => {
      const unsubRep = await this.ws.sendRequest({
        jsonrpc: '2.0',
        method: unsubMethod,
        params: [subId],
      })
      if (unsubRep.error) {
        throw new JRPCError(
          `Unsubscribe failed: ${subId}, ${JSON.stringify(unsubRep.error)}`,
          unsubRep.error
        )
      }
      if (unsubRep.result !== true) {
        throw new Error(`Unsubscription failed, returned false: ${subId}`)
      }
      this.subscriptionCallback.delete(subId)
    }

    return new Subscription(unsubscribe)
  }

  // JSON RPC request
  async request(method: string, params = null): Promise<any> {
    const request = {
      jsonrpc: '2.0',
      method,
      params,
    }

    const response = await this.ws.sendRequest(request, { requestId: 1 })

    if ('result' in response) {
      return response.result
    } else if ('error' in response) {
      throw new JRPCError(
        `zkLink API response error: code ${response.error.code}; message: ${response.error.message}`,
        response.error
      )
    } else {
      throw new Error('Unknown JRPC Error')
    }
  }

  async disconnect() {
    await this.ws.close()
  }
}

export class DummyTransport extends AbstractJSONRPCTransport {
  public constructor(
    public network: string,
    public ethPrivateKey: Uint8Array,
    public getTokens: Function
  ) {
    super()
  }

  async getPubKeyHash(): Promise<PubKeyHash> {
    const ethWallet = new ethers.Wallet(this.ethPrivateKey)
    const { signer } = await Signer.fromETHSignature(ethWallet)
    return await signer.pubKeyHash()
  }

  async request(method: string, params = null): Promise<any> {
    if (method == 'getSupportChains') {
      return [
        {
          chainId: 1,
          layerOneChainId: 1001,
          mainContract: '0x000102030405060708090a0b0c0d0e0f10111213',
        },
      ]
    }

    if (method == 'getSupportTokens') {
      const tokensList = this.getTokens()
      const tokens = {}

      for (const tokenItem of tokensList) {
        const token = {
          chains: tokenItem.chains,
          id: tokenItem.id,
          symbol: tokenItem.symbol,
          decimals: tokenItem.decimals,
        }
        tokens[tokenItem.id] = token
      }

      return tokens
    }
    if (method == 'estimateTransactionFee') {
      return '4070000000000000'
    }
    if (method == 'getAccount') {
      // The example `AccountState` instance:
      //  - assigns the '42' value to account_id;
      //  - assigns the committed.pubKeyHash to match the wallet's signer's PubKeyHash
      //  - adds single entry of "DAI" token to the committed balances;
      //  - adds single entry of "USDC" token to the verified balances.
      return {
        id: 42,
        address: params[0],
        nonce: 0,
        pubKeyHash: await this.getPubKeyHash(),
        subAccountNonces: {
          '0': 5,
          '1': 10,
        },
      }
    }
    if (method == 'getAccountBalances') {
      return {
        '0': {
          '1': BigNumber.from(12345).toString(),
        },
      }
    }
    if (method == 'getTransactionByHash') {
      return {
        txHash: params[0],
        tx: {
          type: 'Transfer',
          accountId: 2,
          fromSubAccountId: 0,
          toSubAccountId: 1,
          to: '0xdc9c9863167ee865edd5216964b8b99d43ee7a81',
          token: 18,
          amount: '1000000000000',
          fee: '216000000000000',
          nonce: 38192,
          signature: {
            pubKey: '5f07954b65b5407a37ec0a2c54fb4647e2014475936057bb2f52a6faab938b02',
            signature:
              '79bdeaa739557a4be289ef2bf718253ce791adc3ce5fbcb7abcad4b0a2d6e203a9c38d68d987f96ffc7a391f2518f281874f33c7a5a7110d27591ad029b31005',
          },
          ts: 1675406687,
        },
        receipt: {
          executed: true,
          success: true,
          failReason: null,
          block: 3947,
          index: 1,
        },
        updates: [
          {
            type: 'BalanceUpdate',
            updateId: 9,
            accountId: 2,
            subAccountId: 0,
            coinId: 18,
            oldBalance: '1941710093000000000000',
            newBalance: '1941709876000000000000',
            oldNonce: 38192,
            newNonce: 38193,
          },
          {
            type: 'BalanceUpdate',
            updateId: 10,
            accountId: 2,
            subAccountId: 1,
            coinId: 18,
            oldBalance: '38191000000000000',
            newBalance: '38192000000000000',
            oldNonce: 38192,
            newNonce: 38193,
          },
        ],
      }
    }
    if (method == 'sendTransaction') {
      return ['0x0d162d589577dc3fdeffb8270feb53da7415b2a82249954c40ced41ae7e2270d']
    }

    if (method == 'get_zksync_version') {
      return 'contracts-4'
    }

    return {
      method,
      params,
    }
  }

  async disconnect() {}
}
