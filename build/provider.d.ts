import { AbstractJSONRPCTransport } from './transport';
import { BigNumber } from 'ethers';
import { AccountBalances, AccountState, Address, ContractAddress, PriorityOperationReceipt, Tokens, TransactionReceipt, TxEthSignature } from './types';
import { TokenSet } from './utils';
export declare class Provider {
    transport: AbstractJSONRPCTransport;
    contractAddress: ContractAddress[];
    tokenSet: TokenSet;
    pollIntervalMilliSecs: number;
    chainId: number;
    private constructor();
    /**
     * @deprecated Websocket support will be removed in future. Use HTTP transport instead.
     */
    static newWebsocketProvider(address: string): Promise<Provider>;
    static newHttpProvider(address?: string, pollIntervalMilliSecs?: number): Promise<Provider>;
    /**
     * Provides some hardcoded values the `Provider` responsible for
     * without communicating with the network
     */
    static newMockProvider(network: string, ethPrivateKey: Uint8Array, getTokens: Function): Promise<Provider>;
    submitTx({ tx, signature, }: {
        tx: any;
        signature?: TxEthSignature;
        fastProcessing?: boolean;
    }): Promise<string>;
    getContractAddress(linkChainId: number): Promise<ContractAddress>;
    getTokens(): Promise<Tokens>;
    updateTokenSet(): Promise<void>;
    getState(address: Address): Promise<AccountState>;
    getStateById(accountId: number): Promise<AccountState>;
    getBalance(accountId: number, subAccountId: number): Promise<AccountBalances>;
    getSubAccountState(address: Address, subAccountId: number): Promise<AccountState>;
    getTxReceipt(txHash: string): Promise<TransactionReceipt>;
    getPriorityOpStatus(linkChainId: number, serialId: number): Promise<PriorityOperationReceipt>;
    notifyPriorityOp(linkChainId: number, serialId: number, action: 'COMMIT' | 'VERIFY'): Promise<PriorityOperationReceipt>;
    notifyTransaction(hash: string, action: 'COMMIT' | 'VERIFY'): Promise<TransactionReceipt>;
    getTransactionFee(tx: any): Promise<BigNumber>;
    disconnect(): Promise<any>;
}
