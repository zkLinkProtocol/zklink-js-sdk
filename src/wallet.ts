import { TransactionResponse } from '@ethersproject/abstract-provider'
import { ErrorCode } from '@ethersproject/logger'
import {
  BigNumber,
  BigNumberish,
  ContractTransaction,
  ethers,
  utils,
} from 'ethers'
import { isAddress } from 'ethers/lib/utils'
import { EthMessageSigner } from './eth-message-signer'
import { Create2WalletSigner, Signer } from './signer'
import {
  Address,
  ChangePubKeyData,
  ChangePubKeyEntries,
  ContractData,
  ContractMatchingData,
  ContractMatchingEntries,
  Create2Data,
  EthSignerType,
  ForcedExitData,
  ForcedExitEntries,
  L1ChainId,
  Nonce,
  OrderData,
  OrderMatchingData,
  OrderMatchingEntries,
  PubKeyHash,
  SignedTransaction,
  TokenAddress,
  TokenId,
  TransferData,
  TransferEntries,
  TxEthSignature,
  WithdrawData,
  WithdrawEntries,
} from './types'
import {
  ERC20_APPROVE_TRESHOLD,
  ERC20_DEPOSIT_GAS_LIMIT,
  ERC20_RECOMMENDED_DEPOSIT_GAS_LIMIT,
  IERC20_INTERFACE,
  MAIN_CONTRACT_INTERFACE,
  MAX_ERC20_APPROVE_AMOUNT,
  getChangePubkeyMessage,
  getEthereumBalance,
  getTimestamp,
  isGasToken,
  signMessageEIP712,
} from './utils'

const EthersErrorCode = ErrorCode

export class Wallet {
  private constructor(
    public ethSigner: ethers.Signer,
    public ethMessageSigner: EthMessageSigner,
    public cachedAddress: Address,
    public signer?: Signer,
    public accountId?: number,
    public ethSignerType?: EthSignerType
  ) {}

  static async fromEthSigner(
    ethWallet: ethers.Signer,
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
    return wallet
  }

  static async fromCreate2Data(
    syncSigner: Signer,
    createrSigner: ethers.Signer,
    create2Data: Create2Data,
    accountId?: number
  ): Promise<Wallet> {
    const create2Signer = new Create2WalletSigner(
      await syncSigner.pubKeyHash(),
      create2Data,
      createrSigner
    )
    return await Wallet.fromEthSigner(create2Signer, syncSigner, accountId, {
      verificationMethod: 'ERC-1271',
      isSignedMsgPrefixed: true,
    })
  }

