import { BigNumber, BigNumberish } from 'ethers';

// 0x-prefixed, hex encoded, ethereum account address
export type Address = string;
// sync:-prefixed, hex encoded, hash of the account public key
export type PubKeyHash = string;

// Symbol like "ETH" or "FAU" or token contract address(zero address is implied for "ETH").
export type TokenLike = TokenSymbol | TokenAddress;
// Token symbol (e.g. "ETH", "FAU", etc.)
export type TokenSymbol = string;
// Token address (e.g. 0xde..ad for ERC20, or 0x00.00 for "ETH")
export type TokenAddress = string;
export type TokenId = number;

export type TotalFee = Map<TokenLike, BigNumber>;

export type Nonce = number | 'committed';

export type Network = 'localhost' | 'rinkeby' | 'ropsten' | 'mainnet' | 'rinkeby-beta' | 'ropsten-beta';

export interface PairInfo {
    chain0: number,
    chain1: number
    reserve0: string,  // wei
    reserve1: string,  // wei
    token0: number,
    token1: number,
    token_lp: number,
    total_supply: string,  // wei
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
            // Token are indexed by their symbol (e.g. "ETH")
            [token: string]: {
                // Sum of pending deposits for the token.
                amount: BigNumberish;
                // Value denoting the block number when the funds are expected
                // to be received by zkSync network.
                expectedAcceptBlock: number;
            };
        };
    };
    committed: {
        balances: {
            // Token are indexed by their symbol (e.g. "ETH")
            [token: string]: BigNumberish;
        };
        nonce: number;
        pubKeyHash: PubKeyHash;
        pairInfo: PairInfo;
    };
    verified: {
        balances: {
            // Token are indexed by their symbol (e.g. "ETH")
            [token: string]: BigNumberish;
        };
        nonce: number;
        pubKeyHash: PubKeyHash;
    };
}

export type EthSignerType = {
    verificationMethod: 'ECDSA' | 'ERC-1271';
    // Indicates if signer adds `\x19Ethereum Signed Message\n${msg.length}` prefix before signing message.
    // i.e. if false, we should add this prefix manually before asking to sign message
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
    fromChainId: number;
    toChainId: number;
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

export interface AddLiquidity {
    type: 'AddLiq';
    fromChainId: number;
    toChainId: number;
    account: Address;
    accountId: number;
    amount0: BigNumberish,
    amount1: BigNumberish,
    amount0Min: BigNumberish,
    amount1Min: BigNumberish,
    // fee1: BigNumberish,
    // fee2: BigNumberish,
    nonce: number;
    token0: number,
    token1: number,
    pairAccount: Address,
    signature?: Signature;
    validFrom: number;
    validUntil: number;
}

export interface RemoveLiquidity {
    type: 'RemoveLiquidity';
    fromChainId: number;
	toChainId: number;
    accountId: number;
    token1: number,
    token2: number,
    lpToken: number,
    fee1: BigNumberish,
    fee2: BigNumberish,
    from: Address;
    lpQuantity: BigNumberish;
    minAmount1: BigNumberish,
    minAmount2: BigNumberish,
    pairAddress: Address,
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
    amountIn: BigNumberish,
    amountOut: BigNumberish,
    amountOutMin: BigNumberish,
    fee0: BigNumberish,
    fee1: BigNumberish,
    nonce: number;
    pairAddress: Address,
    tokenIn: number,
    tokenOut: number,
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
    withdrawFeeRatio: number;
    fastWithdraw: number;
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

export type ChangePubkeyTypes = 'Onchain' | 'ECDSA' | 'CREATE2' | 'ECDSALegacyMessage';

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
    tx: Transfer | Withdraw | ChangePubKey | CloseAccount | ForcedExit | AddLiquidity | RemoveLiquidity | Swap;
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
    // Tokens are indexed by their symbol (e.g. "ETH")
    [token: string]: {
        address: string;
        id: number;
        symbol: string;
        decimals: number;
    };
}

// we have to ignore this because of a bug in prettier causes this exact block
// to have double semicolons inside
// prettier-ignore
export interface ChangePubKeyFee {
    // Note: Ignore, since it just looks more intuitive if `"ChangePubKey"` is kept as a string literal)
    // prettier-ignore
    // Denotes how authorization of operation is performed:
    // 'Onchain' if it's done by sending an Ethereum transaction,
    // 'ECDSA' if it's done by providing an Ethereum signature in zkSync transaction.
    // 'CREATE2' if it's done by providing arguments to restore account ethereum address according to CREATE2 specification.
    "ChangePubKey": ChangePubkeyTypes;
}

export interface LegacyChangePubKeyFee {
    ChangePubKey: {
        onchainPubkeyAuth: boolean;
    };
}

export interface Fee {
    // Operation type (amount of chunks in operation differs and impacts the total fee).
    feeType: 'Withdraw' | 'Transfer' | 'TransferToNew' | 'FastWithdraw' | ChangePubKeyFee;
    // Amount of gas used by transaction
    gasTxAmount: BigNumber;
    // Gas price (in wei)
    gasPriceWei: BigNumber;
    // Ethereum gas part of fee (in wei)
    gasFee: BigNumber;
    // Zero-knowledge proof part of fee (in wei)
    zkpFee: BigNumber;
    // Total fee amount (in wei)
    totalFee: BigNumber;
}

export interface BatchFee {
    // Total fee amount (in wei)
    totalFee: BigNumber;
}
