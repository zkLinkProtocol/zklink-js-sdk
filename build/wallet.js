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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
const logger_1 = require("@ethersproject/logger");
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const eth_message_signer_1 = require("./eth-message-signer");
const signer_1 = require("./signer");
const utils_2 = require("./utils");
const EthersErrorCode = logger_1.ErrorCode;
class Wallet {
    constructor(ethSigner, ethMessageSigner, cachedAddress, signer, accountId, ethSignerType) {
        this.ethSigner = ethSigner;
        this.ethMessageSigner = ethMessageSigner;
        this.cachedAddress = cachedAddress;
        this.signer = signer;
        this.accountId = accountId;
        this.ethSignerType = ethSignerType;
    }
    static fromEthSigner(ethWallet, signer, accountId, ethSignerType) {
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
            return wallet;
        });
    }
    static fromCreate2Data(syncSigner, createrSigner, create2Data, accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            const create2Signer = new signer_1.Create2WalletSigner(yield syncSigner.pubKeyHash(), create2Data, createrSigner);
            return yield Wallet.fromEthSigner(create2Signer, syncSigner, accountId, {
                verificationMethod: 'ERC-1271',
                isSignedMsgPrefixed: true,
            });
        });
    }
    static fromEthSignerNoKeys(ethWallet, accountId, ethSignerType) {
        return __awaiter(this, void 0, void 0, function* () {
            const ethMessageSigner = new eth_message_signer_1.EthMessageSigner(ethWallet, ethSignerType);
            const wallet = new Wallet(ethWallet, ethMessageSigner, yield ethWallet.getAddress(), undefined, accountId, ethSignerType);
            return wallet;
        });
    }
    getEIP712Signature(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.ethSignerType == null) {
                throw new Error('ethSignerType is unknown');
            }
            const signature = yield (0, utils_2.signMessageEIP712)(this.ethSigner, data);
            return {
                type: this.ethSignerType.verificationMethod === 'ECDSA'
                    ? 'EthereumSignature'
                    : 'EIP1271Signature',
                signature,
            };
        });
    }
    getTransferData(entries) {
        this.requireAccountId(entries === null || entries === void 0 ? void 0 : entries.accountId, 'Transfer');
        this.requireNonce(entries === null || entries === void 0 ? void 0 : entries.nonce, 'Transfer');
        const { tokenId, tokenSymbol } = entries, data = __rest(entries, ["tokenId", "tokenSymbol"]);
        const transactionData = Object.assign(Object.assign({}, data), { type: 'Transfer', from: this.address(), token: tokenId, ts: entries.ts || (0, utils_2.getTimestamp)() });
        return transactionData;
    }
    signTransfer(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionData = this.getTransferData(entries);
            const signedTransferTransaction = yield this.signer.signTransfer(transactionData);
            const stringAmount = ethers_1.BigNumber.from(transactionData.amount).isZero()
                ? null
                : ethers_1.utils.formatEther(transactionData.amount);
            const stringFee = ethers_1.BigNumber.from(transactionData.fee).isZero()
                ? null
                : ethers_1.utils.formatEther(transactionData.fee);
            const stringToken = entries.tokenSymbol;
            const ethereumSignature = yield this.ethMessageSigner.ethSignTransfer({
                stringAmount,
                stringFee,
                stringToken,
                to: transactionData.to,
                nonce: transactionData.nonce,
                accountId: transactionData.accountId,
            });
            return {
                tx: signedTransferTransaction,
                ethereumSignature,
            };
        });
    }
    getForcedExitData(entries) {
        const { l2SourceTokenId, l1TargetTokenId } = entries, data = __rest(entries, ["l2SourceTokenId", "l1TargetTokenId"]);
        if (entries.withdrawToL1 !== 0 && entries.withdrawToL1 !== 1) {
            throw new Error('withdrawToL1 must be 0 or 1');
        }
        const transactionData = Object.assign(Object.assign({}, data), { type: 'ForcedExit', l2SourceToken: l2SourceTokenId, l1TargetToken: l1TargetTokenId, ts: entries.ts || (0, utils_2.getTimestamp)() });
        return transactionData;
    }
    signForcedExit(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionData = this.getForcedExitData(entries);
            const signedForcedExitTransaction = yield this.signer.signForcedExit(transactionData);
            return {
                tx: signedForcedExitTransaction,
            };
        });
    }
    signOrder(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            const signedTransferTransaction = yield this.signer.signOrder(entries);
            return {
                tx: signedTransferTransaction,
                ethereumSignature: null,
            };
        });
    }
    getOrderMatchingData(entries) {
        const { feeTokenId, feeTokenSymbol } = entries, data = __rest(entries, ["feeTokenId", "feeTokenSymbol"]);
        const transactionData = Object.assign(Object.assign({}, data), { type: 'OrderMatching', account: entries.account || this.address(), feeToken: feeTokenId });
        return transactionData;
    }
    signOrderMatching(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionData = this.getOrderMatchingData(entries);
            const signedTransferTransaction = yield this.signer.signOrderMatching(transactionData);
            const stringFee = ethers_1.BigNumber.from(transactionData.fee).isZero()
                ? null
                : ethers_1.utils.formatEther(transactionData.fee);
            const stringFeeToken = entries.feeTokenSymbol;
            const ethereumSignature = this.ethSigner instanceof signer_1.Create2WalletSigner
                ? null
                : yield this.ethMessageSigner.ethSignOrderMatching({
                    stringFee,
                    stringFeeToken,
                });
            return {
                tx: signedTransferTransaction,
                ethereumSignature,
            };
        });
    }
    signContract(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            const signedTransferTransaction = yield this.signer.signContract(entries);
            return {
                tx: signedTransferTransaction,
                ethereumSignature: null,
            };
        });
    }
    getContractMatchingData(entries) {
        const { feeTokenId, feeTokenSymbol } = entries, data = __rest(entries, ["feeTokenId", "feeTokenSymbol"]);
        const transactionData = Object.assign(Object.assign({}, data), { type: 'ContractMatching', feeToken: feeTokenId });
        return transactionData;
    }
    signContractMatching(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionData = this.getContractMatchingData(entries);
            const signedTransferTransaction = yield this.signer.signContractMatching(transactionData);
            const stringFee = ethers_1.BigNumber.from(transactionData.fee).isZero()
                ? null
                : ethers_1.utils.formatEther(transactionData.fee);
            const stringFeeToken = entries.feeTokenSymbol;
            const ethereumSignature = this.ethSigner instanceof signer_1.Create2WalletSigner
                ? null
                : yield this.ethMessageSigner.ethSignContractMatching({
                    stringFee,
                    stringFeeToken,
                });
            return {
                tx: signedTransferTransaction,
                ethereumSignature,
            };
        });
    }
    getWithdrawData(entries) {
        this.requireAccountId(entries === null || entries === void 0 ? void 0 : entries.accountId, 'Withdraw');
        this.requireNonce(entries === null || entries === void 0 ? void 0 : entries.nonce, 'Withdraw');
        if (entries.withdrawToL1 !== 0 && entries.withdrawToL1 !== 1) {
            throw new Error('withdrawToL1 must be 0 or 1');
        }
        const { l2SourceTokenId, l2SourceTokenSymbol, l1TargetTokenId } = entries, data = __rest(entries, ["l2SourceTokenId", "l2SourceTokenSymbol", "l1TargetTokenId"]);
        const transactionData = Object.assign(Object.assign({}, data), { type: 'Withdraw', from: entries.from || this.address(), l2SourceToken: l2SourceTokenId, l1TargetToken: l1TargetTokenId, ts: entries.ts || (0, utils_2.getTimestamp)() });
        return transactionData;
    }
    signWithdrawToEthereum(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionData = this.getWithdrawData(entries);
            const signedWithdrawTransaction = yield this.signer.signWithdraw(transactionData);
            const stringAmount = ethers_1.BigNumber.from(transactionData.amount).isZero()
                ? null
                : ethers_1.utils.formatEther(transactionData.amount);
            const stringFee = ethers_1.BigNumber.from(transactionData.fee).isZero()
                ? null
                : ethers_1.utils.formatEther(transactionData.fee);
            const stringToken = entries.l2SourceTokenSymbol;
            const ethereumSignature = this.ethSigner instanceof signer_1.Create2WalletSigner
                ? null
                : yield this.ethMessageSigner.ethSignWithdraw({
                    stringAmount,
                    stringFee,
                    stringToken,
                    to: transactionData.to,
                    nonce: transactionData.nonce,
                    accountId: transactionData.accountId,
                });
            return {
                tx: signedWithdrawTransaction,
                ethereumSignature,
            };
        });
    }
    isSigningKeySet(currentPubKeyHash) {
        return __awaiter(this, void 0, void 0, function* () {
            if (currentPubKeyHash === '0x0000000000000000000000000000000000000000') {
                return false;
            }
            const signerPubKeyHash = yield this.signer.pubKeyHash();
            return currentPubKeyHash === signerPubKeyHash;
        });
    }
    getChangePubKeyData(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            this.requireAccountId(entries === null || entries === void 0 ? void 0 : entries.accountId, 'ChangePubKey');
            this.requireNonce(entries === null || entries === void 0 ? void 0 : entries.nonce, 'ChangePubKey');
            const { feeTokenId } = entries, data = __rest(entries, ["feeTokenId"]);
            const transactionData = Object.assign(Object.assign({}, data), { type: 'ChangePubKey', account: entries.account || this.address(), newPkHash: entries.newPkHash || (yield this.signer.pubKeyHash()), feeToken: feeTokenId, ts: entries.ts || (0, utils_2.getTimestamp)() });
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
                const ethSignature = (yield this.ethMessageSigner.ethSignChangePubKey({
                    pubKeyHash: transactionData.newPkHash,
                    nonce: String(transactionData.nonce),
                    accountId: String(transactionData.accountId),
                })).signature;
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
    isOnchainAuthSigningKeySet(mainContract, nonce) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = utils_2.MAIN_CONTRACT_INTERFACE.encodeFunctionData('authFacts', [
                this.address(),
                nonce,
            ]);
            try {
                const onchainAuthFact = yield this.ethSigner.call({
                    to: mainContract,
                    data,
                });
                return (onchainAuthFact !==
                    '0x0000000000000000000000000000000000000000000000000000000000000000');
            }
            catch (e) {
                this.modifyEthersError(e);
            }
        });
    }
    onchainAuthSigningKey(mainContract, nonce, currentPubKeyHash, ethTxOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.signer) {
                throw new Error('ZKLink signer is required for current pubkey calculation.');
            }
            const signerPubKeyHash = yield this.signer.pubKeyHash();
            if (currentPubKeyHash === signerPubKeyHash) {
                throw new Error('Current PubKeyHash is the same as new');
            }
            const data = utils_2.MAIN_CONTRACT_INTERFACE.encodeFunctionData('setAuthPubkeyHash', [signerPubKeyHash, nonce]);
            try {
                return this.ethSigner.sendTransaction(Object.assign({ to: mainContract, data, gasLimit: ethers_1.BigNumber.from('200000') }, ethTxOptions));
            }
            catch (e) {
                this.modifyEthersError(e);
            }
        });
    }
    address() {
        return this.cachedAddress;
    }
    getEthereumBalance(tokenAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return (0, utils_2.getEthereumBalance)(this.ethSigner.provider, this.cachedAddress, tokenAddress);
            }
            catch (e) {
                this.modifyEthersError(e);
            }
        });
    }
    estimateGasDeposit(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const gasEstimate = yield this.ethSigner.estimateGas(tx);
                return gasEstimate.gte(utils_2.ERC20_RECOMMENDED_DEPOSIT_GAS_LIMIT)
                    ? gasEstimate
                    : utils_2.ERC20_RECOMMENDED_DEPOSIT_GAS_LIMIT;
            }
            catch (e) {
                this.modifyEthersError(e);
            }
        });
    }
    getERC20DepositsAllowance(mainContract, tokenAddress, accountAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((0, utils_2.isGasToken)(tokenAddress)) {
                return utils_2.ERC20_APPROVE_TRESHOLD;
            }
            try {
                const data = utils_2.IERC20_INTERFACE.encodeFunctionData('allowance', [
                    accountAddress,
                    mainContract,
                ]);
                const currentAllowance = yield this.ethSigner.call({
                    to: tokenAddress,
                    data,
                });
                return ethers_1.BigNumber.from(currentAllowance);
            }
            catch (e) {
                this.modifyEthersError(e);
            }
        });
    }
    isERC20DepositsApproved(mainContract, tokenAddress, accountAddress, erc20ApproveThreshold = utils_2.ERC20_APPROVE_TRESHOLD) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((0, utils_2.isGasToken)(tokenAddress)) {
                throw new Error('ETH token does not need approval.');
            }
            try {
                const data = utils_2.IERC20_INTERFACE.encodeFunctionData('allowance', [
                    accountAddress,
                    mainContract,
                ]);
                const currentAllowance = yield this.ethSigner.call({
                    to: tokenAddress,
                    data,
                });
                return ethers_1.BigNumber.from(currentAllowance).gte(erc20ApproveThreshold);
            }
            catch (e) {
                this.modifyEthersError(e);
            }
        });
    }
    approveERC20TokenDeposits(mainContract, tokenAddress, max_erc20_approve_amount = utils_2.MAX_ERC20_APPROVE_AMOUNT) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((0, utils_2.isGasToken)(tokenAddress)) {
                throw Error('ETH token does not need approval.');
            }
            try {
                const data = utils_2.IERC20_INTERFACE.encodeFunctionData('approve', [
                    mainContract,
                    max_erc20_approve_amount,
                ]);
                return this.ethSigner.sendTransaction({
                    to: tokenAddress,
                    data,
                });
            }
            catch (e) {
                this.modifyEthersError(e);
            }
        });
    }
    sendDepositFromEthereum(deposit) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let ethTransaction;
            if (!(0, utils_1.isAddress)(deposit.token)) {
                throw new Error('Token address is invalid');
            }
            deposit.depositTo = ethers_1.utils.hexZeroPad(`${deposit.depositTo}`, 32);
            if ((0, utils_2.isGasToken)(deposit.token)) {
                try {
                    const data = utils_2.MAIN_CONTRACT_INTERFACE.encodeFunctionData('depositETH', [
                        deposit.depositTo,
                        deposit.subAccountId,
                    ]);
                    ethTransaction = yield this.ethSigner.sendTransaction(Object.assign({ to: deposit.mainContract, data, value: ethers_1.BigNumber.from(deposit.amount) }, deposit.ethTxOptions));
                }
                catch (e) {
                    this.modifyEthersError(e);
                }
            }
            else {
                // ERC20 token deposit
                let nonce;
                if (deposit.approveDepositAmountForERC20) {
                    try {
                        const data = utils_2.IERC20_INTERFACE.encodeFunctionData('approve', [
                            deposit.mainContract,
                            utils_2.MAX_ERC20_APPROVE_AMOUNT,
                        ]);
                        const approveTx = yield this.ethSigner.sendTransaction(Object.assign({ to: deposit.token, data }, deposit.ethTxOptions));
                        nonce = approveTx.nonce + 1;
                    }
                    catch (e) {
                        this.modifyEthersError(e);
                    }
                }
                const data = utils_2.MAIN_CONTRACT_INTERFACE.encodeFunctionData('depositERC20', [
                    deposit.token,
                    deposit.amount,
                    deposit.depositTo,
                    deposit.subAccountId,
                    deposit.mapping ? true : false,
                ]);
                const tx = Object.assign({ to: deposit.mainContract, data,
                    nonce }, deposit.ethTxOptions);
                if (tx.gasLimit == null) {
                    if (deposit.approveDepositAmountForERC20) {
                        tx.gasLimit =
                            (_a = utils_2.ERC20_DEPOSIT_GAS_LIMIT[deposit.chainId]) !== null && _a !== void 0 ? _a : utils_2.ERC20_RECOMMENDED_DEPOSIT_GAS_LIMIT;
                    }
                }
                try {
                    ethTransaction = yield this.ethSigner.sendTransaction(tx);
                }
                catch (e) {
                    this.modifyEthersError(e);
                }
            }
            return ethTransaction;
        });
    }
    emergencyWithdraw(withdraw) {
        return __awaiter(this, void 0, void 0, function* () {
            const gasPrice = yield this.ethSigner.provider.getGasPrice();
            try {
                const data = utils_2.MAIN_CONTRACT_INTERFACE.encodeFunctionData('requestFullExit', [withdraw.accountId, withdraw.subAccountId, withdraw.tokenId]);
                const ethTransaction = yield this.ethSigner.sendTransaction(Object.assign({ to: withdraw.mainContract, data, gasLimit: ethers_1.BigNumber.from('500000'), gasPrice }, withdraw.ethTxOptions));
                return ethTransaction;
            }
            catch (e) {
                this.modifyEthersError(e);
            }
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
    requireAccountId(accountId, msg) {
        if (accountId === undefined || accountId === null) {
            throw new Error(`Missing accountId in ${msg}, accountId: ${accountId}`);
        }
        if (typeof accountId !== 'number' || accountId < 0) {
            throw new Error(`Invalid accountId in ${msg}, accountId: ${accountId}`);
        }
    }
    requireNonce(nonce, msg) {
        if (nonce === undefined || nonce === null) {
            throw new Error(`Missing nonce in ${msg}, nonce: ${nonce}`);
        }
        if (typeof nonce !== 'number' || nonce < 0) {
            throw new Error(`Invalid nonce in ${msg}, nonce: ${nonce}`);
        }
    }
}
exports.Wallet = Wallet;
