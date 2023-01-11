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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeFeeRatio = exports.serializeChainId = exports.serializeNonce = exports.serializeFeePacked = exports.serializeAmountFull = exports.serializeAmountPacked = exports.serializeTokenId = exports.serializeSubAccountId = exports.serializeAccountId = exports.serializeAddress = exports.getEthSignatureType = exports.verifyERC1271Signature = exports.signMessageEIP712 = exports.signMessagePersonalAPI = exports.getSignedBytesFromMessage = exports.getChangePubkeyMessage = exports.TokenSet = exports.isTokenETH = exports.sleep = exports.buffer2bitsBE = exports.isTransactionFeePackable = exports.closestGreaterOrEqPackableTransactionFee = exports.closestPackableTransactionFee = exports.isTransactionAmountPackable = exports.closestGreaterOrEqPackableTransactionAmount = exports.closestPackableTransactionAmount = exports.packFeeChecked = exports.packAmountChecked = exports.reverseBits = exports.integerToFloatUp = exports.integerToFloat = exports.bitsIntoBytesInBEOrder = exports.floatToInteger = exports.TOTAL_CHAIN_NUM = exports.ERC20_RECOMMENDED_FASTSWAP_GAS_LIMIT = exports.ETH_RECOMMENDED_FASTSWAP_GAS_LIMIT = exports.ERC20_RECOMMENDED_DEPOSIT_GAS_LIMIT = exports.ETH_RECOMMENDED_DEPOSIT_GAS_LIMIT = exports.ERC20_APPROVE_TRESHOLD = exports.MAX_ERC20_APPROVE_AMOUNT = exports.ERC20_DEPOSIT_GAS_LIMIT = exports.MULTICALL_INTERFACE = exports.IEIP1271_INTERFACE = exports.SYNC_GOV_CONTRACT_INTERFACE = exports.ZKL_CONTRACT_INTERFACE = exports.SYNC_EXIT_CONTRACT_INTERFACE = exports.SYNC_MAIN_CONTRACT_INTERFACE = exports.IERC20_INTERFACE = exports.MAX_UNONCE = exports.MIN_UNONCE = void 0;
exports.getTimestamp = exports.chainsCompletion = exports.getFastSwapUNonce = exports.getRandom = exports.getTxHash = exports.getPendingBalance = exports.getEthereumBalance = exports.getCREATE2AddressAndSalt = exports.parseHexWithPrefix = exports.bigintToBytesBE = exports.numberToBytesBE = exports.serializeTx = exports.serializeOrderMatching = exports.serializeOrder = exports.serializeForcedExit = exports.serializeChangePubKey = exports.serializeTransfer = exports.serializeWithdraw = exports.serializeTimestamp = exports.serializeFastWithdraw = void 0;
const ethers_1 = require("ethers");
const zksync_crypto_1 = require("zksync-crypto");
// Max number of tokens for the current version, it is determined by the zkSync circuit implementation.
const MAX_NUMBER_OF_TOKENS = 65535;
// Max number of accounts for the current version, it is determined by the zkSync circuit implementation.
const MAX_NUMBER_OF_ACCOUNTS = Math.pow(2, 24);
exports.MIN_UNONCE = 1;
exports.MAX_UNONCE = 4294967295;
exports.IERC20_INTERFACE = new ethers_1.utils.Interface(require('../abi/IERC20.json').abi);
exports.SYNC_MAIN_CONTRACT_INTERFACE = new ethers_1.utils.Interface(require('../abi/SyncMain.json').abi);
exports.SYNC_EXIT_CONTRACT_INTERFACE = new ethers_1.utils.Interface(require('../abi/SyncExit.json').abi);
exports.ZKL_CONTRACT_INTERFACE = new ethers_1.utils.Interface(require('../abi/ZKL.json').abi);
exports.SYNC_GOV_CONTRACT_INTERFACE = new ethers_1.utils.Interface(require('../abi/SyncGov.json').abi);
exports.IEIP1271_INTERFACE = new ethers_1.utils.Interface(require('../abi/IEIP1271.json').abi);
exports.MULTICALL_INTERFACE = new ethers_1.utils.Interface(require('../abi/Multicall.json').abi);
exports.ERC20_DEPOSIT_GAS_LIMIT = require('../misc/DepositERC20GasLimit.json');
exports.MAX_ERC20_APPROVE_AMOUNT = ethers_1.BigNumber.from('115792089237316195423570985008687907853269984665640564039457584007913129639935'); // 2^256 - 1
exports.ERC20_APPROVE_TRESHOLD = ethers_1.BigNumber.from('57896044618658097711785492504343953926634992332820282019728792003956564819968'); // 2^255
// Gas limit that is set for eth deposit by default. For default EOA accounts 60k should be enough, but we reserve
// more gas for smart-contract wallets
exports.ETH_RECOMMENDED_DEPOSIT_GAS_LIMIT = ethers_1.BigNumber.from('140000'); // 90k
// For normal wallet/erc20 token 90k gas for deposit should be enough, but for some tokens this can go as high as ~200k
// we try to be safe by default
exports.ERC20_RECOMMENDED_DEPOSIT_GAS_LIMIT = ethers_1.BigNumber.from('300000'); // 300k
exports.ETH_RECOMMENDED_FASTSWAP_GAS_LIMIT = ethers_1.BigNumber.from('140000'); // 90k
exports.ERC20_RECOMMENDED_FASTSWAP_GAS_LIMIT = ethers_1.BigNumber.from('300000'); // 300k
exports.TOTAL_CHAIN_NUM = 4;
const AMOUNT_EXPONENT_BIT_WIDTH = 5;
const AMOUNT_MANTISSA_BIT_WIDTH = 35;
const FEE_EXPONENT_BIT_WIDTH = 5;
const FEE_MANTISSA_BIT_WIDTH = 11;
function floatToInteger(floatBytes, expBits, mantissaBits, expBaseNumber) {
    if (floatBytes.length * 8 !== mantissaBits + expBits) {
        throw new Error('Float unpacking, incorrect input length');
    }
    const bits = buffer2bitsBE(floatBytes).reverse();
    let exponent = ethers_1.BigNumber.from(0);
    let expPow2 = ethers_1.BigNumber.from(1);
    for (let i = 0; i < expBits; i++) {
        if (bits[i] === 1) {
            exponent = exponent.add(expPow2);
        }
        expPow2 = expPow2.mul(2);
    }
    exponent = ethers_1.BigNumber.from(expBaseNumber).pow(exponent);
    let mantissa = ethers_1.BigNumber.from(0);
    let mantissaPow2 = ethers_1.BigNumber.from(1);
    for (let i = expBits; i < expBits + mantissaBits; i++) {
        if (bits[i] === 1) {
            mantissa = mantissa.add(mantissaPow2);
        }
        mantissaPow2 = mantissaPow2.mul(2);
    }
    return exponent.mul(mantissa);
}
exports.floatToInteger = floatToInteger;
function bitsIntoBytesInBEOrder(bits) {
    if (bits.length % 8 !== 0) {
        throw new Error('wrong number of bits to pack');
    }
    const nBytes = bits.length / 8;
    const resultBytes = new Uint8Array(nBytes);
    for (let byte = 0; byte < nBytes; ++byte) {
        let value = 0;
        if (bits[byte * 8] === 1) {
            value |= 0x80;
        }
        if (bits[byte * 8 + 1] === 1) {
            value |= 0x40;
        }
        if (bits[byte * 8 + 2] === 1) {
            value |= 0x20;
        }
        if (bits[byte * 8 + 3] === 1) {
            value |= 0x10;
        }
        if (bits[byte * 8 + 4] === 1) {
            value |= 0x08;
        }
        if (bits[byte * 8 + 5] === 1) {
            value |= 0x04;
        }
        if (bits[byte * 8 + 6] === 1) {
            value |= 0x02;
        }
        if (bits[byte * 8 + 7] === 1) {
            value |= 0x01;
        }
        resultBytes[byte] = value;
    }
    return resultBytes;
}
exports.bitsIntoBytesInBEOrder = bitsIntoBytesInBEOrder;
function numberToBits(integer, bits) {
    const result = [];
    for (let i = 0; i < bits; i++) {
        result.push(integer & 1);
        integer /= 2;
    }
    return result;
}
function integerToFloat(integer, expBits, mantissaBits, expBase) {
    const maxExponentPower = ethers_1.BigNumber.from(2).pow(expBits).sub(1);
    const maxExponent = ethers_1.BigNumber.from(expBase).pow(maxExponentPower);
    const maxMantissa = ethers_1.BigNumber.from(2).pow(mantissaBits).sub(1);
    if (integer.gt(maxMantissa.mul(maxExponent))) {
        throw new Error('Integer is too big');
    }
    // The algortihm is as follows: calculate minimal exponent
    // such that integer <= max_mantissa * exponent_base ^ exponent,
    // then if this minimal exponent is 0 we can choose mantissa equals integer and exponent equals 0
    // else we need to check two variants:
    // 1) with that minimal exponent
    // 2) with that minimal exponent minus 1
    let exponent = 0;
    let exponentTemp = ethers_1.BigNumber.from(1);
    while (integer.gt(maxMantissa.mul(exponentTemp))) {
        exponentTemp = exponentTemp.mul(expBase);
        exponent += 1;
    }
    let mantissa = integer.div(exponentTemp);
    if (exponent !== 0) {
        const variant1 = exponentTemp.mul(mantissa);
        const variant2 = exponentTemp.div(expBase).mul(maxMantissa);
        const diff1 = integer.sub(variant1);
        const diff2 = integer.sub(variant2);
        if (diff2.lt(diff1)) {
            mantissa = maxMantissa;
            exponent -= 1;
        }
    }
    // encode into bits. First bits of mantissa in LE order
    const encoding = [];
    encoding.push(...numberToBits(exponent, expBits));
    const mantissaNumber = mantissa.toNumber();
    encoding.push(...numberToBits(mantissaNumber, mantissaBits));
    return bitsIntoBytesInBEOrder(encoding.reverse()).reverse();
}
exports.integerToFloat = integerToFloat;
function integerToFloatUp(integer, expBits, mantissaBits, expBase) {
    const maxExponentPower = ethers_1.BigNumber.from(2).pow(expBits).sub(1);
    const maxExponent = ethers_1.BigNumber.from(expBase).pow(maxExponentPower);
    const maxMantissa = ethers_1.BigNumber.from(2).pow(mantissaBits).sub(1);
    if (integer.gt(maxMantissa.mul(maxExponent))) {
        throw new Error('Integer is too big');
    }
    // The algortihm is as follows: calculate minimal exponent
    // such that integer <= max_mantissa * exponent_base ^ exponent,
    // then mantissa is calculated as integer divided by exponent_base ^ exponent and rounded up
    let exponent = 0;
    let exponentTemp = ethers_1.BigNumber.from(1);
    while (integer.gt(maxMantissa.mul(exponentTemp))) {
        exponentTemp = exponentTemp.mul(expBase);
        exponent += 1;
    }
    let mantissa = integer.div(exponentTemp);
    if (!integer.mod(exponentTemp).eq(ethers_1.BigNumber.from(0))) {
        mantissa = mantissa.add(1);
    }
    // encode into bits. First bits of mantissa in LE order
    const encoding = [];
    encoding.push(...numberToBits(exponent, expBits));
    const mantissaNumber = mantissa.toNumber();
    encoding.push(...numberToBits(mantissaNumber, mantissaBits));
    return bitsIntoBytesInBEOrder(encoding.reverse()).reverse();
}
exports.integerToFloatUp = integerToFloatUp;
function reverseBits(buffer) {
    const reversed = buffer.reverse();
    reversed.map((b) => {
        // reverse bits in byte
        b = ((b & 0xf0) >> 4) | ((b & 0x0f) << 4);
        b = ((b & 0xcc) >> 2) | ((b & 0x33) << 2);
        b = ((b & 0xaa) >> 1) | ((b & 0x55) << 1);
        return b;
    });
    return reversed;
}
exports.reverseBits = reverseBits;
function packAmount(amount) {
    return reverseBits(integerToFloat(amount, AMOUNT_EXPONENT_BIT_WIDTH, AMOUNT_MANTISSA_BIT_WIDTH, 10));
}
function packAmountUp(amount) {
    return reverseBits(integerToFloatUp(amount, AMOUNT_EXPONENT_BIT_WIDTH, AMOUNT_MANTISSA_BIT_WIDTH, 10));
}
function packFee(amount) {
    return reverseBits(integerToFloat(amount, FEE_EXPONENT_BIT_WIDTH, FEE_MANTISSA_BIT_WIDTH, 10));
}
function packFeeUp(amount) {
    return reverseBits(integerToFloatUp(amount, FEE_EXPONENT_BIT_WIDTH, FEE_MANTISSA_BIT_WIDTH, 10));
}
function packAmountChecked(amount) {
    if (closestPackableTransactionAmount(amount.toString()).toString() !== amount.toString()) {
        throw new Error('Transaction Amount is not packable');
    }
    return packAmount(amount);
}
exports.packAmountChecked = packAmountChecked;
function packFeeChecked(amount) {
    if (closestPackableTransactionFee(amount.toString()).toString() !== amount.toString()) {
        throw new Error('Fee Amount is not packable');
    }
    return packFee(amount);
}
exports.packFeeChecked = packFeeChecked;
/**
 * packs and unpacks the amount, returning the closest packed value.
 * e.g 1000000003 => 1000000000
 * @param amount
 */
