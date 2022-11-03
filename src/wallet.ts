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
  ChangePubKeyData,
  EthSignerType,
  SignedTransaction,
  TransferData,
  TxEthSignature,
  ForcedExitData,
  WithdrawData,
  ChangePubkeyTypes,
  Create2Data,
  ChainId,
  TokenId,
  OrderData,
  TokenAddress,
  OrderMatchingData,
  AccountBalances,
  TransferEntries,
  ForcedExitEntries,
  WithdrawEntries,
} from './types'
import {
  IERC20_INTERFACE,
  isTokenETH,
  MAX_ERC20_APPROVE_AMOUNT,
  SYNC_MAIN_CONTRACT_INTERFACE,
  ERC20_RECOMMENDED_DEPOSIT_GAS_LIMIT,
  getChangePubkeyMessage,
  getEthereumBalance,
  ETH_RECOMMENDED_DEPOSIT_GAS_LIMIT,
  getTimestamp,
  signMessageEIP712,
} from './utils'
import { LinkContract } from './contract'
import { isAddress } from 'ethers/lib/utils'

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

    if (this.accountId === undefined) {
      this.provider
        .getState(this.address())
        .then((r) => {
          this.accountId = r.id
        })
        .catch((e) => {})
    }
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

  async sendTransfer(transfer: TransferEntries): Promise<Transaction> {
    const signedTransferTransaction = await this.signTransfer(transfer)
    return submitSignedTransaction(signedTransferTransaction, this.provider)
  }

  async getTransferData(entries: TransferEntries): Promise<TransferData> {
    if (!this.signer) {
      throw new Error('ZKLink signer is required for sending zklink transactions.')
    }
    await this.setRequiredAccountIdFromServer('Transfer funds')

    const transactionData: TransferData = {
      ...entries,
      type: 'Transfer',
      accountId: entries.accountId || this.accountId,
      from: this.address(),
      token: this.provider.tokenSet.resolveTokenId(entries.token),
      fee: entries.fee ? entries.fee : null,
      nonce: entries.nonce == null ? await this.getNonce() : await this.getNonce(entries.nonce),
      ts: entries.ts || getTimestamp(),
    }

    if (transactionData.fee == null) {
      transactionData.fee = await this.provider.getTransactionFee({
        ...transactionData,
        fee: '0',
        amount: BigNumber.from(transactionData.amount).toString(),
      })
    }
    return transactionData
  }

  async signTransfer(entries: TransferEntries): Promise<SignedTransaction> {
    const transactionData = await this.getTransferData(entries)

    const signedTransferTransaction = await this.signer.signTransfer(transactionData)

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

  async sendForcedExit(entries: ForcedExitEntries): Promise<Transaction> {
    const signedForcedExitTransaction = await this.signForcedExit(entries)
    return submitSignedTransaction(signedForcedExitTransaction, this.provider)
  }
  async getForcedExitData(entries: ForcedExitEntries): Promise<ForcedExitData> {
    if (!this.signer) {
      throw new Error('ZKLink signer is required for sending zklink transactions.')
    }
    await this.setRequiredAccountIdFromServer('perform a Forced Exit')

    const transactionData: ForcedExitData = {
      ...entries,
      type: 'ForcedExit',
      initiatorAccountId: entries.initiatorAccountId || this.accountId,
      l2SourceToken: this.provider.tokenSet.resolveTokenId(entries.l2SourceToken),
      l1TargetToken: this.provider.tokenSet.resolveTokenId(entries.l1TargetToken),
      feeToken: this.provider.tokenSet.resolveTokenId(entries.feeToken),
      fee: entries.fee,
      nonce: entries.nonce == null ? await this.getNonce() : await this.getNonce(entries.nonce),
      ts: entries.ts || getTimestamp(),
    }

    if (transactionData.fee == null) {
      transactionData.fee = await this.provider.getTransactionFee({
        ...transactionData,
        fee: '0',
      })
    }

    return transactionData
  }
  async signForcedExit(entries: ForcedExitEntries): Promise<SignedTransaction> {
    const transactionData = await this.getForcedExitData(entries)
    const signedForcedExitTransaction = await this.signer.signForcedExit(transactionData)

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

  async signOrder(entries: OrderData): Promise<SignedTransaction> {
    if (!this.signer) {
      throw new Error('zkLink signer is required for sending zkLink transactions.')
    }
    const signedTransferTransaction = await this.signer.signOrder(entries)

    return {
      tx: signedTransferTransaction,
      ethereumSignature: null,
    }
  }
  async signOrderMatching(matching: {
    accountId: number
    subAccountId: number
    account: Address
    taker: any
    maker: any
    expectBaseAmount: BigNumberish
    expectQuoteAmount: BigNumberish
    feeToken: TokenId
    fee?: BigNumberish
    nonce?: number
  }): Promise<SignedTransaction> {
    if (!this.signer) {
      throw new Error('ZKLink signer is required for sending zklink transactions.')
    }

    await this.setRequiredAccountIdFromServer('Transfer funds')

    const transactionData: OrderMatchingData = {
      ...matching,
      type: 'OrderMatching',
      fee: matching.fee,
      feeToken: this.provider.tokenSet.resolveTokenId(matching.feeToken),
      nonce: matching.nonce == null ? await this.getNonce() : await this.getNonce(matching.nonce),
    }

    const signedTransferTransaction = await this.signer.signOrderMatching(transactionData)

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

  async sendWithdrawToEthereum(entries: WithdrawEntries): Promise<Transaction> {
    const signedWithdrawTransaction = await this.signWithdrawToEthereum(entries as any)
    return submitSignedTransaction(signedWithdrawTransaction, this.provider)
  }

  async getWithdrawData(entries: WithdrawEntries): Promise<WithdrawData> {
    if (!this.signer) {
      throw new Error('zkLink signer is required for sending zkLink transactions.')
    }
    await this.setRequiredAccountIdFromServer('Withdraw funds')
    const transactionData: WithdrawData = {
      ...entries,
      type: 'Withdraw',
      accountId: entries.accountId || this.accountId,
      from: entries.from || this.address(),
      l2SourceToken: this.provider.tokenSet.resolveTokenId(entries.l2SourceToken),
      l1TargetToken: this.provider.tokenSet.resolveTokenId(entries.l1TargetToken),
      fee: entries.fee,
      nonce: entries.nonce == null ? await this.getNonce() : await this.getNonce(entries.nonce),
      ts: entries.ts || getTimestamp(),
    }

    if (transactionData.fee == null) {
      transactionData.fee = await this.provider.getTransactionFee({
        ...transactionData,
        fee: '0',
        amount: BigNumber.from(transactionData.amount).toString(),
      })
    }
    return transactionData
  }

  async signWithdrawToEthereum(entries: WithdrawEntries): Promise<SignedTransaction> {
    const transactionData = await this.getWithdrawData(entries)
    const signedWithdrawTransaction = await await this.signer.signWithdraw(transactionData)

    const stringAmount = BigNumber.from(transactionData.amount).isZero()
      ? null
      : utils.formatEther(transactionData.amount)
    const stringFee = BigNumber.from(transactionData.fee).isZero()
      ? null
      : utils.formatEther(transactionData.fee)

    const stringToken = this.provider.tokenSet.resolveTokenSymbol(transactionData.l2SourceToken)
    const ethereumSignature =
      this.ethSigner instanceof Create2WalletSigner
        ? null
        : await this.ethMessageSigner.ethSignWithdraw({
            stringAmount,
            stringFee,
            stringToken,
            to: transactionData.to,
            nonce: transactionData.nonce,
            accountId: transactionData.accountId || this.accountId,
          })

    return {
      tx: signedWithdrawTransaction,
      ethereumSignature,
    }
  }

  async isSigningKeySet(): Promise<boolean> {
    if (!this.signer) {
      throw new Error('ZKLink signer is required for current pubkey calculation.')
    }
    const currentPubKeyHash = await this.getCurrentPubKeyHash()
    const signerPubKeyHash = await this.signer.pubKeyHash()
    return currentPubKeyHash === signerPubKeyHash
  }

  async sendChangePubKey(changePubKey: {
    chainId: number
    subAccountId: number
    feeToken: TokenId
    ethAuthType: ChangePubkeyTypes
    verifyingContract?: Address
    accountId?: number
    domainName?: string
    version?: string
    fee?: BigNumberish
    nonce?: Nonce
  }): Promise<Transaction> {
    const txData = await this.signChangePubKey(changePubKey as any)

    const currentPubKeyHash = await this.getCurrentPubKeyHash()
    if (currentPubKeyHash === (txData.tx as ChangePubKeyData).newPkHash) {
      throw new Error('Current signing key is already set')
    }

    return submitSignedTransaction(txData, this.provider)
  }

  async signChangePubKey(changePubKey: {
    type: 'ChangePubKey'
    chainId: ChainId
    subAccountId: number
    feeToken: TokenId
    fee?: BigNumberish
    ethAuthType: ChangePubkeyTypes
    verifyingContract?: string
    layerOneChainId?: number
    domainName?: string
    version?: string
    accountId?: number
    nonce?: Nonce
    ts?: number
  }): Promise<SignedTransaction> {
    if (!this.signer) {
      throw new Error('ZKLink signer is required for current pubkey calculation.')
    }
    await this.setRequiredAccountIdFromServer('Set Signing Key')

    const transactionData: ChangePubKeyData = {
      type: 'ChangePubKey',
      chainId: changePubKey.chainId,
      account: this.address(),
      accountId: changePubKey.accountId || this.accountId || (await this.getAccountId()),
      subAccountId: changePubKey.subAccountId,

      newPkHash: await this.signer.pubKeyHash(),
      fee: changePubKey.fee,
      feeToken: changePubKey.feeToken,
      nonce:
        changePubKey.nonce == null
          ? await this.getNonce()
          : await this.getNonce(changePubKey.nonce),
      ts: changePubKey.ts || getTimestamp(),
      ethAuthData: undefined,
    }

    if (changePubKey.ethAuthType === 'Onchain') {
      transactionData.ethAuthData = {
        type: 'Onchain',
      }
    } else if (changePubKey.ethAuthType === 'EthECDSA') {
      await this.setRequiredAccountIdFromServer('ChangePubKey authorized by ECDSA.')
      const contractInfo = await this.provider.getContractInfo(changePubKey.chainId)
      const changePubKeySignData = getChangePubkeyMessage(
        transactionData.newPkHash,
        transactionData.nonce,
        transactionData.accountId || this.accountId,
        changePubKey.verifyingContract || contractInfo.mainContract,
        changePubKey.layerOneChainId || contractInfo.layerOneChainId,
        changePubKey.domainName,
        changePubKey.version
      )
      const ethSignature = (await this.getEIP712Signature(changePubKeySignData)).signature
      transactionData.ethAuthData = {
        type: 'EthECDSA',
        ethSignature,
      }
    } else if (changePubKey.ethAuthType === 'EthCREATE2') {
      if (this.ethSigner instanceof Create2WalletSigner) {
        const create2data = this.ethSigner.create2WalletData
        transactionData.ethAuthData = {
          type: 'EthCREATE2',
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

    if (transactionData.fee == null) {
      transactionData.fee = await this.provider.getTransactionFee({
        ...transactionData,
        fee: '0',
      })
    }

    const signedChangePubKeyTransaction = await this.signer.signChangePubKey(transactionData)

    return {
      tx: signedChangePubKeyTransaction,
    }
  }

  async isOnchainAuthSigningKeySet(
    linkChainId: number,
    nonce: Nonce = 'committed'
  ): Promise<boolean> {
    const mainContract = await this.getMainContract(linkChainId)

    const numNonce = await this.getNonce(nonce)
    try {
      const onchainAuthFact = await mainContract.authFacts(this.address(), numNonce)
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

    const mainContract = await this.getMainContract(linkChainId)

    try {
      return mainContract.setAuthPubkeyHash(newPubKeyHash.replace('sync:', '0x'), numNonce, {
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

  async getBalances(subAccountId?: number): Promise<AccountBalances> {
    this.accountId = await this.getAccountId()
    return await this.provider.getBalance(this.accountId, subAccountId)
  }

  async getTokenBalance(tokenId: TokenId, subAccountId: number) {
    const balances = await this.getBalances()
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
    const mainContract = await this.getMainContract(linkChainId)

    try {
      const gasEstimate = await mainContract.estimateGas.depositERC20(...args).then(
        (estimate) => estimate,
        () => BigNumber.from('0')
      )
      const recommendedGasLimit = ERC20_RECOMMENDED_DEPOSIT_GAS_LIMIT
      return gasEstimate.gte(recommendedGasLimit) ? gasEstimate : recommendedGasLimit
    } catch (e) {
      this.modifyEthersError(e)
    }
  }

  async sendDepositFromEthereum(deposit: {
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
    const mainContract = await this.getMainContract(deposit.linkChainId)

    let ethTransaction

    if (!isAddress(deposit.token)) {
      throw new Error('Token address is invalid')
    }

    if (isTokenETH(deposit.token)) {
      try {
        ethTransaction = await mainContract.depositETH(deposit.depositTo, deposit.subAccountId, {
          value: BigNumber.from(deposit.amount),
          gasLimit: BigNumber.from(ETH_RECOMMENDED_DEPOSIT_GAS_LIMIT),
          ...deposit.ethTxOptions,
        })
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
        ethTransaction = await mainContract.depositERC20(...args)
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

    const mainContract = await this.getMainContract(withdraw.linkChainId)

    try {
      const ethTransaction = await mainContract.requestFullExit(
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

  async getMainContract(linkChainId: number) {
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
