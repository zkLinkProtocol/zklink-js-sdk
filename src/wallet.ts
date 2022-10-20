import { BigNumber, BigNumberish, Contract, ContractTransaction, ethers, utils } from 'ethers'
import { ErrorCode } from '@ethersproject/logger'
import { EthMessageSigner } from './eth-message-signer'
import { Provider } from './provider'
import { Create2WalletSigner, Signer } from './signer'
import {
  AccountState,
  Address,
  TokenLike,
  Nonce,
  PriorityOperationReceipt,
  TransactionReceipt,
  PubKeyHash,
  ChangePubKey,
  EthSignerType,
  SignedTransaction,
  Transfer,
  TxEthSignature,
  ForcedExit,
  Withdraw,
  ChangePubkeyTypes,
  ChangePubKeyOnchain,
  ChangePubKeyECDSA,
  ChangePubKeyCREATE2,
  Create2Data,
  ChainId,
  TokenId,
  Order,
  TokenSymbol,
  TokenAddress,
  OrderMatching,
} from './types'
import {
  IERC20_INTERFACE,
  isTokenETH,
  MAX_ERC20_APPROVE_AMOUNT,
  SYNC_MAIN_CONTRACT_INTERFACE,
  ERC20_RECOMMENDED_DEPOSIT_GAS_LIMIT,
  signMessagePersonalAPI,
  getSignedBytesFromMessage,
  getChangePubkeyMessage,
  getEthereumBalance,
  ETH_RECOMMENDED_DEPOSIT_GAS_LIMIT,
  getTimestamp,
  signMessageEIP712,
} from './utils'
import { LinkContract } from './contract'

const EthersErrorCode = ErrorCode

export class ZKSyncTxError extends Error {
  constructor(message: string, public value: PriorityOperationReceipt | TransactionReceipt) {
    super(message)
  }
}

export class Wallet {
  public provider: Provider

  public contract: LinkContract

  private constructor(
    public ethSigner: ethers.Signer,
    public ethMessageSigner: EthMessageSigner,
    public cachedAddress: Address,
    public signer?: Signer,
    public accountId?: number,
    public ethSignerType?: EthSignerType
  ) {}

  connect(provider: Provider) {
    this.provider = provider

    this.contract = new LinkContract(provider, this.ethSigner)
    return this
  }

  static async fromEthSigner(
    ethWallet: ethers.Signer,
    provider: Provider,
    signer?: Signer,
    accountId?: number,
    ethSignerType?: EthSignerType
  ): Promise<Wallet> {
    if (signer == null) {
      const signerResult = await Signer.fromETHSignature(ethWallet)
      signer = signerResult.signer
      ethSignerType = ethSignerType || signerResult.ethSignatureType
    } else if (ethSignerType == null) {
      throw new Error('If you passed signer, you must also pass ethSignerType.')
    }
    const address = await ethWallet.getAddress()
    if (accountId === undefined) {
      accountId = (await provider.getState(address))?.id
    }
    const ethMessageSigner = new EthMessageSigner(ethWallet, ethSignerType)
    const wallet = new Wallet(
      ethWallet,
      ethMessageSigner,
      address,
      signer,
      accountId,
      ethSignerType
    )
    wallet.connect(provider)
    return wallet
  }

  static async fromCreate2Data(
    syncSigner: Signer,
    provider: Provider,
    create2Data: Create2Data,
    accountId?: number
  ): Promise<Wallet> {
    const create2Signer = new Create2WalletSigner(await syncSigner.pubKeyHash(), create2Data)
    return await Wallet.fromEthSigner(create2Signer, provider, syncSigner, accountId, {
      verificationMethod: 'ERC-1271',
      isSignedMsgPrefixed: true,
    })
  }

  static async fromEthSignerNoKeys(
    ethWallet: ethers.Signer,
    provider: Provider,
    accountId?: number,
    ethSignerType?: EthSignerType
  ): Promise<Wallet> {
    const ethMessageSigner = new EthMessageSigner(ethWallet, ethSignerType)
    const wallet = new Wallet(
      ethWallet,
      ethMessageSigner,
      await ethWallet.getAddress(),
      undefined,
      accountId,
      ethSignerType
    )
    wallet.connect(provider)
    return wallet
  }