function closestPackableTransactionAmount(amount) {
    const packedAmount = packAmount(ethers_1.BigNumber.from(amount));
    return floatToInteger(packedAmount, AMOUNT_EXPONENT_BIT_WIDTH, AMOUNT_MANTISSA_BIT_WIDTH, 10);
}
exports.closestPackableTransactionAmount = closestPackableTransactionAmount;
function closestGreaterOrEqPackableTransactionAmount(amount) {
    const packedAmount = packAmountUp(ethers_1.BigNumber.from(amount));
    return floatToInteger(packedAmount, AMOUNT_EXPONENT_BIT_WIDTH, AMOUNT_MANTISSA_BIT_WIDTH, 10);
}
exports.closestGreaterOrEqPackableTransactionAmount = closestGreaterOrEqPackableTransactionAmount;
function isTransactionAmountPackable(amount) {
    return closestPackableTransactionAmount(amount).eq(amount);
}
exports.isTransactionAmountPackable = isTransactionAmountPackable;
/**
 * packs and unpacks the amount, returning the closest packed value.
 * e.g 1000000003 => 1000000000
 * @param fee
 */
function closestPackableTransactionFee(fee) {
    const packedFee = packFee(ethers_1.BigNumber.from(fee));
    return floatToInteger(packedFee, FEE_EXPONENT_BIT_WIDTH, FEE_MANTISSA_BIT_WIDTH, 10);
}
exports.closestPackableTransactionFee = closestPackableTransactionFee;
function closestGreaterOrEqPackableTransactionFee(fee) {
    const packedFee = packFeeUp(ethers_1.BigNumber.from(fee));
    return floatToInteger(packedFee, FEE_EXPONENT_BIT_WIDTH, FEE_MANTISSA_BIT_WIDTH, 10);
}
exports.closestGreaterOrEqPackableTransactionFee = closestGreaterOrEqPackableTransactionFee;
function isTransactionFeePackable(amount) {
    return closestPackableTransactionFee(amount).eq(amount);
}
exports.isTransactionFeePackable = isTransactionFeePackable;
function buffer2bitsBE(buff) {
    const res = new Array(buff.length * 8);
    for (let i = 0; i < buff.length; i++) {
        const b = buff[i];
        res[i * 8] = (b & 0x80) !== 0 ? 1 : 0;
        res[i * 8 + 1] = (b & 0x40) !== 0 ? 1 : 0;
        res[i * 8 + 2] = (b & 0x20) !== 0 ? 1 : 0;
        res[i * 8 + 3] = (b & 0x10) !== 0 ? 1 : 0;
        res[i * 8 + 4] = (b & 0x08) !== 0 ? 1 : 0;
        res[i * 8 + 5] = (b & 0x04) !== 0 ? 1 : 0;
        res[i * 8 + 6] = (b & 0x02) !== 0 ? 1 : 0;
        res[i * 8 + 7] = (b & 0x01) !== 0 ? 1 : 0;
    }
    return res;
}
exports.buffer2bitsBE = buffer2bitsBE;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
exports.sleep = sleep;
function isTokenETH(token) {
    return (token === ethers_1.constants.AddressZero ||
        '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase() === token.toLowerCase());
}
exports.isTokenETH = isTokenETH;
class TokenSet {
    // TODO: handle stale entries, edge case when we rename token after adding it (ZKS-120).
    constructor(tokensById) {
        this.tokensById = tokensById;
    }
    resolveTokenObject(tokenLike) {
        if (this.tokensById[tokenLike]) {
            return this.tokensById[tokenLike];
        }
        for (const token of Object.values(this.tokensById)) {
            if (typeof tokenLike === 'number') {
                if (token.id === tokenLike) {
                    return token;
                }
            }
            else if (token.symbol.toLocaleLowerCase() === tokenLike.toLocaleLowerCase()) {
                return token;
            }
        }
        throw new Error(`Token ${tokenLike} is not supported`);
    }
    isTokenTransferAmountPackable(tokenLike, amount) {
        const parsedAmount = this.parseToken(tokenLike, amount);
        return isTransactionAmountPackable(parsedAmount);
    }
    isTokenTransactionFeePackable(tokenLike, amount) {
        const parsedAmount = this.parseToken(tokenLike, amount);
        return isTransactionFeePackable(parsedAmount);
    }
    formatToken(tokenLike, amount) {
        const decimals = this.resolveTokenDecimals(tokenLike);
        return ethers_1.utils.formatUnits(amount, decimals);
    }
    parseToken(tokenLike, amount) {
        const decimals = this.resolveTokenDecimals(tokenLike);
        return ethers_1.utils.parseUnits(amount, decimals);
    }
    resolveTokenDecimals(tokenLike) {
        return this.resolveTokenObject(tokenLike).decimals;
    }
    resolveTokenId(tokenLike) {
        return this.resolveTokenObject(tokenLike).id;
    }
    resolveTokenAddress(tokenLike, chainId) {
        return this.resolveTokenObject(tokenLike).chains[chainId].address;
    }
    resolveTokenSymbol(tokenLike) {
        return this.resolveTokenObject(tokenLike).symbol;
    }
}
exports.TokenSet = TokenSet;
function getChangePubkeyMessage(pubKeyHash, nonce, accountId, verifyingContract, layerOneChainId, domainName = 'ZkLink', version = '1') {
    const domainType = [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
    ];
    const ChangePubKey = [
        { name: 'pubKeyHash', type: 'bytes20' },
        { name: 'nonce', type: 'uint32' },
        { name: 'accountId', type: 'uint32' },
    ];
    // All properties on a domain are optional
    const domain = {
        name: domainName,
        version,
        chainId: layerOneChainId,
        verifyingContract,
    };
    // The named list of all type definitions
    const types = {
        EIP712Domain: domainType,
        ChangePubKey,
    };
    // The data to sign
    const message = {
        pubKeyHash: pubKeyHash.replace(/^sync:/, '0x'),
        nonce,
        accountId,
    };
    const data = {
        types,
        domain,
        primaryType: 'ChangePubKey',
        message,
    };
    return data;
}
exports.getChangePubkeyMessage = getChangePubkeyMessage;
function getSignedBytesFromMessage(message, addPrefix) {
    let messageBytes = typeof message === 'string' ? ethers_1.utils.toUtf8Bytes(message) : ethers_1.utils.arrayify(message);
    if (addPrefix) {
        messageBytes = ethers_1.utils.concat([
            ethers_1.utils.toUtf8Bytes(`\x19Ethereum Signed Message:\n${messageBytes.length}`),
            messageBytes,
        ]);
    }
    return messageBytes;
}
exports.getSignedBytesFromMessage = getSignedBytesFromMessage;
function signMessagePersonalAPI(signer, message) {
    return __awaiter(this, void 0, void 0, function* () {
        if (signer instanceof ethers_1.ethers.providers.JsonRpcSigner) {
            return signer.provider
                .send('personal_sign', [ethers_1.utils.hexlify(message), yield signer.getAddress()])
                .then((sign) => sign, (err) => {
                // We check for method name in the error string because error messages about invalid method name
                // often contain method name.
                if (err.message.includes('personal_sign')) {
                    // If no "personal_sign", use "eth_sign"
                    return signer.signMessage(message);
                }
                throw err;
            });
        }
        else {
            return signer.signMessage(message);
        }
    });
}
exports.signMessagePersonalAPI = signMessagePersonalAPI;
function signMessageEIP712(signer, data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (signer instanceof ethers_1.ethers.providers.JsonRpcSigner) {
            return signer.provider
                .send('eth_signTypedData_v4', [yield signer.getAddress(), JSON.stringify(data)])
                .then((sign) => sign, (err) => {
                console.log('eth_signTypedData_v4', err);
                throw err;
            });
        }
        else {
            const _a = data.types, { EIP712Domain } = _a, types = __rest(_a, ["EIP712Domain"]);
            return signer._signTypedData(data.domain, types, data.message);
        }
    });
}
exports.signMessageEIP712 = signMessageEIP712;
function verifyERC1271Signature(address, message, signature, signerOrProvider) {
    return __awaiter(this, void 0, void 0, function* () {
        const EIP1271_SUCCESS_VALUE = '0x1626ba7e';
        const signMessage = getSignedBytesFromMessage(message, true);
        const signMessageHash = ethers_1.utils.keccak256(signMessage);
        const eip1271 = new ethers_1.ethers.Contract(address, exports.IEIP1271_INTERFACE, signerOrProvider);
        const eipRetVal = yield eip1271.isValidSignature(signMessageHash, signature);
        return eipRetVal === EIP1271_SUCCESS_VALUE;
    });
}
exports.verifyERC1271Signature = verifyERC1271Signature;
function getEthSignatureType(_provider, message, signature, address) {
    return __awaiter(this, void 0, void 0, function* () {
        const messageNoPrefix = getSignedBytesFromMessage(message, false);
        const messageWithPrefix = getSignedBytesFromMessage(message, true);
        const prefixedECDSASigner = ethers_1.utils.recoverAddress(ethers_1.utils.keccak256(messageWithPrefix), signature);
        if (prefixedECDSASigner.toLowerCase() === address.toLowerCase()) {
            return {
                verificationMethod: 'ECDSA',
                isSignedMsgPrefixed: true,
            };
        }
        const notPrefixedMsgECDSASigner = ethers_1.utils.recoverAddress(ethers_1.utils.keccak256(messageNoPrefix), signature);
        if (notPrefixedMsgECDSASigner.toLowerCase() === address.toLowerCase()) {
            return {
                verificationMethod: 'ECDSA',
                isSignedMsgPrefixed: false,
            };
        }
        let isSignedMsgPrefixed = null;
        // Sometimes an error is thrown if the signature is wrong
        try {
            isSignedMsgPrefixed = yield verifyERC1271Signature(address, messageNoPrefix, signature, _provider);
        }
        catch (_a) {
            isSignedMsgPrefixed = false;
        }
        return {
            verificationMethod: 'ERC-1271',
            isSignedMsgPrefixed,
        };
    });
}
exports.getEthSignatureType = getEthSignatureType;
function removeAddressPrefix(address) {
    if (address.startsWith('0x'))
        return address.substr(2);
    if (address.startsWith('sync:'))
        return address.substr(5);
    throw new Error("ETH address must start with '0x' and PubKeyHash must start with 'sync:'");
}
// PubKeyHash or eth address
function serializeAddress(address) {
    const prefixlessAddress = removeAddressPrefix(address);
    const addressBytes = ethers_1.utils.arrayify(`0x${prefixlessAddress}`);
    if (addressBytes.length !== 20) {
        throw new Error('Address must be 20 bytes long');
    }
    return addressBytes;
}
exports.serializeAddress = serializeAddress;
function serializeAccountId(accountId) {
    if (accountId < 0) {
        throw new Error('Negative account id');
    }
    if (accountId >= MAX_NUMBER_OF_ACCOUNTS) {
        throw new Error('AccountId is too big');
    }
    return numberToBytesBE(accountId, 4);
}
exports.serializeAccountId = serializeAccountId;
function serializeSubAccountId(subAccountId) {
    return numberToBytesBE(subAccountId, 1);
}
exports.serializeSubAccountId = serializeSubAccountId;
function serializeTokenId(tokenId) {
    if (tokenId < 0) {
        throw new Error('Negative tokenId');
    }
    if (tokenId >= MAX_NUMBER_OF_TOKENS) {
        throw new Error('TokenId is too big');
    }
    return numberToBytesBE(tokenId, 2);
}
exports.serializeTokenId = serializeTokenId;
function serializeAmountPacked(amount) {
    return packAmountChecked(ethers_1.BigNumber.from(amount));
}
exports.serializeAmountPacked = serializeAmountPacked;
function serializeAmountFull(amount) {
    const bnAmount = ethers_1.BigNumber.from(amount);
    return ethers_1.utils.zeroPad(ethers_1.utils.arrayify(bnAmount), 16);
}
exports.serializeAmountFull = serializeAmountFull;
function serializeFeePacked(fee) {
    return packFeeChecked(ethers_1.BigNumber.from(fee));
}
exports.serializeFeePacked = serializeFeePacked;
function serializeNonce(nonce) {
    if (nonce < 0) {
        throw new Error('Negative nonce');
    }
    return numberToBytesBE(nonce, 4);
}
exports.serializeNonce = serializeNonce;
function serializeChainId(chainId) {
    return numberToBytesBE(chainId, 1);
}
exports.serializeChainId = serializeChainId;
function serializeFeeRatio(withdrawFeeRatio) {
    return numberToBytesBE(withdrawFeeRatio, 2);
}
exports.serializeFeeRatio = serializeFeeRatio;
function serializeFastWithdraw(fastWithdraw) {
    return new Uint8Array([fastWithdraw]);
}
exports.serializeFastWithdraw = serializeFastWithdraw;
function serializeTimestamp(time) {
    if (time < 0) {
        throw new Error('Negative timestamp');
    }
    return ethers_1.ethers.utils.concat([new Uint8Array(4), numberToBytesBE(time, 4)]);
}
exports.serializeTimestamp = serializeTimestamp;
function serializeWithdraw(withdraw) {
    const type = new Uint8Array([3]);
    const toChainId = serializeChainId(withdraw.toChainId);
    const accountId = serializeAccountId(withdraw.accountId);
    const subAccountId = serializeSubAccountId(withdraw.subAccountId);
    const toBytes = serializeAddress(withdraw.to);
    const l2SourceTokenIdBytes = serializeTokenId(withdraw.l2SourceToken);
    const l1TargetTokenIdBytes = serializeTokenId(withdraw.l1TargetToken);
    const amountBytes = serializeAmountFull(withdraw.amount);
    const feeBytes = serializeFeePacked(withdraw.fee);
    const nonceBytes = serializeNonce(withdraw.nonce);
    const fastWithdrawBytes = serializeFastWithdraw(withdraw.fastWithdraw);
    const withdrawFeeRatioBytes = serializeFeeRatio(withdraw.withdrawFeeRatio);
    const tsBytes = numberToBytesBE(withdraw.ts, 4);
    return ethers_1.ethers.utils.concat([
        type,
        toChainId,
        accountId,
        subAccountId,
        toBytes,
        l2SourceTokenIdBytes,
        l1TargetTokenIdBytes,
        amountBytes,
        feeBytes,
        nonceBytes,
        fastWithdrawBytes,
        withdrawFeeRatioBytes,
        tsBytes,
    ]);
}
exports.serializeWithdraw = serializeWithdraw;
function serializeTransfer(transfer) {
    const type = new Uint8Array([4]); // tx type
    const accountId = serializeAccountId(transfer.accountId);
    const fromSubAccountId = serializeSubAccountId(transfer.fromSubAccountId);
    const to = serializeAddress(transfer.to);
    const toSubAccountId = serializeSubAccountId(transfer.toSubAccountId);
    const token = serializeTokenId(transfer.token);
    const amount = serializeAmountPacked(transfer.amount);
    const fee = serializeFeePacked(transfer.fee);
    const nonce = serializeNonce(transfer.nonce);
    const tsBytes = numberToBytesBE(transfer.ts, 4);
    return ethers_1.ethers.utils.concat([
        type,
        accountId,
        fromSubAccountId,
        to,
        toSubAccountId,
        token,
        amount,
        fee,
        nonce,
        tsBytes,
    ]);
}
exports.serializeTransfer = serializeTransfer;
function serializeChangePubKey(changePubKey) {
    const type = new Uint8Array([6]);
    const chainIdBytes = serializeChainId(changePubKey.chainId);
    const subAccountIdBytes = serializeSubAccountId(changePubKey.subAccountId);
    const accountIdBytes = serializeAccountId(changePubKey.accountId);
    const pubKeyHashBytes = serializeAddress(changePubKey.newPkHash);
    const feeTokenIdBytes = serializeTokenId(changePubKey.feeToken);
    const feeBytes = serializeFeePacked(changePubKey.fee);
    const nonceBytes = serializeNonce(changePubKey.nonce);
    const tsBytes = numberToBytesBE(changePubKey.ts, 4);
    return ethers_1.ethers.utils.concat([
        type,
        chainIdBytes,
        accountIdBytes,
        subAccountIdBytes,
        pubKeyHashBytes,
        feeTokenIdBytes,
        feeBytes,
        nonceBytes,
        tsBytes,
    ]);
}
exports.serializeChangePubKey = serializeChangePubKey;
function serializeForcedExit(forcedExit) {
    const type = new Uint8Array([7]);
    const toChainIdBytes = serializeChainId(forcedExit.toChainId);
    const initiatorAccountIdBytes = serializeAccountId(forcedExit.initiatorAccountId);
    const initiatorSubAccountIdBytes = serializeSubAccountId(forcedExit.initiatorSubAccountId);
    const targetBytes = serializeAddress(forcedExit.target);
    const targetSubAccountIdBytes = serializeSubAccountId(forcedExit.targetSubAccountId);
    const l2SourceTokenIdBytes = serializeTokenId(forcedExit.l2SourceToken);
    const l1TargetTokenIdBytes = serializeTokenId(forcedExit.l1TargetToken);
    const feeTokenIdBytes = serializeTokenId(forcedExit.feeToken);
    const feeBytes = serializeFeePacked(forcedExit.fee);
    const nonceBytes = serializeNonce(forcedExit.nonce);
    const tsBytes = numberToBytesBE(forcedExit.ts, 4);
    return ethers_1.ethers.utils.concat([
        type,
        toChainIdBytes,
        initiatorAccountIdBytes,
        initiatorSubAccountIdBytes,
        targetBytes,
        targetSubAccountIdBytes,
        l2SourceTokenIdBytes,
        l1TargetTokenIdBytes,
        feeTokenIdBytes,
        feeBytes,
        nonceBytes,
        tsBytes,
    ]);
}
exports.serializeForcedExit = serializeForcedExit;
function serializeOrder(order) {
    const type = new Uint8Array([255]);
    const accountIdBytes = serializeAccountId(order.accountId);
    const subAccountIdBytes = serializeSubAccountId(order.subAccountId);
    const slotBytes = numberToBytesBE(order.slotId, 1);
    const nonceBytes = serializeNonce(order.nonce);
    const baseTokenIdBytes = serializeTokenId(order.baseTokenId);
    const quoteTokenIdBytes = serializeTokenId(order.quoteTokenId);
    const priceBytes = bigintToBytesBE(ethers_1.BigNumber.from(order.price).toBigInt(), 15);
    const isSellBytes = numberToBytesBE(order.isSell, 1);
    const feeRatio1Bytes = numberToBytesBE(order.feeRatio1, 1);
    const feeRatio2Bytes = numberToBytesBE(order.feeRatio2, 1);
    const amountBytes = serializeAmountPacked(order.amount);
    return ethers_1.ethers.utils.concat([
        type,
        accountIdBytes,
        subAccountIdBytes,
        slotBytes,
        nonceBytes,
        baseTokenIdBytes,
        quoteTokenIdBytes,
        priceBytes,
        isSellBytes,
        feeRatio1Bytes,
        feeRatio2Bytes,
        amountBytes,
    ]);
}
exports.serializeOrder = serializeOrder;
function serializeOrderMatching(matching) {
    return __awaiter(this, void 0, void 0, function* () {
        const makerBytes = serializeOrder(matching.maker);
        const takerBytes = serializeOrder(matching.taker);
        const ordersBytes = new Uint8Array(178);
        ordersBytes.fill(0);
        ordersBytes.set([...makerBytes, ...takerBytes], 0);
        const ordersHash = yield (0, zksync_crypto_1.rescueHashOrders)(ordersBytes);
        const type = new Uint8Array([8]);
        const accountIdBytes = serializeAccountId(matching.accountId);
        const subAccountIdBytes = serializeSubAccountId(matching.subAccountId);
        const feeTokenBytes = serializeTokenId(matching.feeToken);
        const feeBytes = serializeFeePacked(matching.fee);
        const expectBaseAmountBytes = serializeAmountFull(matching.expectBaseAmount);
        const expectQuoteAmountBytes = serializeAmountFull(matching.expectQuoteAmount);
        return ethers_1.ethers.utils.concat([
            type,
            accountIdBytes,
            subAccountIdBytes,
            ordersHash,
            feeTokenBytes,
            feeBytes,
            expectBaseAmountBytes,
            expectQuoteAmountBytes,
        ]);
    });
}
exports.serializeOrderMatching = serializeOrderMatching;
/**
 * Encodes the transaction data as the byte sequence according to the zkSync protocol.
 * @param tx A transaction to serialize.
 */
