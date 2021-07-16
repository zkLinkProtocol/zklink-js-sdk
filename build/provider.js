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
exports.ETHProxy = exports.Provider = exports.getDefaultProvider = void 0;
const transport_1 = require("./transport");
const ethers_1 = require("ethers");
const utils_1 = require("./utils");
function getDefaultProvider(network, transport = 'HTTP') {
    return __awaiter(this, void 0, void 0, function* () {
        if (transport === 'WS') {
            console.warn('Websocket support will be removed in future. Use HTTP transport instead.');
        }
        if (network === 'localhost') {
            if (transport === 'WS') {
                return yield Provider.newWebsocketProvider('ws://127.0.0.1:3031');
            }
            else if (transport === 'HTTP') {
                return yield Provider.newHttpProvider('http://127.0.0.1:3030');
            }
        }
        else if (network === 'ropsten') {
            if (transport === 'WS') {
                return yield Provider.newWebsocketProvider('wss://ropsten-api.zksync.io/jsrpc-ws');
            }
            else if (transport === 'HTTP') {
                return yield Provider.newHttpProvider('https://ropsten-api.zksync.io/jsrpc');
            }
        }
        else if (network === 'rinkeby') {
            if (transport === 'WS') {
                return yield Provider.newWebsocketProvider('wss://rinkeby-api.zksync.io/jsrpc-ws');
            }
            else if (transport === 'HTTP') {
                return yield Provider.newHttpProvider('https://rinkeby-api.zksync.io/jsrpc');
            }
        }
        else if (network === 'ropsten-beta') {
            if (transport === 'WS') {
                return yield Provider.newWebsocketProvider('wss://ropsten-beta-api.zksync.io/jsrpc-ws');
            }
            else if (transport === 'HTTP') {
                return yield Provider.newHttpProvider('https://ropsten-beta-api.zksync.io/jsrpc');
            }
        }
        else if (network === 'rinkeby-beta') {
            if (transport === 'WS') {
                return yield Provider.newWebsocketProvider('wss://rinkeby-beta-api.zksync.io/jsrpc-ws');
            }
            else if (transport === 'HTTP') {
                return yield Provider.newHttpProvider('https://rinkeby-beta-api.zksync.io/jsrpc');
            }
        }
        else if (network === 'mainnet') {
            if (transport === 'WS') {
                return yield Provider.newWebsocketProvider('wss://api.zksync.io/jsrpc-ws');
            }
            else if (transport === 'HTTP') {
                return yield Provider.newHttpProvider('https://api.zksync.io/jsrpc');
            }
        }
        else {
            throw new Error(`Ethereum network ${network} is not supported`);
        }
    });
}
exports.getDefaultProvider = getDefaultProvider;
class Provider {
    constructor(transport) {
        this.transport = transport;
        // For HTTP provider
        this.pollIntervalMilliSecs = 500;
    }
    setChainId(chainId) {
        this.chainId = String(chainId);
    }
    /**
     * @deprecated Websocket support will be removed in future. Use HTTP transport instead.
     */
    static newWebsocketProvider(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const transport = yield transport_1.WSTransport.connect(address);
            const provider = new Provider(transport);
            provider.contractAddress = yield provider.getContractAddress();
            provider.tokenSet = new utils_1.TokenSet(yield provider.getTokens());
            return provider;
        });
    }
    static newHttpProvider(address = 'http://127.0.0.1:3030', chainId, pollIntervalMilliSecs) {
        return __awaiter(this, void 0, void 0, function* () {
            const transport = new transport_1.HTTPTransport(address);
            const provider = new Provider(transport);
            if (pollIntervalMilliSecs) {
                provider.pollIntervalMilliSecs = pollIntervalMilliSecs;
            }
            if (chainId !== undefined) {
                provider.setChainId(chainId);
            }
            console.log('provider.chainId', provider.chainId);
            provider.contractAddress = yield provider.getContractAddress();
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
            provider.contractAddress = yield provider.getContractAddress();
            provider.tokenSet = new utils_1.TokenSet(yield provider.getTokens());
            return provider;
        });
    }
    // return transaction hash (e.g. sync-tx:dead..beef)
    submitTx({ chainId, tx, signature, fastProcessing }) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.transport.request('tx_submit', [chainId, tx, signature, fastProcessing]);
        });
    }
    // Requests `zkSync` server to execute several transactions together.
    // return transaction hash (e.g. sync-tx:dead..beef)
    submitTxsBatch(transactions, ethSignatures) {
        return __awaiter(this, void 0, void 0, function* () {
            let signatures = [];
            // For backwards compatibility we allow sending single signature as well
            // as no signatures at all.
            if (ethSignatures == undefined) {
                signatures = [];
            }
            else if (ethSignatures instanceof Array) {
                signatures = ethSignatures;
            }
            else {
                signatures.push(ethSignatures);
            }
            return yield this.transport.request('submit_txs_batch', [this.chainId, transactions, signatures]);
        });
    }
    getContractAddress(chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('provider.chainId', this.chainId);
            return yield this.transport.request('contract_address', [(chainId || this.chainId)]);
        });
    }
    getTokens(chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.transport.request('tokens', [(chainId || this.chainId)]);
        });
    }
    updateTokenSet() {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedTokenSet = new utils_1.TokenSet(yield this.getTokens());
            this.tokenSet = updatedTokenSet;
        });
    }
    getState(address, chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.transport.request('account_info', [chainId, address]);
        });
    }
    getAddressByPair(token0, token1) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenId0 = this.tokenSet.resolveTokenId(token0);
            const tokenId1 = this.tokenSet.resolveTokenId(token1);
            return yield this.transport.request('address_by_pair', [this.chainId, tokenId0, tokenId1]);
        });
    }
    // get transaction status by its hash (e.g. 0xdead..beef)
    getTxReceipt(chainId, txHash) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.transport.request('tx_info', [chainId, txHash]);
        });
    }
    getPriorityOpStatus(serialId, chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.transport.request('ethop_info', [(chainId || this.chainId), serialId]);
        });
    }
    getConfirmationsForEthOpAmount(chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.transport.request('get_confirmations_for_eth_op_amount', [(chainId || this.chainId)]);
        });
    }
    getEthTxForWithdrawal(withdrawal_hash, chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.transport.request('get_eth_tx_for_withdrawal', [(chainId || this.chainId), withdrawal_hash]);
        });
    }
    notifyPriorityOp(serialId, action) {
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
                    const priorOpStatus = yield this.getPriorityOpStatus(serialId);
                    const notifyDone = action === 'COMMIT'
                        ? priorOpStatus.block && priorOpStatus.block.committed
                        : priorOpStatus.block && priorOpStatus.block.verified;
                    if (notifyDone) {
                        return priorOpStatus;
                    }
                    else {
                        yield utils_1.sleep(this.pollIntervalMilliSecs);
                    }
                }
            }
        });
    }
    notifyTransaction(chainId, hash, action) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.transport.subscriptionsSupported()) {
                return yield new Promise((resolve) => {
                    const subscribe = this.transport.subscribe('tx_subscribe', [chainId, hash, action], 'tx_unsubscribe', (resp) => {
                        subscribe
                            .then((sub) => sub.unsubscribe())
                            .catch((err) => console.log(`WebSocket connection closed with reason: ${err}`));
                        resolve(resp);
                    });
                });
            }
            else {
                while (true) {
                    const transactionStatus = yield this.getTxReceipt(chainId, hash);
                    const notifyDone = action == 'COMMIT'
                        ? transactionStatus.block && transactionStatus.block.committed
                        : transactionStatus.block && transactionStatus.block.verified;
                    if (notifyDone) {
                        return transactionStatus;
                    }
                    else {
                        yield utils_1.sleep(this.pollIntervalMilliSecs);
                    }
                }
            }
        });
    }
    getTransactionFee(chainId, txType, address, tokenLike) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionFee = yield this.transport.request('get_tx_fee', [chainId, txType, address.toString(), tokenLike]);
            return {
                feeType: transactionFee.feeType,
                gasTxAmount: ethers_1.BigNumber.from(transactionFee.gasTxAmount),
                gasPriceWei: ethers_1.BigNumber.from(transactionFee.gasPriceWei),
                gasFee: ethers_1.BigNumber.from(transactionFee.gasFee),
                zkpFee: ethers_1.BigNumber.from(transactionFee.zkpFee),
                totalFee: ethers_1.BigNumber.from(transactionFee.totalFee)
            };
        });
    }
    getTransactionsBatchFee(txTypes, addresses, tokenLike, chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            const batchFee = yield this.transport.request('get_txs_batch_fee_in_wei', [(chainId || this.chainId), txTypes, addresses, tokenLike]);
            return ethers_1.BigNumber.from(batchFee.totalFee);
        });
    }
    getTokenPrice(tokenLike, chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenPrice = yield this.transport.request('get_token_price', [(chainId || this.chainId), tokenLike]);
            return parseFloat(tokenPrice);
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.transport.disconnect();
        });
    }
}
exports.Provider = Provider;
class ETHProxy {
    constructor(ethersProvider, contractAddress) {
        this.ethersProvider = ethersProvider;
        this.contractAddress = contractAddress;
        this.governanceContract = new ethers_1.Contract(this.contractAddress.govContract, utils_1.SYNC_GOV_CONTRACT_INTERFACE, this.ethersProvider);
    }
    resolveTokenId(token) {
        return __awaiter(this, void 0, void 0, function* () {
            if (utils_1.isTokenETH(token)) {
                return 0;
            }
            else {
                const tokenId = yield this.governanceContract.tokenIds(token);
                if (tokenId == 0) {
                    throw new Error(`ERC20 token ${token} is not supported`);
                }
                return tokenId;
            }
        });
    }
}
exports.ETHProxy = ETHProxy;
