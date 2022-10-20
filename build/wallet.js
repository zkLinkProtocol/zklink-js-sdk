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
        return this;
    }
    static fromEthSigner(ethWallet, provider, signer, accountId, ethSignerType) {
        var _a;
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
            if (accountId === undefined) {
                accountId = (_a = (yield provider.getState(address))) === null || _a === void 0 ? void 0 : _a.id;
            }
            const ethMessageSigner = new eth_message_signer_1.EthMessageSigner(ethWallet, ethSignerType);
            const wallet = new Wallet(ethWallet, ethMessageSigner, address, signer, accountId, ethSignerType);
            wallet.connect(provider);
            return wallet;
        });
    }
    static fromCreate2Data(syncSigner, provider, create2Data, accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            const create2Signer = new signer_1.Create2WalletSigner(yield syncSigner.pubKeyHash(), create2Data);
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
    getTransfer(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.signer) {
                throw new Error('ZKLink signer is required for sending zklink transactions.');
            }
            yield this.setRequiredAccountIdFromServer('Transfer funds');
            return this.signer.signSyncTransfer(tx);
        });
    }
    signSyncTransfer(transfer) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionData = {
                type: 'Transfer',
                fromSubAccountId: transfer.fromSubAccountId,
                toSubAccountId: transfer.toSubAccountId,
                accountId: transfer.accountId || this.accountId,
                from: this.address(),
                to: transfer.to,
                token: this.provider.tokenSet.resolveTokenId(transfer.token),
                amount: transfer.amount,
                fee: transfer.fee,
                ts: transfer.ts || (0, utils_1.getTimestamp)(),
                nonce: transfer.nonce,
            };
            if (transactionData.fee == null) {
                transactionData.fee = yield this.provider.getTransactionFee(transactionData);
            }
            const signedTransferTransaction = yield this.getTransfer(transactionData);
            const stringAmount = ethers_1.BigNumber.from(transactionData.amount).isZero()
                ? null
                : ethers_1.utils.formatEther(transactionData.amount);
            const stringFee = ethers_1.BigNumber.from(transactionData.fee).isZero()
                ? null
                : ethers_1.utils.formatEther(transactionData.fee);
            const stringToken = this.provider.tokenSet.resolveTokenSymbol(transactionData.token);
            const ethereumSignature = this.ethSigner instanceof signer_1.Create2WalletSigner
                ? null
                : yield this.ethMessageSigner.ethSignTransfer({
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
    getOrderMatching(matching) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.signer) {
                throw new Error('ZKLink signer is required for sending zklink transactions.');
            }
            yield this.setRequiredAccountIdFromServer('Transfer funds');
            const feeTokenId = this.provider.tokenSet.resolveTokenId(matching.feeToken);
            const transactionData = {
                accountId: matching.accountId,
                account: matching.account,
                taker: matching.taker,
                maker: matching.maker,
                expectBaseAmount: matching.expectBaseAmount,
                expectQuoteAmount: matching.expectQuoteAmount,
                fee: matching.fee,
                feeTokenId: feeTokenId,
                nonce: matching.nonce,
            };
            return this.signer.signSyncOrderMatching(transactionData);
        });
    }
    signSyncOrderMatching(matching) {
        return __awaiter(this, void 0, void 0, function* () {
            const signedTransferTransaction = yield this.getOrderMatching(matching);
            const stringFee = ethers_1.BigNumber.from(matching.fee).isZero() ? null : ethers_1.utils.formatEther(matching.fee);
            const stringFeeToken = this.provider.tokenSet.resolveTokenSymbol(matching.feeToken);
            const ethereumSignature = this.ethSigner instanceof signer_1.Create2WalletSigner
                ? null
                : yield this.ethMessageSigner.ethSignOrderMatching({
                    stringFee,
                    stringFeeToken,
                    nonce: matching.nonce,
                });
            return {
                tx: signedTransferTransaction,
                ethereumSignature,
            };
        });
    }
    getForcedExit(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.signer) {
                throw new Error('ZKLink signer is required for sending zklink transactions.');
            }
            yield this.setRequiredAccountIdFromServer('perform a Forced Exit');
            return yield this.signer.signSyncForcedExit(tx);
        });
    }
    signSyncForcedExit(forcedExit) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionData = {
                type: 'ForcedExit',
                toChainId: forcedExit.toChainId,
                initiatorAccountId: this.accountId,
                initiatorSubAccountId: forcedExit.initiatorSubAccountId,
                target: forcedExit.target,
                targetSubAccountId: forcedExit.targetSubAccountId,
                l2SourceToken: this.provider.tokenSet.resolveTokenId(forcedExit.l2SourceToken),
                l1TargetToken: this.provider.tokenSet.resolveTokenId(forcedExit.l1TargetToken),
                feeToken: this.provider.tokenSet.resolveTokenId(forcedExit.feeToken),
                fee: forcedExit.fee,
                ts: forcedExit.ts || (0, utils_1.getTimestamp)(),
                nonce: forcedExit.nonce,
            };
            if (transactionData.fee == null) {
                transactionData.fee = yield this.provider.getTransactionFee(transactionData);
            }
            const signedForcedExitTransaction = yield this.getForcedExit(transactionData);
            const stringFee = ethers_1.BigNumber.from(transactionData.fee).isZero()
                ? null
                : ethers_1.utils.formatEther(transactionData.fee);
            const stringToken = this.provider.tokenSet.resolveTokenSymbol(transactionData.l2SourceToken);
            const stringFeeToken = this.provider.tokenSet.resolveTokenSymbol(transactionData.feeToken);
            const ethereumSignature = this.ethSigner instanceof signer_1.Create2WalletSigner
                ? null
                : yield this.ethMessageSigner.ethSignForcedExit({
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
    syncForcedExit(forcedExit) {
        return __awaiter(this, void 0, void 0, function* () {
            forcedExit.nonce =
                forcedExit.nonce != null ? yield this.getNonce(forcedExit.nonce) : yield this.getNonce();
            const signedForcedExitTransaction = yield this.signSyncForcedExit(forcedExit);
            return submitSignedTransaction(signedForcedExitTransaction, this.provider);
        });
    }
    syncTransfer(transfer) {
        return __awaiter(this, void 0, void 0, function* () {
            transfer.nonce =
                transfer.nonce != null ? yield this.getNonce(transfer.nonce) : yield this.getNonce();
            const signedTransferTransaction = yield this.signSyncTransfer(transfer);
            return submitSignedTransaction(signedTransferTransaction, this.provider);
        });
    }
    getOrder(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.signer) {
                throw new Error('zkLink signer is required for sending zkLink transactions.');
            }
            return this.signer.signSyncOrder(payload);
        });
    }
    signSyncOrder(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const signedTransferTransaction = yield this.getOrder(payload);
            return {
                tx: signedTransferTransaction,
                ethereumSignature: null,
            };
        });
    }
    getWithdrawFromSyncToEthereum(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.signer) {
                throw new Error('zkLink signer is required for sending zkLink transactions.');
            }
            yield this.setRequiredAccountIdFromServer('Withdraw funds');
            return yield this.signer.signSyncWithdraw(tx);
        });
    }
    signWithdrawFromSyncToEthereum(withdraw) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionData = {
                type: 'Withdraw',
                toChainId: withdraw.toChainId,
                subAccountId: withdraw.subAccountId,
                accountId: withdraw.accountId || this.accountId,
                from: this.address(),
                to: withdraw.to,
                l2SourceToken: this.provider.tokenSet.resolveTokenId(withdraw.l2SourceToken),
                l1TargetToken: this.provider.tokenSet.resolveTokenId(withdraw.l1TargetToken),
                amount: withdraw.amount,
                withdrawFeeRatio: withdraw.withdrawFeeRatio || 0,
                fastWithdraw: withdraw.fastWithdraw,
                fee: withdraw.fee,
                ts: withdraw.ts || (0, utils_1.getTimestamp)(),
                nonce: withdraw.nonce,
            };
            if (transactionData.fee == null) {
                transactionData.fee = yield this.provider.getTransactionFee(transactionData);
            }
            const signedWithdrawTransaction = yield this.getWithdrawFromSyncToEthereum(transactionData);
            const stringAmount = ethers_1.BigNumber.from(withdraw.amount).isZero()
                ? null
                : ethers_1.utils.formatEther(withdraw.amount);
            const stringFee = ethers_1.BigNumber.from(withdraw.fee).isZero() ? null : ethers_1.utils.formatEther(withdraw.fee);
            const stringToken = this.provider.tokenSet.resolveTokenSymbol(withdraw.l2SourceToken);
            const ethereumSignature = this.ethSigner instanceof signer_1.Create2WalletSigner
                ? null
                : yield this.ethMessageSigner.ethSignWithdraw({
                    stringAmount,
                    stringFee,
                    stringToken,
                    to: withdraw.to,
                    nonce: withdraw.nonce,
                    accountId: withdraw.accountId || this.accountId,
                });
            return {
                tx: signedWithdrawTransaction,
                ethereumSignature,
            };
        });
    }
    withdrawFromSyncToEthereum(withdraw) {
        return __awaiter(this, void 0, void 0, function* () {
            withdraw.nonce =
                withdraw.nonce != null ? yield this.getNonce(withdraw.nonce) : yield this.getNonce();
            const signedWithdrawTransaction = yield this.signWithdrawFromSyncToEthereum(withdraw);
            return submitSignedTransaction(signedWithdrawTransaction, this.provider);
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
    getChangePubKey(changePubKey) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.signer) {
                throw new Error('ZKLink signer is required for current pubkey calculation.');
            }
            let feeTokenId = changePubKey.feeToken === '' || changePubKey.feeToken === undefined
                ? 1
                : this.provider.tokenSet.resolveTokenId(changePubKey.feeToken);
            const newPkHash = yield this.signer.pubKeyHash();
            yield this.setRequiredAccountIdFromServer('Set Signing Key');
            const changePubKeyTx = yield this.signer.signSyncChangePubKey({
                accountId: changePubKey.accountId || this.accountId,
                account: this.address(),
                linkChainId: changePubKey.linkChainId,
                newPkHash,
                nonce: changePubKey.nonce,
                feeTokenId,
                fee: ethers_1.BigNumber.from(changePubKey.fee).toString(),
                ts: changePubKey.ts,
                ethAuthData: changePubKey.ethAuthData,
            });
            return changePubKeyTx;
        });
    }
    signSetSigningKey(changePubKey) {
        return __awaiter(this, void 0, void 0, function* () {
            changePubKey.ts = changePubKey.ts || (0, utils_1.getTimestamp)();
            const newPubKeyHash = yield this.signer.pubKeyHash();
            // request latest account id
            changePubKey.accountId = yield this.getAccountId();
            let ethAuthData;
            if (changePubKey.ethAuthType === 'Onchain') {
                ethAuthData = {
                    type: 'Onchain',
                };
            }
            else if (changePubKey.ethAuthType === 'ECDSA') {
                yield this.setRequiredAccountIdFromServer('ChangePubKey authorized by ECDSA.');
                const contractInfo = yield this.provider.getContractInfo(changePubKey.linkChainId);
                const changePubKeySignData = (0, utils_1.getChangePubkeyMessage)(newPubKeyHash, changePubKey.nonce, changePubKey.accountId || this.accountId, changePubKey.verifyingContract || contractInfo.mainContract, changePubKey.chainId || contractInfo.layerOneChainId, changePubKey.domainName, changePubKey.version);
                const ethSignature = (yield this.getEIP712Signature(changePubKeySignData)).signature;
                ethAuthData = {
                    type: 'ECDSA',
                    ethSignature,
                };
            }
            else if (changePubKey.ethAuthType === 'CREATE2') {
                if (this.ethSigner instanceof signer_1.Create2WalletSigner) {
                    const create2data = this.ethSigner.create2WalletData;
                    ethAuthData = {
                        type: 'CREATE2',
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
            const changePubkeyTxUnsigned = Object.assign(changePubKey, { ethAuthData });
            const changePubKeyTx = yield this.getChangePubKey(changePubkeyTxUnsigned);
            return {
                tx: changePubKeyTx,
            };
        });
    }
    setSigningKey(changePubKey) {
        return __awaiter(this, void 0, void 0, function* () {
            changePubKey.nonce =
                changePubKey.nonce != null ? yield this.getNonce(changePubKey.nonce) : yield this.getNonce();
            const txData = yield this.signSetSigningKey(changePubKey);
            const currentPubKeyHash = yield this.getCurrentPubKeyHash();
            if (currentPubKeyHash === txData.tx.newPkHash) {
                throw new Error('Current signing key is already set');
            }
            return submitSignedTransaction(txData, this.provider);
        });
    }
    isOnchainAuthSigningKeySet(linkChainId, nonce = 'committed') {
        return __awaiter(this, void 0, void 0, function* () {
            const mainZkSyncContract = yield this.getZkSyncMainContract(linkChainId);
            const numNonce = yield this.getNonce(nonce);
            try {
                const onchainAuthFact = yield mainZkSyncContract.authFacts(this.address(), numNonce);
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
            const mainZkSyncContract = yield this.getZkSyncMainContract(linkChainId);
            try {
                return mainZkSyncContract.setAuthPubkeyHash(newPubKeyHash.replace('sync:', '0x'), numNonce, Object.assign({ gasLimit: ethers_1.BigNumber.from('200000') }, ethTxOptions));
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
    getBalance(token, subAccountId) {
        return __awaiter(this, void 0, void 0, function* () {
            const balances = yield this.provider.getBalance(this.accountId, subAccountId);
            const tokenId = this.provider.tokenSet.resolveTokenId(token);
            let balance = balances[subAccountId][tokenId];
            return balance ? ethers_1.BigNumber.from(balance) : undefined;
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
            const mainZkSyncContract = yield this.getZkSyncMainContract(linkChainId);
            try {
                const gasEstimate = yield mainZkSyncContract.estimateGas.depositERC20(...args).then((estimate) => estimate, () => ethers_1.BigNumber.from('0'));
                const recommendedGasLimit = utils_1.ERC20_RECOMMENDED_DEPOSIT_GAS_LIMIT;
                return gasEstimate.gte(recommendedGasLimit) ? gasEstimate : recommendedGasLimit;
            }
            catch (e) {
                this.modifyEthersError(e);
            }
        });
    }
    depositToSyncFromEthereum(deposit) {
        return __awaiter(this, void 0, void 0, function* () {
            const contractAddress = yield this.provider.getContractInfo(deposit.linkChainId);
            const mainZkSyncContract = yield this.getZkSyncMainContract(deposit.linkChainId);
            let ethTransaction;
            if ((0, utils_1.isTokenETH)(deposit.token)) {
                try {
                    ethTransaction = yield mainZkSyncContract.depositETH(deposit.depositTo, deposit.subAccountId, Object.assign({ value: ethers_1.BigNumber.from(deposit.amount), gasLimit: ethers_1.BigNumber.from(utils_1.ETH_RECOMMENDED_DEPOSIT_GAS_LIMIT) }, deposit.ethTxOptions));
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
                    ethTransaction = yield mainZkSyncContract.depositERC20(...args);
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
            const mainZkSyncContract = yield this.getZkSyncMainContract(withdraw.linkChainId);
            try {
                const ethTransaction = yield mainZkSyncContract.requestFullExit(accountId, withdraw.subAccountId, withdraw.tokenId, Object.assign({ gasLimit: ethers_1.BigNumber.from('500000'), gasPrice }, withdraw.ethTxOptions));
                return new ETHOperation(ethTransaction, this.provider);
            }
            catch (e) {
                this.modifyEthersError(e);
            }
        });
    }
    getZkSyncMainContract(linkChainId) {
        return __awaiter(this, void 0, void 0, function* () {
            const contractAddress = yield this.provider.getContractInfo(linkChainId);
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
    awaitReceipt(linkChainId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.throwErrorIfFailedState();
            yield this.awaitEthereumTxCommit();
            if (this.state !== 'Mined')
                return;
            const receipt = yield this.zkSyncProvider.notifyPriorityOp(linkChainId, this.priorityOpId.toNumber(), 'COMMIT');
            if (!receipt.executed) {
                this.setErrorState(new ZKSyncTxError('Priority operation failed', receipt));
                this.throwErrorIfFailedState();
            }
            this.state = 'Committed';
            return receipt;
        });
    }
    awaitVerifyReceipt(linkChainId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.awaitReceipt(linkChainId);
            if (this.state !== 'Committed')
                return;
            const receipt = yield this.zkSyncProvider.notifyPriorityOp(linkChainId, this.priorityOpId.toNumber(), 'VERIFY');
            this.state = 'Verified';
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
            const receipt = yield this.sidechainProvider.notifyTransaction(hash, 'COMMIT');
            if (!receipt.success) {
                this.setErrorState(new ZKSyncTxError(`zkLink transaction failed: ${receipt.failReason}`, receipt));
                this.throwErrorIfFailedState();
            }
            this.state = 'Committed';
            return receipt;
        });
    }
    awaitVerifyReceipt() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.awaitReceipt();
            const hash = Array.isArray(this.txHash) ? this.txHash[0] : this.txHash;
            const receipt = yield this.sidechainProvider.notifyTransaction(hash, 'VERIFY');
            this.state = 'Verified';
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
