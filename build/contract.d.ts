import { BigNumber, BigNumberish, Contract, ContractTransaction, ethers } from 'ethers';
import { Provider } from './provider';
import { Address, TokenAddress } from './types';
import { ETHOperation } from './wallet';
export declare class LinkContract {
    provider: Provider;
    ethSigner: ethers.Signer;
    constructor(provider: Provider, ethSigner: ethers.Signer);
    connect(provider: Provider): this;
    static fromEthSigner(provider: Provider, ethSigner: ethers.Signer): LinkContract;
    getMainContract(): Contract;
    getExitContract(): Contract;
    isERC20DepositsApproved(tokenAddress: Address, accountAddress: Address, erc20ApproveThreshold?: BigNumber): Promise<boolean>;
    approveERC20TokenDeposits(tokenAddress: Address, max_erc20_approve_amount?: BigNumber): Promise<ContractTransaction>;
    bridge(bridge: {
        from: Address;
        to: Address;
        amount: BigNumberish;
        tokenAddress: Address;
        tokenId: number;
        toChainId: number;
        withdrawFee: number;
        ethTxOptions?: ethers.providers.TransactionRequest;
    }): Promise<ETHOperation>;
    fastSwap(swap: {
        fromChainId: number;
        toChainId: number;
        from: Address;
        to: Address;
        tokenInAddress: TokenAddress;
        tokenOutId: number;
        amountIn: BigNumberish;
        amountOutMin: BigNumberish;
        withdrawFee: number;
        ethTxOptions?: ethers.providers.TransactionRequest;
        approveDepositAmountForERC20?: boolean;
    }): Promise<ETHOperation>;
    getPendingBalance(pending: {
        account: Address;
        tokenAddress: Address;
    }): Promise<BigNumber>;
    getPendingBalances(pending: {
        account: Address;
        tokenAddresses: Address[];
    }): Promise<BigNumber[]>;
    withdrawPendingBalance(withdraw: {
        account: Address;
        tokenAddress: Address;
        amount: BigNumberish;
    }): Promise<ETHOperation>;
    withdrawMultiplePendingBalance(withdraw: {
        account: Address;
        tokenAddresses: Address[];
        amounts: BigNumberish[];
    }): Promise<ETHOperation>;
    private modifyEthersError;
}
