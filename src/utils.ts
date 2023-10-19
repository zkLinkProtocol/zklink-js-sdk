import {
  BigNumber,
  BigNumberish,
  Contract,
  constants,
  ethers,
  utils,
} from 'ethers'
import { arrayify } from 'ethers/lib/utils'
import { rescueHashOrders } from 'zksync-crypto'
import {
  Address,
  ChangePubKeyData,
  ContractData,
  ContractMatchingData,
  EthSignerType,
  ForcedExitData,
  OrderData,
  OrderMatchingData,
  PubKeyHash,
  TokenAddress,
  TransferData,
  WithdrawData,
} from './types'

// Max number of tokens for the current version, it is determined by the zkSync circuit implementation.
const MAX_NUMBER_OF_TOKENS = 65535
// Max number of accounts for the current version, it is determined by the zkSync circuit implementation.
const MAX_NUMBER_OF_ACCOUNTS = Math.pow(2, 24)

export const MIN_UNONCE = 1
export const MAX_UNONCE = 4294967295

export const IERC20_INTERFACE = new utils.Interface(
  require('../abi/IERC20.json').abi
)
export const MAIN_CONTRACT_INTERFACE = new utils.Interface(
  require('../abi/ZkLink.json').abi
)
export const IEIP1271_INTERFACE = new utils.Interface(
  require('../abi/IEIP1271.json').abi
)

export const ERC20_DEPOSIT_GAS_LIMIT = require('../misc/DepositERC20GasLimit.json')

export const MAX_ERC20_APPROVE_AMOUNT = BigNumber.from(
  '115792089237316195423570985008687907853269984665640564039457584007913129639935'
) // 2^256 - 1

export const ERC20_APPROVE_TRESHOLD = BigNumber.from(
  '57896044618658097711785492504343953926634992332820282019728792003956564819968'
) // 2^255

// Gas limit that is set for eth deposit by default. For default EOA accounts 60k should be enough, but we reserve
// more gas for smart-contract wallets
export const ETH_RECOMMENDED_DEPOSIT_GAS_LIMIT = BigNumber.from('140000') // 90k
// For normal wallet/erc20 token 90k gas for deposit should be enough, but for some tokens this can go as high as ~200k
// we try to be safe by default
export const ERC20_RECOMMENDED_DEPOSIT_GAS_LIMIT = BigNumber.from('300000') // 300k

const AMOUNT_EXPONENT_BIT_WIDTH = 5
const AMOUNT_MANTISSA_BIT_WIDTH = 35
const FEE_EXPONENT_BIT_WIDTH = 5
const FEE_MANTISSA_BIT_WIDTH = 11

export const SIGN_MESSAGE =
  "Sign this message to create a key to interact with zkLink's layer2 services.\nNOTE: This application is powered by zkLink protocol.\n\nOnly sign this message for a trusted client!"

export enum TxType {
  Deposit = 1,
  TransferToNew = 2,
  Withdraw = 3,
  Transfer = 4,
  FullExit = 5,
  ChangePubKey = 6,
  ForcedExit = 7,
  OrderMatching = 8,
  ContractMatching = 9,
  Contract = 254,
  Order = 255,
}

export const ORDER_TYPES = 1424 / 8 // 178
export const CONTRACT_TYPES = 35

export function floatToInteger(
  floatBytes: Uint8Array,
  expBits: number,
  mantissaBits: number,
  expBaseNumber: number
): BigNumber {
  if (floatBytes.length * 8 !== mantissaBits + expBits) {
    throw new Error('Float unpacking, incorrect input length')
  }

  const bits = buffer2bitsBE(floatBytes).reverse()
  let exponent = BigNumber.from(0)
  let expPow2 = BigNumber.from(1)
  for (let i = 0; i < expBits; i++) {
    if (bits[i] === 1) {
      exponent = exponent.add(expPow2)
    }
    expPow2 = expPow2.mul(2)
  }
  exponent = BigNumber.from(expBaseNumber).pow(exponent)

  let mantissa = BigNumber.from(0)
  let mantissaPow2 = BigNumber.from(1)
  for (let i = expBits; i < expBits + mantissaBits; i++) {
    if (bits[i] === 1) {
      mantissa = mantissa.add(mantissaPow2)
    }
    mantissaPow2 = mantissaPow2.mul(2)
  }
  return exponent.mul(mantissa)
}

