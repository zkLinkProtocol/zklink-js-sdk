import { BigNumberish } from 'ethers';
export type Address = string;
export type PubKeyHash = string;
export type TokenSymbol = string;
export type TokenAddress = string;
export type TokenId = number;
export type PairId = number;
export type L1ChainId = number;
export type ChainId = number;
export type Ether = string;
export type Wei = string;
export type Nonce = number;
export type SubNonce = number;
export type SubAccountId = number;
export interface Create2Data {
    creatorAddress: string;
    saltArg: string;
    codeHash: string;
}
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
    accountId: number;
    fromSubAccountId: SubAccountId;
    toSubAccountId: SubAccountId;
    to: Address;
    tokenId: TokenId;
    tokenSymbol: TokenSymbol;
    amount: BigNumberish;
    fee: BigNumberish;
    nonce: SubNonce;
    ts?: number;
}
export interface TransferData {
    type: 'Transfer';
    accountId: number;
    fromSubAccountId: SubAccountId;
    toSubAccountId: SubAccountId;
    from: Address;
    to: Address;
    token: TokenId;
    amount: BigNumberish;
    fee: BigNumberish;
    ts: number;
    nonce: SubNonce;
    signature?: Signature;
}
export interface WithdrawEntries {
    toChainId: ChainId;
    withdrawToL1: 0 | 1;
    subAccountId: SubAccountId;
    to: string;
    l2SourceTokenId: TokenId;
    l2SourceTokenSymbol: TokenSymbol;
    l1TargetTokenId: TokenId;
    amount: BigNumberish;
    withdrawFeeRatio: number;
    accountId: number;
    fee: BigNumberish;
    nonce: SubNonce;
    from?: Address;
    ts?: number;
}
export interface WithdrawData {
    type: 'Withdraw';
    toChainId: ChainId;
    withdrawToL1: 0 | 1;
    subAccountId: SubAccountId;
    accountId: number;
    from: Address;
    to: Address;
    l2SourceToken: TokenId;
    l1TargetToken: TokenId;
    amount: BigNumberish;
    fee: BigNumberish;
    withdrawFeeRatio: number;
    ts: number;
    nonce: SubNonce;
    signature?: Signature;
}
export interface ForcedExitEntries {
    toChainId: ChainId;
    withdrawToL1: 0 | 1;
    initiatorAccountId: number;
    initiatorSubAccountId: SubAccountId;
    target: Address;
    targetSubAccountId: SubAccountId;
    l2SourceTokenId: TokenId;
    l1TargetTokenId: TokenId;
    initiatorNonce: SubNonce;
    exitAmount: BigNumberish;
    ts?: number;
}
export interface ForcedExitData {
    type: 'ForcedExit';
    toChainId: ChainId;
    withdrawToL1: 0 | 1;
    initiatorAccountId: number;
    initiatorSubAccountId: SubAccountId;
    target: Address;
    targetSubAccountId: SubAccountId;
    l2SourceToken: TokenId;
    l1TargetToken: TokenId;
    initiatorNonce: SubNonce;
    exitAmount: BigNumberish;
    signature?: Signature;
    ts: number;
}
export type ChangePubkeyTypes = 'Onchain' | 'EthECDSA' | 'EthCreate2';
export interface ChangePubKeyOnchain {
    type: 'Onchain';
}
export interface ChangePubKeyECDSA {
    type: 'EthECDSA';
    ethSignature: string;
    batchHash?: string;
}
export interface ChangePubKeyCREATE2 {
    type: 'EthCreate2';
    creatorAddress: string;
    saltArg: string;
    codeHash: string;
}
export interface ChangePubKeyEntries {
    chainId: ChainId;
    accountId: number;
    subAccountId: SubAccountId;
    feeTokenId: TokenId;
    ethAuthType: ChangePubkeyTypes;
    fee: BigNumberish;
    nonce: Nonce;
    newPkHash?: PubKeyHash;
    account?: Address;
    ts?: number;
}
export interface ChangePubKeyData {
    type: 'ChangePubKey';
    chainId: ChainId;
    subAccountId: SubAccountId;
    account: Address;
    accountId: number;
    newPkHash: PubKeyHash;
    feeToken: TokenId;
    fee: BigNumberish;
    ts: number;
    nonce: Nonce;
    signature?: Signature;
    ethAuthData?: ChangePubKeyOnchain | ChangePubKeyECDSA | ChangePubKeyCREATE2;
    ethSignature?: TxEthSignature;
}
export interface SignedTransaction {
    tx: TransferData | WithdrawData | ChangePubKeyData | ForcedExitData | OrderData | OrderMatchingData | ContractData | ContractMatchingData;
    ethereumSignature?: TxEthSignature;
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
    feeRates: [number, number];
    hasSubsidy?: 0 | 1;
    signature?: Signature;
}
export interface OrderMatchingEntries {
    accountId: number;
    subAccountId: number;
    taker: OrderData;
    maker: OrderData;
    expectBaseAmount: BigNumberish;
    expectQuoteAmount: BigNumberish;
    feeTokenId: TokenId;
    feeTokenSymbol: TokenSymbol;
    fee: BigNumberish;
    account?: Address;
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
    feeToken: TokenId;
    signature?: Signature;
}
export interface ContractData {
    type: 'Contract';
    accountId: number;
    subAccountId: number;
    slotId: number;
    nonce: number;
    pairId: PairId;
    size: BigNumberish;
    price: BigNumberish;
    direction: 0 | 1;
    feeRates: [number, number];
    hasSubsidy?: 0 | 1;
    signature?: Signature;
}
export interface ContractMatchingEntries {
    accountId: number;
    subAccountId: number;
    maker: ContractData[];
    taker: ContractData;
    feeTokenId: TokenId;
    feeTokenSymbol: TokenSymbol;
    fee: BigNumberish;
    signature?: Signature;
}
export interface ContractMatchingData {
    type: 'ContractMatching';
    accountId: number;
    subAccountId: number;
    maker: ContractData[];
    taker: ContractData;
    fee: BigNumberish;
    feeToken: TokenId;
    signature?: Signature;
}