  async getEIP712Signature(data: any): Promise<TxEthSignature> {
    if (this.ethSignerType == null) {
      throw new Error('ethSignerType is unknown')
    }

    const signature = await signMessageEIP712(this.ethSigner, data)

    return {
      type:
        this.ethSignerType.verificationMethod === 'ECDSA'
          ? 'EthereumSignature'
          : 'EIP1271Signature',
      signature,
    }
  }

  async getEthMessageSignature(message: ethers.utils.BytesLike): Promise<TxEthSignature> {
    if (this.ethSignerType == null) {
      throw new Error('ethSignerType is unknown')
    }

    const signedBytes = getSignedBytesFromMessage(message, !this.ethSignerType.isSignedMsgPrefixed)

    const signature = await signMessagePersonalAPI(this.ethSigner, signedBytes)

    return {
      type:
        this.ethSignerType.verificationMethod === 'ECDSA'
          ? 'EthereumSignature'
          : 'EIP1271Signature',
      signature,
    }
  }

  async getTransfer(tx: Transfer): Promise<Transfer> {
    if (!this.signer) {
      throw new Error('ZKLink signer is required for sending zklink transactions.')
    }

    await this.setRequiredAccountIdFromServer('Transfer funds')

    return this.signer.signSyncTransfer(tx)
  }

  async signSyncTransfer(transfer: {
    fromSubAccountId: number
    toSubAccountId: number
    to: Address
    token: TokenLike
    amount: BigNumberish
    fee: BigNumberish
    accountId: number
    ts?: number
    nonce: number
  }): Promise<SignedTransaction> {
    const transactionData: Transfer = {
      type: 'Transfer',
      fromSubAccountId: transfer.fromSubAccountId,
      toSubAccountId: transfer.toSubAccountId,
      accountId: transfer.accountId || this.accountId,
      from: this.address(),
      to: transfer.to,
      token: this.provider.tokenSet.resolveTokenId(transfer.token),
      amount: transfer.amount,
      fee: transfer.fee,
      ts: transfer.ts || getTimestamp(),
      nonce: transfer.nonce,
    }

    if (transactionData.fee == null) {
      transactionData.fee = await this.provider.getTransactionFee(transactionData)
    }

    const signedTransferTransaction = await this.getTransfer(transactionData)

    const stringAmount = BigNumber.from(transactionData.amount).isZero()
      ? null
      : utils.formatEther(transactionData.amount)
    const stringFee = BigNumber.from(transactionData.fee).isZero()
      ? null
      : utils.formatEther(transactionData.fee)
    const stringToken = this.provider.tokenSet.resolveTokenSymbol(transactionData.token)
    const ethereumSignature =
      this.ethSigner instanceof Create2WalletSigner
        ? null
        : await this.ethMessageSigner.ethSignTransfer({
            stringAmount,
            stringFee,
            stringToken,
            to: transactionData.to,
            nonce: transactionData.nonce,
            accountId: transactionData.accountId || this.accountId,
          })
    return {
      tx: signedTransferTransaction,
      ethereumSignature,
    }
  }

  async getOrderMatching(matching: {
    accountId: number
    account: Address
    taker: Order
    maker: Order
    expectBaseAmount: BigNumberish
    expectQuoteAmount: BigNumberish
    fee: BigNumberish
    feeToken: TokenLike
    nonce: number
  }): Promise<OrderMatching> {
    if (!this.signer) {
      throw new Error('ZKLink signer is required for sending zklink transactions.')
    }

    await this.setRequiredAccountIdFromServer('Transfer funds')

    const feeTokenId = this.provider.tokenSet.resolveTokenId(matching.feeToken)
    const transactionData = {
      accountId: matching.accountId,
      account: matching.account,
      taker: matching.taker,
      maker: matching.maker,
      expectBaseAmount: matching.expectBaseAmount,
      expectQuoteAmount: matching.expectQuoteAmount,
      fee: matching.fee,
      feeTokenId: feeTokenId,
      nonce: matching.nonce,
    }

    return this.signer.signSyncOrderMatching(transactionData)
  }

