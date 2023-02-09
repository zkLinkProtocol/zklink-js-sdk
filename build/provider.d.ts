import { AbstractJSONRPCTransport } from './transport';
import { BigNumber } from 'ethers';
import { AccountBalances, AccountState, Address, ContractInfo, Tokens, TransactionReceipt, TxEthSignature } from './types';
import { TokenSet } from './utils';
export declare class Provider {
    transport: AbstractJSONRPCTransport;
    contractInfo: ContractInfo[];
    tokenSet: TokenSet;
    pollIntervalMilliSecs: number;
    chainId: number;
    private constructor();
    /**
     * @deprecated Websocket support will be removed in future. Use HTTP transport instead.
     */
    static newWebsocketProvider(address: string): Promise<Provider>;
    static newHttpProvider(address?: string, rpcTimeout?: number, pollIntervalMilliSecs?: number): Promise<Provider>;
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
    getContractInfo(): Promise<ContractInfo[]>;
    getContractInfoByChainId(chainId: number): Promise<ContractInfo>;
    getTokens(): Promise<Tokens>;
    updateTokenSet(): Promise<void>;
    getState(address: Address): Promise<AccountState>;
    getBalance(accountId: number, subAccountId?: number): Promise<{
        balances: AccountBalances;
    }>;
    getTxReceipt(txHash: string): Promise<TransactionReceipt>;
    getBlockInfo(): Promise<{
        lastBlockNumber: number;
        timestamp: number;
        committed: number;
        verified: number;
    }>;
    notifyTransaction(hash: string, action?: 'COMMIT'): Promise<TransactionReceipt>;
    getTransactionFee(tx: any): Promise<BigNumber>;
    disconnect(): Promise<any>;
}