  static async fromEthSignerNoKeys(
    ethWallet: ethers.Signer,
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

  getTransferData(entries: TransferEntries): TransferData {
    this.requireAccountId(entries?.accountId, 'Transfer')
    this.requireNonce(entries?.nonce, 'Transfer')

    const { tokenId, tokenSymbol, ...data } = entries
    const transactionData: TransferData = {
      ...data,
      type: 'Transfer',
      from: this.address(),
      token: tokenId,
      ts: entries.ts || getTimestamp(),
    }

    return transactionData
  }

  async signTransfer(entries: TransferEntries): Promise<SignedTransaction> {
    const transactionData = this.getTransferData(entries)

    const signedTransferTransaction = await this.signer.signTransfer(
      transactionData
    )

    const stringAmount = BigNumber.from(transactionData.amount).isZero()
      ? null
      : utils.formatEther(transactionData.amount)
    const stringFee = BigNumber.from(transactionData.fee).isZero()
      ? null
      : utils.formatEther(transactionData.fee)
    const stringToken = entries.tokenSymbol
    const ethereumSignature = await this.ethMessageSigner.ethSignTransfer({
      stringAmount,
      stringFee,
      stringToken,
      to: transactionData.to,
      nonce: transactionData.nonce,
      accountId: transactionData.accountId,
    })

    return {
      tx: signedTransferTransaction,
      ethereumSignature,
    }
  }

  getForcedExitData(entries: ForcedExitEntries): ForcedExitData {
    const { l2SourceTokenId, l1TargetTokenId, ...data } = entries
    const transactionData: ForcedExitData = {
      ...data,
      type: 'ForcedExit',
      l2SourceToken: l2SourceTokenId,
      l1TargetToken: l1TargetTokenId,
      ts: entries.ts || getTimestamp(),
    }

    return transactionData
  }

  async signForcedExit(entries: ForcedExitEntries): Promise<SignedTransaction> {
    const transactionData = this.getForcedExitData(entries)
    const signedForcedExitTransaction = await this.signer.signForcedExit(
      transactionData
    )

    return {
      tx: signedForcedExitTransaction,
    }
  }

  async signOrder(entries: OrderData): Promise<SignedTransaction> {
    const signedTransferTransaction = await this.signer.signOrder(entries)

    return {
      tx: signedTransferTransaction,
      ethereumSignature: null,
    }
  }

  getOrderMatchingData(entries: OrderMatchingEntries): OrderMatchingData {
    const { feeTokenId, feeTokenSymbol, ...data } = entries
    const transactionData: OrderMatchingData = {
      ...data,
      type: 'OrderMatching',
      account: entries.account || this.address(),
      feeToken: feeTokenId,
    }

    return transactionData
  }

  async signOrderMatching(
    entries: OrderMatchingEntries
  ): Promise<SignedTransaction> {
    const transactionData = this.getOrderMatchingData(entries)
    const signedTransferTransaction = await this.signer.signOrderMatching(
      transactionData
    )

    const stringFee = BigNumber.from(transactionData.fee).isZero()
      ? null
      : utils.formatEther(transactionData.fee)
    const stringFeeToken = entries.feeTokenSymbol

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

  async signContract(entries: ContractData): Promise<SignedTransaction> {
    const signedTransferTransaction = await this.signer.signContract(entries)

    return {
      tx: signedTransferTransaction,
      ethereumSignature: null,
    }
  }

  getContractMatchingData(
    entries: ContractMatchingEntries
  ): ContractMatchingData {
    const { feeTokenId, feeTokenSymbol, ...data } = entries
    const transactionData: ContractMatchingData = {
      ...data,
      type: 'ContractMatching',
      feeToken: feeTokenId,
    }

    return transactionData
  }

  async signContractMatching(
    entries: ContractMatchingEntries
  ): Promise<SignedTransaction> {
    const transactionData = this.getContractMatchingData(entries)
    const signedTransferTransaction = await this.signer.signContractMatching(
      transactionData
    )

    const stringFee = BigNumber.from(transactionData.fee).isZero()
      ? null
      : utils.formatEther(transactionData.fee)
    const stringFeeToken = entries.feeTokenSymbol

    const ethereumSignature =
      this.ethSigner instanceof Create2WalletSigner
        ? null
        : await this.ethMessageSigner.ethSignContractMatching({
            stringFee,
            stringFeeToken,
          })
    return {
      tx: signedTransferTransaction,
      ethereumSignature,
    }
  }

  getWithdrawData(entries: WithdrawEntries): WithdrawData {
    this.requireAccountId(entries?.accountId, 'Withdraw')
    this.requireNonce(entries?.nonce, 'Withdraw')
    const { l2SourceTokenId, l2SourceTokenSymbol, l1TargetTokenId, ...data } =
      entries
    const transactionData: WithdrawData = {
      ...data,
      type: 'Withdraw',
      from: entries.from || this.address(),
      l2SourceToken: l2SourceTokenId,
      l1TargetToken: l1TargetTokenId,
      ts: entries.ts || getTimestamp(),
    }

    return transactionData
  }

  async signWithdrawToEthereum(
    entries: WithdrawEntries
  ): Promise<SignedTransaction> {
    const transactionData = this.getWithdrawData(entries)
    const signedWithdrawTransaction = await this.signer.signWithdraw(
      transactionData
    )

    const stringAmount = BigNumber.from(transactionData.amount).isZero()
      ? null
      : utils.formatEther(transactionData.amount)
    const stringFee = BigNumber.from(transactionData.fee).isZero()
      ? null
      : utils.formatEther(transactionData.fee)

    const stringToken = entries.l2SourceTokenSymbol
    const ethereumSignature =
      this.ethSigner instanceof Create2WalletSigner
        ? null
        : await this.ethMessageSigner.ethSignWithdraw({
            stringAmount,
            stringFee,
            stringToken,
            to: transactionData.to,
            nonce: transactionData.nonce,
            accountId: transactionData.accountId,
          })

    return {
      tx: signedWithdrawTransaction,
      ethereumSignature,
    }
  }

  async isSigningKeySet(currentPubKeyHash: PubKeyHash): Promise<boolean> {
    if (currentPubKeyHash === '0x0000000000000000000000000000000000000000') {
      return false
    }
    const signerPubKeyHash = await this.signer.pubKeyHash()
    return currentPubKeyHash === signerPubKeyHash
  }

  async getChangePubKeyData(
    entries: ChangePubKeyEntries
  ): Promise<ChangePubKeyData> {
    this.requireAccountId(entries?.accountId, 'ChangePubKey')
    this.requireNonce(entries?.nonce, 'ChangePubKey')

    const { feeTokenId, layerOneChainId, ...data } = entries
    const transactionData: ChangePubKeyData = {
      ...data,
      type: 'ChangePubKey',
      account: entries.account || this.address(),
      newPkHash: entries.newPkHash || (await this.signer.pubKeyHash()),
      feeToken: feeTokenId,
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
        saltArg:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        codeHash:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      }
    }

    return transactionData
  }

  async signChangePubKey(
    entries: ChangePubKeyEntries
  ): Promise<SignedTransaction> {
    const transactionData = await this.getChangePubKeyData(entries)
    if (entries.ethAuthType === 'Onchain') {
      transactionData.ethAuthData = {
        type: 'Onchain',
      }
    } else if (entries.ethAuthType === 'EthECDSA') {
      const changePubKeySignData = getChangePubkeyMessage(
        transactionData.newPkHash,
        transactionData.nonce,
        transactionData.accountId,
        entries.mainContract,
        entries.layerOneChainId
      )
      const ethSignature = (await this.getEIP712Signature(changePubKeySignData))
        .signature
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
        throw new Error(
          'CREATE2 wallet authentication is only available for CREATE2 wallets'
        )
      }
    } else {
      throw new Error('Unsupported SetSigningKey type')
    }

    const signedChangePubKeyTransaction = await this.signer.signChangePubKey(
      transactionData
    )

    return {
      tx: signedChangePubKeyTransaction,
    }
  }

