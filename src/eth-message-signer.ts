import * as ethers from 'ethers'
import {
  TxEthSignature,
  EthSignerType,
  PubKeyHash,
  Address,
  OrderData,
  EthProviderType,
} from './types'
import { getSignedBytesFromMessage, signMessagePersonalAPI, getChangePubkeyMessage } from './utils'

/**
 * Wrapper around `ethers.Signer` which provides convenient methods to get and sign messages required for zkSync.
 */
export class EthMessageSigner {
  constructor(
    private ethSigner: ethers.Signer,
    private ethSignerType?: EthSignerType,
    private ethProviderType?: EthProviderType
  ) {}

  async getEthMessageSignature(message: ethers.utils.BytesLike): Promise<TxEthSignature> {
    if (this.ethSignerType == null) {
      throw new Error('ethSignerType is unknown')
    }

    const signedBytes = getSignedBytesFromMessage(message, !this.ethSignerType.isSignedMsgPrefixed)
    const signature = await signMessagePersonalAPI(
      this.ethSigner,
      signedBytes,
      this.ethProviderType
    )

    return {
      type:
        this.ethSignerType.verificationMethod === 'ECDSA'
          ? 'EthereumSignature'
          : 'EIP1271Signature',
      signature,
    }
  }

  getTransferEthSignMessage(transfer: {
    stringAmount: string
    stringToken: string
    stringFee: string
    to: string
    nonce: number
    accountId: number
  }): string {
    let humanReadableTxInfo = this.getTransferEthMessagePart(transfer, 'transfer')
    if (humanReadableTxInfo.length != 0) {
      humanReadableTxInfo += '\n'
    }
    humanReadableTxInfo += `Nonce: ${transfer.nonce}`

    return humanReadableTxInfo
  }

  async ethSignTransfer(transfer: {
    stringAmount: string
    stringToken: string
    stringFee: string
    to: string
    nonce: number
    accountId: number
  }): Promise<TxEthSignature> {
    const message = this.getTransferEthSignMessage(transfer)
    return await this.getEthMessageSignature(message)
  }

  getOrderMatchingEthSignMessage(matching: {
    stringFeeToken: string
    stringFee: string
    nonce: number
  }): string {
    let humanReadableTxInfo = this.getOrderMatchingEthMessagePart(matching)
    if (humanReadableTxInfo.length != 0) {
      humanReadableTxInfo += '\n'
    }
    humanReadableTxInfo += `Nonce: ${matching.nonce}`

    return humanReadableTxInfo
  }

  async ethSignOrderMatching(matching: {
    stringFeeToken: string
    stringFee: string
    nonce: number
  }): Promise<TxEthSignature> {
    const message = this.getOrderMatchingEthSignMessage(matching)
    return await this.getEthMessageSignature(message)
  }

  getOrderMatchingEthMessagePart(tx: { stringFeeToken: string; stringFee: string }): string {
    let message = `OrderMatching fee: ${tx.stringFee} ${tx.stringFeeToken}`
    return message
  }

  async ethSignOrder(
    payload: OrderData & {
      address: string
      stringPrice: string
      stringAmount: string
      baseTokenSymbol: string
      quoteTokenSymbol: string
    }
  ): Promise<TxEthSignature> {
    const message = this.getOrderEthSignMessage(payload)
    return await this.getEthMessageSignature(message)
  }

  getOrderEthSignMessage(
    payload: OrderData & {
      address: string
      stringPrice: string
      stringAmount: string
      baseTokenSymbol: string
      quoteTokenSymbol: string
    }
  ): string {
    let humanReadableTxInfo = this.getOrderEthMessagePart(payload)
    if (humanReadableTxInfo.length != 0) {
      humanReadableTxInfo += '\n'
    }
    humanReadableTxInfo += `Nonce: ${payload.nonce}`

    return humanReadableTxInfo
  }
  getOrderEthMessagePart(
    tx: OrderData & {
      address: string
      stringPrice: string
      stringAmount: string
      baseTokenSymbol: string
      quoteTokenSymbol: string
    }
  ): string {
    let message = ''
    if (tx.isSell) {
      message += `Order for ${tx.stringAmount} ${tx.baseTokenSymbol} -> ${tx.quoteTokenSymbol}`
    } else {
      message += `Order for ${tx.stringAmount} ${tx.quoteTokenSymbol} -> ${tx.baseTokenSymbol}`
    }
    message += '\n'
    message += `Price: ${tx.stringPrice} ${tx.quoteTokenSymbol}`
    message += '\n'
    message += `Address: ${tx.address}`
    message += '\n'
    return message
  }

  getCreatePoolEthMessagePart(tx: { token0: string; token1: string }): string {
    let message = ''
    message += `Token: ${tx.token0} - ${tx.token1}`
    return message
  }

