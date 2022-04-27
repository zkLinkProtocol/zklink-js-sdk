"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Signer_privateKey;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Create2WalletSigner = exports.Signer = void 0;
const crypto_1 = require("./crypto");
const ethers_1 = require("ethers");
const utils = __importStar(require("./utils"));
class Signer {
    constructor(privKey) {
        _Signer_privateKey.set(this, void 0);
        __classPrivateFieldSet(this, _Signer_privateKey, privKey, "f");
    }
    pubKeyHash() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (0, crypto_1.privateKeyToPubKeyHash)(__classPrivateFieldGet(this, _Signer_privateKey, "f"));
        });
    }
    getPublicKey() {
        return __awaiter(this, void 0, void 0, function* () {
            const wallet = new ethers_1.ethers.Wallet(__classPrivateFieldGet(this, _Signer_privateKey, "f"));
            return wallet.publicKey;
        });
    }
    signMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const wallet = new ethers_1.ethers.Wallet(__classPrivateFieldGet(this, _Signer_privateKey, "f"));
            return yield wallet.signMessage(message);
        });
    }
    signTransactionBytes(bytes) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (0, crypto_1.signTransactionBytes)(__classPrivateFieldGet(this, _Signer_privateKey, "f"), bytes);
        });
    }
    /**
     * @deprecated `Signer.*SignBytes` methods will be removed in future. Use `utils.serializeTx` instead.
     */
    transferSignBytes(transfer) {
        return utils.serializeTransfer(Object.assign(Object.assign({}, transfer), { type: 'Transfer', token: transfer.tokenId }));
    }
    signSyncTransfer(transfer) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = Object.assign(Object.assign({}, transfer), { type: 'Transfer', token: transfer.tokenId });
            const msgBytes = utils.serializeTransfer(tx);
            const signature = yield (0, crypto_1.signTransactionBytes)(__classPrivateFieldGet(this, _Signer_privateKey, "f"), msgBytes);
            return Object.assign(Object.assign({}, tx), { amount: ethers_1.BigNumber.from(transfer.amount).toString(), fee: ethers_1.BigNumber.from(transfer.fee).toString(), signature });
        });
    }
    signSyncCurveAddLiquidity(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = Object.assign(Object.assign({}, payload), { type: 'L2CurveAddLiq' });
            const msgBytes = utils.serializeCurveAddLiquidity(tx);
            const signature = yield (0, crypto_1.signTransactionBytes)(__classPrivateFieldGet(this, _Signer_privateKey, "f"), msgBytes);
            return Object.assign(Object.assign({}, tx), { amounts: payload.amounts.map(amount => ethers_1.BigNumber.from(amount).toString()), collectFees: payload.collectFees.map(fee => ethers_1.BigNumber.from(fee).toString()), fee: ethers_1.BigNumber.from(payload.fee).toString(), lpQuantity: ethers_1.BigNumber.from(payload.lpQuantity).toString(), minLpQuantity: ethers_1.BigNumber.from(payload.minLpQuantity).toString(), signature });
        });
    }
    signSyncCurveRemoveLiquidity(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = Object.assign(Object.assign({}, payload), { type: 'L2CurveRemoveLiquidity' });
            const msgBytes = utils.serializeCurveRemoveLiquidity(tx);
            const signature = yield (0, crypto_1.signTransactionBytes)(__classPrivateFieldGet(this, _Signer_privateKey, "f"), msgBytes);
            return Object.assign(Object.assign({}, tx), { amounts: payload.amounts.map(amount => ethers_1.BigNumber.from(amount).toString()), minAmounts: payload.minAmounts.map(amount => ethers_1.BigNumber.from(amount).toString()), fee: ethers_1.BigNumber.from(payload.fee).toString(), curveFee: ethers_1.BigNumber.from(payload.curveFee).toString(), lpQuantity: ethers_1.BigNumber.from(payload.lpQuantity).toString(), signature });
        });
    }
    signSyncCurveSwap(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = Object.assign(Object.assign({}, payload), { type: 'CurveSwap' });
            const msgBytes = utils.serializeCurveSwap(tx);
            const signature = yield (0, crypto_1.signTransactionBytes)(__classPrivateFieldGet(this, _Signer_privateKey, "f"), msgBytes);
            return Object.assign(Object.assign({}, tx), { amountIn: ethers_1.BigNumber.from(payload.amountIn).toString(), amountOut: ethers_1.BigNumber.from(payload.amountOut).toString(), amountOutMin: ethers_1.BigNumber.from(payload.amountOutMin).toString(), fee: ethers_1.BigNumber.from(payload.fee).toString(), adminFee: ethers_1.BigNumber.from(payload.adminFee).toString(), signature });
        });
    }
    signSyncOrder(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = Object.assign(Object.assign({}, payload), { type: 'Order' });
            const msgBytes = utils.serializeOrder(tx);
            const signature = yield (0, crypto_1.signTransactionBytes)(__classPrivateFieldGet(this, _Signer_privateKey, "f"), msgBytes);
            return Object.assign(Object.assign({}, tx), { price: ethers_1.BigNumber.from(payload.price).toString(), amount: ethers_1.BigNumber.from(payload.amount).toString(), signature });
        });
    }
    /**
     * @deprecated `Signer.*SignBytes` methods will be removed in future. Use `utils.serializeTx` instead.
     */
    withdrawSignBytes(withdraw) {
        return utils.serializeWithdraw(Object.assign(Object.assign({}, withdraw), { type: 'Withdraw', to: withdraw.ethAddress, token: withdraw.tokenId }));
    }
    signSyncWithdraw(withdraw) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = Object.assign(Object.assign({}, withdraw), { type: 'Withdraw', token: withdraw.tokenId });
            const msgBytes = utils.serializeWithdraw(tx);
            const signature = yield (0, crypto_1.signTransactionBytes)(__classPrivateFieldGet(this, _Signer_privateKey, "f"), msgBytes);
            return Object.assign(Object.assign({}, tx), { amount: ethers_1.BigNumber.from(withdraw.amount).toString(), fee: ethers_1.BigNumber.from(withdraw.fee).toString(), signature });
        });
    }
    /**
     * @deprecated `Signer.*SignBytes` methods will be removed in future. Use `utils.serializeTx` instead.
     */
    forcedExitSignBytes(forcedExit) {
        return utils.serializeForcedExit(Object.assign(Object.assign({}, forcedExit), { type: 'ForcedExit', token: forcedExit.tokenId }));
    }
    signSyncForcedExit(forcedExit) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = Object.assign(Object.assign({}, forcedExit), { type: 'ForcedExit', token: forcedExit.tokenId });
            const msgBytes = utils.serializeForcedExit(tx);
            const signature = yield (0, crypto_1.signTransactionBytes)(__classPrivateFieldGet(this, _Signer_privateKey, "f"), msgBytes);
            return Object.assign(Object.assign({}, tx), { fee: ethers_1.BigNumber.from(forcedExit.fee).toString(), signature });
        });
    }
    /**
     * @deprecated `Signer.*SignBytes` methods will be removed in future. Use `utils.serializeTx` instead.
     */
    changePubKeySignBytes(changePubKey) {
        return utils.serializeChangePubKey(Object.assign(Object.assign({}, changePubKey), { type: 'ChangePubKey', feeToken: changePubKey.feeTokenId, 
            // this is not important for serialization
            ethAuthData: { type: 'Onchain' } }));
    }
    signSyncChangePubKey(changePubKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = Object.assign(Object.assign({}, changePubKey), { type: 'ChangePubKey', feeToken: changePubKey.feeTokenId });
            const msgBytes = utils.serializeChangePubKey(tx);
            const signature = yield (0, crypto_1.signTransactionBytes)(__classPrivateFieldGet(this, _Signer_privateKey, "f"), msgBytes);
            return Object.assign(Object.assign({}, tx), { fee: ethers_1.BigNumber.from(changePubKey.fee).toString(), signature });
        });
    }
    static fromPrivateKey(pk) {
        return new Signer(pk);
    }
    static fromSeed(seed) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Signer(yield (0, crypto_1.privateKeyFromSeed)(seed));
        });
    }
    static fromETHSignature(ethSigner) {
        return __awaiter(this, void 0, void 0, function* () {
            let message = 'Access zkLink account.\n\nOnly sign this message for a trusted client!';
            const signedBytes = utils.getSignedBytesFromMessage(message, false);
            const signature = yield utils.signMessagePersonalAPI(ethSigner, signedBytes);
            const address = yield ethSigner.getAddress();
            const ethSignatureType = yield utils.getEthSignatureType(ethSigner.provider, message, signature, address);
            const seed = ethers_1.ethers.utils.arrayify(signature);
            const signer = yield Signer.fromSeed(seed);
            return { signer, ethSignatureType };
        });
    }
}
exports.Signer = Signer;
_Signer_privateKey = new WeakMap();
class Create2WalletSigner extends ethers_1.ethers.Signer {
    constructor(zkSyncPubkeyHash, create2WalletData, provider) {
        super();
        this.zkSyncPubkeyHash = zkSyncPubkeyHash;
        this.create2WalletData = create2WalletData;
        Object.defineProperty(this, 'provider', {
            enumerable: true,
            value: provider,
            writable: false
        });
        const create2Info = utils.getCREATE2AddressAndSalt(zkSyncPubkeyHash, create2WalletData);
        this.address = create2Info.address;
        this.salt = create2Info.salt;
    }
    getAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.address;
        });
    }
    /**
     * This signer can't sign messages but we return zeroed signature bytes to comply with ethers API.
     */
    signMessage(_message) {
        return __awaiter(this, void 0, void 0, function* () {
            return ethers_1.ethers.utils.hexlify(new Uint8Array(65));
        });
    }
    signTransaction(_message) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Create2Wallet signer can't sign transactions");
        });
    }
    connect(provider) {
        return new Create2WalletSigner(this.zkSyncPubkeyHash, this.create2WalletData, provider);
    }
}
exports.Create2WalletSigner = Create2WalletSigner;
