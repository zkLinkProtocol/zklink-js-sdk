import { ErrorCode } from '@ethersproject/logger'
import { BigNumber, BigNumberish, ContractTransaction, ethers, utils } from 'ethers'
import { arrayify, isAddress, sha256 } from 'ethers/lib/utils'
import { LinkContract } from './contract'
import { EthMessageSigner } from './eth-message-signer'
import { Provider } from './provider'
import { Create2WalletSigner, Signer } from './signer'
import {
  AccountBalances,
  AccountState,
  Address,
  ChainId,
  ChangePubKeyData,
  ChangePubKeyEntries,
  Create2Data,
  EthSignerType,
  ForcedExitData,
  ForcedExitEntries,
  Nonce,
  OrderData,
  OrderMatchingData,
  OrderMatchingEntries,
  PriorityOperationReceipt,
  PubKeyHash,
  SignedTransaction,
  TokenAddress,
  TokenId,
  TokenLike,
  TransactionReceipt,
  TransferData,
  TransferEntries,
  TxEthSignature,
  WithdrawData,
  WithdrawEntries,
} from './types'
import {
  ERC20_APPROVE_TRESHOLD,
  ERC20_RECOMMENDED_DEPOSIT_GAS_LIMIT,
  ETH_RECOMMENDED_DEPOSIT_GAS_LIMIT,
  IERC20_INTERFACE,
  MAIN_CONTRACT_INTERFACE,
  MAX_ERC20_APPROVE_AMOUNT,
  getChangePubkeyMessage,
  getEthereumBalance,
  getTimestamp,
  isTokenETH,
  numberToBytesBE,
  signMessageEIP712,
} from './utils'

const EthersErrorCode = ErrorCode

export class ZKLinkTxError extends Error {
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

