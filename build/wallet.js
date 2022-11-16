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
exports.submitSignedTransaction = exports.Transaction = exports.ETHOperation = exports.Wallet = exports.ZKSyncTxError = void 0;
const ethers_1 = require("ethers");
const logger_1 = require("@ethersproject/logger");
const eth_message_signer_1 = require("./eth-message-signer");
const signer_1 = require("./signer");
const utils_1 = require("./utils");
const contract_1 = require("./contract");
const utils_2 = require("ethers/lib/utils");
const EthersErrorCode = logger_1.ErrorCode;
class ZKSyncTxError extends Error {
    constructor(message, value) {
        super(message);
        this.value = value;
    }
}
exports.ZKSyncTxError = ZKSyncTxError;
class Wallet {
    constructor(ethSigner, ethMessageSigner, cachedAddress, signer, accountId, ethSignerType) {
        this.ethSigner = ethSigner;
        this.ethMessageSigner = ethMessageSigner;
        this.cachedAddress = cachedAddress;
        this.signer = signer;
        this.accountId = accountId;
        this.ethSignerType = ethSignerType;
    }
    connect(provider) {
        this.provider = provider;
        this.contract = new contract_1.LinkContract(provider, this.ethSigner);
        if (this.accountId === undefined) {
            this.provider
                .getState(this.address())
                .then((r) => {
                this.accountId = r.id;
            })
                .catch((e) => { });
        }
        return this;
    }
    static fromEthSigner(ethWallet, provider, signer, accountId, ethSignerType) {
        return __awaiter(this, void 0, void 0, function* () {
            if (signer == null) {
                const signerResult = yield signer_1.Signer.fromETHSignature(ethWallet);
                signer = signerResult.signer;
                ethSignerType = ethSignerType || signerResult.ethSignatureType;
            }
            else if (ethSignerType == null) {
                throw new Error('If you passed signer, you must also pass ethSignerType.');
            }
            const address = yield ethWallet.getAddress();
            const ethMessageSigner = new eth_message_signer_1.EthMessageSigner(ethWallet, ethSignerType);
            const wallet = new Wallet(ethWallet, ethMessageSigner, address, signer, accountId, ethSignerType);
            wallet.connect(provider);
            return wallet;
        });
    }
    static fromCreate2Data(syncSigner, createrSigner, provider, create2Data, accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            const create2Signer = new signer_1.Create2WalletSigner(yield syncSigner.pubKeyHash(), create2Data, createrSigner);
            return yield Wallet.fromEthSigner(create2Signer, provider, syncSigner, accountId, {
                verificationMethod: 'ERC-1271',
                isSignedMsgPrefixed: true,
            });
        });
    }
    static fromEthSignerNoKeys(ethWallet, provider, accountId, ethSignerType) {
        return __awaiter(this, void 0, void 0, function* () {
            const ethMessageSigner = new eth_message_signer_1.EthMessageSigner(ethWallet, ethSignerType);
            const wallet = new Wallet(ethWallet, ethMessageSigner, yield ethWallet.getAddress(), undefined, accountId, ethSignerType);
            wallet.connect(provider);
            return wallet;
        });
    }
    getEIP712Signature(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.ethSignerType == null) {
                throw new Error('ethSignerType is unknown');
            }
            const signature = yield (0, utils_1.signMessageEIP712)(this.ethSigner, data);
            return {
                type: this.ethSignerType.verificationMethod === 'ECDSA'
                    ? 'EthereumSignature'
                    : 'EIP1271Signature',
                signature,
            };
        });
    }
    sendTransfer(transfer) {
        return __awaiter(this, void 0, void 0, function* () {
            const signedTransferTransaction = yield this.signTransfer(transfer);
            return submitSignedTransaction(signedTransferTransaction, this.provider);
        });
    }
    getTransferData(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.signer) {
                throw new Error('ZKLink signer is required for sending zklink transactions.');
            }
            yield this.setRequiredAccountIdFromServer('Transfer funds');
            const transactionData = Object.assign(Object.assign({}, entries), { type: 'Transfer', accountId: this.accountId || (yield this.getAccountId()), from: this.address(), token: this.provider.tokenSet.resolveTokenId(entries.token), fee: entries.fee ? entries.fee : null, nonce: entries.nonce == null ? yield this.getNonce() : yield this.getNonce(entries.nonce), ts: entries.ts || (0, utils_1.getTimestamp)() });
            if (transactionData.fee == null) {
                transactionData.fee = yield this.provider.getTransactionFee(Object.assign(Object.assign({}, transactionData), { fee: '0', amount: ethers_1.BigNumber.from(transactionData.amount).toString() }));
            }
            return transactionData;
        });
    }
    signTransfer(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionData = yield this.getTransferData(entries);
            const signedTransferTransaction = yield this.signer.signTransfer(transactionData);
            const stringAmount = ethers_1.BigNumber.from(transactionData.amount).isZero()
                ? null
                : ethers_1.utils.formatEther(transactionData.amount);
            const stringFee = ethers_1.BigNumber.from(transactionData.fee).isZero()
                ? null
                : ethers_1.utils.formatEther(transactionData.fee);
            const stringToken = this.provider.tokenSet.resolveTokenSymbol(transactionData.token);
            const ethereumSignature = yield this.ethMessageSigner.ethSignTransfer({
                stringAmount,
                stringFee,
                stringToken,
                to: transactionData.to,
                nonce: transactionData.nonce,
                accountId: transactionData.accountId || this.accountId,
            });
            return {
                tx: signedTransferTransaction,
                ethereumSignature,
            };
        });
    }
    sendForcedExit(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            const signedForcedExitTransaction = yield this.signForcedExit(entries);
            return submitSignedTransaction(signedForcedExitTransaction, this.provider);
        });
    }
    getForcedExitData(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.signer) {
                throw new Error('ZKLink signer is required for sending zklink transactions.');
            }
            yield this.setRequiredAccountIdFromServer('perform a Forced Exit');
            const transactionData = Object.assign(Object.assign({}, entries), { type: 'ForcedExit', initiatorAccountId: entries.initiatorAccountId || this.accountId, l2SourceToken: this.provider.tokenSet.resolveTokenId(entries.l2SourceToken), l1TargetToken: this.provider.tokenSet.resolveTokenId(entries.l1TargetToken), feeToken: this.provider.tokenSet.resolveTokenId(entries.feeToken), fee: entries.fee, nonce: entries.nonce == null ? yield this.getNonce() : yield this.getNonce(entries.nonce), ts: entries.ts || (0, utils_1.getTimestamp)() });
            if (transactionData.fee == null) {
                transactionData.fee = yield this.provider.getTransactionFee(Object.assign(Object.assign({}, transactionData), { fee: '0' }));
            }
            return transactionData;
        });
    }
    signForcedExit(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionData = yield this.getForcedExitData(entries);
            const signedForcedExitTransaction = yield this.signer.signForcedExit(transactionData);
            const stringFee = ethers_1.BigNumber.from(transactionData.fee).isZero()
                ? null
                : ethers_1.utils.formatEther(transactionData.fee);
            const stringToken = this.provider.tokenSet.resolveTokenSymbol(transactionData.l2SourceToken);
            const stringFeeToken = this.provider.tokenSet.resolveTokenSymbol(transactionData.feeToken);
            const ethereumSignature = yield this.ethMessageSigner.ethSignForcedExit({
                stringToken,
                stringFeeToken,
                stringFee,
                target: transactionData.target,
                nonce: transactionData.nonce,
            });
            return {
                tx: signedForcedExitTransaction,
                ethereumSignature,
            };
        });
    }
    signOrder(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.signer) {
                throw new Error('zkLink signer is required for sending zkLink transactions.');
            }
            const signedTransferTransaction = yield this.signer.signOrder(entries);
            return {
                tx: signedTransferTransaction,
                ethereumSignature: null,
            };
        });
    }
    getOrderMatchingData(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.signer) {
                throw new Error('ZKLink signer is required for sending zklink transactions.');
            }
            yield this.setRequiredAccountIdFromServer('Transfer funds');
            const transactionData = Object.assign(Object.assign({}, entries), { account: entries.account || this.address(), accountId: entries.accountId || this.accountId || (yield this.getAccountId()), type: 'OrderMatching', fee: entries.fee, feeToken: this.provider.tokenSet.resolveTokenId(entries.feeToken), nonce: entries.nonce == null ? yield this.getNonce() : yield this.getNonce(entries.nonce) });
            if (transactionData.fee == null) {
                transactionData.fee = yield this.provider.getTransactionFee(Object.assign(Object.assign({}, transactionData), { fee: '0' }));
            }
            return transactionData;
        });
    }
    signOrderMatching(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionData = yield this.getOrderMatchingData(entries);
            const signedTransferTransaction = yield this.signer.signOrderMatching(transactionData);
            const stringFee = ethers_1.BigNumber.from(transactionData.fee).isZero()
                ? null
                : ethers_1.utils.formatEther(transactionData.fee);
            const stringFeeToken = this.provider.tokenSet.resolveTokenSymbol(transactionData.feeToken);
            const ethereumSignature = this.ethSigner instanceof signer_1.Create2WalletSigner
                ? null
                : yield this.ethMessageSigner.ethSignOrderMatching({
                    stringFee,
                    stringFeeToken,
                    nonce: transactionData.nonce,
                });
            return {
                tx: signedTransferTransaction,
                ethereumSignature,
            };
        });
    }
    sendWithdrawToEthereum(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            const signedWithdrawTransaction = yield this.signWithdrawToEthereum(entries);
            return submitSignedTransaction(signedWithdrawTransaction, this.provider);
        });
    }
    getWithdrawData(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.signer) {
                throw new Error('zkLink signer is required for sending zkLink transactions.');
            }
            yield this.setRequiredAccountIdFromServer('Withdraw funds');
            const transactionData = Object.assign(Object.assign({}, entries), { type: 'Withdraw', accountId: entries.accountId || this.accountId, from: entries.from || this.address(), l2SourceToken: this.provider.tokenSet.resolveTokenId(entries.l2SourceToken), l1TargetToken: this.provider.tokenSet.resolveTokenId(entries.l1TargetToken), fee: entries.fee, nonce: entries.nonce == null ? yield this.getNonce() : yield this.getNonce(entries.nonce), ts: entries.ts || (0, utils_1.getTimestamp)() });
            if (transactionData.fee == null) {
                transactionData.fee = yield this.provider.getTransactionFee(Object.assign(Object.assign({}, transactionData), { fee: '0', amount: ethers_1.BigNumber.from(transactionData.amount).toString() }));
            }
            return transactionData;
        });
    }
    signWithdrawToEthereum(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionData = yield this.getWithdrawData(entries);
            const signedWithdrawTransaction = yield yield this.signer.signWithdraw(transactionData);
            const stringAmount = ethers_1.BigNumber.from(transactionData.amount).isZero()
                ? null
                : ethers_1.utils.formatEther(transactionData.amount);
            const stringFee = ethers_1.BigNumber.from(transactionData.fee).isZero()
                ? null
                : ethers_1.utils.formatEther(transactionData.fee);
            const stringToken = this.provider.tokenSet.resolveTokenSymbol(transactionData.l2SourceToken);
            const ethereumSignature = this.ethSigner instanceof signer_1.Create2WalletSigner
                ? null
                : yield this.ethMessageSigner.ethSignWithdraw({
                    stringAmount,
                    stringFee,
                    stringToken,
                    to: transactionData.to,
                    nonce: transactionData.nonce,
                    accountId: transactionData.accountId || this.accountId,
                });
            return {
                tx: signedWithdrawTransaction,
                ethereumSignature,
            };
        });
    }
    isSigningKeySet() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.signer) {
                throw new Error('ZKLink signer is required for current pubkey calculation.');
            }
            const currentPubKeyHash = yield this.getCurrentPubKeyHash();
            const signerPubKeyHash = yield this.signer.pubKeyHash();
            return currentPubKeyHash === signerPubKeyHash;
        });
    }
    sendChangePubKey(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            const txData = yield this.signChangePubKey(entries);
            if (!entries.accountId) {
                const currentPubKeyHash = yield this.getCurrentPubKeyHash();
                if (currentPubKeyHash === txData.tx.newPkHash) {
                    throw new Error('Current signing key is already set');
                }
            }
            return submitSignedTransaction(txData, this.provider);
        });
    }
    getChangePubKeyData(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.signer) {
                throw new Error('ZKLink signer is required for current pubkey calculation.');
            }
            // Changepubkey for others does not detect the current wallet account id
            if (!entries.accountId) {
                yield this.setRequiredAccountIdFromServer('Set Signing Key');
            }
            const transactionData = {
                type: 'ChangePubKey',
                chainId: entries.chainId,
                account: entries.account || this.address(),
                accountId: entries.accountId || this.accountId || (yield this.getAccountId()),
                subAccountId: entries.subAccountId,
                newPkHash: yield this.signer.pubKeyHash(),
                fee: entries.fee,
                feeToken: entries.feeToken,
                nonce: entries.nonce == null ? yield this.getNonce() : yield this.getNonce(entries.nonce),
                ts: entries.ts || (0, utils_1.getTimestamp)(),
            };
            if (entries.ethAuthType === 'Onchain') {
                transactionData.ethAuthData = {
                    type: 'Onchain',
                };
            }
            else if (entries.ethAuthType === 'EthECDSA') {
                transactionData.ethAuthData = {
                    type: 'EthECDSA',
                    ethSignature: '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
                };
            }
            else if (entries.ethAuthType === 'EthCREATE2') {
                transactionData.ethAuthData = {
                    type: 'EthCREATE2',
                    creatorAddress: '0x0000000000000000000000000000000000000000',
                    saltArg: '0x0000000000000000000000000000000000000000000000000000000000000000',
                    codeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                };
            }
            if (transactionData.fee == null) {
                transactionData.fee = yield this.provider.getTransactionFee(Object.assign(Object.assign({}, transactionData), { fee: '0' }));
            }
            return transactionData;
        });
    }
    signChangePubKey(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionData = yield this.getChangePubKeyData(entries);
            if (entries.ethAuthType === 'Onchain') {
                transactionData.ethAuthData = {
                    type: 'Onchain',
                };
            }
            else if (entries.ethAuthType === 'EthECDSA') {
                yield this.setRequiredAccountIdFromServer('ChangePubKey authorized by ECDSA.');
                const contractInfo = yield this.provider.getContractInfoByChainId(entries.chainId);
                const changePubKeySignData = (0, utils_1.getChangePubkeyMessage)(transactionData.newPkHash, transactionData.nonce, transactionData.accountId || this.accountId, contractInfo.mainContract, contractInfo.layerOneChainId);
                const ethSignature = (yield this.getEIP712Signature(changePubKeySignData)).signature;
                transactionData.ethAuthData = {
                    type: 'EthECDSA',
                    ethSignature,
                };
            }
            else if (entries.ethAuthType === 'EthCREATE2') {
                if (this.ethSigner instanceof signer_1.Create2WalletSigner) {
                    const create2data = this.ethSigner.create2WalletData;
                    transactionData.ethAuthData = {
                        type: 'EthCREATE2',
                        creatorAddress: create2data.creatorAddress,
                        saltArg: create2data.saltArg,
                        codeHash: create2data.codeHash,
                    };
                }
                else {
                    throw new Error('CREATE2 wallet authentication is only available for CREATE2 wallets');
                }
            }
            else {
                throw new Error('Unsupported SetSigningKey type');
            }
            const signedChangePubKeyTransaction = yield this.signer.signChangePubKey(transactionData);
            return {
                tx: signedChangePubKeyTransaction,
            };
        });
    }
    isOnchainAuthSigningKeySet(linkChainId, nonce = 'committed') {
        return __awaiter(this, void 0, void 0, function* () {
            const mainContract = yield this.getMainContract(linkChainId);
            const numNonce = yield this.getNonce(nonce);
            try {
                const onchainAuthFact = yield mainContract.authFacts(this.address(), numNonce);
                return (onchainAuthFact !== '0x0000000000000000000000000000000000000000000000000000000000000000');
            }
            catch (e) {
                this.modifyEthersError(e);
            }
        });
    }
    onchainAuthSigningKey(linkChainId, nonce = 'committed', ethTxOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.signer) {
                throw new Error('ZKLink signer is required for current pubkey calculation.');
            }
            const currentPubKeyHash = yield this.getCurrentPubKeyHash();
            const newPubKeyHash = yield this.signer.pubKeyHash();
            if (currentPubKeyHash === newPubKeyHash) {
                throw new Error('Current PubKeyHash is the same as new');
            }
            const numNonce = yield this.getNonce(nonce);
            const mainContract = yield this.getMainContract(linkChainId);
            try {
                return mainContract.setAuthPubkeyHash(newPubKeyHash.replace('sync:', '0x'), numNonce, Object.assign({ gasLimit: ethers_1.BigNumber.from('200000') }, ethTxOptions));
            }
            catch (e) {
                this.modifyEthersError(e);
            }
        });
    }
    getCurrentPubKeyHash() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.provider.getState(this.address())).pubKeyHash;
        });
    }
    getNonce(nonce = 'committed') {
        return __awaiter(this, void 0, void 0, function* () {
            if (nonce === 'committed') {
                return (yield this.provider.getState(this.address())).nonce;
            }
            else if (typeof nonce === 'number') {
                return nonce;
            }
        });
    }
    getAccountId() {
        return __awaiter(this, void 0, void 0, function* () {
            this.accountId = (yield this.provider.getState(this.address())).id;
            return this.accountId;
        });
    }
    address() {
        return this.cachedAddress;
    }
    getAccountState() {
        return __awaiter(this, void 0, void 0, function* () {
            const state = yield this.provider.getState(this.address());
            // If exsit account id, refresh it.
            if (state === null || state === void 0 ? void 0 : state.id) {
                this.accountId = state.id;
            }
            return state;
        });
    }
    getSubAccountState(subAccountId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.provider.getSubAccountState(this.address(), subAccountId);
        });
    }
    getBalances(subAccountId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.accountId = yield this.getAccountId();
            const balances = yield this.provider.getBalance(this.accountId, subAccountId);
            return balances === null || balances === void 0 ? void 0 : balances.balances;
        });
    }
    getTokenBalance(tokenId, subAccountId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const balances = yield this.getBalances(subAccountId);
            return (_a = balances === null || balances === void 0 ? void 0 : balances[subAccountId]) === null || _a === void 0 ? void 0 : _a[tokenId];
        });
    }
    getEthereumBalance(token, linkChainId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return (0, utils_1.getEthereumBalance)(this.ethSigner.provider, this.provider, this.cachedAddress, token, linkChainId);
            }
            catch (e) {
                this.modifyEthersError(e);
            }
        });
    }
    estimateGasDeposit(linkChainId, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const mainContract = yield this.getMainContract(linkChainId);
            try {
                const gasEstimate = yield mainContract.estimateGas.depositERC20(...args).then((estimate) => estimate, () => ethers_1.BigNumber.from('0'));
                const recommendedGasLimit = utils_1.ERC20_RECOMMENDED_DEPOSIT_GAS_LIMIT;
                return gasEstimate.gte(recommendedGasLimit) ? gasEstimate : recommendedGasLimit;
            }
            catch (e) {
                this.modifyEthersError(e);
            }
        });
    }
    isERC20DepositsApproved(tokenAddress, accountAddress, linkChainId, erc20ApproveThreshold = utils_1.ERC20_APPROVE_TRESHOLD) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.contract.isERC20DepositsApproved(tokenAddress, accountAddress, linkChainId, erc20ApproveThreshold);
        });
    }
    approveERC20TokenDeposits(tokenAddress, linkChainId, max_erc20_approve_amount = utils_1.MAX_ERC20_APPROVE_AMOUNT) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.contract.approveERC20TokenDeposits(tokenAddress, linkChainId, max_erc20_approve_amount);
        });
    }
    sendDepositFromEthereum(deposit) {
        return __awaiter(this, void 0, void 0, function* () {
            const contractAddress = yield this.provider.getContractInfoByChainId(deposit.linkChainId);
            const mainContract = yield this.getMainContract(deposit.linkChainId);
            let ethTransaction;
            if (!(0, utils_2.isAddress)(deposit.token)) {
                throw new Error('Token address is invalid');
            }
            if ((0, utils_1.isTokenETH)(deposit.token)) {
                try {
                    ethTransaction = yield mainContract.depositETH(deposit.depositTo, deposit.subAccountId, Object.assign({ value: ethers_1.BigNumber.from(deposit.amount), gasLimit: ethers_1.BigNumber.from(utils_1.ETH_RECOMMENDED_DEPOSIT_GAS_LIMIT) }, deposit.ethTxOptions));
                }
                catch (e) {
                    this.modifyEthersError(e);
                }
            }
            else {
                // ERC20 token deposit
                const erc20contract = new ethers_1.Contract(deposit.token, utils_1.IERC20_INTERFACE, this.ethSigner);
                let nonce;
                if (deposit.approveDepositAmountForERC20) {
                    try {
                        const approveTx = yield erc20contract.approve(contractAddress.mainContract, utils_1.MAX_ERC20_APPROVE_AMOUNT);
                        nonce = approveTx.nonce + 1;
                    }
                    catch (e) {
                        this.modifyEthersError(e);
                    }
                }
                const args = [
                    deposit.token,
                    deposit.amount,
                    deposit.depositTo,
                    deposit.subAccountId,
                    deposit.mapping ? true : false,
                    Object.assign({ nonce }, deposit.ethTxOptions),
                ];
                // We set gas limit only if user does not set it using ethTxOptions.
                const txRequest = args[args.length - 1];
                if (txRequest.gasLimit == null) {
                    try {
                        txRequest.gasLimit = yield this.estimateGasDeposit(deposit.linkChainId, args);
                        args[args.length - 1] = txRequest;
                    }
                    catch (e) {
                        this.modifyEthersError(e);
                    }
                }
                try {
                    ethTransaction = yield mainContract.depositERC20(...args);
                }
                catch (e) {
                    this.modifyEthersError(e);
                }
            }
            return new ETHOperation(ethTransaction, this.provider);
        });
    }
    emergencyWithdraw(withdraw) {
        return __awaiter(this, void 0, void 0, function* () {
            const gasPrice = yield this.ethSigner.provider.getGasPrice();
            let accountId;
            if (withdraw.accountId != null) {
                accountId = withdraw.accountId;
            }
            else if (this.accountId !== undefined) {
                accountId = this.accountId;
            }
            else {
                const accountState = yield this.getAccountState();
                if (!accountState.id) {
                    throw new Error("Can't resolve account id from the zkLink node");
                }
                accountId = accountState.id;
            }
            const mainContract = yield this.getMainContract(withdraw.linkChainId);
            try {
                const ethTransaction = yield mainContract.requestFullExit(accountId, withdraw.subAccountId, withdraw.tokenId, Object.assign({ gasLimit: ethers_1.BigNumber.from('500000'), gasPrice }, withdraw.ethTxOptions));
                return new ETHOperation(ethTransaction, this.provider);
            }
            catch (e) {
                this.modifyEthersError(e);
            }
        });
    }
    getMainContract(linkChainId) {
        return __awaiter(this, void 0, void 0, function* () {
            const contractAddress = yield this.provider.getContractInfoByChainId(linkChainId);
            return new ethers_1.ethers.Contract(contractAddress.mainContract, utils_1.SYNC_MAIN_CONTRACT_INTERFACE, this.ethSigner);
        });
    }
    modifyEthersError(error) {
        if (this.ethSigner instanceof ethers_1.ethers.providers.JsonRpcSigner) {
            // List of errors that can be caused by user's actions, which have to be forwarded as-is.
            const correct_errors = [
                EthersErrorCode.NONCE_EXPIRED,
                EthersErrorCode.INSUFFICIENT_FUNDS,
                EthersErrorCode.REPLACEMENT_UNDERPRICED,
                EthersErrorCode.UNPREDICTABLE_GAS_LIMIT,
            ];
            if (!correct_errors.includes(error.code)) {
                // This is an error which we don't expect
                error.message = `Ethereum smart wallet JSON RPC server returned the following error while executing an operation: "${error.message}". Please contact your smart wallet support for help.`;
            }
        }
        throw error;
    }
    setRequiredAccountIdFromServer(actionName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.accountId === undefined) {
                const accountIdFromServer = yield this.getAccountId();
                if (accountIdFromServer == null) {
                    throw new Error(`Failed to ${actionName}: Account does not exist in the zkLink network`);
                }
                else {
                    this.accountId = accountIdFromServer;
                }
            }
        });
    }
}
exports.Wallet = Wallet;
class ETHOperation {
    constructor(ethTx, zkSyncProvider) {
        this.ethTx = ethTx;
        this.zkSyncProvider = zkSyncProvider;
        this.state = 'Sent';
    }
    awaitEthereumTxCommit() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.state !== 'Sent')
                return;
            const txReceipt = yield this.ethTx.wait();
            for (const log of txReceipt.logs) {
                try {
                    const priorityQueueLog = utils_1.SYNC_MAIN_CONTRACT_INTERFACE.parseLog(log);
                    if (priorityQueueLog && priorityQueueLog.args.serialId != null) {
                        this.priorityOpId = priorityQueueLog.args.serialId;
                    }
                }
                catch (_a) { }
            }
            if (!this.priorityOpId) {
                throw new Error('Failed to parse tx logs');
            }
            this.state = 'Mined';
            return txReceipt;
        });
    }
    awaitReceipt() {
        return __awaiter(this, void 0, void 0, function* () {
            this.throwErrorIfFailedState();
            yield this.awaitEthereumTxCommit();
            const bytes = ethers_1.ethers.utils.concat([
                (0, utils_1.numberToBytesBE)(Number(this.priorityOpId), 8),
                (0, utils_2.arrayify)(this.ethTx.hash),
            ]);
            const txHash = (0, utils_2.sha256)(bytes).replace('0x', 'sync-tx:');
            if (this.state !== 'Mined')
                return;
            const receipt = yield this.zkSyncProvider.notifyTransaction(txHash);
            if (!receipt.executed) {
                this.setErrorState(new ZKSyncTxError('Priority operation failed', receipt));
                this.throwErrorIfFailedState();
            }
            this.state = 'Committed';
            return receipt;
        });
    }
    setErrorState(error) {
        this.state = 'Failed';
        this.error = error;
    }
    throwErrorIfFailedState() {
        if (this.state === 'Failed')
            throw this.error;
    }
}
exports.ETHOperation = ETHOperation;
class Transaction {
    constructor(txData, txHash, sidechainProvider) {
        this.txData = txData;
        this.txHash = txHash;
        this.sidechainProvider = sidechainProvider;
        this.state = 'Sent';
    }
    awaitReceipt() {
        return __awaiter(this, void 0, void 0, function* () {
            this.throwErrorIfFailedState();
            if (this.state !== 'Sent')
                return;
            const hash = Array.isArray(this.txHash) ? this.txHash[0] : this.txHash;
            const receipt = yield this.sidechainProvider.notifyTransaction(hash);
            if (!receipt.success) {
                this.setErrorState(new ZKSyncTxError(`zkLink transaction failed: ${receipt.failReason}`, receipt));
                this.throwErrorIfFailedState();
            }
            this.state = 'Committed';
            return receipt;
        });
    }
    setErrorState(error) {
        this.state = 'Failed';
        this.error = error;
    }
    throwErrorIfFailedState() {
        if (this.state === 'Failed')
            throw this.error;
    }
}
exports.Transaction = Transaction;
function submitSignedTransaction(signedTx, provider) {
    return __awaiter(this, void 0, void 0, function* () {
        const transactionHash = yield provider.submitTx({
            tx: signedTx.tx,
            signature: signedTx.ethereumSignature,
        });
        return new Transaction(signedTx, transactionHash, provider);
    });
}
exports.submitSignedTransaction = submitSignedTransaction;
