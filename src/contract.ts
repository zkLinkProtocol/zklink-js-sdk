import {
    BigNumber,
    BigNumberish,
    Contract,
    ContractTransaction,
    ethers} from 'ethers';
import { Provider } from './provider';
import { 
    Address,
    TokenAddress} from './types';
import {
    ERC20_APPROVE_TRESHOLD,
    ERC20_RECOMMENDED_FASTSWAP_GAS_LIMIT,
    ETH_RECOMMENDED_FASTSWAP_GAS_LIMIT,
    getFastSwapUNonce,
    IERC20_INTERFACE,
    isTokenETH,
    MAX_ERC20_APPROVE_AMOUNT,
    SYNC_MAIN_CONTRACT_INTERFACE,
    SYNC_EXIT_CONTRACT_INTERFACE,
    ZKL_CONTRACT_INTERFACE,
} from './utils';
import { ETHOperation } from './wallet';
import { ErrorCode } from '@ethersproject/logger';

const EthersErrorCode = ErrorCode;

export class LinkContract {
    constructor(public provider: Provider, public ethSigner: ethers.Signer) {}

    connect(provider: Provider) {
        this.provider = provider;
        return this;
    }

    static fromEthSigner(provider: Provider, ethSigner: ethers.Signer) {
        return new LinkContract(provider, ethSigner);
    }

    async getMainContract(linkChainId: number) {
        const contractAddress = await this.provider.getContractAddress(linkChainId)
        return new ethers.Contract(
            contractAddress.mainContract,
            SYNC_MAIN_CONTRACT_INTERFACE,
            this.ethSigner
        );
    }

    async getExitContract(linkChainId: number) {
        const contractAddress = await this.provider.getContractAddress(linkChainId)
        return new ethers.Contract(
            contractAddress.mainContract,
            SYNC_EXIT_CONTRACT_INTERFACE,
            this.ethSigner
        );
    }

    getZKLContract(contractAddress) {
        return new ethers.Contract(
            contractAddress,
            ZKL_CONTRACT_INTERFACE,
            this.ethSigner
        );
    }

    async isERC20DepositsApproved(
        tokenAddress: Address,
        accountAddress: Address,
        linkChainId: number,
        erc20ApproveThreshold: BigNumber = ERC20_APPROVE_TRESHOLD
    ): Promise<boolean> {
        if (isTokenETH(tokenAddress)) {
            throw Error('ETH token does not need approval.');
        }
        const erc20contract = new Contract(
            tokenAddress,
            IERC20_INTERFACE,
            this.ethSigner
        );
        const contractAddress = await this.provider.getContractAddress(linkChainId)
        try {
            const currentAllowance = await erc20contract.allowance(
                accountAddress,
                contractAddress.mainContract
            );
            return BigNumber.from(currentAllowance).gte(erc20ApproveThreshold);
        } catch (e) {
            this.modifyEthersError(e);
        }
    }

    async approveERC20TokenDeposits(
        tokenAddress: Address,
        linkChainId: number,
        max_erc20_approve_amount: BigNumber = MAX_ERC20_APPROVE_AMOUNT
    ): Promise<ContractTransaction> {
        if (isTokenETH(tokenAddress)) {
            throw Error('ETH token does not need approval.');
        }
        const erc20contract = new Contract(
            tokenAddress,
            IERC20_INTERFACE,
            this.ethSigner
        );
        const contractAddress = await this.provider.getContractAddress(linkChainId)

        try {
            return erc20contract.approve(
            contractAddress.mainContract,
            max_erc20_approve_amount
            );
        } catch (e) {
            this.modifyEthersError(e);
        }
    }

    async bridge(bridge: {
        to: Address,
        toChainId: number,
        amount: BigNumberish,
        contractAddress: Address,
        ethTxOptions?: ethers.providers.TransactionRequest;
    }): Promise<ETHOperation> {

        const zklContract = this.getZKLContract(bridge.contractAddress);

        let ethTransaction;

        let uNonce: number = getFastSwapUNonce();

        const lzFees = await zklContract.estimateBridgeFees(bridge.toChainId, bridge.to, bridge.amount)

        const args = [
            bridge.toChainId,
            bridge.to,
            bridge.amount,
            {
                value: lzFees,
                ...bridge.ethTxOptions,
            } as ethers.providers.TransactionRequest
        ];

        // We set gas limit only if user does not set it using ethTxOptions.
        const txRequest = args[args.length - 1] as ethers.providers.TransactionRequest;
        if (txRequest.gasLimit == null) {
            try {
                const gasEstimate = await zklContract.estimateGas.bridge(...args).then(
                    (estimate) => estimate,
                    () => BigNumber.from('0')
                );
                let recommendedGasLimit = ERC20_RECOMMENDED_FASTSWAP_GAS_LIMIT;
                txRequest.gasLimit = gasEstimate.gte(recommendedGasLimit) ? gasEstimate : recommendedGasLimit;
                args[args.length - 1] = txRequest;
            } catch (e) {
                this.modifyEthersError(e);
            }
        }
        console.log(args);
        try {
            ethTransaction = await zklContract.bridge(...args);
        } catch (e) {
            this.modifyEthersError(e);
        }

        return new ETHOperation(ethTransaction, this.provider);
    }