  async isOnchainAuthSigningKeySet(
    mainContract: Address,
    nonce: Nonce
  ): Promise<boolean> {
    const data = MAIN_CONTRACT_INTERFACE.encodeFunctionData('authFacts', [
      this.address(),
      nonce,
    ])
    try {
      const onchainAuthFact = await this.ethSigner.call({
        to: mainContract,
        data,
      })
      return (
        onchainAuthFact !==
        '0x0000000000000000000000000000000000000000000000000000000000000000'
      )
    } catch (e) {
      this.modifyEthersError(e)
    }
  }

  async onchainAuthSigningKey(
    mainContract: Address,
    nonce: Nonce,
    currentPubKeyHash: PubKeyHash,
    ethTxOptions?: ethers.providers.TransactionRequest
  ): Promise<ContractTransaction> {
    if (!this.signer) {
      throw new Error(
        'ZKLink signer is required for current pubkey calculation.'
      )
    }

    const signerPubKeyHash = await this.signer.pubKeyHash()

    if (currentPubKeyHash === signerPubKeyHash) {
      throw new Error('Current PubKeyHash is the same as new')
    }

    const data = MAIN_CONTRACT_INTERFACE.encodeFunctionData(
      'setAuthPubkeyHash',
      [signerPubKeyHash, nonce]
    )
    try {
      return this.ethSigner.sendTransaction({
        to: mainContract,
        data,
        gasLimit: BigNumber.from('200000'),
        ...ethTxOptions,
      })
    } catch (e) {
      this.modifyEthersError(e)
    }
  }

  address(): Address {
    return this.cachedAddress
  }