function serializeTx(tx) {
    switch (tx.type) {
        case 'Transfer':
            return serializeTransfer(tx);
        case 'Withdraw':
            return serializeWithdraw(tx);
        case 'ChangePubKey':
            return serializeChangePubKey(tx);
        case 'ForcedExit':
            return serializeForcedExit(tx);
        default:
            return new Uint8Array();
    }
}
exports.serializeTx = serializeTx;
function numberToBytesBE(number, bytes) {
    const result = new Uint8Array(bytes);
    for (let i = bytes - 1; i >= 0; i--) {
        result[i] = number & 0xff;
        number >>= 8;
    }
    return result;
}
exports.numberToBytesBE = numberToBytesBE;
function bigintToBytesBE(number1, bytes) {
    const result = new Uint8Array(bytes);
    for (let i = bytes - 1; i >= 0; i--) {
        result[i] = Number(number1 & BigInt('0xff'));
        number1 >>= BigInt(8);
    }
    return result;
}
exports.bigintToBytesBE = bigintToBytesBE;
function parseHexWithPrefix(str) {
    return Uint8Array.from(Buffer.from(str.slice(2), 'hex'));
}
exports.parseHexWithPrefix = parseHexWithPrefix;
function getCREATE2AddressAndSalt(syncPubkeyHash, create2Data) {
    const pubkeyHashHex = syncPubkeyHash.replace('sync:', '0x');
    const additionalSaltArgument = ethers_1.ethers.utils.arrayify(create2Data.saltArg);
    if (additionalSaltArgument.length !== 32) {
        throw new Error('create2Data.saltArg should be exactly 32 bytes long');
    }
    // CREATE2 salt
    const salt = ethers_1.ethers.utils.keccak256(ethers_1.ethers.utils.concat([additionalSaltArgument, pubkeyHashHex]));
    // Address according to CREATE2 specification
    const address = '0x' +
        ethers_1.ethers.utils
            .keccak256(ethers_1.ethers.utils.concat([
            ethers_1.ethers.utils.arrayify(0xff),
            ethers_1.ethers.utils.arrayify(create2Data.creatorAddress),
            salt,
            ethers_1.ethers.utils.arrayify(create2Data.codeHash),
        ]))
            .slice(2 + 12 * 2);
    return { address: address, salt: ethers_1.ethers.utils.hexlify(salt) };
}
exports.getCREATE2AddressAndSalt = getCREATE2AddressAndSalt;
function getEthereumBalance(ethProvider, syncProvider, address, token, chainId) {
    return __awaiter(this, void 0, void 0, function* () {
        let balance;
        if (isTokenETH(token)) {
            balance = yield ethProvider.getBalance(address);
        }
        else {
            const erc20contract = new ethers_1.Contract(token, exports.IERC20_INTERFACE, ethProvider);
            balance = yield erc20contract.balanceOf(address);
        }
        return balance;
    });
}
exports.getEthereumBalance = getEthereumBalance;
function getPendingBalance(ethProvider, syncProvider, address, token, chainId) {
    return __awaiter(this, void 0, void 0, function* () {
        const contractAddress = yield syncProvider.getContractInfoByChainId(chainId);
        const zksyncContract = new ethers_1.Contract(contractAddress.mainContract, exports.SYNC_MAIN_CONTRACT_INTERFACE, ethProvider);
        const tokenAddress = syncProvider.tokenSet.resolveTokenAddress(token, chainId);
        return zksyncContract.getPendingBalance(address, tokenAddress);
    });
}
exports.getPendingBalance = getPendingBalance;
function getTxHash(tx) {
    if (tx.type == 'Close') {
        throw new Error('Close operation is disabled');
    }
    let txBytes = serializeTx(tx);
    return ethers_1.ethers.utils.sha256(txBytes).replace('0x', 'sync-tx:');
}
exports.getTxHash = getTxHash;
function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
exports.getRandom = getRandom;
function getFastSwapUNonce() {
    return getRandom(exports.MIN_UNONCE, exports.MAX_UNONCE);
}
exports.getFastSwapUNonce = getFastSwapUNonce;
function chainsCompletion(chains, chainNum, item) {
    if (chains.length === chainNum) {
        return chains;
    }
    const newChains = Array.from(chains);
    for (let i = 0; i < chainNum - chains.length; i++) {
        newChains.push(item);
    }
    return newChains;
}
exports.chainsCompletion = chainsCompletion;
function getTimestamp() {
    let ts = new Date().getTime();
    return parseInt(String(ts / 1000));
}
exports.getTimestamp = getTimestamp;
