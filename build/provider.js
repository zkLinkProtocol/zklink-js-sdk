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
const transport_1 = require("./transport");
const utils_1 = require("./utils");
const logger_1 = require("@ethersproject/logger");
const EthersErrorCode = logger_1.ErrorCode;
class Provider {
    constructor(transport) {
        this.transport = transport;
        this.contractAddress = [];
        // For HTTP provider
        this.pollIntervalMilliSecs = 500;
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
    static newHttpProvider(address = 'http://127.0.0.1:3030', pollIntervalMilliSecs) {
        return __awaiter(this, void 0, void 0, function* () {
            const transport = new transport_1.HTTPTransport(address);
            const provider = new Provider(transport);
            if (pollIntervalMilliSecs) {
                provider.pollIntervalMilliSecs = pollIntervalMilliSecs;
            }
            provider.tokenSet = new utils_1.TokenSet(yield provider.getTokens());
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
    // return transaction hash (e.g. sync-tx:dead..beef)
    submitTx({ tx, signature, }) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.transport.request('tx_submit', [tx, signature]);
        });
    }
    getContractAddress(linkChainId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.contractAddress[linkChainId]) {
                return this.contractAddress[linkChainId];
            }
            this.contractAddress[linkChainId] = yield this.transport.request('contract_address', [
                linkChainId,
            ]);
            return this.contractAddress[linkChainId];
        });
    }
    getTokens() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.transport.request('tokens', []);
        });
    }
    updateTokenSet() {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedTokenSet = new utils_1.TokenSet(yield this.getTokens());
            this.tokenSet = updatedTokenSet;
        });
    }
    getState(address) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.transport.request('account_info_by_address', [address]);
        });
    }
    getStateById(accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.transport.request('account_info_by_id', [accountId]);
        });
    }
    getBalance(accountId, subAccountId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.transport.request('account_balances', [accountId, subAccountId]);
        });
    }
    getSubAccountState(address, subAccountId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.transport.request('sub_account_info', [address, subAccountId]);
        });
    }
    // get transaction status by its hash (e.g. 0xdead..beef)
    getTxReceipt(txHash) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.transport.request('tx_info', [txHash]);
        });
    }
    getPriorityOpStatus(linkChainId, serialId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.transport.request('ethop_info', [linkChainId, serialId]);
        });
    }
    notifyPriorityOp(linkChainId, serialId, action) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.transport.subscriptionsSupported()) {
                return yield new Promise((resolve) => {
                    const subscribe = this.transport.subscribe('ethop_subscribe', [serialId, action], 'ethop_unsubscribe', (resp) => {
                        subscribe
                            .then((sub) => sub.unsubscribe())
                            .catch((err) => console.log(`WebSocket connection closed with reason: ${err}`));
                        resolve(resp);
                    });
                });
            }
            else {
                while (true) {
                    const priorOpStatus = yield this.getPriorityOpStatus(linkChainId, serialId);
                    const notifyDone = action === 'COMMIT'
                        ? priorOpStatus.block && priorOpStatus.block.committed
                        : priorOpStatus.block && priorOpStatus.block.verified;
                    if (notifyDone) {
                        return priorOpStatus;
                    }
                    else {
                        yield (0, utils_1.sleep)(this.pollIntervalMilliSecs);
                    }
                }
            }
        });
    }
    notifyTransaction(hash, action) {
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
                    const transactionStatus = yield this.getTxReceipt(hash);
                    const notifyDone = action == 'COMMIT'
                        ? transactionStatus.failReason ||
                            (transactionStatus.block && transactionStatus.block.committed)
                        : transactionStatus.failReason ||
                            (transactionStatus.block && transactionStatus.block.verified);
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
    getTransactionFee(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionFee = yield this.transport.request('get_tx_fee', [tx]);
            return transactionFee;
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.transport.disconnect();
        });
    }
}
exports.Provider = Provider;
