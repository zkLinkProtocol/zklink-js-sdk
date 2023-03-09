import * as ethers from 'ethers';
import { TxEthSignature, EthSignerType, PubKeyHash, OrderData, EthProviderType } from './types';
/**
 * Wrapper around `ethers.Signer` which provides convenient methods to get and sign messages required for zkSync.
 */
export declare class EthMessageSigner {
    private ethSigner;
    private ethSignerType?;
    private ethProviderType?;
    constructor(ethSigner: ethers.Signer, ethSignerType?: EthSignerType, ethProviderType?: EthProviderType);
    getEthMessageSignature(message: ethers.utils.BytesLike): Promise<TxEthSignature>;
    getTransferEthSignMessage(transfer: {
        stringAmount: string;
        stringToken: string;
        stringFee: string;
        to: string;
        nonce: number;
        accountId: number;
    }): string;
    ethSignTransfer(transfer: {
        stringAmount: string;
        stringToken: string;
        stringFee: string;
        to: string;
        nonce: number;
        accountId: number;
    }): Promise<TxEthSignature>;
    getOrderMatchingEthSignMessage(matching: {
        stringFeeToken: string;
        stringFee: string;
        nonce: number;
    }): string;
    ethSignOrderMatching(matching: {
        stringFeeToken: string;
        stringFee: string;
        nonce: number;
    }): Promise<TxEthSignature>;
    getOrderMatchingEthMessagePart(tx: {
        stringFeeToken: string;
        stringFee: string;
    }): string;
    ethSignOrder(payload: OrderData & {
        address: string;
        stringPrice: string;
        stringAmount: string;
        baseTokenSymbol: string;
        quoteTokenSymbol: string;
    }): Promise<TxEthSignature>;
    getOrderEthSignMessage(payload: OrderData & {
        address: string;
        stringPrice: string;
        stringAmount: string;
        baseTokenSymbol: string;
        quoteTokenSymbol: string;
    }): string;
    getOrderEthMessagePart(tx: OrderData & {
        address: string;
        stringPrice: string;
        stringAmount: string;
        baseTokenSymbol: string;
        quoteTokenSymbol: string;
    }): string;
    getCreatePoolEthMessagePart(tx: {
        token0: string;
        token1: string;
    }): string;
    getCreatePoolEthSignMessage(transfer: {
        token0: string;
        token1: string;
        nonce: number;
        accountId: number;
    }): string;
    ethSignCreatePool(transfer: {
        token0: string;
        token1: string;
        nonce: number;
        accountId: number;
    }): Promise<TxEthSignature>;
    ethSignForcedExit(forcedExit: {
        stringToken: string;
        stringFeeToken: string;
        stringFee: string;
        target: string;
        nonce: number;
    }): Promise<TxEthSignature>;
    getWithdrawEthSignMessage(withdraw: {
        stringAmount: string;
        stringToken: string;
        stringFee: string;
        to: string;
        nonce: number;
        accountId: number;
    }): string;
    getForcedExitEthSignMessage(forcedExit: {
        stringToken: string;
        stringFeeToken: string;
        stringFee: string;
        target: string;
        nonce: number;
    }): string;
    getTransferEthMessagePart(tx: {
        stringAmount: string;
        stringToken: string;
        stringFee: string;
        to?: string;
    }, type: 'transfer' | 'withdraw'): string;
    getWithdrawEthMessagePart(tx: {
        stringAmount: string;
        stringToken: string;
        stringFee: string;
        to?: string;
    }): string;
    getChangePubKeyEthMessagePart(changePubKey: {
        pubKeyHash: PubKeyHash;
        stringToken: string;
        stringFee: string;
    }): string;
    getForcedExitEthMessagePart(forcedExit: {
        stringToken: string;
        stringFeeToken: string;
        stringFee: string;
        target: string;
    }): string;
    ethSignWithdraw(withdraw: {
        stringAmount: string;
        stringToken: string;
        stringFee: string;
        to: string;
        nonce: number;
        accountId: number;
    }): Promise<TxEthSignature>;
}
