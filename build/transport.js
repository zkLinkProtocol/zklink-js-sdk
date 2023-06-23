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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DummyTransport = exports.WSTransport = exports.HTTPTransport = exports.JRPCError = exports.AbstractJSONRPCTransport = void 0;
const axios_1 = __importDefault(require("axios"));
const ethers = __importStar(require("ethers"));
const ethers_1 = require("ethers");
const websocket = __importStar(require("websocket"));
const signer_1 = require("./signer");
const WebSocketAsPromised = require("websocket-as-promised");
const W3CWebSocket = websocket.w3cwebsocket;
class AbstractJSONRPCTransport {
    subscriptionsSupported() {
        return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    subscribe(subMethod, subParams, unsubMethod, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('subscription are not supported for this transport');
        });
    }
}
exports.AbstractJSONRPCTransport = AbstractJSONRPCTransport;
// Has jrpcError field which is JRPC error object.
// https://www.jsonrpc.org/specification#error_object
class JRPCError extends Error {
    constructor(message, jrpcError) {
        super(message);
        this.jrpcError = jrpcError;
    }
}
exports.JRPCError = JRPCError;
class Subscription {
    constructor(unsubscribe) {
        this.unsubscribe = unsubscribe;
    }
}
class HTTPTransport extends AbstractJSONRPCTransport {
    constructor(address, rpcTimeout = 30000) {
        super();
        this.address = address;
        this.rpcTimeout = rpcTimeout;
    }
    // JSON RPC request
    request(method, params = null) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = {
                id: 1,
                jsonrpc: '2.0',
                method,
                params,
            };
            const controller = new AbortController();
            const timeout = setTimeout(() => {
                controller.abort('JRPC Timeout');
            }, this.rpcTimeout);
            const response = yield axios_1.default.post(this.address, request, {
                signal: controller.signal,
            }).then((resp) => {
                return resp.data;
            });
            clearTimeout(timeout);
            if ('result' in response) {
                return response.result;
            }
            else if ('error' in response) {
                throw new JRPCError(`zkLink API response error: code ${response.error.code}; message: ${response.error.message}`, response.error);
            }
            else {
                throw new Error('Unknown JRPC Error');
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}
exports.HTTPTransport = HTTPTransport;
/**
 * @deprecated Websocket support will be removed in future. Use HTTP transport instead.
 */
class WSTransport extends AbstractJSONRPCTransport {
    constructor(address) {
        super();
        this.address = address;
        this.ws = new WebSocketAsPromised(address, {
            createWebSocket: (url) => new W3CWebSocket(url),
            packMessage: (data) => JSON.stringify(data),
            unpackMessage: (data) => JSON.parse(data),
            attachRequestId: (data, requestId) => Object.assign({ id: requestId }, data),
            extractRequestId: (data) => data && data.id,
        });
        this.subscriptionCallback = new Map();
        // Call all subscription callbacks
        this.ws.onUnpackedMessage.addListener((data) => {
            if (data.params && data.params.subscription) {
                const params = data.params;
                if (this.subscriptionCallback.has(params.subscription)) {
                    this.subscriptionCallback.get(params.subscription)(params.result);
                }
            }
        });
    }
    static connect(address = 'ws://127.0.0.1:3031') {
        return __awaiter(this, void 0, void 0, function* () {
            const transport = new WSTransport(address);
            yield transport.ws.open();
            return transport;
        });
    }
    subscriptionsSupported() {
        return true;
    }
    subscribe(subMethod, subParams, unsubMethod, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            const req = { jsonrpc: '2.0', method: subMethod, params: subParams };
            const sub = yield this.ws.sendRequest(req);
            if (sub.error) {
                throw new JRPCError('Subscription failed', sub.error);
            }
            const subId = sub.result;
            this.subscriptionCallback.set(subId, cb);
            const unsubscribe = () => __awaiter(this, void 0, void 0, function* () {
                const unsubRep = yield this.ws.sendRequest({
                    jsonrpc: '2.0',
                    method: unsubMethod,
                    params: [subId],
                });
                if (unsubRep.error) {
                    throw new JRPCError(`Unsubscribe failed: ${subId}, ${JSON.stringify(unsubRep.error)}`, unsubRep.error);
                }
                if (unsubRep.result !== true) {
                    throw new Error(`Unsubscription failed, returned false: ${subId}`);
                }
                this.subscriptionCallback.delete(subId);
            });
            return new Subscription(unsubscribe);
        });
    }
    // JSON RPC request
    request(method, params = null) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = {
                jsonrpc: '2.0',
                method,
                params,
            };
            const response = yield this.ws.sendRequest(request, { requestId: 1 });
            if ('result' in response) {
                return response.result;
            }
            else if ('error' in response) {
                throw new JRPCError(`zkLink API response error: code ${response.error.code}; message: ${response.error.message}`, response.error);
            }
            else {
                throw new Error('Unknown JRPC Error');
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ws.close();
        });
    }
}
exports.WSTransport = WSTransport;
class DummyTransport extends AbstractJSONRPCTransport {
    constructor(network, ethPrivateKey, getTokens) {
        super();
        this.network = network;
        this.ethPrivateKey = ethPrivateKey;
        this.getTokens = getTokens;
    }
    getPubKeyHash() {
        return __awaiter(this, void 0, void 0, function* () {
            const ethWallet = new ethers.Wallet(this.ethPrivateKey);
            const { signer } = yield signer_1.Signer.fromETHSignature(ethWallet);
            return yield signer.pubKeyHash();
        });
    }
    request(method, params = null) {
        return __awaiter(this, void 0, void 0, function* () {
            if (method == 'getSupportChains') {
                return [
                    {
                        chainId: 1,
                        layerOneChainId: 1001,
                        mainContract: '0x000102030405060708090a0b0c0d0e0f10111213',
                    },
                ];
            }
            if (method == 'getSupportTokens') {
                const tokensList = this.getTokens();
                const tokens = {};
                for (const tokenItem of tokensList) {
                    const token = {
                        chains: tokenItem.chains,
                        id: tokenItem.id,
                        symbol: tokenItem.symbol,
                        decimals: tokenItem.decimals,
                    };
                    tokens[tokenItem.id] = token;
                }
                return tokens;
            }
            if (method == 'estimateTransactionFee') {
                return '4070000000000000';
            }
            if (method == 'getAccount') {
                // The example `AccountState` instance:
                //  - assigns the '42' value to account_id;
                //  - assigns the committed.pubKeyHash to match the wallet's signer's PubKeyHash
                //  - adds single entry of "DAI" token to the committed balances;
                //  - adds single entry of "USDC" token to the verified balances.
                return {
                    id: 42,
                    address: params[0],
                    nonce: 0,
                    pubKeyHash: yield this.getPubKeyHash(),
                    subAccountNonces: {
                        '0': 5,
                        '1': 10,
                    },
                };
            }
            if (method == 'getAccountBalances') {
                return {
                    '0': {
                        '1': ethers_1.BigNumber.from(12345).toString(),
                    },
                };
            }
            if (method == 'getTransactionByHash') {
                return {
                    txHash: params[0],
                    tx: {
                        type: 'Transfer',
                        accountId: 2,
                        fromSubAccountId: 0,
                        toSubAccountId: 1,
                        to: '0xdc9c9863167ee865edd5216964b8b99d43ee7a81',
                        token: 18,
                        amount: '1000000000000',
                        fee: '216000000000000',
                        nonce: 38192,
                        signature: {
                            pubKey: '5f07954b65b5407a37ec0a2c54fb4647e2014475936057bb2f52a6faab938b02',
                            signature: '79bdeaa739557a4be289ef2bf718253ce791adc3ce5fbcb7abcad4b0a2d6e203a9c38d68d987f96ffc7a391f2518f281874f33c7a5a7110d27591ad029b31005',
                        },
                        ts: 1675406687,
                    },
                    receipt: {
                        executed: true,
                        success: true,
                        failReason: null,
                        block: 3947,
                        index: 1,
                    },
                    updates: [
                        {
                            type: 'BalanceUpdate',
                            updateId: 9,
                            accountId: 2,
                            subAccountId: 0,
                            coinId: 18,
                            oldBalance: '1941710093000000000000',
                            newBalance: '1941709876000000000000',
                            oldNonce: 38192,
                            newNonce: 38193,
                        },
                        {
                            type: 'BalanceUpdate',
                            updateId: 10,
                            accountId: 2,
                            subAccountId: 1,
                            coinId: 18,
                            oldBalance: '38191000000000000',
                            newBalance: '38192000000000000',
                            oldNonce: 38192,
                            newNonce: 38193,
                        },
                    ],
                };
            }
            if (method == 'sendTransaction') {
                return ['0x0d162d589577dc3fdeffb8270feb53da7415b2a82249954c40ced41ae7e2270d'];
            }
            if (method == 'get_zksync_version') {
                return 'contracts-4';
            }
            return {
                method,
                params,
            };
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}
exports.DummyTransport = DummyTransport;
