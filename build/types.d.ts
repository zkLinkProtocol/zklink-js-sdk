import { BigNumber, BigNumberish } from 'ethers';
export declare type Address = string;
export declare type PubKeyHash = string;
export declare type TokenLike = TokenSymbol;
export declare type TokenSymbol = string;
export declare type TokenAddress = string;
export declare type TokenId = number;
export declare type ChainId = number;
export declare type TotalFee = Map<TokenLike, BigNumber>;
export declare type Nonce = number | 'committed';
export declare type Network = 'localhost' | 'rinkeby' | 'ropsten' | 'mainnet' | 'rinkeby-beta' | 'ropsten-beta';
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
    nonce: number;
    pubKeyHash: PubKeyHash;
}
export interface AccountBalances {
    [subAccountId: number]: {
        [tokenId: number]: BigNumberish;
    };
}
export declare type EthSignerType = {
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
export interface Transfer {
    type: 'Transfer';
    accountId: number;
    fromSubAccountId: number;
    toSubAccountId: number;
    from: Address;
    to: Address;
    token: number;
    amount: BigNumberish;
    fee: BigNumberish;
    ts: number;
    nonce: number;
    signature?: Signature;
}
export interface Withdraw {
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
export interface ForcedExit {
    type: 'ForcedExit';
    toChainId: ChainId;
    initiatorAccountId: number;
    initiatorSubAccountId: number;
    target: Address;
    targetSubAccountId: number;
    l2SourceToken: number;
    l1TargetToken: number;
    feeToken: number;
    fee: BigNumberish;
    ts: number;
    nonce: number;
    signature?: Signature;
}
export declare type ChangePubkeyTypes = 'Onchain' | 'ECDSA' | 'CREATE2' | 'ECDSALegacyMessage';
export interface ChangePubKeyOnchain {
    type: 'Onchain';
}
export interface ChangePubKeyECDSA {
    type: 'ECDSA';
    ethSignature: string;
    batchHash?: string;
}
export interface ChangePubKeyCREATE2 {
    type: 'CREATE2';
    creatorAddress: string;
    saltArg: string;
    codeHash: string;
}
export interface ChangePubKey {
    type: 'ChangePubKey';
    linkChainId: number;
    subAccountId: number;
    chainId: number;
    accountId: number;
    account: Address;
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
    tx: Transfer | Withdraw | ChangePubKey | CloseAccount | ForcedExit | Order | OrderMatching;
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
    block?: BlockInfo;
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
export interface Tokens {
    [token: string]: {
        id: number;
        symbol: string;
        decimals: number;
        chains: {
            [x: number]: {
                chainId: number;
                address: Address;
                fastWithdraw: boolean;
            };
        };
    };
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
export interface Order {
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
    ethAuthData?: ChangePubKeyOnchain | ChangePubKeyECDSA | ChangePubKeyCREATE2;
    ethSignature?: string;
}
export interface OrderMatching {
    type: 'OrderMatching';
    accountId: number;
    subAccountId: number;
    account: Address;
    taker: Order;
    maker: Order;
    expectBaseAmount: BigNumberish;
    expectQuoteAmount: BigNumberish;
    fee: BigNumberish;
    feeToken: number;
    nonce: number;
    signature?: Signature;
}
