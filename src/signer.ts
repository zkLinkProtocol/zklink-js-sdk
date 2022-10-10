import {
  privateKeyFromSeed,
  signTransactionBytes,
  privateKeyToPubKeyHash,
  privateKeyToPubKey,
} from './crypto'
import { BigNumber, BigNumberish, ethers } from 'ethers'
import * as utils from './utils'
import {
  Address,
  EthSignerType,
  PubKeyHash,
  Transfer,
  Withdraw,
  ForcedExit,
  ChangePubKey,
  ChangePubKeyOnchain,
  ChangePubKeyECDSA,
  ChangePubKeyCREATE2,
  Create2Data,
  Order,
  OrderMatching,
} from './types'

export class Signer {
  readonly #privateKey: Uint8Array

  private constructor(privKey: Uint8Array) {
    this.#privateKey = privKey
  }

  async pubKeyHash(): Promise<PubKeyHash> {
    return await privateKeyToPubKeyHash(this.#privateKey)
  }

  async pubKey(): Promise<string> {
    return await privateKeyToPubKey(this.#privateKey)
  }

  async signSyncTransfer(tx: Transfer): Promise<Transfer> {
    const msgBytes = utils.serializeTransfer(tx)
    const signature = await signTransactionBytes(this.#privateKey, msgBytes)

    return {
      ...tx,
      amount: BigNumber.from(tx.amount).toString(),
      fee: BigNumber.from(tx.fee).toString(),
      signature,
    }
  }

  async signSyncOrderMatching(matching: {
    accountId: number
    account: Address
    taker: Order
    maker: Order
    expectBaseAmount: BigNumberish
    expectQuoteAmount: BigNumberish
    fee: BigNumberish
    feeTokenId: number
    nonce: number
  }): Promise<OrderMatching> {
    const tx: OrderMatching = {
      ...matching,
      type: 'OrderMatching',
      feeToken: matching.feeTokenId,
    }
    const msgBytes = await utils.serializeOrderMatching(tx)
    const signature = await signTransactionBytes(this.#privateKey, msgBytes)

    return {
      ...tx,
      maker: {
        ...tx.maker,
        price: BigNumber.from(tx.maker.price).toString(),
        amount: BigNumber.from(tx.maker.amount).toString(),
      },
      taker: {
        ...tx.taker,
        price: BigNumber.from(tx.taker.price).toString(),
        amount: BigNumber.from(tx.taker.amount).toString(),
      },
      fee: BigNumber.from(matching.fee).toString(),
      expectBaseAmount: BigNumber.from(matching.expectBaseAmount).toString(),
      expectQuoteAmount: BigNumber.from(matching.expectQuoteAmount).toString(),
      signature,
    } as any
  }

  async signSyncOrder(payload: Order): Promise<Order> {
    const tx: Order = {
      ...payload,
      type: 'Order',
    }
    const msgBytes = utils.serializeOrder(tx)
    const signature = await signTransactionBytes(this.#privateKey, msgBytes)

    return {
      ...tx,
      price: BigNumber.from(payload.price).toString(),
      amount: BigNumber.from(payload.amount).toString(),
      signature,
    }
  }

  async signSyncWithdraw(tx: Withdraw): Promise<Withdraw> {
    const msgBytes = utils.serializeWithdraw(tx)
    const signature = await signTransactionBytes(this.#privateKey, msgBytes)
    return {
      ...tx,
      amount: BigNumber.from(tx.amount).toString(),
      fee: BigNumber.from(tx.fee).toString(),
      signature,
    }
  }

  async signSyncForcedExit(tx: ForcedExit): Promise<ForcedExit> {
    const msgBytes = utils.serializeForcedExit(tx)
    const signature = await signTransactionBytes(this.#privateKey, msgBytes)
    return {
      ...tx,
      fee: BigNumber.from(tx.fee).toString(),
      signature,
    }
  }

  async signSyncChangePubKey(changePubKey: {
    linkChainId: number
    accountId: number
    account: Address
    newPkHash: PubKeyHash
    feeTokenId: number
    fee: BigNumberish
    ts: number
    nonce: number
    ethAuthData?: ChangePubKeyOnchain | ChangePubKeyECDSA | ChangePubKeyCREATE2
  }): Promise<ChangePubKey> {
    const tx: ChangePubKey = {
      ...changePubKey,
      type: 'ChangePubKey',
      feeToken: changePubKey.feeTokenId,
      chainId: changePubKey.linkChainId,
    }
    const msgBytes = utils.serializeChangePubKey(tx)
    const signature = await signTransactionBytes(this.#privateKey, msgBytes)
    return {
      ...tx,
      fee: BigNumber.from(changePubKey.fee).toString(),
      signature,
    }
  }

  static fromPrivateKey(pk: Uint8Array): Signer {
    return new Signer(pk)
  }

  static async fromSeed(seed: Uint8Array): Promise<Signer> {
    return new Signer(await privateKeyFromSeed(seed))
  }

  static async fromETHSignature(ethSigner: ethers.Signer): Promise<{
    signer: Signer
    ethSignatureType: EthSignerType
  }> {
    let message =
      "Sign this message to create a private key to interact with zkLink's layer 2 services.\nNOTE: This application is powered by zkLink's multi-chain network.\n\nOnly sign this message for a trusted client!"
    const signedBytes = utils.getSignedBytesFromMessage(message, false)
    const signature = await utils.signMessagePersonalAPI(ethSigner, signedBytes)
    const address = await ethSigner.getAddress()
    const ethSignatureType = await utils.getEthSignatureType(
      ethSigner.provider,
      message,
      signature,
      address
    )
    const seed = ethers.utils.arrayify(signature)
    const signer = await Signer.fromSeed(seed)
    return { signer, ethSignatureType }
  }
}

export class Create2WalletSigner extends ethers.Signer {
  public readonly address: string
  // salt for create2 function call
  public readonly salt: string
  constructor(
    public zkSyncPubkeyHash: string,
    public create2WalletData: Create2Data,
    provider?: ethers.providers.Provider
  ) {
    super()
    Object.defineProperty(this, 'provider', {
      enumerable: true,
      value: provider,
      writable: false,
    })
    const create2Info = utils.getCREATE2AddressAndSalt(zkSyncPubkeyHash, create2WalletData)
    this.address = create2Info.address
    this.salt = create2Info.salt
  }

  async getAddress() {
    return this.address
  }

  /**
   * This signer can't sign messages but we return zeroed signature bytes to comply with ethers API.
   */
  async signMessage(_message) {
    return ethers.utils.hexlify(new Uint8Array(65))
  }

  async signTransaction(_message): Promise<string> {
    throw new Error("Create2Wallet signer can't sign transactions")
  }

  connect(provider: ethers.providers.Provider): ethers.Signer {
    return new Create2WalletSigner(this.zkSyncPubkeyHash, this.create2WalletData, provider)
  }
}