  async signSyncOrderMatching(matching: {
    accountId: number
    account: Address
    taker: any
    maker: any
    expectBaseAmount: BigNumberish
    expectQuoteAmount: BigNumberish
    fee: BigNumberish
    feeToken: TokenLike
    ts?: number
    nonce: number
  }): Promise<SignedTransaction> {
    const signedTransferTransaction = await this.getOrderMatching(matching as any)

    const stringFee = BigNumber.from(matching.fee).isZero() ? null : utils.formatEther(matching.fee)
    const stringFeeToken = this.provider.tokenSet.resolveTokenSymbol(matching.feeToken)
    const ethereumSignature =
      this.ethSigner instanceof Create2WalletSigner
        ? null
        : await this.ethMessageSigner.ethSignOrderMatching({
            stringFee,
            stringFeeToken,
            nonce: matching.nonce,
          })
    return {
      tx: signedTransferTransaction,
      ethereumSignature,
    }
  }

  async getForcedExit(tx: ForcedExit): Promise<ForcedExit> {
    if (!this.signer) {
      throw new Error('ZKLink signer is required for sending zklink transactions.')
    }
    await this.setRequiredAccountIdFromServer('perform a Forced Exit')

    return await this.signer.signSyncForcedExit(tx)
  }

  async signSyncForcedExit(forcedExit: {
    toChainId: ChainId
    target: Address
    targetSubAccountId: number
    initiatorSubAccountId: number
    l2SourceToken: TokenLike
    l1TargetToken: TokenLike
    feeToken: TokenLike
    fee?: BigNumberish
    ts?: number
    nonce: number
  }): Promise<SignedTransaction> {
    const transactionData: ForcedExit = {
      type: 'ForcedExit',
      toChainId: forcedExit.toChainId,
      initiatorAccountId: this.accountId,
      initiatorSubAccountId: forcedExit.initiatorSubAccountId,
      target: forcedExit.target,
      targetSubAccountId: forcedExit.targetSubAccountId,
      l2SourceToken: this.provider.tokenSet.resolveTokenId(forcedExit.l2SourceToken),
      l1TargetToken: this.provider.tokenSet.resolveTokenId(forcedExit.l1TargetToken),
      feeToken: this.provider.tokenSet.resolveTokenId(forcedExit.feeToken),
      fee: forcedExit.fee,
      ts: forcedExit.ts || getTimestamp(),
      nonce: forcedExit.nonce,
    }

    if (transactionData.fee == null) {
      transactionData.fee = await this.provider.getTransactionFee(transactionData)
    }

    const signedForcedExitTransaction = await this.getForcedExit(transactionData)

    const stringFee = BigNumber.from(transactionData.fee).isZero()
      ? null
      : utils.formatEther(transactionData.fee)
    const stringToken = this.provider.tokenSet.resolveTokenSymbol(transactionData.l2SourceToken)
    const stringFeeToken = this.provider.tokenSet.resolveTokenSymbol(transactionData.feeToken)
    const ethereumSignature =
      this.ethSigner instanceof Create2WalletSigner
        ? null
        : await this.ethMessageSigner.ethSignForcedExit({
            stringToken,
            stringFeeToken,
            stringFee,
            target: transactionData.target,
            nonce: transactionData.nonce,
          })

    return {
      tx: signedForcedExitTransaction,
      ethereumSignature,
    }
  }

  async syncForcedExit(forcedExit: {
    target: Address
    targetSubAccountId: number
    initiatorSubAccountId: number
    toChainId: ChainId
    subAccountId: number
    l2SourceToken: TokenLike
    l1TargetToken: TokenLike
    feeToken: TokenLike
    ts?: number
    fee?: BigNumberish
    nonce?: Nonce
  }): Promise<Transaction> {
    forcedExit.nonce =
      forcedExit.nonce != null ? await this.getNonce(forcedExit.nonce) : await this.getNonce()
    const signedForcedExitTransaction = await this.signSyncForcedExit(forcedExit as any)
    return submitSignedTransaction(signedForcedExitTransaction, this.provider)
  }

  async syncTransfer(transfer: {
    fromSubAccountId: number
    toSubAccountId: number
    to: Address
    token: TokenLike
    amount: BigNumberish
    ts?: number
    fee?: BigNumberish
    accountId?: number
    nonce?: Nonce
  }): Promise<Transaction> {
    transfer.nonce =
      transfer.nonce != null ? await this.getNonce(transfer.nonce) : await this.getNonce()

    const signedTransferTransaction = await this.signSyncTransfer(transfer as any)
    return submitSignedTransaction(signedTransferTransaction, this.provider)
  }

