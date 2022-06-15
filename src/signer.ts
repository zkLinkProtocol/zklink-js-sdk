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
  ChainId,
  CurveAddLiquidity,
  CurveRemoveLiquidity,
  CurveSwap,
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

  /**
   * @deprecated `Signer.*SignBytes` methods will be removed in future. Use `utils.serializeTx` instead.
   */
  transferSignBytes(transfer: {
    fromSubAccountId: number
    toSubAccountId: number
    accountId: number
    fromChainId: number
    toChainId: number
    from: Address
    to: Address
    tokenId: number
    amount: BigNumberish
    fee: BigNumberish
    ts: number
    nonce: number
    validFrom: number
    validUntil: number
  }): Uint8Array {
    return utils.serializeTransfer({
      ...transfer,
      type: 'Transfer',
      token: transfer.tokenId,
    })
  }

  async signSyncTransfer(transfer: {
    fromSubAccountId: number
    toSubAccountId: number
    accountId: number
    from: Address
    to: Address
    tokenId: number
    amount: BigNumberish
    fee: BigNumberish
    ts: number
    nonce: number
    validFrom: number
    validUntil: number
  }): Promise<Transfer> {
    const tx: Transfer = {
      ...transfer,
      type: 'Transfer',
      token: transfer.tokenId,
    }
    const msgBytes = utils.serializeTransfer(tx)
    const signature = await signTransactionBytes(this.#privateKey, msgBytes)

    return {
      ...tx,
      amount: BigNumber.from(transfer.amount).toString(),
      fee: BigNumber.from(transfer.fee).toString(),
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
    validFrom: number
    validUntil: number
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

  async signSyncCurveAddLiquidity(
    payload: CurveAddLiquidity & {
      chainId: string
      nonce: number
      validFrom: number
      validUntil: number
    }
  ): Promise<CurveAddLiquidity> {
    const tx: CurveAddLiquidity = {
      ...payload,
      type: 'L2CurveAddLiq',
    }
    const msgBytes = utils.serializeCurveAddLiquidity(tx)
    const signature = await signTransactionBytes(this.#privateKey, msgBytes)

    return {
      ...tx,
      amounts: payload.amounts.map((amount) => BigNumber.from(amount).toString()),
      collectFees: payload.collectFees.map((fee) => BigNumber.from(fee).toString()),
      fee: BigNumber.from(payload.fee).toString(),
      lpQuantity: BigNumber.from(payload.lpQuantity).toString(),
      minLpQuantity: BigNumber.from(payload.minLpQuantity).toString(),
      signature,
    }
  }

  async signSyncCurveRemoveLiquidity(
    payload: CurveRemoveLiquidity & {
      chainId: string
      nonce: number
      validFrom: number
      validUntil: number
    }
  ): Promise<CurveRemoveLiquidity> {
    const tx: CurveRemoveLiquidity = {
      ...payload,
      type: 'L2CurveRemoveLiquidity',
    }
    const msgBytes = utils.serializeCurveRemoveLiquidity(tx)
    const signature = await signTransactionBytes(this.#privateKey, msgBytes)

    return {
      ...tx,
      amounts: payload.amounts.map((amount) => BigNumber.from(amount).toString()),
      minAmounts: payload.minAmounts.map((amount) => BigNumber.from(amount).toString()),
      fee: BigNumber.from(payload.fee).toString(),
      curveFee: BigNumber.from(payload.curveFee).toString(),
      lpQuantity: BigNumber.from(payload.lpQuantity).toString(),
      signature,
    }
  }

  async signSyncCurveSwap(
    payload: CurveSwap & {
      chainId: string
      nonce: number
      validFrom: number
      validUntil: number
    }
  ): Promise<CurveSwap> {
    const tx: CurveSwap = {
      ...payload,
      type: 'CurveSwap',
    }
    const msgBytes = utils.serializeCurveSwap(tx)
    const signature = await signTransactionBytes(this.#privateKey, msgBytes)

    return {
      ...tx,
      amountIn: BigNumber.from(payload.amountIn).toString(),
      amountOut: BigNumber.from(payload.amountOut).toString(),
      amountOutMin: BigNumber.from(payload.amountOutMin).toString(),
      fee: BigNumber.from(payload.fee).toString(),
      adminFee: BigNumber.from(payload.adminFee).toString(),
      signature,
    }
  }

  async signSyncOrder(
    payload: Order & {
      validFrom: number
      validUntil: number
    }
  ): Promise<Order> {
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
  /**
   * @deprecated `Signer.*SignBytes` methods will be removed in future. Use `utils.serializeTx` instead.
   */
  withdrawSignBytes(withdraw: {
    toChainId: number
    subAccountId: number
    accountId: number
    from: Address
    ethAddress: string
    l2SourceToken: number
    l1TargetToken: number
    amount: BigNumberish
    fee: BigNumberish
    withdrawFeeRatio: number
    fastWithdraw: number
    ts: number
    nonce: number
    validFrom: number
    validUntil: number
  }): Uint8Array {
    return utils.serializeWithdraw({
      ...withdraw,
      type: 'Withdraw',
      to: withdraw.ethAddress,
      l2SourceToken: withdraw.l2SourceToken,
      l1TargetToken: withdraw.l1TargetToken,
    })
  }

  async signSyncWithdraw(withdraw: {
    toChainId: number
    subAccountId: number
    accountId: number
    from: Address
    to: string
    l2SourceToken: number
    l1TargetToken: number
    amount: BigNumberish
    fee: BigNumberish
    withdrawFeeRatio: number
    fastWithdraw: number
    ts: number
    nonce: number
    validFrom: number
    validUntil: number
  }): Promise<Withdraw> {
    const tx: Withdraw = {
      ...withdraw,
      type: 'Withdraw',
    }
    const msgBytes = utils.serializeWithdraw(tx)
    const signature = await signTransactionBytes(this.#privateKey, msgBytes)
    return {
      ...tx,
      amount: BigNumber.from(withdraw.amount).toString(),
      fee: BigNumber.from(withdraw.fee).toString(),
      signature,
    }
  }

  /**
   * @deprecated `Signer.*SignBytes` methods will be removed in future. Use `utils.serializeTx` instead.
   */
  forcedExitSignBytes(forcedExit: {
    toChainId: ChainId
    subAccountId: number
    initiatorAccountId: number
    target: Address
    l2SourceToken: number
    l1TargetToken: number
    fee: BigNumberish
    ts: number
    nonce: number
    validFrom: number
    validUntil: number
  }): Uint8Array {
    return utils.serializeForcedExit({
      ...forcedExit,
      type: 'ForcedExit',
    })
  }

  async signSyncForcedExit(forcedExit: {
    toChainId: ChainId
    subAccountId: number
    initiatorAccountId: number
    target: Address
    l2SourceToken: number
    l1TargetToken: number
    fee: BigNumberish
    ts: number
    nonce: number
    validFrom: number
    validUntil: number
  }): Promise<ForcedExit> {
    const tx: ForcedExit = {
      ...forcedExit,
      type: 'ForcedExit',
    }
    const msgBytes = utils.serializeForcedExit(tx)
    const signature = await signTransactionBytes(this.#privateKey, msgBytes)
    return {
      ...tx,
      fee: BigNumber.from(forcedExit.fee).toString(),
      signature,
    }
  }

  /**
   * @deprecated `Signer.*SignBytes` methods will be removed in future. Use `utils.serializeTx` instead.
   */
  changePubKeySignBytes(changePubKey: {
    accountId: number
    account: Address
    newPkHash: PubKeyHash
    fromChainId: number
    toChainId: number
    feeTokenId: number
    fee: BigNumberish
    ts: number
    nonce: number
    validFrom: number
    validUntil: number
  }): Uint8Array {
    return utils.serializeChangePubKey({
      ...changePubKey,
      type: 'ChangePubKey',
      feeToken: changePubKey.feeTokenId,
      // this is not important for serialization
      ethAuthData: { type: 'Onchain' },
    })
  }

  async signSyncChangePubKey(changePubKey: {
    accountId: number
    account: Address
    newPkHash: PubKeyHash
    feeTokenId: number
    fee: BigNumberish
    ts: number
    nonce: number
    ethAuthData?: ChangePubKeyOnchain | ChangePubKeyECDSA | ChangePubKeyCREATE2
    validFrom: number
    validUntil: number
  }): Promise<ChangePubKey> {
    const tx: ChangePubKey = {
      ...changePubKey,
      type: 'ChangePubKey',
      feeToken: changePubKey.feeTokenId,
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
    let message = 'Access zkLink account.\n\nOnly sign this message for a trusted client!'
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
