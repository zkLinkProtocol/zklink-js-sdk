import { AbstractJSONRPCTransport, DummyTransport, HTTPTransport, WSTransport } from './transport';
import { BigNumber, BigNumberish, constants, Contract, ContractTransaction, ethers } from 'ethers';
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
    TokenLike,
    Tokens,
    TransactionReceipt,
    TxEthSignature
} from './types';
import { ERC20_APPROVE_TRESHOLD, ERC20_RECOMMENDED_FASTSWAP_GAS_LIMIT, ETH_RECOMMENDED_FASTSWAP_GAS_LIMIT, getFastSwapUNonce, IERC20_INTERFACE, isTokenETH, MAX_ERC20_APPROVE_AMOUNT, sleep, SYNC_GOV_CONTRACT_INTERFACE, SYNC_MAIN_CONTRACT_INTERFACE, TokenSet } from './utils';
import { ETHOperation } from './wallet';
import { ErrorCode } from '@ethersproject/logger';

const EthersErrorCode = ErrorCode;
export async function getDefaultProvider(network: Network, transport: 'WS' | 'HTTP' = 'HTTP'): Promise<Provider> {
    if (transport === 'WS') {
        console.warn('Websocket support will be removed in future. Use HTTP transport instead.');
    }
    if (network === 'localhost') {
        if (transport === 'WS') {
            return await Provider.newWebsocketProvider('ws://127.0.0.1:3031');
        } else if (transport === 'HTTP') {
            return await Provider.newHttpProvider('http://127.0.0.1:3030');
        }
    } else if (network === 'ropsten') {
        if (transport === 'WS') {
            return await Provider.newWebsocketProvider('wss://ropsten-api.zksync.io/jsrpc-ws');
        } else if (transport === 'HTTP') {
            return await Provider.newHttpProvider('https://ropsten-api.zksync.io/jsrpc');
        }
    } else if (network === 'rinkeby') {
        if (transport === 'WS') {
            return await Provider.newWebsocketProvider('wss://rinkeby-api.zksync.io/jsrpc-ws');
        } else if (transport === 'HTTP') {
            return await Provider.newHttpProvider('https://rinkeby-api.zksync.io/jsrpc');
        }
    } else if (network === 'ropsten-beta') {
        if (transport === 'WS') {
            return await Provider.newWebsocketProvider('wss://ropsten-beta-api.zksync.io/jsrpc-ws');
        } else if (transport === 'HTTP') {
            return await Provider.newHttpProvider('https://ropsten-beta-api.zksync.io/jsrpc');
        }
    } else if (network === 'rinkeby-beta') {
        if (transport === 'WS') {
            return await Provider.newWebsocketProvider('wss://rinkeby-beta-api.zksync.io/jsrpc-ws');
        } else if (transport === 'HTTP') {
            return await Provider.newHttpProvider('https://rinkeby-beta-api.zksync.io/jsrpc');
        }
    } else if (network === 'mainnet') {
        if (transport === 'WS') {
            return await Provider.newWebsocketProvider('wss://api.zksync.io/jsrpc-ws');
        } else if (transport === 'HTTP') {
            return await Provider.newHttpProvider('https://api.zksync.io/jsrpc');
        }
    } else {
        throw new Error(`Ethereum network ${network} is not supported`);
    }
}

export class Provider {
    contractAddress: ContractAddress;
    public tokenSet: TokenSet;

    // For HTTP provider
    public pollIntervalMilliSecs = 500;
    public chainId: string;

    private constructor(public transport: AbstractJSONRPCTransport) {}

    public async setChainId(chainId: string) {
        this.chainId = String(chainId)
        this.contractAddress = await this.getContractAddress();
        this.tokenSet = new TokenSet(await this.getTokens());
    }

    /**
     * @deprecated Websocket support will be removed in future. Use HTTP transport instead.
     */
    static async newWebsocketProvider(address: string): Promise<Provider> {
        const transport = await WSTransport.connect(address);
        const provider = new Provider(transport);
        provider.contractAddress = await provider.getContractAddress();
        provider.tokenSet = new TokenSet(await provider.getTokens());
        return provider;
    }

    static async newHttpProvider(
        address: string = 'http://127.0.0.1:3030',
        chainId?: string,
        pollIntervalMilliSecs?: number
    ): Promise<Provider> {
        const transport = new HTTPTransport(address);
        const provider = new Provider(transport);
        if (pollIntervalMilliSecs) {
            provider.pollIntervalMilliSecs = pollIntervalMilliSecs;
        }
        if (chainId !== undefined) {
            provider.setChainId(chainId)
        }
        provider.contractAddress = await provider.getContractAddress();
        provider.tokenSet = new TokenSet(await provider.getTokens());
        return provider;
    }

