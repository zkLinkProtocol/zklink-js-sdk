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
const wallet_1 = require("./wallet");
const logger_1 = require("@ethersproject/logger");
const EthersErrorCode = logger_1.ErrorCode;
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
        return __awaiter(this, void 0, void 0, function* () {
            this.chainId = String(chainId);
            this.contractAddress = yield this.getContractAddress();
            this.tokenSet = new utils_1.TokenSet(yield this.getTokens());
        });
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
    fastSwapAccepts(accepts) {
        return __awaiter(this, void 0, void 0, function* () {
            const mainZkSyncContract = this.getZkSyncMainContract(accepts.ethSigner);
            const hash = ethers_1.ethers.utils.solidityKeccak256(['address', 'uint', 'string', 'string', 'uint'], [accepts.receiver, accepts.tokenId, accepts.amount.toString(), accepts.withdrawFee, accepts.uNonce]);
            const address = yield mainZkSyncContract.accepts(hash);
            return address;
        });
    }
    getZkSyncMainContract(ethSigner) {
        return new ethers_1.ethers.Contract(this.contractAddress.mainContract, utils_1.SYNC_MAIN_CONTRACT_INTERFACE, ethSigner);
    }
    isERC20DepositsApproved(tokenAddress, accountAddress, ethSigner, erc20ApproveThreshold = utils_1.ERC20_APPROVE_TRESHOLD) {
        return __awaiter(this, void 0, void 0, function* () {
            if (utils_1.isTokenETH(tokenAddress)) {
                throw Error('ETH token does not need approval.');
            }
            const erc20contract = new ethers_1.Contract(tokenAddress, utils_1.IERC20_INTERFACE, ethSigner);
            try {
                const currentAllowance = yield erc20contract.allowance(accountAddress, this.contractAddress.mainContract);
                return ethers_1.BigNumber.from(currentAllowance).gte(erc20ApproveThreshold);
            }
            catch (e) {
                this.modifyEthersError(e);
            }
        });
    }
    approveERC20TokenDeposits(tokenAddress, ethSigner, max_erc20_approve_amount = utils_1.MAX_ERC20_APPROVE_AMOUNT) {
        return __awaiter(this, void 0, void 0, function* () {
            if (utils_1.isTokenETH(tokenAddress)) {
                throw Error('ETH token does not need approval.');
            }
            const erc20contract = new ethers_1.Contract(tokenAddress, utils_1.IERC20_INTERFACE, ethSigner);
            try {
                return erc20contract.approve(this.contractAddress.mainContract, max_erc20_approve_amount);
            }
            catch (e) {
                this.modifyEthersError(e);
            }
        });
    }
    bridge(bridge) {
        return __awaiter(this, void 0, void 0, function* () {
            const mainZkSyncContract = this.getZkSyncMainContract(bridge.ethSigner);
            let ethTransaction;
            let uNonce = 0;
            try {
                uNonce = yield this.fastSwapUNonce({
                    receiver: bridge.to,
                    tokenId: bridge.tokenId,
                    amount: bridge.amount,
                    withdrawFee: bridge.withdrawFee,
                    ethSigner: bridge.ethSigner,
                });
            }
            catch (e) {
                this.modifyEthersError(e);
            }
            const args = [
                bridge.from,
                bridge.to,
                bridge.amount,
                bridge.tokenAddress,
                bridge.toChainId,
                uNonce,
                bridge.withdrawFee,
                Object.assign({}, bridge.ethTxOptions)
            ];
            // We set gas limit only if user does not set it using ethTxOptions.
            const txRequest = args[args.length - 1];
            if (txRequest.gasLimit == null) {
                try {
                    const gasEstimate = yield mainZkSyncContract.estimateGas.mappingToken(...args).then((estimate) => estimate, () => ethers_1.BigNumber.from('0'));
                    let recommendedGasLimit = utils_1.ERC20_RECOMMENDED_FASTSWAP_GAS_LIMIT;
                    txRequest.gasLimit = gasEstimate.gte(recommendedGasLimit) ? gasEstimate : recommendedGasLimit;
                    args[args.length - 1] = txRequest;
                }
                catch (e) {
                    this.modifyEthersError(e);
                }
            }
            try {
                ethTransaction = yield mainZkSyncContract.mappingToken(...args);
            }
            catch (e) {
                this.modifyEthersError(e);
            }
            return new wallet_1.ETHOperation(ethTransaction, this);
        });
    }
    fastSwapUNonce(swap) {
        return __awaiter(this, void 0, void 0, function* () {
            const uNonce = utils_1.getFastSwapUNonce();
            const acceptAddress = yield this.fastSwapAccepts(Object.assign(Object.assign({}, swap), { uNonce }));
            if (acceptAddress === ethers_1.constants.AddressZero) {
                return uNonce;
            }
            return yield this.fastSwapUNonce(swap);
        });
    }
    fastSwap(swap) {
        return __awaiter(this, void 0, void 0, function* () {
            const mainZkSyncContract = this.getZkSyncMainContract(swap.ethSigner);
            let ethTransaction;
            let uNonce = 0;
            try {
                uNonce = yield this.fastSwapUNonce({
                    receiver: swap.to,
                    tokenId: swap.tokenId0,
                    amount: swap.amountIn,
                    withdrawFee: swap.withdrawFee,
                    ethSigner: swap.ethSigner,
                });
            }
            catch (e) {
                this.modifyEthersError(e);
            }
            if (!uNonce) {
                this.modifyEthersError(new Error('swap tx nonce is none'));
            }
            // -------------------------------
            if (utils_1.isTokenETH(swap.token0)) {
                try {
                    // function swapExactETHForTokens(address _zkSyncAddress,uint104 _amountOutMin, uint16 _withdrawFee, uint8 _toChainId, uint16 _toTokenId, address _to, uint32 _nonce) external payable
                    ethTransaction = yield mainZkSyncContract.swapExactETHForTokens(swap.from, swap.amountOutMin, swap.withdrawFee, swap.toChainId, swap.tokenId1, swap.to, uNonce, Object.assign({ value: ethers_1.BigNumber.from(swap.amountIn), gasLimit: ethers_1.BigNumber.from(utils_1.ETH_RECOMMENDED_FASTSWAP_GAS_LIMIT) }, swap.ethTxOptions));
                }
                catch (e) {
                    this.modifyEthersError(e);
                }
            }
            else {
                const tokenAddress = this.tokenSet.resolveTokenAddress(swap.token0);
                // ERC20 token deposit
                let nonce;
                // function swapExactTokensForTokens(address _zkSyncAddress, uint104 _amountIn, uint104 _amountOutMin, uint16 _withdrawFee, IERC20 _fromToken, uint8 _toChainId, uint16 _toTokenId, address _to, uint32 _nonce) external
                const args = [
                    swap.from,
                    swap.amountIn,
                    swap.amountOutMin,
                    swap.withdrawFee,
                    tokenAddress,
                    swap.toChainId,
                    swap.tokenId1,
                    swap.to,
                    uNonce,
                    Object.assign({ nonce }, swap.ethTxOptions)
                ];
                // We set gas limit only if user does not set it using ethTxOptions.
                const txRequest = args[args.length - 1];
                if (txRequest.gasLimit == null) {
                    try {
                        const gasEstimate = yield mainZkSyncContract.estimateGas.swapExactTokensForTokens(...args).then((estimate) => estimate, () => ethers_1.BigNumber.from('0'));
                        let recommendedGasLimit = utils_1.ERC20_RECOMMENDED_FASTSWAP_GAS_LIMIT;
                        txRequest.gasLimit = gasEstimate.gte(recommendedGasLimit) ? gasEstimate : recommendedGasLimit;
                        args[args.length - 1] = txRequest;
                    }
                    catch (e) {
                        this.modifyEthersError(e);
                    }
                }
                try {
                    ethTransaction = yield mainZkSyncContract.swapExactTokensForTokens(...args);
                }
                catch (e) {
                    this.modifyEthersError(e);
                }
            }
            return new wallet_1.ETHOperation(ethTransaction, this);
        });
    }
    getPendingBalance(pending) {
        return __awaiter(this, void 0, void 0, function* () {
            const mainZkSyncContract = this.getZkSyncMainContract(pending.ethSigner);
            const balance = mainZkSyncContract.getPendingBalance(pending.account, pending.tokenAddress);
            return ethers_1.BigNumber.from(balance);
        });
    }
    withdrawPendingBalance(withdraw) {
        return __awaiter(this, void 0, void 0, function* () {
            const mainZkSyncContract = this.getZkSyncMainContract(withdraw.ethSigner);
            const ethTransaction = mainZkSyncContract.withdrawPendingBalance(withdraw.account, withdraw.tokenAddress, ethers_1.BigNumber.from(withdraw.amount));
            return new wallet_1.ETHOperation(ethTransaction, this);
        });
    }
    modifyEthersError(error) {
        // List of errors that can be caused by user's actions, which have to be forwarded as-is.
        const correct_errors = [
            EthersErrorCode.NONCE_EXPIRED,
            EthersErrorCode.INSUFFICIENT_FUNDS,
            EthersErrorCode.REPLACEMENT_UNDERPRICED,
            EthersErrorCode.UNPREDICTABLE_GAS_LIMIT
        ];
        if (!correct_errors.includes(error.code)) {
            // This is an error which we don't expect
            error.message = `Ethereum smart wallet JSON RPC server returned the following error while executing an operation: "${error.message}". Please contact your smart wallet support for help.`;
        }
        throw error;
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
