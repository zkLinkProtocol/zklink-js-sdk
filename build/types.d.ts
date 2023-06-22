import { BigNumber, BigNumberish } from 'ethers';
export type Address = string;
export type PubKeyHash = string;
export type TokenLike = TokenSymbol;
export type TokenSymbol = string;
export type TokenAddress = string;
export type TokenId = number;
export type ChainId = number;
export type Ether = string;
export type Wei = string;
export type TotalFee = Map<TokenLike, BigNumber>;
export type Nonce = number;
export type SubAccountId = string;
export type Network = 'localhost' | 'rinkeby' | 'ropsten' | 'mainnet' | 'rinkeby-beta' | 'ropsten-beta';
export interface PairInfo {
    amplifier: number;
    chains: ChainId[];
    d: string;
    kind: number;
    lp_token: TokenId;
    reserves: string[];
    token_in_pool: number;
    tokens: number[];
    total_supply: string;
}
export interface Create2Data {
    creatorAddress: string;
    saltArg: string;
    codeHash: string;
}
export interface AccountState {
    id?: number;
    address: Address;
    nonce: Nonce;
    pubKeyHash: PubKeyHash;
    accountType: string;
    subAccountNonces: Record<SubAccountId, Nonce>;
}
export interface AccountBalances {
    [subAccountId: SubAccountId]: Record<string, Wei>;
}
export type EthProviderType = 'Metamask' | 'UniPass';
export type EthSignerType = {
    verificationMethod: 'ECDSA' | 'ERC-1271';
    isSignedMsgPrefixed: boolean;
};
export interface TxEthSignature {
    type: 'EthereumSignature' | 'EIP1271Signature';
    signature: string;
}
export interface Signature {
    pubKey: string;
    signature: string;
}
export interface TransferEntries {
    fromSubAccountId: number;
    toSubAccountId: number;
    to: Address;
    token: TokenId;
    amount: BigNumberish;
    nonce?: Nonce;
    ts?: number;
}
export interface TransferData {
    type: 'Transfer';
    accountId: number;
    fromSubAccountId: number;
    toSubAccountId: number;
    from: Address;
    to: Address;
    token: TokenId;
    amount: BigNumberish;
    fee: BigNumberish;
    ts: number;
    nonce: number;
    signature?: Signature;
}
export interface WithdrawEntries {
    toChainId: ChainId;
    subAccountId: number;
    to: string;
    l2SourceToken: TokenId;
    l1TargetToken: TokenId;
    amount: BigNumberish;
    withdrawFeeRatio: number;
    fastWithdraw: number;
    accountId?: number;
    from?: string;
    nonce?: Nonce;
    ts?: number;
}
export interface WithdrawData {
    type: 'Withdraw';
    toChainId: number;
    subAccountId: number;
    accountId: number;
    from: Address;
    to: Address;
    l2SourceToken: number;
    l1TargetToken: number;
    amount: BigNumberish;
    fee: BigNumberish;
    withdrawFeeRatio: number;
    fastWithdraw: number;
    ts: number;
    nonce: number;
    signature?: Signature;
}
export interface ForcedExitEntries {
    toChainId: ChainId;
    initiatorAccountId?: number;
    initiatorSubAccountId: number;
    target: Address;
    targetSubAccountId: number;
    l2SourceToken: TokenId;
    l1TargetToken: TokenId;
    initiatorNonce?: Nonce;
    exitAmount: BigNumberish;
    ts?: number;
}
export interface ForcedExitData {
    type: 'ForcedExit';
    toChainId: ChainId;
    initiatorAccountId: number;
    initiatorSubAccountId: number;
    target: Address;
    targetSubAccountId: number;
    l2SourceToken: number;
    l1TargetToken: number;
    initiatorNonce: number;
    exitAmount: BigNumberish;
    signature?: Signature;
    ts: number;
}
export type ChangePubkeyTypes = 'Onchain' | 'EthECDSA' | 'EthCREATE2';
export interface ChangePubKeyOnchain {
    type: 'Onchain';
}
export interface ChangePubKeyECDSA {
    type: 'EthECDSA';
    ethSignature: string;
    batchHash?: string;
}
export interface ChangePubKeyCREATE2 {
    type: 'EthCREATE2';
    creatorAddress: string;
    saltArg: string;
    codeHash: string;
}
export interface ChangePubKeyEntries {
    chainId: number;
    subAccountId: number;
    ethAuthType: ChangePubkeyTypes;
    account?: Address;
    accountId?: number;
    ts?: number;
    nonce?: Nonce;
}
export interface ChangePubKeyData {
    type: 'ChangePubKey';
    chainId: number;
    subAccountId: number;
    account: Address;
    accountId: number;
    newPkHash: PubKeyHash;
    feeToken: number;
    fee: BigNumberish;
    ts: number;
    nonce: number;
    signature?: Signature;
    ethAuthData?: ChangePubKeyOnchain | ChangePubKeyECDSA | ChangePubKeyCREATE2;
    ethSignature?: string;
}
export interface CloseAccount {
    type: 'Close';
    account: Address;
    nonce: number;
    signature: Signature;
}
export interface SignedTransaction {
    tx: TransferData | WithdrawData | ChangePubKeyData | CloseAccount | ForcedExitData | OrderData | OrderMatchingData;
    ethereumSignature?: TxEthSignature;
}
export interface BlockInfo {
    blockNumber: number;
    committed: boolean;
    verified: boolean;
}
export interface TransactionReceipt {
    executed: boolean;
    success?: boolean;
    failReason?: string;
    block?: number;
}
export interface TransactionResult {
    txHash?: string;
    tx?: any;
    receipt?: TransactionReceipt;
    updates?: {
        type: string;
        updateId: number;
        accountId: number;
        subAccountId: number;
        coinId: number;
        oldBalance: string;
        newBalance: string;
        oldNonce: number;
        newNonce: number;
    }[];
}
export interface PriorityOperationReceipt {
    executed: boolean;
    block?: BlockInfo;
}
export interface ContractInfo {
    chainId: number;
    layerOneChainId: number;
    mainContract: string;
}
export interface Token {
    id: TokenId;
    symbol: TokenSymbol;
    decimals: number;
    chains: {
        [x: ChainId]: {
            chainId: ChainId;
            address: Address;
            decimals: number;
            fastWithdraw: boolean;
        };
    };
}
export interface Tokens {
    [token: TokenId]: Token;
}
export interface ChangePubKeyFee {
    "ChangePubKey": ChangePubkeyTypes;
}
export interface LegacyChangePubKeyFee {
    ChangePubKey: {
        onchainPubkeyAuth: boolean;
    };
}
export interface Fee {
    feeType: 'Withdraw' | 'Transfer' | 'TransferToNew' | 'FastWithdraw' | ChangePubKeyFee;
    gasTxAmounts: BigNumber[];
    gasPriceWei: BigNumber;
    gasFee: BigNumber;
    zkpFee: BigNumber;
    totalFee: BigNumber;
}
export interface BatchFee {
    totalFee: BigNumber;
}
export interface OrderData {
    type: 'Order';
    accountId: number;
    subAccountId: number;
    slotId: number;
    nonce: number;
    baseTokenId: TokenId;
    quoteTokenId: TokenId;
    amount: BigNumberish;
    price: BigNumberish;
    isSell: number;
    feeRatio1: number;
    feeRatio2: number;
    signature?: Signature;
}
export interface OrderMatchingEntries {
    subAccountId: number;
    taker: OrderData;
    maker: OrderData;
    expectBaseAmount: BigNumberish;
    expectQuoteAmount: BigNumberish;
    account?: Address;
    accountId?: number;
    signature?: Signature;
}
export interface OrderMatchingData {
    type: 'OrderMatching';
    accountId: number;
    subAccountId: number;
    account: Address;
    taker: OrderData;
    maker: OrderData;
    expectBaseAmount: BigNumberish;
    expectQuoteAmount: BigNumberish;
    fee: BigNumberish;
    feeToken: number;
    signature?: Signature;
}