  async getOrder(payload: Order): Promise<Order> {
    if (!this.signer) {
      throw new Error('zkLink signer is required for sending zkLink transactions.')
    }
    return this.signer.signSyncOrder(payload as any)
  }
  async signSyncOrder(payload: Order): Promise<SignedTransaction> {
    const signedTransferTransaction = await this.getOrder(payload as any)

    return {
      tx: signedTransferTransaction,
      ethereumSignature: null,
    }
  }

  async getWithdrawFromSyncToEthereum(tx: Withdraw): Promise<Withdraw> {
    if (!this.signer) {
      throw new Error('zkLink signer is required for sending zkLink transactions.')
    }
    await this.setRequiredAccountIdFromServer('Withdraw funds')
    return await this.signer.signSyncWithdraw(tx)
  }

  async signWithdrawFromSyncToEthereum(withdraw: {
    toChainId: number
    subAccountId: number
    to: string
    l2SourceToken: TokenLike
    l1TargetToken: TokenLike
    amount: BigNumberish
    fee: BigNumberish
    withdrawFeeRatio: number
    fastWithdraw: number
    accountId: number
    ts?: number
    nonce: number
  }): Promise<SignedTransaction> {
    const transactionData: Withdraw = {
      type: 'Withdraw',
      toChainId: withdraw.toChainId,
      subAccountId: withdraw.subAccountId,
      accountId: withdraw.accountId || this.accountId,
      from: this.address(),
      to: withdraw.to,
      l2SourceToken: this.provider.tokenSet.resolveTokenId(withdraw.l2SourceToken),
      l1TargetToken: this.provider.tokenSet.resolveTokenId(withdraw.l1TargetToken),
      amount: withdraw.amount,
      withdrawFeeRatio: withdraw.withdrawFeeRatio || 0,
      fastWithdraw: withdraw.fastWithdraw,
      fee: withdraw.fee,
      ts: withdraw.ts || getTimestamp(),
      nonce: withdraw.nonce,
    }

    if (transactionData.fee == null) {
      transactionData.fee = await this.provider.getTransactionFee(transactionData)
    }

    const signedWithdrawTransaction = await this.getWithdrawFromSyncToEthereum(transactionData)

    const stringAmount = BigNumber.from(withdraw.amount).isZero()
      ? null
      : utils.formatEther(withdraw.amount)
    const stringFee = BigNumber.from(withdraw.fee).isZero() ? null : utils.formatEther(withdraw.fee)

    const stringToken = this.provider.tokenSet.resolveTokenSymbol(withdraw.l2SourceToken)
    const ethereumSignature =
      this.ethSigner instanceof Create2WalletSigner
        ? null
        : await this.ethMessageSigner.ethSignWithdraw({
            stringAmount,
            stringFee,
            stringToken,
            to: withdraw.to,
            nonce: withdraw.nonce,
            accountId: withdraw.accountId || this.accountId,
          })

    return {
      tx: signedWithdrawTransaction,
      ethereumSignature,
    }
  }

  async withdrawFromSyncToEthereum(withdraw: {
    toChainId: number
    subAccountId: number
    to: string
    l2SourceToken: TokenLike
    l1TargetToken: TokenLike
    amount: BigNumberish
    withdrawFeeRatio: number
    fastWithdraw: number
    ts?: number
    fee?: BigNumberish
    nonce?: Nonce
    fastProcessing?: boolean
  }): Promise<Transaction> {
    withdraw.nonce =
      withdraw.nonce != null ? await this.getNonce(withdraw.nonce) : await this.getNonce()

    const signedWithdrawTransaction = await this.signWithdrawFromSyncToEthereum(withdraw as any)

    return submitSignedTransaction(signedWithdrawTransaction, this.provider)
  }

  async isSigningKeySet(): Promise<boolean> {
    if (!this.signer) {
      throw new Error('ZKLink signer is required for current pubkey calculation.')
    }
    const currentPubKeyHash = await this.getCurrentPubKeyHash()
    const signerPubKeyHash = await this.signer.pubKeyHash()
    return currentPubKeyHash === signerPubKeyHash
  }