export function bitsIntoBytesInBEOrder(bits: number[]): Uint8Array {
  if (bits.length % 8 !== 0) {
    throw new Error('wrong number of bits to pack')
  }
  const nBytes = bits.length / 8
  const resultBytes = new Uint8Array(nBytes)

  for (let byte = 0; byte < nBytes; ++byte) {
    let value = 0
    if (bits[byte * 8] === 1) {
      value |= 0x80
    }
    if (bits[byte * 8 + 1] === 1) {
      value |= 0x40
    }
    if (bits[byte * 8 + 2] === 1) {
      value |= 0x20
    }
    if (bits[byte * 8 + 3] === 1) {
      value |= 0x10
    }
    if (bits[byte * 8 + 4] === 1) {
      value |= 0x08
    }
    if (bits[byte * 8 + 5] === 1) {
      value |= 0x04
    }
    if (bits[byte * 8 + 6] === 1) {
      value |= 0x02
    }
    if (bits[byte * 8 + 7] === 1) {
      value |= 0x01
    }

    resultBytes[byte] = value
  }

  return resultBytes
}

function numberToBits(integer: number, bits: number): number[] {
  const result = []
  for (let i = 0; i < bits; i++) {
    result.push(integer & 1)
    integer /= 2
  }
  return result
}

export function integerToFloat(
  integer: BigNumber,
  expBits: number,
  mantissaBits: number,
  expBase: number
): Uint8Array {
  const maxExponentPower = BigNumber.from(2).pow(expBits).sub(1)
  const maxExponent = BigNumber.from(expBase).pow(maxExponentPower)
  const maxMantissa = BigNumber.from(2).pow(mantissaBits).sub(1)

  if (integer.gt(maxMantissa.mul(maxExponent))) {
    throw new Error('Integer is too big')
  }

  // The algortihm is as follows: calculate minimal exponent
  // such that integer <= max_mantissa * exponent_base ^ exponent,
  // then if this minimal exponent is 0 we can choose mantissa equals integer and exponent equals 0
  // else we need to check two variants:
  // 1) with that minimal exponent
  // 2) with that minimal exponent minus 1
  let exponent = 0
  let exponentTemp = BigNumber.from(1)
  while (integer.gt(maxMantissa.mul(exponentTemp))) {
    exponentTemp = exponentTemp.mul(expBase)
    exponent += 1
  }
  let mantissa = integer.div(exponentTemp)
  if (exponent !== 0) {
    const variant1 = exponentTemp.mul(mantissa)
    const variant2 = exponentTemp.div(expBase).mul(maxMantissa)
    const diff1 = integer.sub(variant1)
    const diff2 = integer.sub(variant2)
    if (diff2.lt(diff1)) {
      mantissa = maxMantissa
      exponent -= 1
    }
  }

  // encode into bits. First bits of mantissa in LE order
  const encoding = []

  encoding.push(...numberToBits(exponent, expBits))
  const mantissaNumber = mantissa.toNumber()
  encoding.push(...numberToBits(mantissaNumber, mantissaBits))

  return bitsIntoBytesInBEOrder(encoding.reverse()).reverse()
}

export function integerToFloatUp(
  integer: BigNumber,
  expBits: number,
  mantissaBits: number,
  expBase: number
): Uint8Array {
  const maxExponentPower = BigNumber.from(2).pow(expBits).sub(1)
  const maxExponent = BigNumber.from(expBase).pow(maxExponentPower)
  const maxMantissa = BigNumber.from(2).pow(mantissaBits).sub(1)

  if (integer.gt(maxMantissa.mul(maxExponent))) {
    throw new Error('Integer is too big')
  }

  // The algortihm is as follows: calculate minimal exponent
  // such that integer <= max_mantissa * exponent_base ^ exponent,
  // then mantissa is calculated as integer divided by exponent_base ^ exponent and rounded up
  let exponent = 0
  let exponentTemp = BigNumber.from(1)
  while (integer.gt(maxMantissa.mul(exponentTemp))) {
    exponentTemp = exponentTemp.mul(expBase)
    exponent += 1
  }
  let mantissa = integer.div(exponentTemp)
  if (!integer.mod(exponentTemp).eq(BigNumber.from(0))) {
    mantissa = mantissa.add(1)
  }

  // encode into bits. First bits of mantissa in LE order
  const encoding = []

  encoding.push(...numberToBits(exponent, expBits))
  const mantissaNumber = mantissa.toNumber()
  encoding.push(...numberToBits(mantissaNumber, mantissaBits))

  return bitsIntoBytesInBEOrder(encoding.reverse()).reverse()
}