    try {
      if (this.accountId === undefined) {
        this.provider.getState(this.address()).then((r) => {
          this.accountId = r.id
        })
      }
    } catch (e) {}
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
    createrSigner: ethers.Signer,
    provider: Provider,
    create2Data: Create2Data,
    accountId?: number
  ): Promise<Wallet> {
    const create2Signer = new Create2WalletSigner(
      await syncSigner.pubKeyHash(),
      create2Data,
      createrSigner
    )
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
      accountId: this.accountId || (await this.getAccountId()),
      from: this.address(),
      token: this.provider.tokenSet.resolveTokenId(entries.token),
      fee: '0',
      nonce:
        entries.nonce == null ? await this.getSubNonce(entries.fromSubAccountId) : entries.nonce,
      ts: entries.ts || getTimestamp(),
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
    const ethereumSignature = await this.ethMessageSigner.ethSignTransfer({
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
      initiatorNonce:
        entries.initiatorNonce == null
          ? await this.getSubNonce(entries.initiatorSubAccountId)
          : entries.initiatorNonce,
      ts: entries.ts || getTimestamp(),
    }

    return transactionData
  }
  async signForcedExit(entries: ForcedExitEntries): Promise<SignedTransaction> {
    const transactionData = await this.getForcedExitData(entries)
    const signedForcedExitTransaction = await this.signer.signForcedExit(transactionData)

    return {
      tx: signedForcedExitTransaction,
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

  async getOrderMatchingData(entries: OrderMatchingEntries): Promise<OrderMatchingData> {
    if (!this.signer) {
      throw new Error('ZKLink signer is required for sending zklink transactions.')
    }

    await this.setRequiredAccountIdFromServer('Transfer funds')

    const transactionData: OrderMatchingData = {
      ...entries,
      account: entries.account || this.address(),
      accountId: entries.accountId || this.accountId || (await this.getAccountId()),
      type: 'OrderMatching',
      fee: '0',
      feeToken: 1,
    }

    return transactionData
  }

  async signOrderMatching(entries: OrderMatchingEntries): Promise<SignedTransaction> {
    const transactionData = await this.getOrderMatchingData(entries)
    const signedTransferTransaction = await this.signer.signOrderMatching(transactionData)

    const stringFee = BigNumber.from(transactionData.fee).isZero()
      ? null
      : utils.formatEther(transactionData.fee)
    const stringFeeToken = ''
    const ethereumSignature =
      this.ethSigner instanceof Create2WalletSigner
        ? null
        : await this.ethMessageSigner.ethSignOrderMatching({
            stringFee,
            stringFeeToken,
          })
    return {
      tx: signedTransferTransaction,
      ethereumSignature,
    }
  }

  async sendWithdrawToEthereum(entries: WithdrawEntries): Promise<Transaction> {
    const signedWithdrawTransaction = await this.signWithdrawToEthereum(entries)
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
      fee: '0',
      nonce: entries.nonce == null ? await this.getSubNonce(entries.subAccountId) : entries.nonce,
      ts: entries.ts || getTimestamp(),
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

  async sendChangePubKey(entries: ChangePubKeyEntries): Promise<Transaction> {
    const txData = await this.signChangePubKey(entries)

    if (!entries.accountId) {
      const currentPubKeyHash = await this.getCurrentPubKeyHash()
      if (currentPubKeyHash === (txData.tx as ChangePubKeyData).newPkHash) {
        throw new Error('Current signing key is already set')
      }
    }

    return submitSignedTransaction(txData, this.provider)
  }

  async getChangePubKeyData(entries: ChangePubKeyEntries): Promise<ChangePubKeyData> {
    if (!this.signer) {
      throw new Error('ZKLink signer is required for current pubkey calculation.')
    }
    // Changepubkey for others does not detect the current wallet account id
    if (!entries.accountId) {
      await this.setRequiredAccountIdFromServer('Set Signing Key')
    }
    const transactionData: ChangePubKeyData = {
      type: 'ChangePubKey',
      chainId: entries.chainId,
      account: entries.account || this.address(),
      accountId: entries.accountId || this.accountId || (await this.getAccountId()),
      subAccountId: entries.subAccountId,
      newPkHash: await this.signer.pubKeyHash(),
      fee: '0',
      feeToken: 1,
      nonce: entries.nonce == null ? await this.getNonce() : entries.nonce,
      ts: entries.ts || getTimestamp(),
    }
    if (entries.ethAuthType === 'Onchain') {
      transactionData.ethAuthData = {
        type: 'Onchain',
      }
    } else if (entries.ethAuthType === 'EthECDSA') {
      transactionData.ethAuthData = {
        type: 'EthECDSA',
        ethSignature:
          '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      }
    } else if (entries.ethAuthType === 'EthCREATE2') {
      transactionData.ethAuthData = {
        type: 'EthCREATE2',
        creatorAddress: '0x0000000000000000000000000000000000000000',
        saltArg: '0x0000000000000000000000000000000000000000000000000000000000000000',
        codeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      }
    }

    return transactionData
  }

  async signChangePubKey(entries: ChangePubKeyEntries): Promise<SignedTransaction> {
    const transactionData = await this.getChangePubKeyData(entries)
    if (entries.ethAuthType === 'Onchain') {
      transactionData.ethAuthData = {
        type: 'Onchain',
      }
    } else if (entries.ethAuthType === 'EthECDSA') {
      await this.setRequiredAccountIdFromServer('ChangePubKey authorized by ECDSA.')
      const contractInfo = await this.provider.getContractInfoByChainId(entries.chainId)
      const changePubKeySignData = getChangePubkeyMessage(
        transactionData.newPkHash,
        transactionData.nonce,
        transactionData.accountId || this.accountId,
        contractInfo.mainContract,
        contractInfo.layerOneChainId
      )
      const ethSignature = (await this.getEIP712Signature(changePubKeySignData)).signature
      transactionData.ethAuthData = {
        type: 'EthECDSA',
        ethSignature,
      }
    } else if (entries.ethAuthType === 'EthCREATE2') {
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

    const signedChangePubKeyTransaction = await this.signer.signChangePubKey(transactionData)

    return {
      tx: signedChangePubKeyTransaction,
    }
  }

  async isOnchainAuthSigningKeySet(linkChainId: number): Promise<boolean> {
    const contractAddress = await this.provider.getContractInfoByChainId(linkChainId)
    const numNonce = await this.getNonce()
    const data = MAIN_CONTRACT_INTERFACE.encodeFunctionData('authFacts', [this.address(), numNonce])
    try {
      const onchainAuthFact = await this.ethSigner.call({
        to: contractAddress.mainContract,
        data,
      })
      return (
        onchainAuthFact !== '0x0000000000000000000000000000000000000000000000000000000000000000'
      )
    } catch (e) {
      this.modifyEthersError(e)
    }
  }

  async onchainAuthSigningKey(
    linkChainId: number,
    nonce?: Nonce,
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

    const contractAddress = await this.provider.getContractInfoByChainId(linkChainId)
    const numNonce = nonce == undefined ? await this.getNonce() : nonce
    const data = MAIN_CONTRACT_INTERFACE.encodeFunctionData('setAuthPubkeyHash', [
      newPubKeyHash,
      numNonce,
    ])
    try {
      return this.ethSigner.sendTransaction({
        to: contractAddress.mainContract,
        data,
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

  async getNonce(): Promise<number> {
    return (await this.provider.getState(this.address())).nonce
  }

  async getSubNonce(subAccountId: number): Promise<number> {
    const state = await this.provider.getState(this.address())

    if (state.subAccountNonces) {
      return state.subAccountNonces[String(subAccountId)] ?? 0
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

  async getBalances(subAccountId?: number): Promise<AccountBalances> {
    this.accountId = await this.getAccountId()
    if (!this.accountId) {
      return {}
    }
    const balances = await this.provider.getBalance(this.accountId, subAccountId)
    return balances
  }

  async getTokenBalance(tokenId: TokenId, subAccountId: number) {
    const balances = await this.getBalances(subAccountId)
    return balances?.[subAccountId]?.[tokenId]
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

  async estimateGasDeposit(tx: ethers.providers.TransactionRequest) {
    try {
      const gasEstimate = await this.ethSigner.estimateGas(tx)
      return gasEstimate.gte(ERC20_RECOMMENDED_DEPOSIT_GAS_LIMIT)
        ? gasEstimate
        : ERC20_RECOMMENDED_DEPOSIT_GAS_LIMIT
    } catch (e) {
      this.modifyEthersError(e)
    }
  }

  async isERC20DepositsApproved(
    tokenAddress: Address,
    accountAddress: Address,
    linkChainId: number,
    erc20ApproveThreshold: BigNumber = ERC20_APPROVE_TRESHOLD
  ) {
    return this.contract.isERC20DepositsApproved(
      tokenAddress,
      accountAddress,
      linkChainId,
      erc20ApproveThreshold
    )
  }

  async approveERC20TokenDeposits(
    tokenAddress: Address,
    linkChainId: number,
    max_erc20_approve_amount: BigNumber = MAX_ERC20_APPROVE_AMOUNT
  ) {
    return this.contract.approveERC20TokenDeposits(
      tokenAddress,
      linkChainId,
      max_erc20_approve_amount
    )
  }

  async sendDepositFromEthereum(deposit: {
    subAccountId: number
    depositTo: Address
    token: TokenAddress
    amount: BigNumberish
    linkChainId: number
    mapping?: boolean
    ethTxOptions?: ethers.providers.TransactionRequest
    approveDepositAmountForERC20?: boolean
  }): Promise<ETHOperation> {
    const contractAddress = await this.provider.getContractInfoByChainId(deposit.linkChainId)

    let ethTransaction

    if (!isAddress(deposit.token)) {
      throw new Error('Token address is invalid')
    }

    deposit.depositTo = utils.hexZeroPad(`${deposit.depositTo}`, 32)

    if (isTokenETH(deposit.token)) {
      try {
        const data = MAIN_CONTRACT_INTERFACE.encodeFunctionData('depositETH', [
          deposit.depositTo,
          deposit.subAccountId,
        ])
        ethTransaction = await this.ethSigner.sendTransaction({
          to: contractAddress.mainContract,
          data,
          value: BigNumber.from(deposit.amount),
          gasLimit: BigNumber.from(ETH_RECOMMENDED_DEPOSIT_GAS_LIMIT),
          ...deposit.ethTxOptions,
        })
      } catch (e) {
        this.modifyEthersError(e)
      }
    } else {
      // ERC20 token deposit
      let nonce: number
      if (deposit.approveDepositAmountForERC20) {
        try {
          const data = IERC20_INTERFACE.encodeFunctionData('approve', [
            contractAddress.mainContract,
            MAX_ERC20_APPROVE_AMOUNT,
          ])
          const approveTx = await this.ethSigner.sendTransaction({
            to: deposit.token,
            data,
            ...deposit.ethTxOptions,
          })
          nonce = approveTx.nonce + 1
        } catch (e) {
          this.modifyEthersError(e)
        }
      }

      const data = MAIN_CONTRACT_INTERFACE.encodeFunctionData('depositERC20', [
        deposit.token,
        deposit.amount,
        deposit.depositTo,
        deposit.subAccountId,
        deposit.mapping ? true : false,
      ])
      const tx = {
        to: contractAddress.mainContract,
        data,
        nonce,
        ...deposit.ethTxOptions,
      }
      // We set gas limit only if user does not set it using ethTxOptions.
      if (tx.gasLimit == null) {
        if (deposit.approveDepositAmountForERC20) {
          tx.gasLimit = ERC20_RECOMMENDED_DEPOSIT_GAS_LIMIT
        } else {
          try {
            tx.gasLimit = await this.estimateGasDeposit(tx)
          } catch (e) {
            this.modifyEthersError(e)
          }
        }
      }
      try {
        ethTransaction = await this.ethSigner.sendTransaction(tx)
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
    const contractAddress = await this.provider.getContractInfoByChainId(linkChainId)
    return new ethers.Contract(
      contractAddress.mainContract,
      MAIN_CONTRACT_INTERFACE,
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
    if (this.accountId === undefined || this.accountId === null) {
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
  error?: ZKLinkTxError
  priorityOpId?: BigNumber

  constructor(public ethTx: ContractTransaction, public zkSyncProvider: Provider) {
    this.state = 'Sent'
  }

  async awaitEthereumTxCommit() {
    if (this.state !== 'Sent') return

    const txReceipt = await this.ethTx.wait()
    for (const log of txReceipt.logs) {
      try {
        const priorityQueueLog = MAIN_CONTRACT_INTERFACE.parseLog(log)
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

  async awaitReceipt(): Promise<TransactionReceipt> {
    this.throwErrorIfFailedState()

    await this.awaitEthereumTxCommit()
    const bytes = ethers.utils.concat([
      numberToBytesBE(Number(this.priorityOpId), 8),
      arrayify(this.ethTx.hash),
    ])
    const txHash = sha256(bytes)
    if (this.state !== 'Mined') return
    const receipt = await this.zkSyncProvider.notifyTransaction(txHash)

    if (!receipt.executed) {
      this.setErrorState(new ZKLinkTxError('Priority operation failed', receipt))
      this.throwErrorIfFailedState()
    }

    this.state = 'Committed'
    return receipt
  }

  private setErrorState(error: ZKLinkTxError) {
    this.state = 'Failed'
    this.error = error
  }

  private throwErrorIfFailedState() {
    if (this.state === 'Failed') throw this.error
  }
}

export class Transaction {
  state: 'Sent' | 'Committed' | 'Verified' | 'Failed'
  error?: ZKLinkTxError

  constructor(public txData, public txHash: string, public sidechainProvider: Provider) {
    this.state = 'Sent'
  }

  async awaitReceipt(): Promise<TransactionReceipt> {
    this.throwErrorIfFailedState()

    if (this.state !== 'Sent') return
    const hash = Array.isArray(this.txHash) ? this.txHash[0] : this.txHash
    const receipt = await this.sidechainProvider.notifyTransaction(hash)

    if (!receipt.success) {
      this.setErrorState(
        new ZKLinkTxError(`zkLink transaction failed: ${receipt.failReason}`, receipt)
      )
      this.throwErrorIfFailedState()
    }

    this.state = 'Committed'
    return receipt
  }

  private setErrorState(error: ZKLinkTxError) {
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