  async getChangePubKey(changePubKey: {
    linkChainId: number
    feeToken: TokenLike
    fee: BigNumberish
    nonce: number
    accountId?: number
    ethAuthData?: ChangePubKeyOnchain | ChangePubKeyECDSA | ChangePubKeyCREATE2
    ts: number
  }): Promise<ChangePubKey> {
    if (!this.signer) {
      throw new Error('ZKLink signer is required for current pubkey calculation.')
    }

    let feeTokenId =
      changePubKey.feeToken === '' || changePubKey.feeToken === undefined
        ? 1
        : this.provider.tokenSet.resolveTokenId(changePubKey.feeToken)
    const newPkHash = await this.signer.pubKeyHash()

    await this.setRequiredAccountIdFromServer('Set Signing Key')

    const changePubKeyTx: ChangePubKey = await this.signer.signSyncChangePubKey({
      accountId: changePubKey.accountId || this.accountId,
      account: this.address(),
      linkChainId: changePubKey.linkChainId,
      newPkHash,
      nonce: changePubKey.nonce,
      feeTokenId,
      fee: BigNumber.from(changePubKey.fee).toString(),
      ts: changePubKey.ts,
      ethAuthData: changePubKey.ethAuthData,
    })

    return changePubKeyTx
  }

  async signSetSigningKey(changePubKey: {
    linkChainId: number
    feeToken: TokenLike
    fee: BigNumberish
    nonce: number
    ethAuthType: ChangePubkeyTypes
    verifyingContract?: string
    chainId?: number
    domainName?: string
    version?: string
    accountId?: number
    ts?: number
  }): Promise<SignedTransaction> {
    changePubKey.ts = changePubKey.ts || getTimestamp()
    const newPubKeyHash = await this.signer.pubKeyHash()
    // request latest account id
    changePubKey.accountId = await this.getAccountId()

    let ethAuthData
    if (changePubKey.ethAuthType === 'Onchain') {
      ethAuthData = {
        type: 'Onchain',
      }
    } else if (changePubKey.ethAuthType === 'ECDSA') {
      await this.setRequiredAccountIdFromServer('ChangePubKey authorized by ECDSA.')
      const contractInfo = await this.provider.getContractInfo(changePubKey.linkChainId)
      const changePubKeySignData = getChangePubkeyMessage(
        newPubKeyHash,
        changePubKey.nonce,
        changePubKey.accountId || this.accountId,
        changePubKey.verifyingContract || contractInfo.mainContract,
        changePubKey.chainId || contractInfo.layerOneChainId,
        changePubKey.domainName,
        changePubKey.version
      )
      const ethSignature = (await this.getEIP712Signature(changePubKeySignData)).signature
      ethAuthData = {
        type: 'ECDSA',
        ethSignature,
      }
    } else if (changePubKey.ethAuthType === 'CREATE2') {
      if (this.ethSigner instanceof Create2WalletSigner) {
        const create2data = this.ethSigner.create2WalletData
        ethAuthData = {
          type: 'CREATE2',
          creatorAddress: create2data.creatorAddress,
          saltArg: create2data.saltArg,
          codeHash: create2data.codeHash,
        }
      } else {
        throw new Error('CREATE2 wallet authentication is only available for CREATE2 wallets')
      }
    } else {
      throw new Error('Unsupported SetSigningKey type')
    }

    const changePubkeyTxUnsigned = Object.assign(changePubKey, { ethAuthData })
    const changePubKeyTx = await this.getChangePubKey(changePubkeyTxUnsigned as any)

    return {
      tx: changePubKeyTx,
    }
  }

  async setSigningKey(changePubKey: {
    linkChainId: number
    feeToken: TokenLike
    ethAuthType: ChangePubkeyTypes
    chainId: number
    verifyingContract: Address
    domainName?: string
    version?: string
    fee?: BigNumberish
    nonce?: Nonce
  }): Promise<Transaction> {
    changePubKey.nonce =
      changePubKey.nonce != null ? await this.getNonce(changePubKey.nonce) : await this.getNonce()

    const txData = await this.signSetSigningKey(changePubKey as any)

    const currentPubKeyHash = await this.getCurrentPubKeyHash()
    if (currentPubKeyHash === (txData.tx as ChangePubKey).newPkHash) {
      throw new Error('Current signing key is already set')
    }

    return submitSignedTransaction(txData, this.provider)
  }