export function reverseBits(buffer: Uint8Array): Uint8Array {
  const reversed = buffer.reverse()
  reversed.map((b) => {
    // reverse bits in byte
    b = ((b & 0xf0) >> 4) | ((b & 0x0f) << 4)
    b = ((b & 0xcc) >> 2) | ((b & 0x33) << 2)
    b = ((b & 0xaa) >> 1) | ((b & 0x55) << 1)
    return b
  })
  return reversed
}

function packAmount(amount: BigNumber): Uint8Array {
  return reverseBits(
    integerToFloat(
      amount,
      AMOUNT_EXPONENT_BIT_WIDTH,
      AMOUNT_MANTISSA_BIT_WIDTH,
      10
    )
  )
}

function packAmountUp(amount: BigNumber): Uint8Array {
  return reverseBits(
    integerToFloatUp(
      amount,
      AMOUNT_EXPONENT_BIT_WIDTH,
      AMOUNT_MANTISSA_BIT_WIDTH,
      10
    )
  )
}

function packFee(amount: BigNumber): Uint8Array {
  return reverseBits(
    integerToFloat(amount, FEE_EXPONENT_BIT_WIDTH, FEE_MANTISSA_BIT_WIDTH, 10)
  )
}

function packFeeUp(amount: BigNumber): Uint8Array {
  return reverseBits(
    integerToFloatUp(amount, FEE_EXPONENT_BIT_WIDTH, FEE_MANTISSA_BIT_WIDTH, 10)
  )
}

export function packAmountChecked(amount: BigNumber): Uint8Array {
  if (
    closestPackableTransactionAmount(amount.toString()).toString() !==
    amount.toString()
  ) {
    throw new Error('Transaction Amount is not packable')
  }
  return packAmount(amount)
}

export function packFeeChecked(amount: BigNumber): Uint8Array {
  if (
    closestPackableTransactionFee(amount.toString()).toString() !==
    amount.toString()
  ) {
    throw new Error('Fee Amount is not packable')
  }
  return packFee(amount)
}

/**
 * packs and unpacks the amount, returning the closest packed value.
 * e.g 1000000003 => 1000000000
 * @param amount
 */
export function closestPackableTransactionAmount(
  amount: BigNumberish
): BigNumber {
  const packedAmount = packAmount(BigNumber.from(amount))
  return floatToInteger(
    packedAmount,
    AMOUNT_EXPONENT_BIT_WIDTH,
    AMOUNT_MANTISSA_BIT_WIDTH,
    10
  )
}

export function closestGreaterOrEqPackableTransactionAmount(
  amount: BigNumberish
): BigNumber {
  const packedAmount = packAmountUp(BigNumber.from(amount))
  return floatToInteger(
    packedAmount,
    AMOUNT_EXPONENT_BIT_WIDTH,
    AMOUNT_MANTISSA_BIT_WIDTH,
    10
  )
}

export function isTransactionAmountPackable(amount: BigNumberish): boolean {
  return closestPackableTransactionAmount(amount).eq(amount)
}

/**
 * packs and unpacks the amount, returning the closest packed value.
 * e.g 1000000003 => 1000000000
 * @param fee
 */
export function closestPackableTransactionFee(fee: BigNumberish): BigNumber {
  const packedFee = packFee(BigNumber.from(fee))
  return floatToInteger(
    packedFee,
    FEE_EXPONENT_BIT_WIDTH,
    FEE_MANTISSA_BIT_WIDTH,
    10
  )
}

export function closestGreaterOrEqPackableTransactionFee(
  fee: BigNumberish
): BigNumber {
  const packedFee = packFeeUp(BigNumber.from(fee))
  return floatToInteger(
    packedFee,
    FEE_EXPONENT_BIT_WIDTH,
    FEE_MANTISSA_BIT_WIDTH,
    10
  )
}

export function isTransactionFeePackable(amount: BigNumberish): boolean {
  return closestPackableTransactionFee(amount).eq(amount)
}

