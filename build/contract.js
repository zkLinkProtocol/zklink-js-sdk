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
exports.LinkContract = void 0;
const logger_1 = require("@ethersproject/logger");
const ethers_1 = require("ethers");
const utils_1 = require("./utils");
const wallet_1 = require("./wallet");
const EthersErrorCode = logger_1.ErrorCode;
class LinkContract {
    constructor(provider, ethSigner) {
        this.provider = provider;
        this.ethSigner = ethSigner;
    }
    connect(provider) {
        this.provider = provider;
        return this;
    }
    static fromEthSigner(provider, ethSigner) {
        return new LinkContract(provider, ethSigner);
    }
    getMainContract(linkChainId) {
        return __awaiter(this, void 0, void 0, function* () {
            const contractAddress = yield this.provider.getContractInfoByChainId(linkChainId);
            return new ethers_1.ethers.Contract(contractAddress.mainContract, utils_1.MAIN_CONTRACT_INTERFACE, this.ethSigner);
        });
    }
    getZKLContract(contractAddress) {
        return new ethers_1.ethers.Contract(contractAddress, utils_1.ZKL_CONTRACT_INTERFACE, this.ethSigner);
    }
    isERC20DepositsApproved(tokenAddress, accountAddress, linkChainId, erc20ApproveThreshold = utils_1.ERC20_APPROVE_TRESHOLD) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((0, utils_1.isTokenETH)(tokenAddress)) {
                throw Error('ETH token does not need approval.');
            }
            const erc20contract = new ethers_1.Contract(tokenAddress, utils_1.IERC20_INTERFACE, this.ethSigner);
            const contractAddress = yield this.provider.getContractInfoByChainId(linkChainId);
            try {
                const currentAllowance = yield erc20contract.allowance(accountAddress, contractAddress.mainContract);
                return ethers_1.BigNumber.from(currentAllowance).gte(erc20ApproveThreshold);
            }
            catch (e) {
                this.modifyEthersError(e);
            }
        });
    }
    approveERC20TokenDeposits(tokenAddress, linkChainId, max_erc20_approve_amount = utils_1.MAX_ERC20_APPROVE_AMOUNT) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((0, utils_1.isTokenETH)(tokenAddress)) {
                throw Error('ETH token does not need approval.');
            }
            const erc20contract = new ethers_1.Contract(tokenAddress, utils_1.IERC20_INTERFACE, this.ethSigner);
            const contractAddress = yield this.provider.getContractInfoByChainId(linkChainId);
            try {
                return erc20contract.approve(contractAddress.mainContract, max_erc20_approve_amount);
            }
            catch (e) {
                this.modifyEthersError(e);
            }
        });
    }
    getPendingBalance(pending) {
        return __awaiter(this, void 0, void 0, function* () {
            const exitContract = yield this.getMainContract(pending.linkChainId);
            const balance = yield exitContract.getPendingBalance(pending.account, pending.tokenAddress);
            return ethers_1.BigNumber.from(balance);
        });
    }
    getPendingBalances(pending) {
        return __awaiter(this, void 0, void 0, function* () {
            const exitContract = yield this.getMainContract(pending.linkChainId);
            const balances = yield exitContract.getPendingBalances(pending.account, pending.tokenAddresses);
            return balances;
        });
    }
    withdrawPendingBalance(withdraw) {
        return __awaiter(this, void 0, void 0, function* () {
            const exitContract = yield this.getMainContract(withdraw.linkChainId);
            const ethTransaction = yield exitContract.withdrawPendingBalance(withdraw.account, withdraw.tokenAddress, ethers_1.BigNumber.from(withdraw.amount));
            return new wallet_1.ETHOperation(ethTransaction, this.provider);
        });
    }
    withdrawMultiplePendingBalance(withdraw) {
        return __awaiter(this, void 0, void 0, function* () {
            const exitContract = yield this.getMainContract(withdraw.linkChainId);
            const ethTransaction = yield exitContract.withdrawMultiplePendingBalance(withdraw.account, withdraw.tokenAddresses, withdraw.amounts);
            return new wallet_1.ETHOperation(ethTransaction, this.provider);
        });
    }
    modifyEthersError(error) {
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
        throw error;
    }
}
exports.LinkContract = LinkContract;