    async fastSwap(swap: {
        fromChainId: number;
        toChainId: number;
        from: Address;
        to: Address;
        tokenInAddress: TokenAddress,
        tokenOutId: number;
        amountIn: BigNumberish;
        amountOutMin: BigNumberish;
        pair: Address;
        acceptTokenId: number;
        acceptAmountOutMin: BigNumberish;
        ethTxOptions?: ethers.providers.TransactionRequest;
        approveDepositAmountForERC20?: boolean;
    }): Promise<ETHOperation> {

        const mainContract = await this.getMainContract(swap.fromChainId);

        let ethTransaction;
        let uNonce: number = getFastSwapUNonce();


        if (!uNonce) {
            this.modifyEthersError(new Error('swap tx nonce is none'));
        }
        // -------------------------------
        if (isTokenETH(swap.tokenInAddress)) {
            try {
                // function swapExactETHForTokens(address _zkSyncAddress,uint104 _amountOutMin, uint16 _withdrawFee, uint8 _toChainId, uint16 _toTokenId, address _to, uint32 _nonce) external payable
                ethTransaction = await mainContract.swapExactETHForTokens(swap.from, swap.amountOutMin, swap.toChainId, swap.tokenOutId, swap.to, uNonce, swap.pair, swap.acceptTokenId, swap.acceptAmountOutMin, {
                    value: BigNumber.from(swap.amountIn),
                    gasLimit: BigNumber.from(ETH_RECOMMENDED_FASTSWAP_GAS_LIMIT),
                    ...swap.ethTxOptions
                });
            } catch (e) {
                this.modifyEthersError(e);
            }
        }
        else {
            // ERC20 token deposit
            let nonce: number;
            // function swapExactTokensForTokens(address _zkSyncAddress, uint104 _amountIn, uint104 _amountOutMin, uint16 _withdrawFee, IERC20 _fromToken, uint8 _toChainId, uint16 _toTokenId, address _to, uint32 _nonce) external
            const args = [
                swap.from,
                swap.amountIn,
                swap.amountOutMin,
                swap.tokenInAddress,
                swap.toChainId,
                swap.tokenOutId,
                swap.to,
                uNonce,
                swap.pair,
                swap.acceptTokenId,
                swap.acceptAmountOutMin,
                {
                    nonce,
                    ...swap.ethTxOptions
                } as ethers.providers.TransactionRequest
            ];

            // We set gas limit only if user does not set it using ethTxOptions.
            const txRequest = args[args.length - 1] as ethers.providers.TransactionRequest;
            if (txRequest.gasLimit == null) {
                try {
                    const gasEstimate = await mainContract.estimateGas.swapExactTokensForTokens(...args).then(
                        (estimate) => estimate,
                        () => BigNumber.from('0')
                    );
                    let recommendedGasLimit = ERC20_RECOMMENDED_FASTSWAP_GAS_LIMIT;
                    txRequest.gasLimit = gasEstimate.gte(recommendedGasLimit) ? gasEstimate : recommendedGasLimit;
                    args[args.length - 1] = txRequest;
                } catch (e) {
                    this.modifyEthersError(e);
                }
            }
            try {
                ethTransaction = await mainContract.swapExactTokensForTokens(...args);
            } catch (e) {
                this.modifyEthersError(e);
            }

        }

        return new ETHOperation(ethTransaction, this.provider);
    }

    async getPendingBalance(pending: {
        account: Address,
        tokenAddress: Address,
        linkChainId: number
    }): Promise<BigNumber> {
        const exitContract = await this.getExitContract(pending.linkChainId);
        const balance = await exitContract.getPendingBalance(pending.account, pending.tokenAddress)
        return BigNumber.from(balance)
    }
    async getPendingBalances(pending: {
        account: Address,
        tokenAddresses: Address[],
        linkChainId: number
    }): Promise<BigNumber[]> {
        const exitContract = await this.getExitContract(pending.linkChainId);
        const balances = await exitContract.getPendingBalances(pending.account, pending.tokenAddresses)
        return balances
    }

    async withdrawPendingBalance(withdraw: {
        account: Address,
        tokenAddress: Address,
        amount: BigNumberish,
        linkChainId: number
    }): Promise<ETHOperation> {
        const exitContract = await this.getExitContract(withdraw.linkChainId);
        const ethTransaction = await exitContract.withdrawPendingBalance(withdraw.account, withdraw.tokenAddress, BigNumber.from(withdraw.amount))
        return new ETHOperation(ethTransaction, this.provider);
    }

    async withdrawMultiplePendingBalance(withdraw: {
        account: Address,
        tokenAddresses: Address[],
        amounts: BigNumberish[],
        linkChainId: number
    }): Promise<ETHOperation> {
        const exitContract = await this.getExitContract(withdraw.linkChainId);
        const ethTransaction = await exitContract.withdrawMultiplePendingBalance(withdraw.account, withdraw.tokenAddresses, withdraw.amounts)
        return new ETHOperation(ethTransaction, this.provider);
    }
    

    private modifyEthersError(error: any): never {
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
