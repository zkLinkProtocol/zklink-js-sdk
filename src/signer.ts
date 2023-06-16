import { BigNumber, BigNumberish, ethers } from 'ethers'
import { arrayify } from 'ethers/lib/utils'
import {
  privateKeyFromSeed,
  privateKeyToPubKey,
  privateKeyToPubKeyHash,
  signTransactionBytes,
} from './crypto'
import {
  Address,
  ChangePubKeyCREATE2,
  ChangePubKeyData,
  ChangePubKeyECDSA,
  ChangePubKeyOnchain,
  Create2Data,
  EthSignerType,
  ForcedExitData,
  OrderData,
  OrderMatchingData,
  PubKeyHash,
  Signature,
  TokenId,
  TransferData,
  WithdrawData,
} from './types'
import * as utils from './utils'
import { SIGN_MESSAGE } from './utils'

export class Signer {
  readonly #privateKey: Uint8Array

  private constructor(privKey: Uint8Array) {
    this.#privateKey = privKey
  }

  seed: Uint8Array

  async pubKeyHash(): Promise<PubKeyHash> {
    return await privateKeyToPubKeyHash(this.#privateKey)
  }

  async signTransactionBytes(msg: string): Promise<Signature> {
    return await signTransactionBytes(this.#privateKey, arrayify(msg))
  }

  async pubKey(): Promise<string> {
    return await privateKeyToPubKey(this.#privateKey)
  }

  async signTransfer(tx: TransferData): Promise<TransferData> {
    const msgBytes = utils.serializeTransfer(tx)
    const signature = await signTransactionBytes(this.#privateKey, msgBytes)

    return {
      ...tx,
      amount: BigNumber.from(tx.amount).toString(),
      fee: BigNumber.from(tx.fee).toString(),
      signature,
    }
  }

  async signOrderMatching(tx: OrderMatchingData): Promise<OrderMatchingData> {
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
      fee: BigNumber.from(tx.fee).toString(),
      expectBaseAmount: BigNumber.from(tx.expectBaseAmount).toString(),
      expectQuoteAmount: BigNumber.from(tx.expectQuoteAmount).toString(),
      signature,
    } as any
  }

  async signOrder(tx: OrderData): Promise<OrderData> {
    const msgBytes = utils.serializeOrder(tx)
    const signature = await signTransactionBytes(this.#privateKey, msgBytes)

    return {
      ...tx,
      price: BigNumber.from(tx.price).toString(),
      amount: BigNumber.from(tx.amount).toString(),
      signature,
    }
  }

  async signWithdraw(tx: WithdrawData): Promise<WithdrawData> {
    const msgBytes = utils.serializeWithdraw(tx)
    const signature = await signTransactionBytes(this.#privateKey, msgBytes)
    return {
      ...tx,
      amount: BigNumber.from(tx.amount).toString(),
      fee: BigNumber.from(tx.fee).toString(),
      signature,
    }
  }

  async signForcedExit(tx: ForcedExitData): Promise<ForcedExitData> {
    const msgBytes = utils.serializeForcedExit(tx)
    const signature = await signTransactionBytes(this.#privateKey, msgBytes)
    return {
      ...tx,
      exitAmount: BigNumber.from(tx.exitAmount).toString(),
      signature,
    }
  }

  async signChangePubKey(changePubKey: {
    chainId: number
    subAccountId: number
    accountId: number
    account: Address
    newPkHash: PubKeyHash
    feeToken: TokenId
    fee: BigNumberish
    ts: number
    nonce: number
    ethAuthData?: ChangePubKeyOnchain | ChangePubKeyECDSA | ChangePubKeyCREATE2
  }): Promise<ChangePubKeyData> {
    const tx: ChangePubKeyData = {
      ...changePubKey,
      type: 'ChangePubKey',
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
    const signer = new Signer(await privateKeyFromSeed(seed))
    signer.seed = seed
    return signer
  }

  static async fromETHSignature(ethSigner: ethers.Signer): Promise<{
    signer: Signer
    ethSignatureType: EthSignerType
  }> {
    const signedBytes = utils.getSignedBytesFromMessage(SIGN_MESSAGE, false)
    const signature = await utils.signMessagePersonalAPI(ethSigner, signedBytes)
    const address = await ethSigner.getAddress()
    const ethSignatureType = await utils.getEthSignatureType(
      ethSigner.provider,
      SIGN_MESSAGE,
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
    public createrSigner: ethers.Signer,
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
    return this.createrSigner.signMessage(_message)
  }

  async signTransaction(_message): Promise<string> {
    throw new Error("Create2Wallet signer can't sign transactions")
  }

  connect(provider: ethers.providers.Provider): ethers.Signer {
    return new Create2WalletSigner(
      this.zkSyncPubkeyHash,
      this.create2WalletData,
      this.createrSigner,
      provider
    )
  }
}