  async getEthereumBalance(tokenAddress: TokenAddress): Promise<BigNumber> {
    try {
      return getEthereumBalance(
        this.ethSigner.provider,
        this.cachedAddress,
        tokenAddress
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

  async getERC20DepositsAllowance(
    mainContract: Address,
    tokenAddress: Address,
    accountAddress: Address
  ) {
    if (isGasToken(tokenAddress)) {
      return ERC20_APPROVE_TRESHOLD
    }
    try {
      const data = IERC20_INTERFACE.encodeFunctionData('allowance', [
        accountAddress,
        mainContract,
      ])

      const currentAllowance = await this.ethSigner.call({
        to: tokenAddress,
        data,
      })
      return BigNumber.from(currentAllowance)
    } catch (e) {
      this.modifyEthersError(e)
    }
  }

  async isERC20DepositsApproved(
    mainContract: Address,
    tokenAddress: Address,
    accountAddress: Address,
    erc20ApproveThreshold: BigNumber = ERC20_APPROVE_TRESHOLD
  ) {
    if (isGasToken(tokenAddress)) {
      throw new Error('ETH token does not need approval.')
    }
    try {
      const data = IERC20_INTERFACE.encodeFunctionData('allowance', [
        accountAddress,
        mainContract,
      ])

      const currentAllowance = await this.ethSigner.call({
        to: tokenAddress,
        data,
      })
      return BigNumber.from(currentAllowance).gte(erc20ApproveThreshold)
    } catch (e) {
      this.modifyEthersError(e)
    }
  }

  async approveERC20TokenDeposits(
    mainContract: Address,
    tokenAddress: Address,
    max_erc20_approve_amount: BigNumber = MAX_ERC20_APPROVE_AMOUNT
  ) {
    if (isGasToken(tokenAddress)) {
      throw Error('ETH token does not need approval.')
    }

    try {
      const data = IERC20_INTERFACE.encodeFunctionData('approve', [
        mainContract,
        max_erc20_approve_amount,
      ])

      return this.ethSigner.sendTransaction({
        to: tokenAddress,
        data,
      })
    } catch (e) {
      this.modifyEthersError(e)
    }
  }

  async sendDepositFromEthereum(deposit: {
    chainId: L1ChainId
    mainContract: Address
    subAccountId: number
    depositTo: Address
    token: TokenAddress
    amount: BigNumberish
    mapping?: boolean
    ethTxOptions?: ethers.providers.TransactionRequest
    approveDepositAmountForERC20?: boolean
  }): Promise<TransactionResponse> {
    let ethTransaction

    if (!isAddress(deposit.token)) {
      throw new Error('Token address is invalid')
    }

    deposit.depositTo = utils.hexZeroPad(`${deposit.depositTo}`, 32)

    if (isGasToken(deposit.token)) {
      try {
        const data = MAIN_CONTRACT_INTERFACE.encodeFunctionData('depositETH', [
          deposit.depositTo,
          deposit.subAccountId,
        ])
        ethTransaction = await this.ethSigner.sendTransaction({
          to: deposit.mainContract,
          data,
          value: BigNumber.from(deposit.amount),
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
            deposit.mainContract,
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
        to: deposit.mainContract,
        data,
        nonce,
        ...deposit.ethTxOptions,
      }

      if (tx.gasLimit == null) {
        if (deposit.approveDepositAmountForERC20) {
          tx.gasLimit =
            ERC20_DEPOSIT_GAS_LIMIT[deposit.chainId] ??
            ERC20_RECOMMENDED_DEPOSIT_GAS_LIMIT
        }
      }
      try {
        ethTransaction = await this.ethSigner.sendTransaction(tx)
      } catch (e) {
        this.modifyEthersError(e)
      }
    }

    return ethTransaction
  }

  async emergencyWithdraw(withdraw: {
    mainContract: Address
    tokenId: TokenId
    subAccountId: number
    accountId: number
    ethTxOptions?: ethers.providers.TransactionRequest
  }): Promise<TransactionResponse> {
    const gasPrice = await this.ethSigner.provider.getGasPrice()

    try {
      const data = MAIN_CONTRACT_INTERFACE.encodeFunctionData(
        'requestFullExit',
        [withdraw.accountId, withdraw.subAccountId, withdraw.tokenId]
      )
      const ethTransaction = await this.ethSigner.sendTransaction({
        to: withdraw.mainContract,
        data,
        gasLimit: BigNumber.from('500000'),
        gasPrice,
        ...withdraw.ethTxOptions,
      })

      return ethTransaction
    } catch (e) {
      this.modifyEthersError(e)
    }
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

  requireAccountId(accountId: number, msg: string) {
    if (accountId === undefined || accountId === null) {
      throw new Error(`Missing accountId in ${msg}, accountId: ${accountId}`)
    }
    if (typeof accountId !== 'number' || accountId < 0) {
      throw new Error(`Invalid accountId in ${msg}, accountId: ${accountId}`)
    }
  }

  requireNonce(nonce: number, msg: string) {
    if (nonce === undefined || nonce === null) {
      throw new Error(`Missing nonce in ${msg}, nonce: ${nonce}`)
    }
    if (typeof nonce !== 'number' || nonce < 0) {
      throw new Error(`Invalid nonce in ${msg}, nonce: ${nonce}`)
    }
  }
}