    /**
     * Provides some hardcoded values the `Provider` responsible for
     * without communicating with the network
     */
    static async newMockProvider(network: string, ethPrivateKey: Uint8Array, getTokens: Function): Promise<Provider> {
        const transport = new DummyTransport(network, ethPrivateKey, getTokens);
        const provider = new Provider(transport);

        provider.contractAddress = await provider.getContractAddress();
        provider.tokenSet = new TokenSet(await provider.getTokens());
        return provider;
    }

    // return transaction hash (e.g. sync-tx:dead..beef)
    async submitTx({
        chainId,
        tx,
        signature,
        fastProcessing
    }: {
        chainId?: string,
        tx: any,
        signature?: TxEthSignature,
        fastProcessing?: boolean
    }): Promise<string> {
        return await this.transport.request('tx_submit', [chainId, tx, signature, fastProcessing]);
    }

    // Requests `zkSync` server to execute several transactions together.
    // return transaction hash (e.g. sync-tx:dead..beef)
    async submitTxsBatch(
        transactions: { tx: any; signature?: TxEthSignature }[],
        ethSignatures?: TxEthSignature | TxEthSignature[]
    ): Promise<string[]> {
        let signatures: TxEthSignature[] = [];
        // For backwards compatibility we allow sending single signature as well
        // as no signatures at all.
        if (ethSignatures == undefined) {
            signatures = [];
        } else if (ethSignatures instanceof Array) {
            signatures = ethSignatures;
        } else {
            signatures.push(ethSignatures);
        }
        return await this.transport.request('submit_txs_batch', [this.chainId, transactions, signatures]);
    }

    async getContractAddress(chainId?: string): Promise<ContractAddress> {
        return await this.transport.request('contract_address', [(chainId || this.chainId)]);
    }

    async getTokens(chainId?: string): Promise<Tokens> {
        return await this.transport.request('tokens', [(chainId || this.chainId)]);
    }

    async updateTokenSet(): Promise<void> {
        const updatedTokenSet = new TokenSet(await this.getTokens());
        this.tokenSet = updatedTokenSet;
    }

    async getState(address: Address, chainId: string): Promise<AccountState> {
        return await this.transport.request('account_info', [chainId, address]);
    }

    // get transaction status by its hash (e.g. 0xdead..beef)
    async getTxReceipt(chainId: string, txHash: string): Promise<TransactionReceipt> {
        return await this.transport.request('tx_info', [chainId, txHash]);
    }

    async getPriorityOpStatus(serialId: number, chainId?: string): Promise<PriorityOperationReceipt> {
        return await this.transport.request('ethop_info', [(chainId || this.chainId), serialId]);
    }

    async getConfirmationsForEthOpAmount(chainId?: string): Promise<number> {
        return await this.transport.request('get_confirmations_for_eth_op_amount', [(chainId || this.chainId)]);
    }

    async getEthTxForWithdrawal(withdrawal_hash: string, chainId?: string): Promise<string> {
        return await this.transport.request('get_eth_tx_for_withdrawal', [(chainId || this.chainId), withdrawal_hash]);
    }

    async notifyPriorityOp(serialId: number, action: 'COMMIT' | 'VERIFY'): Promise<PriorityOperationReceipt> {
        if (this.transport.subscriptionsSupported()) {
            return await new Promise((resolve) => {
                const subscribe = this.transport.subscribe(
                    'ethop_subscribe',
                    [serialId, action],
                    'ethop_unsubscribe',
                    (resp) => {
                        subscribe
                            .then((sub) => sub.unsubscribe())
                            .catch((err) => console.log(`WebSocket connection closed with reason: ${err}`));
                        resolve(resp);
                    }
                );
            });
        } else {
            while (true) {
                const priorOpStatus = await this.getPriorityOpStatus(serialId);
                const notifyDone =
                    action === 'COMMIT'
                        ? priorOpStatus.block && priorOpStatus.block.committed
                        : priorOpStatus.block && priorOpStatus.block.verified;
                if (notifyDone) {
                    return priorOpStatus;
                } else {
                    await sleep(this.pollIntervalMilliSecs);
                }
            }
        }
    }