export function buffer2bitsBE(buff) {
  const res = new Array(buff.length * 8)
  for (let i = 0; i < buff.length; i++) {
    const b = buff[i]
    res[i * 8] = (b & 0x80) !== 0 ? 1 : 0
    res[i * 8 + 1] = (b & 0x40) !== 0 ? 1 : 0
    res[i * 8 + 2] = (b & 0x20) !== 0 ? 1 : 0
    res[i * 8 + 3] = (b & 0x10) !== 0 ? 1 : 0
    res[i * 8 + 4] = (b & 0x08) !== 0 ? 1 : 0
    res[i * 8 + 5] = (b & 0x04) !== 0 ? 1 : 0
    res[i * 8 + 6] = (b & 0x02) !== 0 ? 1 : 0
    res[i * 8 + 7] = (b & 0x01) !== 0 ? 1 : 0
  }
  return res
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isGasToken(token: TokenAddress): boolean {
  return (
    token === constants.AddressZero ||
    '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase() ===
      token.toLowerCase()
  )
}

export function getChangePubkeyMessage(
  pubKeyHash: PubKeyHash,
  nonce: number,
  accountId: number,
  verifyingContract: string,
  layerOneChainId: number,
  domainName: string = 'ZkLink',
  version: string = '1'
): any {
  const domainType = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
  ]
  const ChangePubKey = [
    { name: 'pubKeyHash', type: 'bytes20' },
    { name: 'nonce', type: 'uint32' },
    { name: 'accountId', type: 'uint32' },
  ]
  // All properties on a domain are optional
  const domain = {
    name: domainName,
    version,
    chainId: layerOneChainId,
    verifyingContract,
  }
  // The named list of all type definitions
  const types = {
    EIP712Domain: domainType,
    ChangePubKey,
  }
  // The data to sign
  const message = {
    pubKeyHash,
    nonce,
    accountId,
  }
  const data = {
    types,
    domain,
    primaryType: 'ChangePubKey',
    message,
  }
  return data
}

export function getSignedBytesFromMessage(
  message: utils.BytesLike | string,
  addPrefix: boolean
): Uint8Array {
  let messageBytes =
    typeof message === 'string'
      ? utils.toUtf8Bytes(message)
      : utils.arrayify(message)
  if (addPrefix) {
    messageBytes = utils.concat([
      utils.toUtf8Bytes(`\x19Ethereum Signed Message:\n${messageBytes.length}`),
      messageBytes,
    ])
  }
  return messageBytes
}

export async function signMessagePersonalAPI(
  signer: ethers.Signer | any,
  message: Uint8Array
): Promise<string> {
  if (signer instanceof ethers.providers.JsonRpcSigner) {
    return signer.provider
      .send('personal_sign', [
        utils.hexlify(message),
        await signer.getAddress(),
      ])
      .then(
        (sign) => sign,
        (err) => {
          // We check for method name in the error string because error messages about invalid method name
          // often contain method name.
          if (err.message.includes('personal_sign')) {
            // If no "personal_sign", use "eth_sign"
            return signer.signMessage(message)
          }
          throw err
        }
      )
  } else {
    return signer.signMessage(message)
  }
}

export async function signMessageEIP712(
  signer: any,
  data: any
): Promise<string> {
  if (signer instanceof ethers.providers.JsonRpcSigner) {
    return signer.provider
      .send('eth_signTypedData_v4', [
        await signer.getAddress(),
        JSON.stringify(data),
      ])
      .then(
        (sign) => sign,
        (err) => {
          console.log('eth_signTypedData_v4', err)
          throw err
        }
      )
  } else {
    const { EIP712Domain, ...types } = data.types
    return signer._signTypedData(data.domain, types, data.message)
  }
}

export async function verifyERC1271Signature(
  address: string,
  message: Uint8Array,
  signature: string,
  signerOrProvider: ethers.Signer | ethers.providers.Provider
): Promise<boolean> {
  const EIP1271_SUCCESS_VALUE = '0x1626ba7e'

  const signMessage = getSignedBytesFromMessage(message, true)
  const signMessageHash = utils.keccak256(signMessage)

  const eip1271 = new ethers.Contract(
    address,
    IEIP1271_INTERFACE,
    signerOrProvider
  )
  const eipRetVal = await eip1271.isValidSignature(signMessageHash, signature)
  return eipRetVal === EIP1271_SUCCESS_VALUE
}

