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
exports.Provider = void 0;
const logger_1 = require("@ethersproject/logger");
const ethers_1 = require("ethers");
const transport_1 = require("./transport");
const utils_1 = require("./utils");
const EthersErrorCode = logger_1.ErrorCode;
class Provider {
    constructor(transport, rpcTimeout = 10000, pollIntervalMilliSecs = 2000) {
        this.transport = transport;
        this.rpcTimeout = rpcTimeout;
        this.pollIntervalMilliSecs = pollIntervalMilliSecs;
    }
    /**
     * @deprecated Websocket support will be removed in future. Use HTTP transport instead.
     */
    static newWebsocketProvider(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const transport = yield transport_1.WSTransport.connect(address);
            const provider = new Provider(transport);
            provider.tokenSet = new utils_1.TokenSet(yield provider.getTokens());
            return provider;
        });
    }
    static newHttpProvider(address = 'http://127.0.0.1:3030', rpcTimeout, pollIntervalMilliSecs) {
        return __awaiter(this, void 0, void 0, function* () {
            const transport = new transport_1.HTTPTransport(address, rpcTimeout);
            const provider = new Provider(transport, rpcTimeout, pollIntervalMilliSecs);
            provider.tokenSet = new utils_1.TokenSet(yield provider.getTokens());
            yield provider.getContractInfo();
            return provider;
        });
    }
    /**
     * Provides some hardcoded values the `Provider` responsible for
     * without communicating with the network
     */
    static newMockProvider(network, ethPrivateKey, getTokens) {
        return __awaiter(this, void 0, void 0, function* () {
            const transport = new transport_1.DummyTransport(network, ethPrivateKey, getTokens);
            const provider = new Provider(transport);
            provider.tokenSet = new utils_1.TokenSet(yield provider.getTokens());
            return provider;
        });
    }
    // return transaction hash (e.g. 0xdead..beef)
    submitTx({ tx, signature, }) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.transport.request('sendTransaction', [tx, signature]);
        });
    }
    getContractInfo() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!((_a = this.contractInfo) === null || _a === void 0 ? void 0 : _a.length)) {
                this.contractInfo = yield this.transport.request('getSupportChains', []);
            }
            return this.contractInfo;
        });
    }
    getContractInfoByChainId(chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            const contractInfo = yield this.getContractInfo();
            return contractInfo.find((v) => v.chainId === chainId);
        });
    }
    getTokens() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.transport.request('getSupportTokens', []);
        });
    }
    updateTokenSet() {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedTokenSet = new utils_1.TokenSet(yield this.getTokens());
            this.tokenSet = updatedTokenSet;
        });
    }
    getState(address) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.transport.request('getAccount', [address]);
            }
            catch (e) {
                if (((_a = e === null || e === void 0 ? void 0 : e.jrpcError) === null || _a === void 0 ? void 0 : _a.code) === 201) {
                    return {
                        id: null,
                        address: address,
                        nonce: 0,
                        pubKeyHash: '0x0000000000000000000000000000000000000000',
                        accountType: 'unknown',
                        subAccountNonces: {},
                    };
                }
                throw e;
            }
        });
    }
    getBalance(accountId, subAccountId) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = [accountId];
            if (typeof subAccountId === 'number') {
                params.push(subAccountId);
            }
            return yield this.transport.request('getAccountBalances', [...params]);
        });
    }
    // get transaction status by its hash (e.g. 0xdead..beef)
    getTxReceipt(txHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.transport.request('getTransactionByHash', [txHash, false]);
            return result === null || result === void 0 ? void 0 : result.receipt;
        });
    }
    getBlockInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.transport.request('getLatestBlockNumber', []);
        });
    }
    notifyTransaction(hash, action = 'COMMIT') {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.transport.subscriptionsSupported()) {
                return yield new Promise((resolve) => {
                    const subscribe = this.transport.subscribe('tx_subscribe', [hash, action], 'tx_unsubscribe', (resp) => {
                        subscribe
                            .then((sub) => sub.unsubscribe())
                            .catch((err) => console.log(`WebSocket connection closed with reason: ${err}`));
                        resolve(resp);
                    });
                });
            }
            else {
                while (true) {
                    const transactionStatus = yield this.getTxReceipt(hash).catch((e) => { });
                    const notifyDone = transactionStatus && (transactionStatus === null || transactionStatus === void 0 ? void 0 : transactionStatus.executed);
                    if (notifyDone) {
                        return transactionStatus;
                    }
                    else {
                        yield (0, utils_1.sleep)(this.pollIntervalMilliSecs);
                    }
                }
            }
        });
    }
    // getTransactionFee is deprecated, will be removed in future.
    getTransactionFee(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            return ethers_1.BigNumber.from('0');
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.transport.disconnect();
        });
    }
}
exports.Provider = Provider;