  getCreatePoolEthSignMessage(transfer: {
    token0: string
    token1: string
    nonce: number
    accountId: number
  }): string {
    let humanReadableTxInfo = this.getCreatePoolEthMessagePart(transfer)
    if (humanReadableTxInfo.length != 0) {
      humanReadableTxInfo += '\n'
    }
    humanReadableTxInfo += `Nonce: ${transfer.nonce}`

    return humanReadableTxInfo
  }

  async ethSignCreatePool(transfer: {
    token0: string
    token1: string
    nonce: number
    accountId: number
  }): Promise<TxEthSignature> {
    const message = this.getCreatePoolEthSignMessage(transfer)
    return await this.getEthMessageSignature(message)
  }

  async ethSignForcedExit(forcedExit: {
    stringToken: string
    stringFeeToken: string
    stringFee: string
    target: string
    nonce: number
  }): Promise<TxEthSignature> {
    const message = this.getForcedExitEthSignMessage(forcedExit)
    return await this.getEthMessageSignature(message)
  }

  getWithdrawEthSignMessage(withdraw: {
    stringAmount: string
    stringToken: string
    stringFee: string
    to: string
    nonce: number
    accountId: number
  }): string {
    let humanReadableTxInfo = this.getWithdrawEthMessagePart(withdraw)
    if (humanReadableTxInfo.length != 0) {
      humanReadableTxInfo += '\n'
    }
    humanReadableTxInfo += `Nonce: ${withdraw.nonce}`

    return humanReadableTxInfo
  }

  getForcedExitEthSignMessage(forcedExit: {
    stringToken: string
    stringFeeToken: string
    stringFee: string
    target: string
    nonce: number
  }): string {
    let humanReadableTxInfo = this.getForcedExitEthMessagePart(forcedExit)
    humanReadableTxInfo += `\nNonce: ${forcedExit.nonce}`
    return humanReadableTxInfo
  }

  getTransferEthMessagePart(
    tx: {
      stringAmount: string
      stringToken: string
      stringFee: string
      to?: string
    },
    type: 'transfer' | 'withdraw'
  ): string {
    let txType: string
    if (type == 'withdraw') {
      txType = 'Withdraw'
    } else if (type == 'transfer') {
      txType = 'Transfer'
    } else {
      throw new Error('Ether to or ethAddress field must be present')
    }

    let message = ''
    if (tx.stringAmount != null) {
      message += `${txType} ${tx.stringAmount} ${tx.stringToken} to: ${tx.to.toLowerCase()}`
    }
    if (tx.stringFee != null) {
      if (message.length != 0) {
        message += '\n'
      }
      message += `Fee: ${tx.stringFee} ${tx.stringToken}`
    }
    return message
  }

  getWithdrawEthMessagePart(tx: {
    stringAmount: string
    stringToken: string
    stringFee: string
    to?: string
  }): string {
    return this.getTransferEthMessagePart(tx, 'withdraw')
  }

  getChangePubKeyEthMessagePart(changePubKey: {
    pubKeyHash: PubKeyHash
    stringToken: string
    stringFee: string
  }): string {
    let message = ''
    message += `Set signing key: ${changePubKey.pubKeyHash.replace('sync:', '').toLowerCase()}`
    if (changePubKey.stringFee != null) {
      message += `\nFee: ${changePubKey.stringFee} ${changePubKey.stringToken}`
    }
    return message
  }

  getForcedExitEthMessagePart(forcedExit: {
    stringToken: string
    stringFeeToken: string
    stringFee: string
    target: string
  }): string {
    let message = `ForcedExit ${forcedExit.stringToken} to: ${forcedExit.target.toLowerCase()}`
    if (forcedExit.stringFee != null) {
      message += `\nFee: ${forcedExit.stringFee} ${forcedExit.stringFeeToken}`
    }
    return message
  }

  async ethSignWithdraw(withdraw: {
    stringAmount: string
    stringToken: string
    stringFee: string
    to: string
    nonce: number
    accountId: number
  }): Promise<TxEthSignature> {
    const message = this.getWithdrawEthSignMessage(withdraw)
    return await this.getEthMessageSignature(message)
  }

  // getChangePubKeyEthSignMessage(changePubKey: {
  //   pubKeyHash: PubKeyHash
  //   nonce: number
  //   accountId: number
  // }): Uint8Array {
  //   return getChangePubkeyMessage(
  //     changePubKey.pubKeyHash,
  //     changePubKey.nonce,
  //     changePubKey.accountId
  //   )
  // }

  // async ethSignChangePubKey(changePubKey: {
  //   pubKeyHash: PubKeyHash
  //   nonce: number
  //   accountId: number
  // }): Promise<TxEthSignature> {
  //   const message = this.getChangePubKeyEthSignMessage(changePubKey)
  //   return await this.getEthMessageSignature(message)
  // }
}