export async function getEthSignatureType(
  _provider: ethers.providers.Provider,
  message: string,
  signature: string,
  address: string
): Promise<EthSignerType> {
  const messageNoPrefix = getSignedBytesFromMessage(message, false)
  const messageWithPrefix = getSignedBytesFromMessage(message, true)

  const prefixedECDSASigner = utils.recoverAddress(
    utils.keccak256(messageWithPrefix),
    signature
  )
  if (prefixedECDSASigner.toLowerCase() === address.toLowerCase()) {
    return {
      verificationMethod: 'ECDSA',
      isSignedMsgPrefixed: true,
    }
  }

  const notPrefixedMsgECDSASigner = utils.recoverAddress(
    utils.keccak256(messageNoPrefix),
    signature
  )
  if (notPrefixedMsgECDSASigner.toLowerCase() === address.toLowerCase()) {
    return {
      verificationMethod: 'ECDSA',
      isSignedMsgPrefixed: false,
    }
  }

  let isSignedMsgPrefixed: boolean | null = null
  // Sometimes an error is thrown if the signature is wrong
  try {
    isSignedMsgPrefixed = await verifyERC1271Signature(
      address,
      messageWithPrefix,
      signature,
      _provider
    )
  } catch {
    isSignedMsgPrefixed = false
  }

  return {
    verificationMethod: 'ERC-1271',
    isSignedMsgPrefixed,
  }
}

function removeAddressPrefix(address: Address | PubKeyHash): string {
  if (address.startsWith('0x')) return address.substr(2)
  throw new Error("ETH address must start with '0x'")
}
export function serializePubKeyHash(address: PubKeyHash): Uint8Array {
  const prefixlessAddress = removeAddressPrefix(address)

  const addressBytes = utils.arrayify(`0x${prefixlessAddress}`)
  if (addressBytes.length !== 20) {
    throw new Error('PubKeyHash must be 20 bytes long')
  }

  return addressBytes
}
export function serializeAddress(address: Address | PubKeyHash): Uint8Array {
  const prefixlessAddress = removeAddressPrefix(address)
  const address32 = utils.zeroPad(`0x${prefixlessAddress}`, 32)
  const addressBytes = utils.arrayify(address32)
  if (addressBytes.length !== 32) {
    throw new Error('Address must be 32 bytes long')
  }

  return addressBytes
}
export function serializeAccountId(accountId: number): Uint8Array {
  if (accountId < 0) {
    throw new Error('Negative account id')
  }
  if (accountId >= MAX_NUMBER_OF_ACCOUNTS) {
    throw new Error('AccountId is too big')
  }
  return numberToBytesBE(accountId, 4)
}
export function serializeSubAccountId(subAccountId: number): Uint8Array {
  return numberToBytesBE(subAccountId, 1)
}
export function serializeTokenId(tokenId: number): Uint8Array {
  if (tokenId < 0) {
    throw new Error('Negative tokenId')
  }
  if (tokenId >= MAX_NUMBER_OF_TOKENS) {
    throw new Error('TokenId is too big')
  }
  return numberToBytesBE(tokenId, 2)
}
export function serializeAmountPacked(amount: BigNumberish): Uint8Array {
  return packAmountChecked(BigNumber.from(amount))
}
export function serializeAmountFull(amount: BigNumberish): Uint8Array {
  const bnAmount = BigNumber.from(amount)
  return utils.zeroPad(utils.arrayify(bnAmount), 16)
}
export function serializePrice(price: BigNumberish): Uint8Array {
  const bnPrice = BigNumber.from(price)
  return utils.zeroPad(utils.arrayify(bnPrice), 15)
}
export function serializeFeePacked(fee: BigNumberish): Uint8Array {
  return packFeeChecked(BigNumber.from(fee))
}
export function serializeNonce(nonce: number): Uint8Array {
  if (nonce < 0) {
    throw new Error('Negative nonce')
  }
  return numberToBytesBE(nonce, 4)
}
export function serializeChainId(chainId: number): Uint8Array {
  return numberToBytesBE(chainId, 1)
}
export function serializeFeeRatio(withdrawFeeRatio: number): Uint8Array {
  return numberToBytesBE(withdrawFeeRatio, 2)
}
export function serializeFastWithdraw(fastWithdraw: number): Uint8Array {
  return new Uint8Array([fastWithdraw])
}
export function serializeTimestamp(time: number): Uint8Array {
  if (time < 0) {
    throw new Error('Negative timestamp')
  }
  return ethers.utils.concat([new Uint8Array(4), numberToBytesBE(time, 4)])
}