    async notifyTransaction(chainId: string, hash: string, action: 'COMMIT' | 'VERIFY'): Promise<TransactionReceipt> {
        if (this.transport.subscriptionsSupported()) {
            return await new Promise((resolve) => {
                const subscribe = this.transport.subscribe('tx_subscribe', [chainId, hash, action], 'tx_unsubscribe', (resp) => {
                    subscribe
                        .then((sub) => sub.unsubscribe())
                        .catch((err) => console.log(`WebSocket connection closed with reason: ${err}`));
                    resolve(resp);
                });
            });
        } else {
            while (true) {
                const transactionStatus = await this.getTxReceipt(chainId, hash);
                const notifyDone =
                    action == 'COMMIT'
                        ? transactionStatus.block && transactionStatus.block.committed
                        : transactionStatus.block && transactionStatus.block.verified;
                if (notifyDone) {
                    return transactionStatus;
                } else {
                    await sleep(this.pollIntervalMilliSecs);
                }
            }
        }
    }

    async getTransactionFee(
        chainId: string,
        txType: 'Withdraw' | 'Transfer' | 'FastWithdraw' | ChangePubKeyFee | LegacyChangePubKeyFee,
        address: Address,
        tokenLike: TokenLike,
    ): Promise<Fee> {
        const transactionFee = await this.transport.request('get_tx_fee', [chainId, txType, address.toString(), tokenLike]);
        return {
            feeType: transactionFee.feeType,
            gasTxAmount: BigNumber.from(transactionFee.gasTxAmount),
            gasPriceWei: BigNumber.from(transactionFee.gasPriceWei),
            gasFee: BigNumber.from(transactionFee.gasFee),
            zkpFee: BigNumber.from(transactionFee.zkpFee),
            totalFee: BigNumber.from(transactionFee.totalFee)
        };
    }

    async getTransactionsBatchFee(
        txTypes: ('Withdraw' | 'Transfer' | 'FastWithdraw' | ChangePubKeyFee | LegacyChangePubKeyFee)[],
        addresses: Address[],
        tokenLike: TokenLike,
        chainId?: string
    ): Promise<BigNumber> {
        const batchFee = await this.transport.request('get_txs_batch_fee_in_wei', [(chainId || this.chainId), txTypes, addresses, tokenLike]);
        return BigNumber.from(batchFee.totalFee);
    }

    async getTokenPrice(tokenLike: TokenLike, chainId?: string): Promise<number> {
        const tokenPrice = await this.transport.request('get_token_price', [(chainId || this.chainId), tokenLike]);
        return parseFloat(tokenPrice);
    }

    async disconnect() {
        return await this.transport.disconnect();
    }


    async fastSwapAccepts(accepts: {
        receiver: Address,
        tokenId: number,
        amount: BigNumberish,
        withdrawFee: number,
        uNonce: number,
        ethSigner: ethers.Signer,
    }): Promise<Address> {
        const mainZkSyncContract = this.getZkSyncMainContract(accepts.ethSigner);
        const hash = ethers.utils.solidityKeccak256(['address', 'uint', 'string', 'string', 'uint'], [accepts.receiver, accepts.tokenId, accepts.amount.toString(), accepts.withdrawFee, accepts.uNonce])
        const address = await mainZkSyncContract.accepts(hash)
        return address
    }


    getZkSyncMainContract(ethSigner) {
        return new ethers.Contract(
            this.contractAddress.mainContract,
            SYNC_MAIN_CONTRACT_INTERFACE,
            ethSigner
        );
    }


    async isERC20DepositsApproved(
        tokenAddress: Address,
        accountAddress: Address,
        ethSigner: ethers.Signer,
        erc20ApproveThreshold: BigNumber = ERC20_APPROVE_TRESHOLD
    ): Promise<boolean> {
        if (isTokenETH(tokenAddress)) {
            throw Error('ETH token does not need approval.');
        }
        const erc20contract = new Contract(tokenAddress, IERC20_INTERFACE, ethSigner);
        try {
            const currentAllowance = await erc20contract.allowance(
                accountAddress,
                this.contractAddress.mainContract
            );
            return BigNumber.from(currentAllowance).gte(erc20ApproveThreshold);
        } catch (e) {
            this.modifyEthersError(e);
        }
    }

