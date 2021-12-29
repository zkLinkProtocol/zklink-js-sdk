import {
    BigNumber,
    BigNumberish,
    Contract,
    ContractTransaction,
    ethers,
    constants,
    utils
} from 'ethers';
import { Provider } from './provider';
import { 
    AccountState,
    Address,
    ChangePubKeyFee,
    ContractAddress,
    Fee,
    LegacyChangePubKeyFee,
    Network,
    PriorityOperationReceipt,
    TokenAddress,
    TokenSymbol,
    TokenLike,
    Tokens,
    TransactionReceipt,
    TxEthSignature
} from './types';
import {
    ERC20_APPROVE_TRESHOLD,
    ERC20_RECOMMENDED_FASTSWAP_GAS_LIMIT,
    ETH_RECOMMENDED_FASTSWAP_GAS_LIMIT,
    getFastSwapUNonce,
    IERC20_INTERFACE,
    isTokenETH,
    MAX_ERC20_APPROVE_AMOUNT,
    sleep,
    SYNC_GOV_CONTRACT_INTERFACE,
    SYNC_MAIN_CONTRACT_INTERFACE,
    SYNC_EXIT_CONTRACT_INTERFACE,
    TokenSet,
    ZKL_CONTRACT_INTERFACE,
} from './utils';
import { ETHOperation } from './wallet';
import { ErrorCode } from '@ethersproject/logger';
import { parseEther } from 'ethers/lib/utils';

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

    getMainContract() {
        return new ethers.Contract(
            this.provider.contractAddress.mainContract,
            SYNC_MAIN_CONTRACT_INTERFACE,
            this.ethSigner
        );
    }

    getExitContract() {
        return new ethers.Contract(
            this.provider.contractAddress.mainContract,
            SYNC_EXIT_CONTRACT_INTERFACE,
            this.ethSigner
        );
    }

    getZKLContract() {
        return new ethers.Contract(
            this.provider.contractAddress.mainContract,
            ZKL_CONTRACT_INTERFACE,
            this.ethSigner
        );
    }

    async isERC20DepositsApproved(
        tokenAddress: Address,
        accountAddress: Address,
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
        try {
            const currentAllowance = await erc20contract.allowance(
                accountAddress,
                this.provider.contractAddress.mainContract
            );
            return BigNumber.from(currentAllowance).gte(erc20ApproveThreshold);
        } catch (e) {
            this.modifyEthersError(e);
        }
    }

    async approveERC20TokenDeposits(
        tokenAddress: Address,
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

        try {
            return erc20contract.approve(
            this.provider.contractAddress.mainContract,
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
        ethTxOptions?: ethers.providers.TransactionRequest;
    }): Promise<ETHOperation> {

        const zklContract = this.getZKLContract();

        let ethTransaction;

        let uNonce: number = getFastSwapUNonce();

        // Wait for the ABI to implement this function, Temporarily use 0.1
        // const lzFees = await zklContract.estimateBridgeFees(bridge.toChainId, bridge.to, bridge.amount)
        const lzFees = parseEther('0.1')

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

        const mainContract = this.getMainContract();

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
    }): Promise<BigNumber> {
        const exitContract = this.getExitContract();
        const balance = await exitContract.getPendingBalance(pending.account, pending.tokenAddress)
        return BigNumber.from(balance)
    }
    async getPendingBalances(pending: {
        account: Address,
        tokenAddresses: Address[],
    }): Promise<BigNumber[]> {
        const exitContract = this.getExitContract();
        const balances = await exitContract.getPendingBalances(pending.account, pending.tokenAddresses)
        return balances
    }

    async withdrawPendingBalance(withdraw: {
        account: Address,
        tokenAddress: Address,
        amount: BigNumberish,
    }): Promise<ETHOperation> {
        const exitContract = this.getExitContract();
        const ethTransaction = await exitContract.withdrawPendingBalance(withdraw.account, withdraw.tokenAddress, BigNumber.from(withdraw.amount))
        return new ETHOperation(ethTransaction, this.provider);
    }

    async withdrawMultiplePendingBalance(withdraw: {
        account: Address,
        tokenAddresses: Address[],
        amounts: BigNumberish[],
    }): Promise<ETHOperation> {
        const exitContract = this.getExitContract();
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
