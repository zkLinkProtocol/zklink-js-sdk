import { BigNumberish, ethers } from 'ethers';
import { Address, EthSignerType, PubKeyHash, Transfer, Withdraw, ForcedExit, ChangePubKey, ChangePubKeyOnchain, ChangePubKeyECDSA, ChangePubKeyCREATE2, Create2Data, Order, OrderMatching, Signature, TokenId } from './types';
export declare class Signer {
    #private;
    private constructor();
    pubKeyHash(): Promise<PubKeyHash>;
    signTransactionBytes(msg: string): Promise<Signature>;
    pubKey(): Promise<string>;
    signTransfer(tx: Transfer): Promise<Transfer>;
    signOrderMatching(tx: OrderMatching): Promise<OrderMatching>;
    signOrder(tx: Order): Promise<Order>;
    signWithdraw(tx: Withdraw): Promise<Withdraw>;
    signForcedExit(tx: ForcedExit): Promise<ForcedExit>;
    signChangePubKey(changePubKey: {
        chainId: number;
        subAccountId: number;
        accountId: number;
        account: Address;
        newPkHash: PubKeyHash;
        feeToken: TokenId;
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
