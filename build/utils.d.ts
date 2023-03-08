import { utils, ethers, BigNumber, BigNumberish } from 'ethers';
import { Provider } from '.';
import { PubKeyHash, TokenAddress, TokenLike, Tokens, TokenSymbol, EthSignerType, Address, TransferData, ForcedExitData, ChangePubKeyData, WithdrawData, CloseAccount, OrderData, ChainId, OrderMatchingData } from './types';
export declare const MIN_UNONCE = 1;
export declare const MAX_UNONCE = 4294967295;
export declare const IERC20_INTERFACE: utils.Interface;
export declare const SYNC_MAIN_CONTRACT_INTERFACE: utils.Interface;
export declare const SYNC_EXIT_CONTRACT_INTERFACE: utils.Interface;
export declare const ZKL_CONTRACT_INTERFACE: utils.Interface;
export declare const SYNC_GOV_CONTRACT_INTERFACE: utils.Interface;
export declare const IEIP1271_INTERFACE: utils.Interface;
export declare const MULTICALL_INTERFACE: utils.Interface;
export declare const ERC20_DEPOSIT_GAS_LIMIT: any;
export declare const MAX_ERC20_APPROVE_AMOUNT: ethers.BigNumber;
export declare const ERC20_APPROVE_TRESHOLD: ethers.BigNumber;
export declare const ETH_RECOMMENDED_DEPOSIT_GAS_LIMIT: ethers.BigNumber;
export declare const ERC20_RECOMMENDED_DEPOSIT_GAS_LIMIT: ethers.BigNumber;
export declare const ETH_RECOMMENDED_FASTSWAP_GAS_LIMIT: ethers.BigNumber;
export declare const ERC20_RECOMMENDED_FASTSWAP_GAS_LIMIT: ethers.BigNumber;
export declare const TOTAL_CHAIN_NUM = 4;
export declare const SIGN_MESSAGE = "Sign this message to create a private key to interact with zkLink's layer 2 services.\nNOTE: This application is powered by zkLink's multi-chain network.\n\nOnly sign this message for a trusted client!";
export declare function floatToInteger(floatBytes: Uint8Array, expBits: number, mantissaBits: number, expBaseNumber: number): BigNumber;
export declare function bitsIntoBytesInBEOrder(bits: number[]): Uint8Array;
export declare function integerToFloat(integer: BigNumber, expBits: number, mantissaBits: number, expBase: number): Uint8Array;
export declare function integerToFloatUp(integer: BigNumber, expBits: number, mantissaBits: number, expBase: number): Uint8Array;
export declare function reverseBits(buffer: Uint8Array): Uint8Array;
export declare function packAmountChecked(amount: BigNumber): Uint8Array;
export declare function packFeeChecked(amount: BigNumber): Uint8Array;
/**
 * packs and unpacks the amount, returning the closest packed value.
 * e.g 1000000003 => 1000000000
 * @param amount
 */
export declare function closestPackableTransactionAmount(amount: BigNumberish): BigNumber;
export declare function closestGreaterOrEqPackableTransactionAmount(amount: BigNumberish): BigNumber;
export declare function isTransactionAmountPackable(amount: BigNumberish): boolean;
/**
 * packs and unpacks the amount, returning the closest packed value.
 * e.g 1000000003 => 1000000000
 * @param fee
 */