export function serializeWithdraw(withdraw: WithdrawData): Uint8Array {
  const type = new Uint8Array([TxType.Withdraw])
  const toChainId = serializeChainId(withdraw.toChainId)
  const accountId = serializeAccountId(withdraw.accountId)
  const subAccountId = serializeSubAccountId(withdraw.subAccountId)
  const toBytes = serializeAddress(withdraw.to)
  const l2SourceTokenIdBytes = serializeTokenId(withdraw.l2SourceToken)
  const l1TargetTokenIdBytes = serializeTokenId(withdraw.l1TargetToken)
  const withdrawToL1Bytes = numberToBytesBE(withdraw.withdrawToL1, 1)
  const amountBytes = serializeAmountFull(withdraw.amount)
  const feeBytes = serializeFeePacked(withdraw.fee)
  const nonceBytes = serializeNonce(withdraw.nonce)
  const fastWithdrawBytes = serializeFastWithdraw(withdraw.fastWithdraw)
  const withdrawFeeRatioBytes = serializeFeeRatio(withdraw.withdrawFeeRatio)
  const tsBytes = numberToBytesBE(withdraw.ts, 4)
  return ethers.utils.concat([
    type,
    toChainId,
    accountId,
    subAccountId,
    toBytes,
    l2SourceTokenIdBytes,
    l1TargetTokenIdBytes,
    withdrawToL1Bytes,
    amountBytes,
    feeBytes,
    nonceBytes,
    fastWithdrawBytes,
    withdrawFeeRatioBytes,
    tsBytes,
  ])
}

export function serializeTransfer(transfer: TransferData): Uint8Array {
  const type = new Uint8Array([TxType.Transfer]) // tx type
  const accountId = serializeAccountId(transfer.accountId)
  const fromSubAccountId = serializeSubAccountId(transfer.fromSubAccountId)
  const to = serializeAddress(transfer.to)
  const toSubAccountId = serializeSubAccountId(transfer.toSubAccountId)
  const token = serializeTokenId(transfer.token)
  const amount = serializeAmountPacked(transfer.amount)
  const fee = serializeFeePacked(transfer.fee)
  const nonce = serializeNonce(transfer.nonce)
  const tsBytes = numberToBytesBE(transfer.ts, 4)
  return ethers.utils.concat([
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
  ])
}

export function serializeChangePubKey(
  changePubKey: ChangePubKeyData
): Uint8Array {
  const type = new Uint8Array([TxType.ChangePubKey])
  const chainIdBytes = serializeChainId(changePubKey.chainId)
  const subAccountIdBytes = serializeSubAccountId(changePubKey.subAccountId)
  const accountIdBytes = serializeAccountId(changePubKey.accountId)
  const pubKeyHashBytes = serializePubKeyHash(changePubKey.newPkHash)
  const feeTokenIdBytes = serializeTokenId(changePubKey.feeToken)
  const feeBytes = serializeFeePacked(changePubKey.fee)
  const nonceBytes = serializeNonce(changePubKey.nonce)
  const tsBytes = numberToBytesBE(changePubKey.ts, 4)
  return ethers.utils.concat([
    type,
    chainIdBytes,
    accountIdBytes,
    subAccountIdBytes,
    pubKeyHashBytes,
    feeTokenIdBytes,
    feeBytes,
    nonceBytes,
    tsBytes,
  ])
}

export function serializeForcedExit(forcedExit: ForcedExitData): Uint8Array {
  const type = new Uint8Array([TxType.ForcedExit])
  const toChainIdBytes = serializeChainId(forcedExit.toChainId)
  const initiatorAccountIdBytes = serializeAccountId(
    forcedExit.initiatorAccountId
  )
  const initiatorSubAccountIdBytes = serializeSubAccountId(
    forcedExit.initiatorSubAccountId
  )
  const targetBytes = serializeAddress(forcedExit.target)
  const targetSubAccountIdBytes = serializeSubAccountId(
    forcedExit.targetSubAccountId
  )
  const l2SourceTokenIdBytes = serializeTokenId(forcedExit.l2SourceToken)
  const l1TargetTokenIdBytes = serializeTokenId(forcedExit.l1TargetToken)
  const withdrawToL1Bytes = numberToBytesBE(forcedExit.withdrawToL1, 1)
  const initiatorNonceBytes = serializeNonce(forcedExit.initiatorNonce)
  const exitAmountBytes = serializeAmountFull(forcedExit.exitAmount)
  const tsBytes = numberToBytesBE(forcedExit.ts, 4)
  return ethers.utils.concat([
    type,
    toChainIdBytes,
    initiatorAccountIdBytes,
    initiatorSubAccountIdBytes,
    targetBytes,
    targetSubAccountIdBytes,
    l2SourceTokenIdBytes,
    l1TargetTokenIdBytes,
    withdrawToL1Bytes,
    initiatorNonceBytes,
    exitAmountBytes,
    tsBytes,
  ])
}

