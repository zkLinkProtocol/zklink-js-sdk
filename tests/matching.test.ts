import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { parseEther, sha256 } from 'ethers/lib/utils'
import { describe } from 'mocha'
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
      'ff00000006010100000001002000010000000000000014d1120d7b16000000050a4a817c800a',
      'Unexpected maker serialize bytes'
    )
    const serializedTaker = serializeOrder(takerData as any)
    expect(Buffer.from(serializedTaker).toString('hex')).to.eq(
      'ff00000006010300000000002000010000000000000014d1120d7b16000001050a4a817c8008',
      'Unexpected taker serialize bytes'
    )
    const maker = await wallet.signOrder(makerData)
    expect(maker.tx.signature?.pubKey).to.eq(
      '191f5a474b7b8af67e4338c169b16093a8662bd9fd825b88ec97f987e6453e1c',
      'Unexpected maker pubKey'
    )
    expect(maker.tx.signature?.signature).to.eq(
      '3e82ff5f01b74614b55c2f39a99bb393fc00afca71d68f29b72bbe01053f10a716384ea8e95f6d67cc72819ecb5af4eb5caca7cc0602a5ef32b46f40a7690601',
      'Unexpected maker signature'
    )

    const taker = await wallet.signOrder(takerData)
    expect(taker.tx.signature?.pubKey).to.eq(
      '191f5a474b7b8af67e4338c169b16093a8662bd9fd825b88ec97f987e6453e1c',
      'Unexpected taker pubKey'
    )
    expect(taker.tx.signature?.signature).to.eq(
      '520b7982580eaeaba6ecc8c6448deb4ddfa1a2f96bf5c513b152b7775922d3a4c48d54458a8d1ca52a55e7ecf32a88f2b55a6565e7583d42551898f9abf68f01',
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
      '0b0000000601f99c088c238aa3ee951c48ce736a411289336a4e3226b525bf0d511655249d0001000000000000000000000de0b6b3a7640000000000000000000014d1120d7b160000',
      'Unexpected matching serialize bytes'
    )

    const signed = await wallet.signOrderMatching(matching)

    expect(sha256(serialized)).to.eq(
      '0x3e17f81185e5ddc85c2b6cef724adcbb6d0325844f56f019a16a6671b79805f7',
      'Unexpected matching tx hash'
    )
    expect(signed.tx.signature?.pubKey).to.eq(
      '191f5a474b7b8af67e4338c169b16093a8662bd9fd825b88ec97f987e6453e1c',
      'Unexpected matching tx pubKey'
    )
    expect(signed.tx.signature?.signature).to.eq(
      'bb34cdfe08796230a2c44a24cbea525cd191bea4e42652ec38f9c6b49d790022147bcb006b1ae55e6dd27c874331f26686251746b6b42aa246e98975d2f73305',
      'Unexpected matching tx signature'
    )
  })
})