  async isOnchainAuthSigningKeySet(
    linkChainId: number,
    nonce: Nonce = 'committed'
  ): Promise<boolean> {
    const mainZkSyncContract = await this.getZkSyncMainContract(linkChainId)

    const numNonce = await this.getNonce(nonce)
    try {
      const onchainAuthFact = await mainZkSyncContract.authFacts(this.address(), numNonce)
      return (
        onchainAuthFact !== '0x0000000000000000000000000000000000000000000000000000000000000000'
      )
    } catch (e) {
      this.modifyEthersError(e)
    }
  }

  async onchainAuthSigningKey(
    linkChainId: number,
    nonce: Nonce = 'committed',
    ethTxOptions?: ethers.providers.TransactionRequest
  ): Promise<ContractTransaction> {
    if (!this.signer) {
      throw new Error('ZKLink signer is required for current pubkey calculation.')
    }

    const currentPubKeyHash = await this.getCurrentPubKeyHash()
    const newPubKeyHash = await this.signer.pubKeyHash()

    if (currentPubKeyHash === newPubKeyHash) {
      throw new Error('Current PubKeyHash is the same as new')
    }

    const numNonce = await this.getNonce(nonce)

    const mainZkSyncContract = await this.getZkSyncMainContract(linkChainId)

    try {
      return mainZkSyncContract.setAuthPubkeyHash(newPubKeyHash.replace('sync:', '0x'), numNonce, {
        gasLimit: BigNumber.from('200000'),
        ...ethTxOptions,
      })
    } catch (e) {
      this.modifyEthersError(e)
    }
  }

  async getCurrentPubKeyHash(): Promise<PubKeyHash> {
    return (await this.provider.getState(this.address())).pubKeyHash
  }

  async getNonce(nonce: Nonce = 'committed'): Promise<number> {
    if (nonce === 'committed') {
      return (await this.provider.getState(this.address())).nonce
    } else if (typeof nonce === 'number') {
      return nonce
    }
  }

  async getAccountId(): Promise<number | undefined> {
    this.accountId = (await this.provider.getState(this.address())).id
    return this.accountId
  }

  address(): Address {
    return this.cachedAddress
  }

  async getAccountState(): Promise<AccountState> {
    const state = await this.provider.getState(this.address())
    // If exsit account id, refresh it.
    if (state?.id) {
      this.accountId = state.id
    }
    return state
  }

  async getSubAccountState(subAccountId: number): Promise<AccountState> {
    return this.provider.getSubAccountState(this.address(), subAccountId)
  }

  async getBalance(token: TokenLike, subAccountId: number): Promise<BigNumber> {
    const balances = await this.provider.getBalance(this.accountId, subAccountId)
    const tokenId = this.provider.tokenSet.resolveTokenId(token)
    let balance = balances[subAccountId][tokenId]
    return balance ? BigNumber.from(balance) : undefined
  }

  async getEthereumBalance(token: TokenLike, linkChainId: ChainId): Promise<BigNumber> {
    try {
      return getEthereumBalance(
        this.ethSigner.provider,
        this.provider,
        this.cachedAddress,
        token,
        linkChainId
      )
    } catch (e) {
      this.modifyEthersError(e)
    }
  }

  async estimateGasDeposit(linkChainId: number, args: any[]) {
    const mainZkSyncContract = await this.getZkSyncMainContract(linkChainId)

    try {
      const gasEstimate = await mainZkSyncContract.estimateGas.depositERC20(...args).then(
        (estimate) => estimate,
        () => BigNumber.from('0')
      )
      const recommendedGasLimit = ERC20_RECOMMENDED_DEPOSIT_GAS_LIMIT
      return gasEstimate.gte(recommendedGasLimit) ? gasEstimate : recommendedGasLimit
    } catch (e) {
      this.modifyEthersError(e)
    }
  }

