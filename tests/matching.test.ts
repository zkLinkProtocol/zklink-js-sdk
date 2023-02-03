import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { parseEther, sha256 } from 'ethers/lib/utils'
import { OrderData, OrderMatchingData } from '../src/types'
import {
  closestPackableTransactionAmount,
  serializeOrder,
  serializeOrderMatching,
} from '../src/utils'
import { getWallet } from './wallet.test'

describe('matching', () => {
  it('bytes and signature', async function () {
    const wallet = await getWallet()

    const makerData: OrderData = {
      type: 'Order',
      nonce: 1,
      price: '1500000000000000000',
      amount: '100000000000000000000',
      isSell: 0,
      slotId: 1,
      feeRatio1: 5,
      feeRatio2: 10,
      accountId: 6,
      baseTokenId: 32,
      quoteTokenId: 1,
      subAccountId: 1,
    }
    const takerData: OrderData = {
      type: 'Order',
      nonce: 0,
      price: '1500000000000000000',
      amount: '1000000000000000000',
      isSell: 1,
      slotId: 3,
      feeRatio1: 5,
      feeRatio2: 10,
      accountId: 6,
      baseTokenId: 32,
      quoteTokenId: 1,
      subAccountId: 1,
    }

    const serializedMaker = serializeOrder(makerData)
    expect(Buffer.from(serializedMaker).toString('hex')).to.eq(
      'ff0000000601000100000001002000010000000000000014d1120d7b16000000050a4a817c800a',
      'Unexpected maker serialize bytes'
    )
    const serializedTaker = serializeOrder(takerData as any)
    expect(Buffer.from(serializedTaker).toString('hex')).to.eq(
      'ff0000000601000300000000002000010000000000000014d1120d7b16000001050a4a817c8008',
      'Unexpected taker serialize bytes'
    )
    const maker = await wallet.signOrder(makerData)
    expect(maker.tx.signature?.pubKey).to.eq(
      '191f5a474b7b8af67e4338c169b16093a8662bd9fd825b88ec97f987e6453e1c',
      'Unexpected maker pubKey'
    )
    expect(maker.tx.signature?.signature).to.eq(
      '1e9238584fe03239173684232f5640ba8acfc575190e5ea6bc9754a2a40f4c2810ab914e54bc2fd96324000974e611f36dfca30fca3cfab3b5abbb2548c2e305',
      'Unexpected maker signature'
    )

    const taker = await wallet.signOrder(takerData)
    expect(taker.tx.signature?.pubKey).to.eq(
      '191f5a474b7b8af67e4338c169b16093a8662bd9fd825b88ec97f987e6453e1c',
      'Unexpected taker pubKey'
    )
    expect(taker.tx.signature?.signature).to.eq(
      '58ef0c5c04655d52fb6fd21514fe4e1d3e9d0ad3e74266b40b2952cae838a79cb03521fd536bdce35234383babdfb2dadc680339589f387b60bdc5fa29f10005',
      'Unexpected taker signature'
    )

    const matching: OrderMatchingData = {
      fee: '0',
      type: 'OrderMatching',
      subAccountId: 1,
      maker: maker.tx as OrderData,
      nonce: 0,
      taker: taker.tx as OrderData,
      account: '0x3498F456645270eE003441df82C718b56c0e6666',
      feeToken: 1,
      accountId: 6,
      expectBaseAmount: '1000000000000000000',
      expectQuoteAmount: '1500000000000000000',
    }
    const serialized = await serializeOrderMatching(matching)

    expect(Buffer.from(serialized).toString('hex')).to.eq(
      '0800000006010368a89b68dbc6576c8b5365f5f2235a40647763d1450dbb72a8c6208007c30001000000000000000000000de0b6b3a7640000000000000000000014d1120d7b160000',
      'Unexpected matching serialize bytes'
    )

    const signed = await wallet.signOrderMatching(matching)

    expect(sha256(serialized)).to.eq(
      '0x5fd4bc72945c052368e819e672c544da1eeeea6e803f13279a9d7a0d7eaaf022',
      'Unexpected matching tx hash'
    )
    expect(signed.tx.signature?.pubKey).to.eq(
      '191f5a474b7b8af67e4338c169b16093a8662bd9fd825b88ec97f987e6453e1c',
      'Unexpected matching tx pubKey'
    )
    expect(signed.tx.signature?.signature).to.eq(
      '0ca75e46de656945cb9d585dccdf34ed7b5b69a5fff922f1e80e80142615bd085c33a68854f10dc8125b97b98a07efbd5f63b7944c83bcc66033dd5b0f340506',
      'Unexpected matching tx signature'
    )
  })
})