    async approveERC20TokenDeposits(
        tokenAddress: Address,
        ethSigner: ethers.Signer,
        max_erc20_approve_amount: BigNumber = MAX_ERC20_APPROVE_AMOUNT
    ): Promise<ContractTransaction> {
        if (isTokenETH(tokenAddress)) {
            throw Error('ETH token does not need approval.');
        }
        const erc20contract = new Contract(tokenAddress, IERC20_INTERFACE, ethSigner);

        try {
            return erc20contract.approve(this.contractAddress.mainContract, max_erc20_approve_amount);
        } catch (e) {
            this.modifyEthersError(e);
        }
    }

    async fastSwapUNonce(swap: {
        receiver: Address,
        tokenId: number,
        amount: BigNumberish,
        withdrawFee: number,
        ethSigner: ethers.Signer,
    }): Promise<number> {
        const uNonce = getFastSwapUNonce()
        const acceptAddress = await this.fastSwapAccepts({
            ...swap,
            uNonce,
        })
        if (acceptAddress === constants.AddressZero) {
            return uNonce
        }
        return await this.fastSwapUNonce(swap)
    }

    async fastSwap(swap: {
        fromChainId: number;
        toChainId: number;
        from: Address;
        to: Address;
        tokenId0: number;
        token0: TokenLike;
        tokenId1: number;
        token1: TokenLike;
        amountIn: BigNumberish;
        amountOutMin: BigNumberish;
        ethSigner: ethers.Signer;
        withdrawFee: number; // 100 means 1%, 10000 = 100%
        ethTxOptions?: ethers.providers.TransactionRequest;
        approveDepositAmountForERC20?: boolean;
    }): Promise<ETHOperation> {
        const gasPrice = await swap.ethSigner.provider.getGasPrice();

        const mainZkSyncContract = this.getZkSyncMainContract(swap.ethSigner);

        let ethTransaction;
        let uNonce: number = 0;

        try {
            uNonce = await this.fastSwapUNonce({
                receiver: swap.to,
                tokenId: swap.tokenId0,
                amount: swap.amountIn,
                withdrawFee: swap.withdrawFee,
                ethSigner: swap.ethSigner,
            })
        }
        catch(e) {
            this.modifyEthersError(e)
        }

        if (!uNonce) {
            this.modifyEthersError(new Error('swap tx nonce is none'));
        }
        // -------------------------------
        if (isTokenETH(swap.token0)) {
            try {
                // function swapExactETHForTokens(address _zkSyncAddress,uint104 _amountOutMin, uint16 _withdrawFee, uint8 _toChainId, uint16 _toTokenId, address _to, uint32 _nonce) external payable
                ethTransaction = await mainZkSyncContract.swapExactETHForTokens(swap.from, swap.amountOutMin, swap.withdrawFee, swap.toChainId, swap.tokenId1, swap.to, uNonce, {
                    value: BigNumber.from(swap.amountIn),
                    gasLimit: BigNumber.from(ETH_RECOMMENDED_FASTSWAP_GAS_LIMIT),
                    gasPrice,
                    ...swap.ethTxOptions
                });
            } catch (e) {
                this.modifyEthersError(e);
            }
        }
        else {
            const tokenAddress = this.tokenSet.resolveTokenAddress(swap.token0);
            // ERC20 token deposit
            let nonce: number;
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
                {
                    nonce,
                    gasPrice,
                    ...swap.ethTxOptions
                } as ethers.providers.TransactionRequest
            ];

            // We set gas limit only if user does not set it using ethTxOptions.
            const txRequest = args[args.length - 1] as ethers.providers.TransactionRequest;
            if (txRequest.gasLimit == null) {
                try {
                    const gasEstimate = await mainZkSyncContract.estimateGas.swapExactTokensForTokens(...args).then(
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
                ethTransaction = await mainZkSyncContract.swapExactTokensForTokens(...args);
            } catch (e) {
                this.modifyEthersError(e);
            }

        }

        return new ETHOperation(ethTransaction, this);
    }

    private modifyEthersError(error: any): never {
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



export class ETHProxy {
    private governanceContract: Contract;

    constructor(private ethersProvider: ethers.providers.Provider, public contractAddress: ContractAddress) {
        this.governanceContract = new Contract(
            this.contractAddress.govContract,
            SYNC_GOV_CONTRACT_INTERFACE,
            this.ethersProvider
        );
    }

    async resolveTokenId(token: TokenAddress): Promise<number> {
        if (isTokenETH(token)) {
            return 0;
        } else {
            const tokenId = await this.governanceContract.tokenIds(token);
            if (tokenId == 0) {
                throw new Error(`ERC20 token ${token} is not supported`);
            }
            return tokenId;
        }
    }
}
