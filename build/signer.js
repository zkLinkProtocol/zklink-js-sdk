"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
const utils_1 = require("ethers/lib/utils");
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
    signTransactionBytes(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (0, crypto_1.signTransactionBytes)(__classPrivateFieldGet(this, _Signer_privateKey, "f"), (0, utils_1.arrayify)(msg));
        });
    }
    pubKey() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (0, crypto_1.privateKeyToPubKey)(__classPrivateFieldGet(this, _Signer_privateKey, "f"));
        });
    }
    signTransfer(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            const msgBytes = utils.serializeTransfer(tx);
            const signature = yield (0, crypto_1.signTransactionBytes)(__classPrivateFieldGet(this, _Signer_privateKey, "f"), msgBytes);
            return Object.assign(Object.assign({}, tx), { amount: ethers_1.BigNumber.from(tx.amount).toString(), fee: ethers_1.BigNumber.from(tx.fee).toString(), signature });
        });
    }
    signOrderMatching(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            const msgBytes = yield utils.serializeOrderMatching(tx);
            const signature = yield (0, crypto_1.signTransactionBytes)(__classPrivateFieldGet(this, _Signer_privateKey, "f"), msgBytes);
            return Object.assign(Object.assign({}, tx), { maker: Object.assign(Object.assign({}, tx.maker), { price: ethers_1.BigNumber.from(tx.maker.price).toString(), amount: ethers_1.BigNumber.from(tx.maker.amount).toString() }), taker: Object.assign(Object.assign({}, tx.taker), { price: ethers_1.BigNumber.from(tx.taker.price).toString(), amount: ethers_1.BigNumber.from(tx.taker.amount).toString() }), fee: ethers_1.BigNumber.from(tx.fee).toString(), expectBaseAmount: ethers_1.BigNumber.from(tx.expectBaseAmount).toString(), expectQuoteAmount: ethers_1.BigNumber.from(tx.expectQuoteAmount).toString(), signature });
        });
    }
    signOrder(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            const msgBytes = utils.serializeOrder(tx);
            const signature = yield (0, crypto_1.signTransactionBytes)(__classPrivateFieldGet(this, _Signer_privateKey, "f"), msgBytes);
            return Object.assign(Object.assign({}, tx), { price: ethers_1.BigNumber.from(tx.price).toString(), amount: ethers_1.BigNumber.from(tx.amount).toString(), signature });
        });
    }
    signWithdraw(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            const msgBytes = utils.serializeWithdraw(tx);
            const signature = yield (0, crypto_1.signTransactionBytes)(__classPrivateFieldGet(this, _Signer_privateKey, "f"), msgBytes);
            return Object.assign(Object.assign({}, tx), { amount: ethers_1.BigNumber.from(tx.amount).toString(), fee: ethers_1.BigNumber.from(tx.fee).toString(), signature });
        });
    }
    signForcedExit(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            const msgBytes = utils.serializeForcedExit(tx);
            const signature = yield (0, crypto_1.signTransactionBytes)(__classPrivateFieldGet(this, _Signer_privateKey, "f"), msgBytes);
            return Object.assign(Object.assign({}, tx), { fee: ethers_1.BigNumber.from(tx.fee).toString(), signature });
        });
    }
    signChangePubKey(changePubKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = Object.assign(Object.assign({}, changePubKey), { type: 'ChangePubKey' });
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
            let message = "Sign this message to create a private key to interact with zkLink's layer 2 services.\nNOTE: This application is powered by zkLink's multi-chain network.\n\nOnly sign this message for a trusted client!";
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
            writable: false,
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