  async depositToSyncFromEthereum(deposit: {
    subAccountId: number
    depositTo: Address
    token: TokenAddress
    amount: BigNumberish
    linkChainId: number
    mapping: boolean
    ethTxOptions?: ethers.providers.TransactionRequest
    approveDepositAmountForERC20?: boolean
  }): Promise<ETHOperation> {
    const contractAddress = await this.provider.getContractInfo(deposit.linkChainId)
    const mainZkSyncContract = await this.getZkSyncMainContract(deposit.linkChainId)

    let ethTransaction

    if (isTokenETH(deposit.token)) {
      try {
        ethTransaction = await mainZkSyncContract.depositETH(
          deposit.depositTo,
          deposit.subAccountId,
          {
            value: BigNumber.from(deposit.amount),
            gasLimit: BigNumber.from(ETH_RECOMMENDED_DEPOSIT_GAS_LIMIT),
            ...deposit.ethTxOptions,
          }
        )
      } catch (e) {
        this.modifyEthersError(e)
      }
    } else {
      // ERC20 token deposit
      const erc20contract = new Contract(deposit.token, IERC20_INTERFACE, this.ethSigner)
      let nonce: number
      if (deposit.approveDepositAmountForERC20) {
        try {
          const approveTx = await erc20contract.approve(
            contractAddress.mainContract,
            MAX_ERC20_APPROVE_AMOUNT
          )
          nonce = approveTx.nonce + 1
        } catch (e) {
          this.modifyEthersError(e)
        }
      }
      const args = [
        deposit.token,
        deposit.amount,
        deposit.depositTo,
        deposit.subAccountId,
        deposit.mapping ? true : false,
        {
          nonce,
          ...deposit.ethTxOptions,
        } as ethers.providers.TransactionRequest,
      ]

      // We set gas limit only if user does not set it using ethTxOptions.
      const txRequest = args[args.length - 1] as ethers.providers.TransactionRequest
      if (txRequest.gasLimit == null) {
        try {
          txRequest.gasLimit = await this.estimateGasDeposit(deposit.linkChainId, args)
          args[args.length - 1] = txRequest
        } catch (e) {
          this.modifyEthersError(e)
        }
      }

      try {
        ethTransaction = await mainZkSyncContract.depositERC20(...args)
      } catch (e) {
        this.modifyEthersError(e)
      }
    }

    return new ETHOperation(ethTransaction, this.provider)
  }

  async emergencyWithdraw(withdraw: {
    tokenId: TokenId
    subAccountId: number
    linkChainId: number
    accountId?: number
    ethTxOptions?: ethers.providers.TransactionRequest
  }): Promise<ETHOperation> {
    const gasPrice = await this.ethSigner.provider.getGasPrice()

    let accountId: number
    if (withdraw.accountId != null) {
      accountId = withdraw.accountId
    } else if (this.accountId !== undefined) {
      accountId = this.accountId
    } else {
      const accountState = await this.getAccountState()
      if (!accountState.id) {
        throw new Error("Can't resolve account id from the zkLink node")
      }
      accountId = accountState.id
    }

    const mainZkSyncContract = await this.getZkSyncMainContract(withdraw.linkChainId)

    try {
      const ethTransaction = await mainZkSyncContract.requestFullExit(
        accountId,
        withdraw.subAccountId,
        withdraw.tokenId,
        {
          gasLimit: BigNumber.from('500000'),
          gasPrice,
          ...withdraw.ethTxOptions,
        }
      )
      return new ETHOperation(ethTransaction, this.provider)
    } catch (e) {
      this.modifyEthersError(e)
    }
  }

  async getZkSyncMainContract(linkChainId: number) {
    const contractAddress = await this.provider.getContractInfo(linkChainId)
    return new ethers.Contract(
      contractAddress.mainContract,
      SYNC_MAIN_CONTRACT_INTERFACE,
      this.ethSigner
    )
  }

  private modifyEthersError(error: any): never {
    if (this.ethSigner instanceof ethers.providers.JsonRpcSigner) {
      // List of errors that can be caused by user's actions, which have to be forwarded as-is.
      const correct_errors = [
        EthersErrorCode.NONCE_EXPIRED,
        EthersErrorCode.INSUFFICIENT_FUNDS,
        EthersErrorCode.REPLACEMENT_UNDERPRICED,
        EthersErrorCode.UNPREDICTABLE_GAS_LIMIT,
      ]
      if (!correct_errors.includes(error.code)) {
        // This is an error which we don't expect
        error.message = `Ethereum smart wallet JSON RPC server returned the following error while executing an operation: "${error.message}". Please contact your smart wallet support for help.`
      }
    }

    throw error
  }

