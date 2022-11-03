"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthMessageSigner = void 0;
const utils_1 = require("./utils");
/**
 * Wrapper around `ethers.Signer` which provides convenient methods to get and sign messages required for zkSync.
 */
class EthMessageSigner {
    constructor(ethSigner, ethSignerType) {
        this.ethSigner = ethSigner;
        this.ethSignerType = ethSignerType;
    }
    getEthMessageSignature(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.ethSignerType == null) {
                throw new Error('ethSignerType is unknown');
            }
            const signedBytes = (0, utils_1.getSignedBytesFromMessage)(message, !this.ethSignerType.isSignedMsgPrefixed);
            const signature = yield (0, utils_1.signMessagePersonalAPI)(this.ethSigner, signedBytes);
            return {
                type: this.ethSignerType.verificationMethod === 'ECDSA'
                    ? 'EthereumSignature'
                    : 'EIP1271Signature',
                signature,
            };
        });
    }
    getTransferEthSignMessage(transfer) {
        let humanReadableTxInfo = this.getTransferEthMessagePart(transfer, 'transfer');
        if (humanReadableTxInfo.length != 0) {
            humanReadableTxInfo += '\n';
        }
        humanReadableTxInfo += `Nonce: ${transfer.nonce}`;
        return humanReadableTxInfo;
    }
    ethSignTransfer(transfer) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = this.getTransferEthSignMessage(transfer);
            return yield this.getEthMessageSignature(message);
        });
    }
    getOrderMatchingEthSignMessage(matching) {
        let humanReadableTxInfo = this.getOrderMatchingEthMessagePart(matching);
        if (humanReadableTxInfo.length != 0) {
            humanReadableTxInfo += '\n';
        }
        humanReadableTxInfo += `Nonce: ${matching.nonce}`;
        return humanReadableTxInfo;
    }
    ethSignOrderMatching(matching) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = this.getOrderMatchingEthSignMessage(matching);
            return yield this.getEthMessageSignature(message);
        });
    }
    getOrderMatchingEthMessagePart(tx) {
        let message = `OrderMatching fee: ${tx.stringFee} ${tx.stringFeeToken}`;
        return message;
    }
    ethSignOrder(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = this.getOrderEthSignMessage(payload);
            return yield this.getEthMessageSignature(message);
        });
    }
    getOrderEthSignMessage(payload) {
        let humanReadableTxInfo = this.getOrderEthMessagePart(payload);
        if (humanReadableTxInfo.length != 0) {
            humanReadableTxInfo += '\n';
        }
        humanReadableTxInfo += `Nonce: ${payload.nonce}`;
        return humanReadableTxInfo;
    }
    getOrderEthMessagePart(tx) {
        let message = '';
        if (tx.isSell) {
            message += `Order for ${tx.stringAmount} ${tx.baseTokenSymbol} -> ${tx.quoteTokenSymbol}`;
        }
        else {
            message += `Order for ${tx.stringAmount} ${tx.quoteTokenSymbol} -> ${tx.baseTokenSymbol}`;
        }
        message += '\n';
        message += `Price: ${tx.stringPrice} ${tx.quoteTokenSymbol}`;
        message += '\n';
        message += `Address: ${tx.address}`;
        message += '\n';
        return message;
    }
    getCreatePoolEthMessagePart(tx) {
        let message = '';
        message += `Token: ${tx.token0} - ${tx.token1}`;
        return message;
    }
    getCreatePoolEthSignMessage(transfer) {
        let humanReadableTxInfo = this.getCreatePoolEthMessagePart(transfer);
        if (humanReadableTxInfo.length != 0) {
            humanReadableTxInfo += '\n';
        }
        humanReadableTxInfo += `Nonce: ${transfer.nonce}`;
        return humanReadableTxInfo;
    }
    ethSignCreatePool(transfer) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = this.getCreatePoolEthSignMessage(transfer);
            return yield this.getEthMessageSignature(message);
        });
    }
    ethSignForcedExit(forcedExit) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = this.getForcedExitEthSignMessage(forcedExit);
            return yield this.getEthMessageSignature(message);
        });
    }
    getWithdrawEthSignMessage(withdraw) {
        let humanReadableTxInfo = this.getWithdrawEthMessagePart(withdraw);
        if (humanReadableTxInfo.length != 0) {
            humanReadableTxInfo += '\n';
        }
        humanReadableTxInfo += `Nonce: ${withdraw.nonce}`;
        return humanReadableTxInfo;
    }
    getForcedExitEthSignMessage(forcedExit) {
        let humanReadableTxInfo = this.getForcedExitEthMessagePart(forcedExit);
        humanReadableTxInfo += `\nNonce: ${forcedExit.nonce}`;
        return humanReadableTxInfo;
    }
    getTransferEthMessagePart(tx, type) {
        let txType;
        if (type == 'withdraw') {
            txType = 'Withdraw';
        }
        else if (type == 'transfer') {
            txType = 'Transfer';
        }
        else {
            throw new Error('Ether to or ethAddress field must be present');
        }
        let message = '';
        if (tx.stringAmount != null) {
            message += `${txType} ${tx.stringAmount} ${tx.stringToken} to: ${tx.to.toLowerCase()}`;
        }
        if (tx.stringFee != null) {
            if (message.length != 0) {
                message += '\n';
            }
            message += `Fee: ${tx.stringFee} ${tx.stringToken}`;
        }
        return message;
    }
    getWithdrawEthMessagePart(tx) {
        return this.getTransferEthMessagePart(tx, 'withdraw');
    }
    getChangePubKeyEthMessagePart(changePubKey) {
        let message = '';
        message += `Set signing key: ${changePubKey.pubKeyHash
            .replace('sync:', '')
            .toLowerCase()}`;
        if (changePubKey.stringFee != null) {
            message += `\nFee: ${changePubKey.stringFee} ${changePubKey.stringToken}`;
        }
        return message;
    }
    getForcedExitEthMessagePart(forcedExit) {
        let message = `ForcedExit ${forcedExit.stringToken} to: ${forcedExit.target.toLowerCase()}`;
        if (forcedExit.stringFee != null) {
            message += `\nFee: ${forcedExit.stringFee} ${forcedExit.stringFeeToken}`;
        }
        return message;
    }
    ethSignWithdraw(withdraw) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = this.getWithdrawEthSignMessage(withdraw);
            return yield this.getEthMessageSignature(message);
        });
    }
}
exports.EthMessageSigner = EthMessageSigner;
