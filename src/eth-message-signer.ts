import * as ethers from 'ethers';
import { TxEthSignature, EthSignerType, PubKeyHash, Address, Order } from './types';
import { getSignedBytesFromMessage, signMessagePersonalAPI, getChangePubkeyMessage } from './utils';

/**
 * Wrapper around `ethers.Signer` which provides convenient methods to get and sign messages required for zkSync.
 */
export class EthMessageSigner {
    constructor(private ethSigner: ethers.Signer, private ethSignerType?: EthSignerType) {}

    async getEthMessageSignature(message: ethers.utils.BytesLike): Promise<TxEthSignature> {
        if (this.ethSignerType == null) {
            throw new Error('ethSignerType is unknown');
        }

        const signedBytes = getSignedBytesFromMessage(message, !this.ethSignerType.isSignedMsgPrefixed);

        const signature = await signMessagePersonalAPI(this.ethSigner, signedBytes);

        return {
            type: this.ethSignerType.verificationMethod === 'ECDSA' ? 'EthereumSignature' : 'EIP1271Signature',
            signature
        };
    }

    getTransferEthSignMessage(transfer: {
        stringAmount: string;
        stringToken: string;
        stringFee: string;
        to: string;
        nonce: number;
        accountId: number;
    }): string {
        let humanReadableTxInfo = this.getTransferEthMessagePart(transfer);
        if (humanReadableTxInfo.length != 0) {
            humanReadableTxInfo += '\n';
        }
        humanReadableTxInfo += `Nonce: ${transfer.nonce}`;

        return humanReadableTxInfo;
    }

    async ethSignTransfer(transfer: {
        stringAmount: string;
        stringToken: string;
        stringFee: string;
        to: string;
        nonce: number;
        accountId: number;
    }): Promise<TxEthSignature> {
        const message = this.getTransferEthSignMessage(transfer);
        return await this.getEthMessageSignature(message);
    }


    getSwapEthMessagePart(tx: {
        stringAmountIn: string,
        stringAmountOut: string,
        stringFee0: string,
        stringFee1: string,
        stringTokenIn: string,
        stringTokenOut: string,
        pairAddress: string,
    }): string {

        let message = '';
        message += `Swap ${tx.stringAmountIn} to: ${tx.stringAmountOut}`;
        message += '\n';
        message += `Amount: ${tx.stringAmountIn} to: ${tx.stringAmountOut}`;
        message += '\n';
        message += `Fee: ${tx.stringFee0}`;
        message += '\n';
        return message;
    }
    getSwapEthSignMessage(transfer: {
        stringAmountIn: string,
        stringAmountOut: string,
        stringAmountOutMin: string,
        stringFee0: string,
        stringFee1: string,
        stringTokenIn: string,
        stringTokenOut: string,
        pairAddress: string,
        nonce: number;
        accountId: number;
    }): string {
        let humanReadableTxInfo = this.getSwapEthMessagePart(transfer);
        if (humanReadableTxInfo.length != 0) {
            humanReadableTxInfo += '\n';
        }
        humanReadableTxInfo += `Nonce: ${transfer.nonce}`;

        return humanReadableTxInfo;
    }


    async ethSignSwap(transfer: {
        stringAmountIn: string,
        stringAmountOut: string,
        stringAmountOutMin: string,
        stringFee0: string,
        stringFee1: string,
        stringTokenIn: string,
        stringTokenOut: string,
        pairAddress: string,
        nonce: number;
        accountId: number;
    }): Promise<TxEthSignature> {
        const message = this.getSwapEthSignMessage(transfer);
        return await this.getEthMessageSignature(message);
    }


    getRemoveLiquidityEthMessagePart(tx: {
        stringAmount0: string,
        stringAmount1: string,
        stringLpQuantity: string,
        pairAddress: Address,
        fee1: string,
        fee2: string,
        nonce: number;
        accountId: number;
    }): string {
        let message = '';
        if (tx.pairAddress != null) {
            message += `Remove Liquidity`;
        }
        message += '\n';
        message += `LP: ${tx.stringLpQuantity}`;
        message += '\n';
        message += `Amount: ${tx.stringAmount0} - ${tx.stringAmount1}`
        return message;
    }