export function serializeOrder(order: OrderData): Uint8Array {
  const type = new Uint8Array([TxType.Order])
  const accountIdBytes = serializeAccountId(order.accountId)
  const subAccountIdBytes = serializeSubAccountId(order.subAccountId)
  const slotBytes = numberToBytesBE(order.slotId, 2)
  const nonceBytes = numberToBytesBE(order.nonce, 3)
  const baseTokenIdBytes = serializeTokenId(order.baseTokenId)
  const quoteTokenIdBytes = serializeTokenId(order.quoteTokenId)
  const priceBytes = serializePrice(order.price)
  const isSellBytes = numberToBytesBE(order.isSell, 1)
  const makerFeeRateBytes = numberToBytesBE(order.feeRates[0], 1)
  const takerFeeRateBytes = numberToBytesBE(order.feeRates[1], 1)
  const amountBytes = serializeAmountPacked(order.amount)
  return ethers.utils.concat([
    type,
    accountIdBytes,
    subAccountIdBytes,
    slotBytes,
    nonceBytes,
    baseTokenIdBytes,
    quoteTokenIdBytes,
    priceBytes,
    isSellBytes,
    makerFeeRateBytes,
    takerFeeRateBytes,
    amountBytes,
  ])
}

export async function serializeOrderMatching(
  matching: OrderMatchingData
): Promise<Uint8Array> {
  const makerBytes = serializeOrder(matching.maker)
  const takerBytes = serializeOrder(matching.taker)
  const ordersBytes = new Uint8Array(ORDER_TYPES)
  ordersBytes.fill(0)
  ordersBytes.set([...makerBytes, ...takerBytes], 0)

  const ordersHash = await rescueHashOrders(ordersBytes)

  const type = new Uint8Array([8])
  const accountIdBytes = serializeAccountId(matching.accountId)
  const subAccountIdBytes = serializeSubAccountId(matching.subAccountId)
  const feeTokenBytes = serializeTokenId(matching.feeToken)
  const feeBytes = serializeFeePacked(matching.fee)
  const expectBaseAmountBytes = serializeAmountFull(matching.expectBaseAmount)
  const expectQuoteAmountBytes = serializeAmountFull(matching.expectQuoteAmount)
  return ethers.utils.concat([
    type,
    accountIdBytes,
    subAccountIdBytes,
    ordersHash,
    feeTokenBytes,
    feeBytes,
    expectBaseAmountBytes,
    expectQuoteAmountBytes,
  ])
}

export function serializeContract(contract: ContractData): Uint8Array {
  const type = new Uint8Array([TxType.Contract])
  const accountIdBytes = serializeAccountId(contract.accountId)
  const subAccountIdBytes = serializeSubAccountId(contract.subAccountId)
  const slotBytes = numberToBytesBE(contract.slotId, 2)
  const nonceBytes = numberToBytesBE(contract.nonce, 3)
  const pairIdBytes = numberToBytesBE(contract.pairId, 1)
  const sizeBytes = serializeAmountPacked(contract.size)
  const priceBytes = serializePrice(contract.price)
  const directionBytes = numberToBytesBE(contract.direction, 1)
  const makerFeeRateBytes = numberToBytesBE(contract.feeRates[0], 1)
  const takerFeeRateBytes = numberToBytesBE(contract.feeRates[1], 1)
  return ethers.utils.concat([
    type,
    accountIdBytes,
    subAccountIdBytes,
    slotBytes,
    nonceBytes,
    pairIdBytes,
    directionBytes,
    sizeBytes,
    priceBytes,
    makerFeeRateBytes,
    takerFeeRateBytes,
  ])
}

