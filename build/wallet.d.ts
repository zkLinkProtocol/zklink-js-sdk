import { BigNumber, BigNumberish, Contract, ContractTransaction, ethers } from 'ethers';
import { EthMessageSigner } from './eth-message-signer';
import { Provider } from './provider';
import { Signer } from './signer';
import { BatchBuilder } from './batch-builder';
import { AccountState, Address, TokenLike, Nonce, PriorityOperationReceipt, TransactionReceipt, PubKeyHash, ChangePubKey, EthSignerType, SignedTransaction, Transfer, TxEthSignature, ForcedExit, Withdraw, ChangePubkeyTypes, ChangePubKeyOnchain, ChangePubKeyECDSA, ChangePubKeyCREATE2, Create2Data, CurveAddLiquidity, ChainId, TokenId, CurveRemoveLiquidity, CurveSwap, Order, TokenSymbol, TokenAddress } from './types';
export declare class ZKSyncTxError extends Error {
    value: PriorityOperationReceipt | TransactionReceipt;
    constructor(message: string, value: PriorityOperationReceipt | TransactionReceipt);
}
export declare class Wallet {
    ethSigner: ethers.Signer;
    ethMessageSigner: EthMessageSigner;
    cachedAddress: Address;
    signer?: Signer;
    accountId?: number;
    ethSignerType?: EthSignerType;
    provider: Provider;
    private constructor();
    connect(provider: Provider): this;
    static fromEthSigner(ethWallet: ethers.Signer, provider: Provider, signer?: Signer, accountId?: number, ethSignerType?: EthSignerType): Promise<Wallet>;
    static fromCreate2Data(syncSigner: Signer, provider: Provider, create2Data: Create2Data, accountId?: number): Promise<Wallet>;
    static fromEthSignerNoKeys(ethWallet: ethers.Signer, provider: Provider, accountId?: number, ethSignerType?: EthSignerType): Promise<Wallet>;
    getEthMessageSignature(message: ethers.utils.BytesLike): Promise<TxEthSignature>;
    batchBuilder(nonce?: Nonce): BatchBuilder;
    getTransfer(transfer: {
        fromSubAccountId: number;
        toSubAccountId: number;
        to: Address;
        token: TokenLike;
        tokenId: number;
        amount: BigNumberish;
        fee: BigNumberish;
        accountId: number;
        ts: number;
        nonce: number;
        validFrom: number;
        validUntil: number;
    }): Promise<Transfer>;
    signSyncTransfer(transfer: {
        fromSubAccountId: number;
        toSubAccountId: number;
        to: Address;
        token: TokenLike;
        tokenId: number;
        amount: BigNumberish;
        fee: BigNumberish;
        accountId: number;
        ts?: number;
        nonce: number;
        validFrom?: number;
        validUntil?: number;
    }): Promise<SignedTransaction>;
    getForcedExit(forcedExit: {
        chainId: ChainId;
        subAccountId: number;
        target: Address;
        token: TokenLike;
        fee: BigNumberish;
        nonce: number;
        validFrom?: number;
        validUntil?: number;
    }): Promise<ForcedExit>;
    signSyncForcedExit(forcedExit: {
        chainId: ChainId;
        subAccountId: number;
        target: Address;
        token: TokenLike;
        tokenSymbol: TokenSymbol;
        fee: BigNumberish;
        nonce: number;
        validFrom?: number;
        validUntil?: number;
    }): Promise<SignedTransaction>;
    syncForcedExit(forcedExit: {
        target: Address;
        chainId: ChainId;
        subAccountId: number;
        token: TokenLike;
        fee?: BigNumberish;
        nonce?: Nonce;
        validFrom?: number;
        validUntil?: number;
    }): Promise<Transaction>;
    syncMultiTransfer(transfers: {
        fromSubAccountId: number;
        toSubAccountId: number;
        to: Address;
        token: TokenSymbol;
        tokenId: number;
        amount: BigNumberish;
        fee: BigNumberish;
        accountId?: number;
        ts: number;
        nonce?: Nonce;
        validFrom?: number;
        validUntil?: number;
    }[]): Promise<Transaction[]>;
    syncTransfer(transfer: {
        fromSubAccountId: number;
        toSubAccountId: number;
        to: Address;
        token: TokenLike;
        tokenId: number;
        amount: BigNumberish;
        fee?: BigNumberish;
        accountId?: number;
        nonce?: Nonce;
        validFrom?: number;
        validUntil?: number;
    }): Promise<Transaction>;
    getCurveAddLiquidity(payload: CurveAddLiquidity & {
        nonce?: number;
        validFrom?: number;
        validUntil?: number;
    }): Promise<CurveAddLiquidity>;
    signSyncCurveAddLiquidity(payload: CurveAddLiquidity & {
        nonce?: number;
        validFrom?: number;
        validUntil?: number;
    }): Promise<SignedTransaction>;
    syncCurveAddLiquidity(payload: CurveAddLiquidity & {
        nonce?: Nonce;
        validFrom?: number;
        validUntil?: number;
    }): Promise<Transaction>;
    getCurveRemoveLiquidity(payload: CurveRemoveLiquidity & {
        nonce?: number;
        validFrom?: number;
        validUntil?: number;
    }): Promise<CurveRemoveLiquidity>;
    signSyncCurveRemoveLiquidity(payload: CurveRemoveLiquidity & {
        nonce?: number;
        validFrom?: number;
        validUntil?: number;
    }): Promise<SignedTransaction>;
    syncCurveRemoveLiquidity(payload: CurveRemoveLiquidity & {
        nonce?: Nonce;
        validFrom?: number;
        validUntil?: number;
    }): Promise<Transaction>;
    getCurveSwap(payload: CurveSwap & {
        nonce?: number;
        validFrom?: number;
        validUntil?: number;
    }): Promise<CurveSwap>;
    signSyncCurveSwap(payload: CurveSwap & {
        nonce?: number;
        validFrom?: number;
        validUntil?: number;
    }): Promise<SignedTransaction>;
    syncCurveSwap(payload: CurveSwap & {
        nonce?: Nonce;
        validFrom?: number;
        validUntil?: number;
    }): Promise<Transaction>;
    getOrder(payload: Order & {
        validFrom?: number;
        validUntil?: number;
    }): Promise<Order>;
    signSyncOrder(payload: Order & {
        validFrom?: number;
        validUntil?: number;
    }): Promise<SignedTransaction>;
    getWithdrawFromSyncToEthereum(withdraw: {
        toChainId: number;
        subAccountId: number;
        to: string;
        token: TokenLike;
        tokenId: number;
        amount: BigNumberish;
        fee: BigNumberish;
        withdrawFeeRatio: number;
        fastWithdraw: number;
        ts: number;
        nonce: number;
        accountId: number;
        validFrom: number;
        validUntil: number;
    }): Promise<Withdraw>;
    signWithdrawFromSyncToEthereum(withdraw: {
        toChainId: number;
        subAccountId: number;
        to: string;
        token: TokenLike;
        tokenId: number;
        amount: BigNumberish;
        fee: BigNumberish;
        withdrawFeeRatio: number;
        fastWithdraw: number;
        accountId: number;
        ts?: number;
        nonce: number;
        validFrom?: number;
        validUntil?: number;
    }): Promise<SignedTransaction>;
    withdrawFromSyncToEthereum(withdraw: {
        toChainId: number;
        subAccountId: number;
        to: string;
        token: TokenLike;
        amount: BigNumberish;
        withdrawFeeRatio: number;
        fastWithdraw: number;
        fee?: BigNumberish;
        nonce?: Nonce;
        fastProcessing?: boolean;
        validFrom?: number;
        validUntil?: number;
    }): Promise<Transaction>;
    isSigningKeySet(): Promise<boolean>;
    getChangePubKey(changePubKey: {
        feeToken: TokenLike;
        fee: BigNumberish;
        nonce: number;
        accountId?: number;
        ethAuthData?: ChangePubKeyOnchain | ChangePubKeyECDSA | ChangePubKeyCREATE2;
        ts: number;
        validFrom: number;
        validUntil: number;
    }): Promise<ChangePubKey>;
    signSetSigningKey(changePubKey: {
        feeToken: TokenLike;
        fee: BigNumberish;
        nonce: number;
        ethAuthType: ChangePubkeyTypes;
        accountId?: number;
        batchHash?: string;
        ts?: number;
        validFrom?: number;
        validUntil?: number;
    }): Promise<SignedTransaction>;
    setSigningKey(changePubKey: {
        feeToken: TokenLike;
        ethAuthType: ChangePubkeyTypes;
        fee?: BigNumberish;
        nonce?: Nonce;
        validFrom?: number;
        validUntil?: number;
    }): Promise<Transaction>;
    getTransferEthMessagePart(transfer: {
        to: Address;
        token: TokenSymbol;
        amount: BigNumberish;
        fee: BigNumberish;
    }): string;
    getWithdrawEthMessagePart(withdraw: {
        to: string;
        token: TokenLike;
        amount: BigNumberish;
        fee: BigNumberish;
    }): string;
    getChangePubKeyEthMessagePart(changePubKey: {
        pubKeyHash: string;
        feeToken: TokenLike;
        fee: BigNumberish;
    }): string;
    getForcedExitEthMessagePart(forcedExit: {
        target: Address;
        token: TokenLike;
        fee: BigNumberish;
        nonce: number;
    }): string;
    isOnchainAuthSigningKeySet(linkChainId: number, nonce?: Nonce): Promise<boolean>;
    onchainAuthSigningKey(linkChainId: number, nonce?: Nonce, ethTxOptions?: ethers.providers.TransactionRequest): Promise<ContractTransaction>;
    getCurrentPubKeyHash(): Promise<PubKeyHash>;
    getNonce(nonce?: Nonce): Promise<number>;
    getAccountId(): Promise<number | undefined>;
    address(): Address;
    getAccountState(): Promise<AccountState>;
    getBalance(token: TokenLike, type?: 'committed' | 'verified'): Promise<BigNumber>;
    getEthereumBalance(token: TokenLike, linkChainId: ChainId): Promise<BigNumber>;
    isERC20DepositsApproved(token: TokenLike, linkChainId: number, erc20ApproveThreshold?: BigNumber): Promise<boolean>;
    approveERC20TokenDeposits(token: TokenLike, linkChainId: number, max_erc20_approve_amount?: BigNumber): Promise<ContractTransaction>;
    depositToSyncFromEthereum(deposit: {
        subAccountId: number;
        depositTo: Address;
        token: TokenAddress;
        amount: BigNumberish;
        linkChainId: number;
        ethTxOptions?: ethers.providers.TransactionRequest;
        approveDepositAmountForERC20?: boolean;
    }): Promise<ETHOperation>;
    emergencyWithdraw(withdraw: {
        tokenId: TokenId;
        subAccountId: number;
        linkChainId: number;
        accountId?: number;
        ethTxOptions?: ethers.providers.TransactionRequest;
    }): Promise<ETHOperation>;
    getZkSyncMainContract(linkChainId: number): Promise<Contract>;
    private modifyEthersError;
    private setRequiredAccountIdFromServer;
}
export declare class ETHOperation {
    ethTx: ContractTransaction;
    zkSyncProvider: Provider;
    state: 'Sent' | 'Mined' | 'Committed' | 'Verified' | 'Failed';
    error?: ZKSyncTxError;
    priorityOpId?: BigNumber;
    constructor(ethTx: ContractTransaction, zkSyncProvider: Provider);
    awaitEthereumTxCommit(): Promise<ethers.ContractReceipt>;
    awaitReceipt(linkChainId: number): Promise<PriorityOperationReceipt>;
    awaitVerifyReceipt(linkChainId: number): Promise<PriorityOperationReceipt>;
    private setErrorState;
    private throwErrorIfFailedState;
}
export declare class Transaction {
    txData: any;
    txHash: string;
    sidechainProvider: Provider;
    state: 'Sent' | 'Committed' | 'Verified' | 'Failed';
    error?: ZKSyncTxError;
    constructor(txData: any, txHash: string, sidechainProvider: Provider);
    awaitReceipt(): Promise<TransactionReceipt>;
    awaitVerifyReceipt(): Promise<TransactionReceipt>;
    private setErrorState;
    private throwErrorIfFailedState;
}
export declare function submitSignedTransaction(signedTx: SignedTransaction, provider: Provider, fastProcessing?: boolean): Promise<Transaction>;
export declare function submitSignedTransactionsBatch(provider: Provider, signedTxs: SignedTransaction[], ethSignatures?: TxEthSignature[]): Promise<Transaction[]>;