    getRemoveLiquidityEthSignMessage(transfer: {
        stringAmount0: string,
        stringAmount1: string,
        stringLpQuantity: string,
        pairAddress: Address,
        fee1: string,
        fee2: string,
        nonce: number;
        accountId: number;
    }): string {
        let humanReadableTxInfo = this.getRemoveLiquidityEthMessagePart(transfer);
        if (humanReadableTxInfo.length != 0) {
            humanReadableTxInfo += '\n';
        }
        humanReadableTxInfo += `Nonce: ${transfer.nonce}`;

        return humanReadableTxInfo;
    }

    async ethSignRemoveLiquidity(transfer: {
        stringAmount0: string,
        stringAmount1: string,
        stringTokenIn: string,
        stringTokenOut: string,
        stringTokenLp: string,
        stringLpQuantity: string,
        pairAddress: Address,
        fee1: string,
        fee2: string,
        nonce: number;
        accountId: number;
    }): Promise<TxEthSignature> {
        const message = this.getRemoveLiquidityEthSignMessage(transfer);
        return await this.getEthMessageSignature(message);
    }

    async ethSignAddLiquidity(transfer: {
        stringAmount0: string,
        stringAmount1: string,
        stringAmount0Min: string,
        stringAmount1Min: string,
        stringToken0: string,
        stringToken1: string,
        account: string;
        nonce: number;
        accountId: number;
        pairAccount: Address;
    }): Promise<TxEthSignature> {
        const message = this.getAddLiquidityEthSignMessage(transfer);
        return await this.getEthMessageSignature(message);
    }

    getAddLiquidityEthSignMessage(transfer: {
        stringAmount0: string,
        stringAmount1: string,
        stringToken0: string,
        stringToken1: string,
        account: string;
        nonce: number;
        accountId: number;
    }): string {
        let humanReadableTxInfo = this.getAddLiquidityEthMessagePart(transfer);
        if (humanReadableTxInfo.length != 0) {
            humanReadableTxInfo += '\n';
        }
        humanReadableTxInfo += `Nonce: ${transfer.nonce}`;

        return humanReadableTxInfo;
    }
    getAddLiquidityEthMessagePart(tx: {
        stringAmount0: string,
        stringAmount1: string,
        stringToken0: string,
        stringToken1: string,
        account: string;
        nonce: number;
        accountId: number;
    }): string {
        let message = '';
        if (tx.account != null) {
            message += `Add Liquidity`;
        }
        message += '\n';
        message += `Token: ${tx.stringToken0} - ${tx.stringToken1}`;
        message += '\n';
        message += `Amount: ${tx.stringAmount0} - ${tx.stringAmount1}`
        return message;
    }

    async ethSignCurveAddLiquidity(payload: {
        stringAmounts: string[],
        account: string;
        nonce: number;
        pairAccount: Address;
    }): Promise<TxEthSignature> {
        const message = this.getCurveAddLiquidityEthSignMessage(payload);
        return await this.getEthMessageSignature(message);
    }

    getCurveAddLiquidityEthSignMessage(payload: {
        stringAmounts: string[],
        account: string;
        nonce: number;
        pairAccount: Address;
    }): string {
        let humanReadableTxInfo = this.getCurveAddLiquidityEthMessagePart(payload);
        if (humanReadableTxInfo.length != 0) {
            humanReadableTxInfo += '\n';
        }
        humanReadableTxInfo += `Nonce: ${payload.nonce}`;

        return humanReadableTxInfo;
    }
    getCurveAddLiquidityEthMessagePart(tx: {
        stringAmounts: string[],
        account: string;
        nonce: number;
        pairAccount: Address;
    }): string {
        let message = '';
        if (tx.account != null) {
            message += `Add Liquidity`;
        }
        message += '\n';
        message += `Amount: ${tx.stringAmounts.filter((a) => Number(a) != 0 && Number(a) != NaN).join('-')}`
        return message;
    }


    async ethSignCurveRemoveLiquidity(payload: {
        stringAmounts: string[],
        account: string;
        nonce: number;
        pairAccount: Address;
    }): Promise<TxEthSignature> {
        const message = this.getCurveRemoveLiquidityEthSignMessage(payload);
        return await this.getEthMessageSignature(message);
    }

