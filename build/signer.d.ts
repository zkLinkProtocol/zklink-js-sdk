import { BigNumberish, ethers } from 'ethers';
import { Address, EthSignerType, PubKeyHash, Transfer, Withdraw, ForcedExit, ChangePubKey, ChangePubKeyOnchain, ChangePubKeyECDSA, ChangePubKeyCREATE2, Create2Data, Order, OrderMatching } from './types';
export declare class Signer {
    #private;
    private constructor();
    pubKeyHash(): Promise<PubKeyHash>;
    pubKey(): Promise<string>;
    signSyncTransfer(tx: Transfer): Promise<Transfer>;
    signSyncOrderMatching(matching: {
        accountId: number;
        account: Address;
        taker: Order;
        maker: Order;
        expectBaseAmount: BigNumberish;
        expectQuoteAmount: BigNumberish;
        fee: BigNumberish;
        feeTokenId: number;
        nonce: number;
    }): Promise<OrderMatching>;
    signSyncOrder(payload: Order): Promise<Order>;
    signSyncWithdraw(tx: Withdraw): Promise<Withdraw>;
    signSyncForcedExit(tx: ForcedExit): Promise<ForcedExit>;
    signSyncChangePubKey(changePubKey: {
        linkChainId: number;
        accountId: number;
        account: Address;
        newPkHash: PubKeyHash;
        feeTokenId: number;
        fee: BigNumberish;
        ts: number;
        nonce: number;
        ethAuthData?: ChangePubKeyOnchain | ChangePubKeyECDSA | ChangePubKeyCREATE2;
    }): Promise<ChangePubKey>;
    static fromPrivateKey(pk: Uint8Array): Signer;
    static fromSeed(seed: Uint8Array): Promise<Signer>;
    static fromETHSignature(ethSigner: ethers.Signer): Promise<{
        signer: Signer;
        ethSignatureType: EthSignerType;
    }>;
}
export declare class Create2WalletSigner extends ethers.Signer {
    zkSyncPubkeyHash: string;
    create2WalletData: Create2Data;
    readonly address: string;
    readonly salt: string;
    constructor(zkSyncPubkeyHash: string, create2WalletData: Create2Data, provider?: ethers.providers.Provider);
    getAddress(): Promise<string>;
    /**
     * This signer can't sign messages but we return zeroed signature bytes to comply with ethers API.
     */
    signMessage(_message: any): Promise<string>;
    signTransaction(_message: any): Promise<string>;
    connect(provider: ethers.providers.Provider): ethers.Signer;
}