export async function serializeContractMatching(
  matching: ContractMatchingData
): Promise<Uint8Array> {
  const makerArrayBytes = new Uint8Array(CONTRACT_TYPES * matching.maker.length)
  matching.maker.forEach((v, i) => {
    const makerBytes = serializeContract(v)
    makerArrayBytes.set(makerBytes, i * makerBytes.length)
  })
  const takerBytes = serializeContract(matching.taker)
  const ordersBytes = new Uint8Array(ORDER_TYPES)
  ordersBytes.fill(0)
  ordersBytes.set([...makerArrayBytes, ...takerBytes], 0)

  const ordersHash = await rescueHashOrders(ordersBytes)

  const type = new Uint8Array([TxType.ContractMatching])
  const accountIdBytes = serializeAccountId(matching.accountId)
  const subAccountIdBytes = serializeSubAccountId(matching.subAccountId)
  const feeTokenBytes = serializeTokenId(matching.feeToken)
  const feeBytes = serializeFeePacked(matching.fee)
  return ethers.utils.concat([
    type,
    accountIdBytes,
    subAccountIdBytes,
    ordersHash,
    feeTokenBytes,
    feeBytes,
  ])
}

/**
 * Encodes the transaction data as the byte sequence according to the zkSync protocol.
 * @param tx A transaction to serialize.
 */
export function serializeTx(
  tx: TransferData | WithdrawData | ChangePubKeyData | ForcedExitData
): Uint8Array {
  switch (tx.type) {
    case 'Transfer':
      return serializeTransfer(tx)
    case 'Withdraw':
      return serializeWithdraw(tx)
    case 'ChangePubKey':
      return serializeChangePubKey(tx)
    case 'ForcedExit':
      return serializeForcedExit(tx)
    default:
      return new Uint8Array()
  }
}

export function numberToBytesBE(number: number, bytes: number): Uint8Array {
  const result = new Uint8Array(bytes)
  for (let i = bytes - 1; i >= 0; i--) {
    result[i] = number & 0xff
    number >>= 8
  }
  return result
}

export function getCREATE2AddressAndSalt(
  syncPubkeyHash: string,
  create2Data: {
    creatorAddress: string
    saltArg: string
    codeHash: string
  }
): { salt: string; address: string } {
  const pubkeyHashHex = syncPubkeyHash

  const additionalSaltArgument = ethers.utils.arrayify(create2Data.saltArg)
  if (additionalSaltArgument.length !== 32) {
    throw new Error('create2Data.saltArg should be exactly 32 bytes long')
  }

  // CREATE2 salt
  const salt = ethers.utils.keccak256(
    ethers.utils.concat([additionalSaltArgument, pubkeyHashHex])
  )

  // Address according to CREATE2 specification
  const address =
    '0x' +
    ethers.utils
      .keccak256(
        ethers.utils.concat([
          ethers.utils.arrayify(0xff),
          ethers.utils.arrayify(create2Data.creatorAddress),
          salt,
          ethers.utils.arrayify(create2Data.codeHash),
        ])
      )
      .slice(2 + 12 * 2)

  return { address: address, salt: ethers.utils.hexlify(salt) }
}

export async function getEthereumBalance(
  ethProvider: ethers.providers.Provider,
  address: Address,
  tokenAddress: TokenAddress
): Promise<BigNumber> {
  let balance: BigNumber
  if (isGasToken(tokenAddress)) {
    balance = await ethProvider.getBalance(address)
  } else {
    const erc20contract = new Contract(
      tokenAddress,
      IERC20_INTERFACE,
      ethProvider
    )

    balance = await erc20contract.balanceOf(address)
  }
  return balance
}

export function getTxHash(
  tx: TransferData | WithdrawData | ChangePubKeyData | ForcedExitData
): string {
  let txBytes = serializeTx(tx)
  return ethers.utils.sha256(txBytes)
}

export function getTimestamp(): number {
  let ts = new Date().getTime()
  return parseInt(String(ts / 1000))
}

export function getL2TxHashFromEthHash(ethHash: string, serialId: number) {
  if (!ethHash || !Number.isInteger(Number(serialId))) return ''

  const bytes = ethers.utils.concat([
    numberToBytesBE(Number(serialId), 8),
    arrayify(ethHash),
  ])
  return ethers.utils.sha256(bytes)
}
