import { BigNumber, BigNumberish } from 'ethers';
export declare type Address = string;
export declare type PubKeyHash = string;
export declare type TokenLike = TokenSymbol | TokenAddress;
export declare type TokenSymbol = string;
export declare type TokenAddress = string;
export declare type TotalFee = Map<TokenLike, BigNumber>;
export declare type Nonce = number | 'committed';
export declare type Network = 'localhost' | 'rinkeby' | 'ropsten' | 'mainnet' | 'rinkeby-beta' | 'ropsten-beta';
export interface PairInfo {
    chain0: number;
    chain1: number;
    reserve0: string;
    reserve1: string;
    token0: number;
    token1: number;
    token_lp: number;
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
            [token: string]: {
                amount: BigNumberish;
                expectedAcceptBlock: number;
            };
        };
    };
    committed: {
        balances: {
            [token: string]: BigNumberish;
        };
        nonce: number;
        pubKeyHash: PubKeyHash;
        pairInfo: PairInfo;
    };
    verified: {
        balances: {
            [token: string]: BigNumberish;
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
    from: Address;
    to: Address;
    token: number;
    amount: BigNumberish;
    fee: BigNumberish;
    nonce: number;
    signature?: Signature;
    validFrom: number;
    validUntil: number;
}
export interface CreatePool {
    type: 'CreatePool';
    chainId0: number;
    chainId1: number;
    account: Address;
    accountId: number;
    nonce: number;
    token0: number;
    token1: number;
    signature?: Signature;
    validFrom: number;
    validUntil: number;
}
export interface AddLiquidity {
    type: 'AddLiq';
    fromChainId: number;
    toChainId: number;
    account: Address;
    accountId: number;
    amount0: BigNumberish;
    amount1: BigNumberish;
    amount0Min: BigNumberish;
    amount1Min: BigNumberish;
    nonce: number;
    token0: number;
    token1: number;
    pairAccount: Address;
    signature?: Signature;
    validFrom: number;
    validUntil: number;
}
export interface RemoveLiquidity {
    type: 'RemoveLiquidity';
    fromChainId: number;
    toChainId: number;
    accountId: number;
    token1: number;
    token2: number;
    lpToken: number;
    fee1: BigNumberish;
    fee2: BigNumberish;
    from: Address;
    lpQuantity: BigNumberish;
    minAmount1: BigNumberish;
    minAmount2: BigNumberish;
    pairAddress: Address;
    nonce: number;
    signature?: Signature;
    validFrom: number;
    validUntil: number;
}
export interface Swap {
    type: 'Swap';
    fromChain: number;
    toChain: number;
    account: Address;
    accountId: number;
    amountIn: BigNumberish;
    amountOut: BigNumberish;
    amountOutMin: BigNumberish;
    fee0: BigNumberish;
    fee1: BigNumberish;
    nonce: number;
    pairAddress: Address;
    tokenIn: number;
    tokenOut: number;
    signature?: Signature;
    validFrom: number;
    validUntil: number;
}
export interface Withdraw {
    type: 'Withdraw';
    accountId: number;
    from: Address;
    to: Address;
    token: number;
    tokenId: number;
    amount: BigNumberish;
    fee: BigNumberish;
    nonce: number;
    signature?: Signature;
    validFrom: number;
    validUntil: number;
}
export interface ForcedExit {
    type: 'ForcedExit';
    initiatorAccountId: number;
    target: Address;
    token: number;
    fee: BigNumberish;
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
    fromChainId: number;
    toChainId: number;
    feeToken: number;
    fee: BigNumberish;
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
    tx: Transfer | Withdraw | ChangePubKey | CloseAccount | ForcedExit | CreatePool | AddLiquidity | RemoveLiquidity | Swap;
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
        address: string;
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
