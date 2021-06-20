import { privateKeyFromSeed, signTransactionBytes, privateKeyToPubKeyHash } from './crypto';
import { BigNumber, BigNumberish, ethers } from 'ethers';
import * as utils from './utils';
import {
    Address,
    EthSignerType,
    PubKeyHash,
    Transfer,
    Withdraw,
    ForcedExit,
    ChangePubKey,
    ChangePubKeyOnchain,
    ChangePubKeyECDSA,
    ChangePubKeyCREATE2,
    Create2Data,
    CreatePool, AddLiquidity, RemoveLiquidity, Swap
} from './types';

export class Signer {
    readonly #privateKey: Uint8Array;

    private constructor(privKey: Uint8Array) {
        this.#privateKey = privKey;
    }

    async pubKeyHash(): Promise<PubKeyHash> {
        return await privateKeyToPubKeyHash(this.#privateKey);
    }

    /**
     * @deprecated `Signer.*SignBytes` methods will be removed in future. Use `utils.serializeTx` instead.
     */
    transferSignBytes(transfer: {
        accountId: number;
        from: Address;
        to: Address;
        tokenId: number;
        amount: BigNumberish;
        fee: BigNumberish;
        nonce: number;
        validFrom: number;
        validUntil: number;
    }): Uint8Array {
        return utils.serializeTransfer({
            ...transfer,
            type: 'Transfer',
            token: transfer.tokenId
        });
    }

    async signSyncTransfer(transfer: {
        accountId: number;
        from: Address;
        to: Address;
        tokenId: number;
        amount: BigNumberish;
        fee: BigNumberish;
        nonce: number;
        validFrom: number;
        validUntil: number;
    }): Promise<Transfer> {
        const tx: Transfer = {
            ...transfer,
            type: 'Transfer',
            token: transfer.tokenId
        };
        const msgBytes = utils.serializeTransfer(tx);
        const signature = await signTransactionBytes(this.#privateKey, msgBytes);

        return {
            ...tx,
            amount: BigNumber.from(transfer.amount).toString(),
            fee: BigNumber.from(transfer.fee).toString(),
            signature
        };
    }


    async signSyncSwap(transfer: {
        fromChain: number,
        toChain: number,
        accountId: number,
        account: Address,  // this.address()
        tokenIdIn: number,
        tokenIdOut: number,
        amountIn: BigNumberish,
        amountOut: BigNumberish,
        amountOutMin: BigNumberish,
        fee0: BigNumberish,
        fee1: BigNumberish,
        pairAddress: Address,
        
        nonce: number;
        validFrom: number;
        validUntil: number;
    }): Promise<Swap> {
        const tx: Swap = {
            ...transfer,
            type: 'Swap',
            tokenIn: transfer.tokenIdIn,
            tokenOut: transfer.tokenIdOut,
        };
        const msgBytes = utils.serializeSwap(tx);
        const signature = await signTransactionBytes(this.#privateKey, msgBytes);

        return {
            ...tx,
            amountIn: BigNumber.from(transfer.amountIn).toString(),
            amountOut: BigNumber.from(transfer.amountOut).toString(),
            amountOutMin: BigNumber.from(transfer.amountOutMin).toString(),
            fee0: BigNumber.from(transfer.fee0).toString(),
            fee1: BigNumber.from(transfer.fee1).toString(),
            signature
        };
    }

    async signSyncRemoveLiquidity(transfer: {
        fromChainId: number;
        toChainId: number;
        minAmount1: BigNumberish,
        minAmount2: BigNumberish,
        tokenId1: number,
        tokenId2: number,
        lpTokenId: number,
        fee1: BigNumberish,
        fee2: BigNumberish,
        from: Address;
        pairAddress: Address,
        lpQuantity: string;
        accountId: number,
        nonce: number;
        validFrom: number;
        validUntil: number;
    }): Promise<RemoveLiquidity> {
        const tx: RemoveLiquidity = {
            ...transfer,
            type: 'RemoveLiquidity',
            token1: transfer.tokenId1,
            token2: transfer.tokenId2,
            lpToken: transfer.lpTokenId,
        };
        const msgBytes = utils.serializeRemoveLiquidity(tx);
        const signature = await signTransactionBytes(this.#privateKey, msgBytes);

        return {
            ...tx,
            minAmount1: BigNumber.from(transfer.minAmount1).toString(),
            minAmount2: BigNumber.from(transfer.minAmount2).toString(),
            fee1: BigNumber.from(transfer.fee1).toString(),
            fee2: BigNumber.from(transfer.fee2).toString(),
            signature
        };
    }

    async signSyncAddLiquidity(transfer: {
        accountId: number;
        account: Address;
        fromChainId: number;
        toChainId: number;
        tokenId0: number;
        tokenId1: number;
        amount0: BigNumberish;
        amount1: BigNumberish;
        amount0Min: BigNumberish;
        amount1Min: BigNumberish;
        pairAccount: Address;
        // fee1: BigNumberish;
        // fee2: BigNumberish;
        nonce: number;
        validFrom: number;
        validUntil: number;
    }): Promise<AddLiquidity> {
        const tx: AddLiquidity = {
            ...transfer,
            type: 'AddLiq',
            token0: transfer.tokenId0,
            token1: transfer.tokenId1,
        };
        const msgBytes = utils.serializeAddLiquidity(tx);
        const signature = await signTransactionBytes(this.#privateKey, msgBytes);

        return {
            ...tx,
            amount0: BigNumber.from(transfer.amount0).toString(),
            amount1: BigNumber.from(transfer.amount1).toString(),
            amount0Min: BigNumber.from(transfer.amount0Min).toString(),
            amount1Min: BigNumber.from(transfer.amount1Min).toString(),
            signature
        };
    }

    createPoolSignBytes(transfer: {
        accountId: number;
        account: Address;
        chainId0: number;
        chainId1: number;
        tokenId0: number;
        tokenId1: number;
        nonce: number;
        validFrom: number;
        validUntil: number;
    }): Uint8Array {
        return utils.serializeCreatePool({
            ...transfer,
            type: 'CreatePool',
            token0: transfer.tokenId0,
            token1: transfer.tokenId1,
        });
    }
    async signSyncCreatePool(transfer: {
        accountId: number;
        account: Address;
        chainId0: number;
        chainId1: number;
        tokenId0: number;
        tokenId1: number;
        nonce: number;
        validFrom: number;
        validUntil: number;
    }): Promise<CreatePool> {
        const tx: CreatePool = {
            ...transfer,
            type: 'CreatePool',
            token0: transfer.tokenId0,
            token1: transfer.tokenId1,
        };
        const msgBytes = utils.serializeCreatePool(tx);
        const signature = await signTransactionBytes(this.#privateKey, msgBytes);

        return {
            ...tx,
            signature
        };
    }

    /**
     * @deprecated `Signer.*SignBytes` methods will be removed in future. Use `utils.serializeTx` instead.
     */
    withdrawSignBytes(withdraw: {
        accountId: number;
        from: Address;
        ethAddress: string;
        tokenId: number;
        amount: BigNumberish;
        fee: BigNumberish;
        nonce: number;
        validFrom: number;
        validUntil: number;
    }): Uint8Array {
        return utils.serializeWithdraw({
            ...withdraw,
            type: 'Withdraw',
            to: withdraw.ethAddress,
            token: withdraw.tokenId
        });
    }

    async signSyncWithdraw(withdraw: {
        accountId: number;
        from: Address;
        ethAddress: string;
        tokenId: number;
        amount: BigNumberish;
        fee: BigNumberish;
        nonce: number;
        validFrom: number;
        validUntil: number;
    }): Promise<Withdraw> {
        const tx: Withdraw = {
            ...withdraw,
            type: 'Withdraw',
            to: withdraw.ethAddress,
            token: withdraw.tokenId
        };
        const msgBytes = utils.serializeWithdraw(tx);
        const signature = await signTransactionBytes(this.#privateKey, msgBytes);

        return {
            ...tx,
            amount: BigNumber.from(withdraw.amount).toString(),
            fee: BigNumber.from(withdraw.fee).toString(),
            signature
        };
    }

    /**
     * @deprecated `Signer.*SignBytes` methods will be removed in future. Use `utils.serializeTx` instead.
     */
    forcedExitSignBytes(forcedExit: {
        initiatorAccountId: number;
        target: Address;
        tokenId: number;
        fee: BigNumberish;
        nonce: number;
        validFrom: number;
        validUntil: number;
    }): Uint8Array {
        return utils.serializeForcedExit({
            ...forcedExit,
            type: 'ForcedExit',
            token: forcedExit.tokenId
        });
    }

    async signSyncForcedExit(forcedExit: {
        initiatorAccountId: number;
        target: Address;
        tokenId: number;
        fee: BigNumberish;
        nonce: number;
        validFrom: number;
        validUntil: number;
    }): Promise<ForcedExit> {
        const tx: ForcedExit = {
            ...forcedExit,
            type: 'ForcedExit',
            token: forcedExit.tokenId
        };
        const msgBytes = utils.serializeForcedExit(tx);
        const signature = await signTransactionBytes(this.#privateKey, msgBytes);
        return {
            ...tx,
            fee: BigNumber.from(forcedExit.fee).toString(),
            signature
        };
    }

    /**
     * @deprecated `Signer.*SignBytes` methods will be removed in future. Use `utils.serializeTx` instead.
     */
    changePubKeySignBytes(changePubKey: {
        accountId: number;
        account: Address;
        newPkHash: PubKeyHash;
        feeTokenId: number;
        fee: BigNumberish;
        nonce: number;
        validFrom: number;
        validUntil: number;
    }): Uint8Array {
        return utils.serializeChangePubKey({
            ...changePubKey,
            type: 'ChangePubKey',
            feeToken: changePubKey.feeTokenId,
            // this is not important for serialization
            ethAuthData: { type: 'Onchain' }
        });
    }

    async signSyncChangePubKey(changePubKey: {
        accountId: number;
        account: Address;
        newPkHash: PubKeyHash;
        feeTokenId: number;
        fee: BigNumberish;
        nonce: number;
        ethAuthData?: ChangePubKeyOnchain | ChangePubKeyECDSA | ChangePubKeyCREATE2;
        ethSignature?: string;
        validFrom: number;
        validUntil: number;
    }): Promise<ChangePubKey> {
        const tx: ChangePubKey = {
            ...changePubKey,
            type: 'ChangePubKey',
            feeToken: changePubKey.feeTokenId
        };
        const msgBytes = utils.serializeChangePubKey(tx);
        const signature = await signTransactionBytes(this.#privateKey, msgBytes);
        return {
            ...tx,
            fee: BigNumber.from(changePubKey.fee).toString(),
            signature
        };
    }

    static fromPrivateKey(pk: Uint8Array): Signer {
        return new Signer(pk);
    }

    static async fromSeed(seed: Uint8Array): Promise<Signer> {
        return new Signer(await privateKeyFromSeed(seed));
    }

    static async fromETHSignature(
        ethSigner: ethers.Signer
    ): Promise<{
        signer: Signer;
        ethSignatureType: EthSignerType;
    }> {
        let message = 'Access zkLink account.\n\nOnly sign this message for a trusted client!';
        const signedBytes = utils.getSignedBytesFromMessage(message, false);
        const signature = await utils.signMessagePersonalAPI(ethSigner, signedBytes);
        const address = await ethSigner.getAddress();
        const ethSignatureType = await utils.getEthSignatureType(ethSigner.provider, message, signature, address);
        const seed = ethers.utils.arrayify(signature);
        const signer = await Signer.fromSeed(seed);
        return { signer, ethSignatureType };
    }
}

export class Create2WalletSigner extends ethers.Signer {
    public readonly address: string;
    // salt for create2 function call
    public readonly salt: string;
    constructor(
        public zkSyncPubkeyHash: string,
        public create2WalletData: Create2Data,
        provider?: ethers.providers.Provider
    ) {
        super();
        Object.defineProperty(this, 'provider', {
            enumerable: true,
            value: provider,
            writable: false
        });
        const create2Info = utils.getCREATE2AddressAndSalt(zkSyncPubkeyHash, create2WalletData);
        this.address = create2Info.address;
        this.salt = create2Info.salt;
    }

    async getAddress() {
        return this.address;
    }

    /**
     * This signer can't sign messages but we return zeroed signature bytes to comply with ethers API.
     */
    async signMessage(_message) {
        return ethers.utils.hexlify(new Uint8Array(65));
    }

    async signTransaction(_message): Promise<string> {
        throw new Error("Create2Wallet signer can't sign transactions");
    }

    connect(provider: ethers.providers.Provider): ethers.Signer {
        return new Create2WalletSigner(this.zkSyncPubkeyHash, this.create2WalletData, provider);
    }
}
