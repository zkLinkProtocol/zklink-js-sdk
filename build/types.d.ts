import { BigNumber, BigNumberish } from 'ethers';
export declare type Address = string;
export declare type PubKeyHash = string;
export declare type TokenLike = TokenSymbol | TokenAddress;
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
    address: Address;
    id?: number;
    depositing: {
        balances: {
            [subAccountId: number]: {
                [token: string]: {
                    amount: BigNumberish;
                    expectedAcceptBlock: number;
                };
            };
        };
    };
    committed: {
        balances: {
            [subAccountId: number]: {
                [token: string]: BigNumberish;
            };
        };
        nonce: number;
        pubKeyHash: PubKeyHash;
        pairInfo: PairInfo;
        orderNonces: {
            [slotId: number]: {};
        };
    };
    verified: {
        balances: {
            [subAccountId: number]: {
                [token: string]: BigNumberish;
            };
        };
        nonce: number;
        pubKeyHash: PubKeyHash;
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
    validFrom: number;
    validUntil: number;
}
export interface CurveAddLiquidity {
    type: 'L2CurveAddLiq';
    account: Address;
    tokens: TokenId[];
    amounts: BigNumberish[];
    lpQuantity: BigNumberish;
    minLpQuantity: BigNumberish;
    pairAddress: Address;
    fee: BigNumberish;
    feeToken: TokenId;
    collectFees: BigNumberish[];
    ts?: number;
    nonce: number;
    signature?: Signature;
    validFrom: number;
    validUntil: number;
}
export interface CurveRemoveLiquidity {
    type: 'L2CurveRemoveLiquidity';
    account: Address;
    tokens: TokenId[];
    amounts: BigNumberish[];
    minAmounts: BigNumberish[];
    lpQuantity: BigNumberish;
    pairAddress: Address;
    fee: BigNumberish;
    feeToken: TokenId;
    curveFee: BigNumberish;
    ts?: number;
    nonce: number;
    signature?: Signature;
    validFrom: number;
    validUntil: number;
}
export interface CurveSwap {
    type: 'CurveSwap';
    accountId: number;
    account: Address;
    pairAddress: Address;
    tokenIn: TokenId;
    tokenOut: TokenId;
    amountIn: BigNumberish;
    amountOut: BigNumberish;
    amountOutMin: BigNumberish;
    fee: BigNumberish;
    adminFee: BigNumberish;
    ts?: number;
    nonce: number;
    signature?: Signature;
    validFrom: number;
    validUntil: number;
}
export interface Withdraw {
    type: 'Withdraw';
    toChainId: number;
    subAccountId: number;
    accountId: number;
    from: Address;
    to: Address;
    token: number;
    tokenId: number;
    amount: BigNumberish;
    fee: BigNumberish;
    withdrawFeeRatio: number;
    fastWithdraw: number;
    ts: number;
    nonce: number;
    signature?: Signature;
    validFrom: number;
    validUntil: number;
}
export interface ForcedExit {
    type: 'ForcedExit';
    toChainId: ChainId;
    subAccountId: number;
    initiatorAccountId: number;
    target: Address;
    token: number;
    fee: BigNumberish;
    ts: number;
    nonce: number;
    signature?: Signature;
    validFrom: number;
    validUntil: number;
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
    validFrom: number;
    validUntil: number;
}
export interface CloseAccount {
    type: 'Close';
    account: Address;
    nonce: number;
    signature: Signature;
}
export interface SignedTransaction {
    tx: Transfer | Withdraw | ChangePubKey | CloseAccount | ForcedExit | CurveAddLiquidity | CurveRemoveLiquidity | CurveSwap | Order | OrderMatching;
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
export interface ContractAddress {
    mainContract: string;
    govContract: string;
}
export interface Tokens {
    [token: string]: {
        chains: number[];
        address: string[];
        id: number;
        symbol: string;
        decimals: number;
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
    gasTxAmount: BigNumber;
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
    validFrom: number;
    validUntil: number;
    signature?: Signature;
    ethAuthData?: ChangePubKeyOnchain | ChangePubKeyECDSA | ChangePubKeyCREATE2;
    ethSignature?: string;
}
export interface OrderMatching {
    type: 'OrderMatching';
    accountId: number;
    account: Address;
    taker: Order;
    maker: Order;
    expectBaseAmount: BigNumberish;
    expectQuoteAmount: BigNumberish;
    fee: BigNumberish;
    feeToken: number;
    nonce: number;
    signature?: Signature;
    validFrom: number;
    validUntil: number;
}
