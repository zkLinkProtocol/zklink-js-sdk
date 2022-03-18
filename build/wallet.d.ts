import { BigNumber, BigNumberish, Contract, ContractTransaction, ethers } from 'ethers';
import { EthMessageSigner } from './eth-message-signer';
import { Provider } from './provider';
import { Signer } from './signer';
import { BatchBuilder } from './batch-builder';
import { AccountState, Address, TokenLike, Nonce, PriorityOperationReceipt, TransactionReceipt, PubKeyHash, ChangePubKey, EthSignerType, SignedTransaction, Transfer, TxEthSignature, ForcedExit, Withdraw, ChangePubkeyTypes, ChangePubKeyOnchain, ChangePubKeyECDSA, ChangePubKeyCREATE2, Create2Data, RemoveLiquidity, AddLiquidity, Swap, CurveAddLiquidity, CurveRemoveLiquidity, CurveSwap, Order } from './types';
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
        fromChainId: number;
        toChainId: number;
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
        fromChainId: number;
        toChainId: number;
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
        target: Address;
        token: TokenLike;
        fee: BigNumberish;
        nonce: number;
        validFrom?: number;
        validUntil?: number;
    }): Promise<ForcedExit>;
    signSyncForcedExit(forcedExit: {
        target: Address;
        token: TokenLike;
        fee: BigNumberish;
        nonce: number;
        validFrom?: number;
        validUntil?: number;
    }): Promise<SignedTransaction>;
    syncForcedExit(forcedExit: {
        target: Address;
        token: TokenLike;
        fee?: BigNumberish;
        nonce?: Nonce;
        validFrom?: number;
        validUntil?: number;
    }): Promise<Transaction>;
    syncMultiTransfer(transfers: {
        fromChainId: number;
        toChainId: number;
        to: Address;
        token: TokenLike;
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
        fromChainId: number;
        toChainId: number;
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
    getSwap(transfer: {
        fromChain: number;
        toChain: number;
        tokenIdIn: number;
        tokenIdOut: number;
        tokenIn: TokenLike;
        tokenOut: TokenLike;
        amountIn: BigNumberish;
        amountOut: BigNumberish;
        amountOutMin: BigNumberish;
        accountId: number;
        pairAddress: Address;
        fee0?: BigNumberish;
        fee1?: BigNumberish;
        nonce: number;
        validFrom: number;
        validUntil: number;
    }): Promise<Swap>;
    signSyncSwap(transfer: {
        fromChain: number;
        toChain: number;
        tokenIdIn: number;
        tokenIdOut: number;
        tokenIn: TokenLike;
        tokenOut: TokenLike;
        amountIn: BigNumberish;
        amountOut: BigNumberish;
        amountOutMin: BigNumberish;
        pairAddress: Address;
        accountId?: number;
        fee0?: BigNumberish;
        fee1?: BigNumberish;
        nonce: number;
        validFrom?: number;
        validUntil?: number;
    }): Promise<SignedTransaction>;
    syncSwap(transfer: {
        fromChain: number;
        toChain: number;
        tokenIn: TokenLike;
        tokenOut: TokenLike;
        tokenIdIn: number;
        tokenIdOut: number;
        amountIn: BigNumberish;
        amountOut: BigNumberish;
        amountOutMin: BigNumberish;
        pairAddress: Address;
        fee0?: BigNumberish;
        fee1?: BigNumberish;
        nonce?: Nonce;
        validFrom?: number;
        validUntil?: number;
    }): Promise<Transaction>;
    getRemoveLiquidity(transfer: {
        fromChainId: number;
        toChainId: number;
        token1: TokenLike;
        token2: TokenLike;
        lpToken: TokenLike;
        tokenId1: number;
        tokenId2: number;
        lpTokenId: number;
        minAmount1: BigNumberish;
        minAmount2: BigNumberish;
        fee1: BigNumberish;
        fee2: BigNumberish;
        pairAddress: Address;
        lpQuantity: BigNumberish;
        accountId: number;
        nonce?: number;
        validFrom?: number;
        validUntil?: number;
    }): Promise<RemoveLiquidity>;
    signSyncRemoveLiquidity(transfer: {
        fromChainId: number;
        toChainId: number;
        token1: TokenLike;
        token2: TokenLike;
        lpToken: TokenLike;
        tokenId1: number;
        tokenId2: number;
        lpTokenId: number;
        minAmount1: BigNumberish;
        minAmount2: BigNumberish;
        fee1: string;
        fee2: string;
        pairAddress: Address;
        lpQuantity: BigNumberish;
        accountId?: number;
        nonce?: number;
        validFrom?: number;
        validUntil?: number;
    }): Promise<SignedTransaction>;
    syncRemoveLiquidity(transfer: {
        fromChainId: number;
        toChainId: number;
        token1: TokenLike;
        token2: TokenLike;
        tokenId1: number;
        tokenId2: number;
        lpToken: TokenLike;
        lpTokenId: number;
        minAmount1: BigNumberish;
        minAmount2: BigNumberish;
        fee1: BigNumberish;
        fee2: BigNumberish;
        pairAddress: Address;
        lpQuantity: BigNumberish;
        accountId?: number;
        nonce?: Nonce;
        validFrom?: number;
        validUntil?: number;
    }): Promise<Transaction>;
    getAddLiquidity(transfer: {
        fromChainId: number;
        toChainId: number;
        token0: TokenLike;
        token1: TokenLike;
        tokenId0: number;
        tokenId1: number;
        amount0: BigNumberish;
        amount1: BigNumberish;
        amount0Min: BigNumberish;
        amount1Min: BigNumberish;
        accountId: number;
        pairAccount: Address;
        nonce?: number;
        validFrom?: number;
        validUntil?: number;
    }): Promise<AddLiquidity>;
    signSyncAddLiquidity(transfer: {
        chainId0: number;
        chainId1: number;
        account: Address;
        token0: TokenLike;
        token1: TokenLike;
        tokenId0: number;
        tokenId1: number;
        amount0: BigNumberish;
        amount1: BigNumberish;
        amount0Min: BigNumberish;
        amount1Min: BigNumberish;
        accountId?: number;
        pairAccount: Address;
        nonce?: number;
        validFrom?: number;
        validUntil?: number;
    }): Promise<SignedTransaction>;
    syncAddLiquidity(transfer: {
        fromChainId: number;
        toChainId: number;
        token0: TokenLike;
        token1: TokenLike;
        tokenId0: number;
        tokenId1: number;
        amount0: BigNumberish;
        amount1: BigNumberish;
        amount0Min: BigNumberish;
        amount1Min: BigNumberish;
        pairAccount: Address;
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
        ethAddress: string;
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
        ethAddress: string;
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
        ethAddress: string;
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
        fromChainId: number;
        toChainId: number;
        accountId?: number;
        ethAuthData?: ChangePubKeyOnchain | ChangePubKeyECDSA | ChangePubKeyCREATE2;
        ethSignature?: string;
        ts: number;
        validFrom: number;
        validUntil: number;
    }): Promise<ChangePubKey>;
    signSetSigningKey(changePubKey: {
        feeToken: TokenLike;
        fee: BigNumberish;
        fromChainId: number;
        toChainId: number;
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
        token: TokenLike;
        amount: BigNumberish;
        fee: BigNumberish;
    }): string;
    getWithdrawEthMessagePart(withdraw: {
        ethAddress: string;
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
    isOnchainAuthSigningKeySet(nonce?: Nonce): Promise<boolean>;
    onchainAuthSigningKey(nonce?: Nonce, ethTxOptions?: ethers.providers.TransactionRequest): Promise<ContractTransaction>;
    getCurrentPubKeyHash(): Promise<PubKeyHash>;
    getNonce(nonce?: Nonce): Promise<number>;
    getAccountId(): Promise<number | undefined>;
    address(): Address;
    getAccountState(): Promise<AccountState>;
    getBalance(token: TokenLike, type?: 'committed' | 'verified'): Promise<BigNumber>;
    getEthereumBalance(token: TokenLike): Promise<BigNumber>;
    isERC20DepositsApproved(token: TokenLike, erc20ApproveThreshold?: BigNumber): Promise<boolean>;
    approveERC20TokenDeposits(token: TokenLike, max_erc20_approve_amount?: BigNumber): Promise<ContractTransaction>;
    depositToSyncFromEthereum(deposit: {
        depositTo: Address;
        token: TokenLike;
        amount: BigNumberish;
        ethTxOptions?: ethers.providers.TransactionRequest;
        approveDepositAmountForERC20?: boolean;
    }): Promise<ETHOperation>;
    emergencyWithdraw(withdraw: {
        token: TokenLike;
        accountId?: number;
        ethTxOptions?: ethers.providers.TransactionRequest;
    }): Promise<ETHOperation>;
    getZkSyncMainContract(): Contract;
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
    awaitReceipt(): Promise<PriorityOperationReceipt>;
    awaitVerifyReceipt(): Promise<PriorityOperationReceipt>;
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
