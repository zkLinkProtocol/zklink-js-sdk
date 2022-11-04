import { BigNumber, BigNumberish } from 'ethers'

// 0x-prefixed, hex encoded, ethereum account address
export type Address = string
// sync:-prefixed, hex encoded, hash of the account public key
export type PubKeyHash = string

// Symbol like "ETH" or "FAU" or token contract address(zero address is implied for "ETH").
export type TokenLike = TokenSymbol
// Token symbol (e.g. "ETH", "FAU", etc.)
export type TokenSymbol = string
// Token address (e.g. 0xde..ad for ERC20, or 0x00.00 for "ETH")
export type TokenAddress = string
export type TokenId = number
export type ChainId = number
export type Ether = string
export type Wei = string

export type TotalFee = Map<TokenLike, BigNumber>

export type Nonce = number | 'committed'

export type Network =
  | 'localhost'
  | 'rinkeby'
  | 'ropsten'
  | 'mainnet'
  | 'rinkeby-beta'
  | 'ropsten-beta'

export interface PairInfo {
  amplifier: number
  chains: ChainId[]
  d: string
  kind: number
  lp_token: TokenId
  reserves: string[]
  token_in_pool: number
  tokens: number[]
  total_supply: string // wei
}

export interface Create2Data {
  creatorAddress: string
  saltArg: string
  codeHash: string
}

export interface AccountState {
  id?: number
  address: Address
  nonce: number
  pubKeyHash: PubKeyHash
}

export interface AccountBalances {
  [subAccountId: number]: {
    // Token are indexed by their id (e.g. "1")
    [tokenId: number]: Wei
  }
}

export type EthSignerType = {
  verificationMethod: 'ECDSA' | 'ERC-1271'
  // Indicates if signer adds `\x19Ethereum Signed Message\n${msg.length}` prefix before signing message.
  // i.e. if false, we should add this prefix manually before asking to sign message
  isSignedMsgPrefixed: boolean
}

export interface TxEthSignature {
  type: 'EthereumSignature' | 'EIP1271Signature'
  signature: string
}

export interface Signature {
  pubKey: string
  signature: string
}

export interface TransferEntries {
  fromSubAccountId: number
  toSubAccountId: number
  to: Address
  token: TokenId
  amount: BigNumberish
  accountId?: number
  fee?: BigNumberish
  nonce?: Nonce
  ts?: number
}

export interface TransferData {
  type: 'Transfer'
  accountId: number
  fromSubAccountId: number
  toSubAccountId: number
  from: Address
  to: Address
  token: TokenId
  amount: BigNumberish
  fee: BigNumberish
  ts: number
  nonce: number
  signature?: Signature
}

export interface WithdrawEntries {
  toChainId: ChainId
  subAccountId: number
  to: string
  l2SourceToken: TokenId
  l1TargetToken: TokenId
  amount: BigNumberish
  withdrawFeeRatio: number
  fastWithdraw: number
  accountId?: number
  from?: string
  fee?: BigNumberish
  nonce?: Nonce
  ts?: number
}
export interface WithdrawData {
  type: 'Withdraw'
  toChainId: number
  subAccountId: number
  accountId: number
  from: Address
  to: Address
  l2SourceToken: number
  l1TargetToken: number
  amount: BigNumberish
  fee: BigNumberish
  withdrawFeeRatio: number
  fastWithdraw: number
  ts: number
  nonce: number
  signature?: Signature
}

export interface ForcedExitEntries {
  target: Address
  targetSubAccountId: number
  initiatorSubAccountId: number
  toChainId: ChainId
  l2SourceToken: TokenId
  l1TargetToken: TokenId
  feeToken: TokenId
  initiatorAccountId?: number
  fee?: BigNumberish
  nonce?: Nonce
  ts?: number
}
export interface ForcedExitData {
  type: 'ForcedExit'
  toChainId: ChainId
  initiatorAccountId: number
  initiatorSubAccountId: number
  target: Address
  targetSubAccountId: number
  l2SourceToken: number
  l1TargetToken: number
  feeToken: number
  fee: BigNumberish
  ts: number
  nonce: number
  signature?: Signature
}