  private async setRequiredAccountIdFromServer(actionName: string) {
    if (this.accountId === undefined) {
      const accountIdFromServer = await this.getAccountId()
      if (accountIdFromServer == null) {
        throw new Error(`Failed to ${actionName}: Account does not exist in the zkLink network`)
      } else {
        this.accountId = accountIdFromServer
      }
    }
  }
}

export class ETHOperation {
  state: 'Sent' | 'Mined' | 'Committed' | 'Verified' | 'Failed'
  error?: ZKSyncTxError
  priorityOpId?: BigNumber

  constructor(public ethTx: ContractTransaction, public zkSyncProvider: Provider) {
    this.state = 'Sent'
  }

  async awaitEthereumTxCommit() {
    if (this.state !== 'Sent') return

    const txReceipt = await this.ethTx.wait()
    for (const log of txReceipt.logs) {
      try {
        const priorityQueueLog = SYNC_MAIN_CONTRACT_INTERFACE.parseLog(log)
        if (priorityQueueLog && priorityQueueLog.args.serialId != null) {
          this.priorityOpId = priorityQueueLog.args.serialId
        }
      } catch {}
    }
    if (!this.priorityOpId) {
      throw new Error('Failed to parse tx logs')
    }

    this.state = 'Mined'
    return txReceipt
  }

  async awaitReceipt(linkChainId: number): Promise<PriorityOperationReceipt> {
    this.throwErrorIfFailedState()

    await this.awaitEthereumTxCommit()
    if (this.state !== 'Mined') return
    const receipt = await this.zkSyncProvider.notifyPriorityOp(
      linkChainId,
      this.priorityOpId.toNumber(),
      'COMMIT'
    )

    if (!receipt.executed) {
      this.setErrorState(new ZKSyncTxError('Priority operation failed', receipt))
      this.throwErrorIfFailedState()
    }

    this.state = 'Committed'
    return receipt
  }

  async awaitVerifyReceipt(linkChainId: number): Promise<PriorityOperationReceipt> {
    await this.awaitReceipt(linkChainId)
    if (this.state !== 'Committed') return

    const receipt = await this.zkSyncProvider.notifyPriorityOp(
      linkChainId,
      this.priorityOpId.toNumber(),
      'VERIFY'
    )

    this.state = 'Verified'

    return receipt
  }

  private setErrorState(error: ZKSyncTxError) {
    this.state = 'Failed'
    this.error = error
  }

  private throwErrorIfFailedState() {
    if (this.state === 'Failed') throw this.error
  }
}

export class Transaction {
  state: 'Sent' | 'Committed' | 'Verified' | 'Failed'
  error?: ZKSyncTxError

  constructor(public txData, public txHash: string, public sidechainProvider: Provider) {
    this.state = 'Sent'
  }

  async awaitReceipt(): Promise<TransactionReceipt> {
    this.throwErrorIfFailedState()

    if (this.state !== 'Sent') return
    const hash = Array.isArray(this.txHash) ? this.txHash[0] : this.txHash
    const receipt = await this.sidechainProvider.notifyTransaction(hash, 'COMMIT')

    if (!receipt.success) {
      this.setErrorState(
        new ZKSyncTxError(`zkLink transaction failed: ${receipt.failReason}`, receipt)
      )
      this.throwErrorIfFailedState()
    }

    this.state = 'Committed'
    return receipt
  }

  async awaitVerifyReceipt(): Promise<TransactionReceipt> {
    await this.awaitReceipt()
    const hash = Array.isArray(this.txHash) ? this.txHash[0] : this.txHash
    const receipt = await this.sidechainProvider.notifyTransaction(hash, 'VERIFY')

    this.state = 'Verified'
    return receipt
  }

  private setErrorState(error: ZKSyncTxError) {
    this.state = 'Failed'
    this.error = error
  }

  private throwErrorIfFailedState() {
    if (this.state === 'Failed') throw this.error
  }
}

export async function submitSignedTransaction(
  signedTx: SignedTransaction,
  provider: Provider
): Promise<Transaction> {
  const transactionHash = await provider.submitTx({
    tx: signedTx.tx,
    signature: signedTx.ethereumSignature,
  })
  return new Transaction(signedTx, transactionHash, provider)
}