export declare function closestPackableTransactionFee(fee: BigNumberish): BigNumber;
export declare function closestGreaterOrEqPackableTransactionFee(fee: BigNumberish): BigNumber;
export declare function isTransactionFeePackable(amount: BigNumberish): boolean;
export declare function buffer2bitsBE(buff: any): any[];
export declare function sleep(ms: number): Promise<unknown>;
export declare function isTokenETH(token: TokenAddress): boolean;
declare type TokenOrId = TokenLike | number;
export declare class TokenSet {
    private tokensById;
    constructor(tokensById: Tokens);
    private resolveTokenObject;
    isTokenTransferAmountPackable(tokenLike: TokenOrId, amount: string): boolean;
    isTokenTransactionFeePackable(tokenLike: TokenOrId, amount: string): boolean;
    formatToken(tokenLike: TokenOrId, amount: BigNumberish): string;
    parseToken(tokenLike: TokenOrId, amount: string): BigNumber;
    resolveTokenDecimals(tokenLike: TokenOrId): number;
    resolveTokenId(tokenLike: TokenOrId): number;
    resolveTokenAddress(tokenLike: TokenOrId, chainId: ChainId): TokenAddress;
    resolveTokenSymbol(tokenLike: TokenOrId): TokenSymbol;
}
export declare function getChangePubkeyMessage(pubKeyHash: PubKeyHash, nonce: number, accountId: number, verifyingContract: string, layerOneChainId: number, domainName?: string, version?: string): any;
export declare function getSignedBytesFromMessage(message: utils.BytesLike | string, addPrefix: boolean): Uint8Array;
export declare function signMessagePersonalAPI(signer: ethers.Signer, message: Uint8Array): Promise<string>;
export declare function signMessageEIP712(signer: any, data: any): Promise<string>;
export declare function verifyERC1271Signature(address: string, message: Uint8Array, signature: string, signerOrProvider: ethers.Signer | ethers.providers.Provider): Promise<boolean>;
export declare function getEthSignatureType(_provider: ethers.providers.Provider, message: string, signature: string, address: string): Promise<EthSignerType>;
export declare function serializeAddress(address: Address | PubKeyHash): Uint8Array;
export declare function serializeAccountId(accountId: number): Uint8Array;
export declare function serializeSubAccountId(subAccountId: number): Uint8Array;
export declare function serializeTokenId(tokenId: number): Uint8Array;
export declare function serializeAmountPacked(amount: BigNumberish): Uint8Array;
export declare function serializeAmountFull(amount: BigNumberish): Uint8Array;
export declare function serializeFeePacked(fee: BigNumberish): Uint8Array;
export declare function serializeNonce(nonce: number): Uint8Array;
export declare function serializeChainId(chainId: number): Uint8Array;
export declare function serializeFeeRatio(withdrawFeeRatio: number): Uint8Array;
export declare function serializeFastWithdraw(fastWithdraw: number): Uint8Array;
export declare function serializeTimestamp(time: number): Uint8Array;
export declare function serializeWithdraw(withdraw: WithdrawData): Uint8Array;
export declare function serializeTransfer(transfer: TransferData): Uint8Array;
export declare function serializeChangePubKey(changePubKey: ChangePubKeyData): Uint8Array;
export declare function serializeForcedExit(forcedExit: ForcedExitData): Uint8Array;
export declare function serializeOrder(order: OrderData): Uint8Array;
export declare function serializeOrderMatching(matching: OrderMatchingData): Promise<Uint8Array>;
/**
 * Encodes the transaction data as the byte sequence according to the zkSync protocol.
 * @param tx A transaction to serialize.
 */
export declare function serializeTx(tx: TransferData | WithdrawData | ChangePubKeyData | CloseAccount | ForcedExitData): Uint8Array;
export declare function numberToBytesBE(number: number, bytes: number): Uint8Array;
export declare function bigintToBytesBE(number1: bigint, bytes: number): Uint8Array;
export declare function parseHexWithPrefix(str: string): Uint8Array;
export declare function getCREATE2AddressAndSalt(syncPubkeyHash: string, create2Data: {
    creatorAddress: string;
    saltArg: string;
    codeHash: string;
}): {
    salt: string;
    address: string;
};
export declare function getEthereumBalance(ethProvider: ethers.providers.Provider, syncProvider: Provider, address: Address, token: TokenAddress, chainId: ChainId): Promise<BigNumber>;
export declare function getPendingBalance(ethProvider: ethers.providers.Provider, syncProvider: Provider, address: Address, token: TokenLike, chainId: ChainId): Promise<BigNumberish>;
export declare function getTxHash(tx: TransferData | WithdrawData | ChangePubKeyData | ForcedExitData | CloseAccount): string;
export declare function getRandom(min: number, max: number): number;
export declare function getFastSwapUNonce(): number;
export declare function chainsCompletion(chains: any[], chainNum: number, item: any): any[];
export declare function getTimestamp(): number;
export {};