    getCurveRemoveLiquidityEthSignMessage(payload: {
        stringAmounts: string[],
        account: string;
        nonce: number;
        pairAccount: Address;
    }): string {
        let humanReadableTxInfo = this.getCurveRemoveLiquidityEthMessagePart(payload);
        if (humanReadableTxInfo.length != 0) {
            humanReadableTxInfo += '\n';
        }
        humanReadableTxInfo += `Nonce: ${payload.nonce}`;

        return humanReadableTxInfo;
    }
    getCurveRemoveLiquidityEthMessagePart(tx: {
        stringAmounts: string[],
        account: string;
        nonce: number;
        pairAccount: Address;
    }): string {
        let message = '';
        if (tx.account != null) {
            message += `Remove Liquidity`;
        }
        message += '\n';
        message += `Amount: ${tx.stringAmounts.filter((a) => Number(a) != 0 && Number(a) != NaN).join('-')}`
        return message;
    }

    async ethSignCurveSwap(payload: {
        stringAmountIn: string;
        stringAmountOut: string;
        tokenIn: string | number;
        tokenOut: string | number;
        account: string;
        nonce: number;
        pairAccount: Address;
    }): Promise<TxEthSignature> {
        const message = this.getCurveSwapEthSignMessage(payload);
        return await this.getEthMessageSignature(message);
    }

    getCurveSwapEthSignMessage(payload: {
        stringAmountIn: string;
        stringAmountOut: string;
        tokenIn: string | number;
        tokenOut: string | number;
        account: string;
        nonce: number;
        pairAccount: Address;
    }): string {
        let humanReadableTxInfo = this.getCurveSwapEthMessagePart(payload);
        if (humanReadableTxInfo.length != 0) {
            humanReadableTxInfo += '\n';
        }
        humanReadableTxInfo += `Nonce: ${payload.nonce}`;

        return humanReadableTxInfo;
    }
    getCurveSwapEthMessagePart(tx: {
        stringAmountIn: string;
        stringAmountOut: string;
        tokenIn: string | number;
        tokenOut: string | number;
        account: string;
        nonce: number;
        pairAccount: Address;
    }): string {
        let message = '';
        if (tx.account != null) {
            message += `Swap`;
        }
        message += '\n';
        message += `Swap: ${tx.tokenIn} to ${tx.tokenOut}`
        message += '\n';
        message += `Amount: ${tx.stringAmountIn} to ${tx.stringAmountOut}`
        return message;
    }
    

    async ethSignOrder(payload: Order): Promise<TxEthSignature> {
        const message = this.getOrderEthSignMessage(payload);
        return await this.getEthMessageSignature(message);
    }

    getOrderEthSignMessage(payload: Order): string {
        let humanReadableTxInfo = this.getOrderEthMessagePart(payload);
        if (humanReadableTxInfo.length != 0) {
            humanReadableTxInfo += '\n';
        }
        humanReadableTxInfo += `Nonce: ${payload.nonce}`;

        return humanReadableTxInfo;
    }
    getOrderEthMessagePart(tx: Order): string {
        let message = '';
        message += `Order`;
        message += '\n';
        return message;
    }
    

    getCreatePoolEthMessagePart(tx: {
        token0: string;
        token1: string;
    }): string {
        let message = '';
        message += `Token: ${tx.token0} - ${tx.token1}`;
        return message;
    }
    
    getCreatePoolEthSignMessage(transfer: {
        token0: string;
        token1: string;
        nonce: number;
        accountId: number;
    }): string {
        let humanReadableTxInfo = this.getCreatePoolEthMessagePart(transfer);
        if (humanReadableTxInfo.length != 0) {
            humanReadableTxInfo += '\n';
        }
        humanReadableTxInfo += `Nonce: ${transfer.nonce}`;

        return humanReadableTxInfo;
    }

    async ethSignCreatePool(transfer: {
        token0: string;
        token1: string;
        nonce: number;
        accountId: number;
    }): Promise<TxEthSignature> {
        const message = this.getCreatePoolEthSignMessage(transfer);
        return await this.getEthMessageSignature(message);
    }
    