export type ChangePubkeyTypes = 'Onchain' | 'EthECDSA' | 'EthCREATE2' | 'ECDSALegacyMessage'

export interface ChangePubKeyOnchain {
  type: 'Onchain'
}

export interface ChangePubKeyECDSA {
  type: 'EthECDSA'
  ethSignature: string
  batchHash?: string
}

export interface ChangePubKeyCREATE2 {
  type: 'EthCREATE2'
  creatorAddress: string
  saltArg: string
  codeHash: string
}

export interface ChangePubKeyData {
  type: 'ChangePubKey'
  chainId: number
  subAccountId: number
  accountId: number
  account: Address
  newPkHash: PubKeyHash
  feeToken: number
  fee: BigNumberish
  ts: number
  nonce: number
  signature?: Signature
  ethAuthData?: ChangePubKeyOnchain | ChangePubKeyECDSA | ChangePubKeyCREATE2
  ethSignature?: string
}

export interface CloseAccount {
  type: 'Close'
  account: Address
  nonce: number
  signature: Signature
}

export interface SignedTransaction {
  tx:
    | TransferData
    | WithdrawData
    | ChangePubKeyData
    | CloseAccount
    | ForcedExitData
    | OrderData
    | OrderMatchingData
  ethereumSignature?: TxEthSignature
}

export interface BlockInfo {
  blockNumber: number
  committed: boolean
  verified: boolean
}

export interface TransactionReceipt {
  executed: boolean
  success?: boolean
  failReason?: string
  block?: BlockInfo
}

export interface PriorityOperationReceipt {
  executed: boolean
  block?: BlockInfo
}

export interface ContractInfo {
  chainId: number
  layerOneChainId: number
  mainContract: string
}

export interface Token {
  id: TokenId
  symbol: TokenSymbol
  decimals: number
  chains: {
    [x: ChainId]: {
      chainId: ChainId
      address: Address
      decimals: number
      fastWithdraw: boolean
    }
  }
}
export interface Tokens {
  // Tokens are indexed by their symbol (e.g. "ETH")
  [token: TokenId]: Token
}

// we have to ignore this because of a bug in prettier causes this exact block
// to have double semicolons inside
// prettier-ignore
export interface ChangePubKeyFee {
    // Note: Ignore, since it just looks more intuitive if `"ChangePubKey"` is kept as a string literal)
    // prettier-ignore
    // Denotes how authorization of operation is performed:
    // 'Onchain' if it's done by sending an Ethereum transaction,
    // 'ECDSA' if it's done by providing an Ethereum signature in zkSync transaction.
    // 'CREATE2' if it's done by providing arguments to restore account ethereum address according to CREATE2 specification.
    "ChangePubKey": ChangePubkeyTypes;
}

export interface LegacyChangePubKeyFee {
  ChangePubKey: {
    onchainPubkeyAuth: boolean
  }
}

export interface Fee {
  // Operation type (amount of chunks in operation differs and impacts the total fee).
  feeType: 'Withdraw' | 'Transfer' | 'TransferToNew' | 'FastWithdraw' | ChangePubKeyFee
  // Amount of gas used by transaction
  gasTxAmounts: BigNumber[]
  // Gas price (in wei)
  gasPriceWei: BigNumber
  // Ethereum gas part of fee (in wei)
  gasFee: BigNumber
  // Zero-knowledge proof part of fee (in wei)
  zkpFee: BigNumber
  // Total fee amount (in wei)
  totalFee: BigNumber
}

export interface BatchFee {
  // Total fee amount (in wei)
  totalFee: BigNumber
}

export interface OrderData {
  type: 'Order'
  accountId: number
  subAccountId: number
  slotId: number
  nonce: number
  baseTokenId: TokenId
  quoteTokenId: TokenId
  amount: BigNumberish
  price: BigNumberish
  isSell: number
  feeRatio1: number // be used for make
  feeRatio2: number // be used for taker
  signature?: Signature
}

export interface OrderMatchingData {
  type: 'OrderMatching'
  accountId: number
  subAccountId: number
  account: Address
  taker: OrderData
  maker: OrderData
  expectBaseAmount: BigNumberish
  expectQuoteAmount: BigNumberish
  fee: BigNumberish
  feeToken: number
  nonce: number
  signature?: Signature
}