    async ethSignForcedExit(forcedExit: {
        stringToken: string;
        stringFee: string;
        target: string;
        nonce: number;
    }): Promise<TxEthSignature> {
        const message = this.getForcedExitEthSignMessage(forcedExit);
        return await this.getEthMessageSignature(message);
    }

    getWithdrawEthSignMessage(withdraw: {
        stringAmount: string;
        stringToken: string;
        stringFee: string;
        ethAddress: string;
        nonce: number;
        accountId: number;
    }): string {
        let humanReadableTxInfo = this.getWithdrawEthMessagePart(withdraw);
        if (humanReadableTxInfo.length != 0) {
            humanReadableTxInfo += '\n';
        }
        humanReadableTxInfo += `Nonce: ${withdraw.nonce}`;

        return humanReadableTxInfo;
    }

    getForcedExitEthSignMessage(forcedExit: {
        stringToken: string;
        stringFee: string;
        target: string;
        nonce: number;
    }): string {
        let humanReadableTxInfo = this.getForcedExitEthMessagePart(forcedExit);
        humanReadableTxInfo += `\nNonce: ${forcedExit.nonce}`;
        return humanReadableTxInfo;
    }

    getTransferEthMessagePart(tx: {
        stringAmount: string;
        stringToken: string;
        stringFee: string;
        ethAddress?: string;
        to?: string;
    }): string {
        let txType: string, to: string;
        if (tx.ethAddress != undefined) {
            txType = 'Withdraw';
            to = tx.ethAddress;
        } else if (tx.to != undefined) {
            txType = 'Transfer';
            to = tx.to;
        } else {
            throw new Error('Either to or ethAddress field must be present');
        }

        let message = '';
        if (tx.stringAmount != null) {
            message += `${txType} ${tx.stringAmount} ${tx.stringToken} to: ${to.toLowerCase()}`;
        }
        if (tx.stringFee != null) {
            if (message.length != 0) {
                message += '\n';
            }
            message += `Fee: ${tx.stringFee} ${tx.stringToken}`;
        }
        return message;
    }

    getWithdrawEthMessagePart(tx: {
        stringAmount: string;
        stringToken: string;
        stringFee: string;
        ethAddress?: string;
        to?: string;
    }): string {
        return this.getTransferEthMessagePart(tx);
    }

    getChangePubKeyEthMessagePart(changePubKey: {
        pubKeyHash: PubKeyHash;
        stringToken: string;
        stringFee: string;
    }): string {
        let message = '';
        message += `Set signing key: ${changePubKey.pubKeyHash.replace('sync:', '').toLowerCase()}`;
        if (changePubKey.stringFee != null) {
            message += `\nFee: ${changePubKey.stringFee} ${changePubKey.stringToken}`;
        }
        return message;
    }

    getForcedExitEthMessagePart(forcedExit: { stringToken: string; stringFee: string; target: string }): string {
        let message = `ForcedExit ${forcedExit.stringToken} to: ${forcedExit.target.toLowerCase()}`;
        if (forcedExit.stringFee != null) {
            message += `\nFee: ${forcedExit.stringFee} ${forcedExit.stringToken}`;
        }
        return message;
    }

    async ethSignWithdraw(withdraw: {
        stringAmount: string;
        stringToken: string;
        stringFee: string;
        ethAddress: string;
        nonce: number;
        accountId: number;
    }): Promise<TxEthSignature> {
        const message = this.getWithdrawEthSignMessage(withdraw);
        return await this.getEthMessageSignature(message);
    }

    getChangePubKeyEthSignMessage(changePubKey: {
        pubKeyHash: PubKeyHash;
        nonce: number;
        accountId: number;
    }): Uint8Array {
        return getChangePubkeyMessage(changePubKey.pubKeyHash, changePubKey.nonce, changePubKey.accountId);
    }

    async ethSignChangePubKey(changePubKey: {
        pubKeyHash: PubKeyHash;
        nonce: number;
        accountId: number;
    }): Promise<TxEthSignature> {
        const message = this.getChangePubKeyEthSignMessage(changePubKey);
        return await this.getEthMessageSignature(message);
    }
}
