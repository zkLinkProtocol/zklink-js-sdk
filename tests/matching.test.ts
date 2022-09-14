import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { parseEther, sha256 } from 'ethers/lib/utils'
import { describe } from 'mocha'
import {
  closestPackableTransactionAmount,
  serializeOrder,
  serializeOrderMatching,
} from '../src/utils'
import { getWallet } from './wallet.test'

const defaultValidFrom = 0
const defaultValidUntil = 9007199254740991

describe('matching', () => {
  it('bytes and signature', async function () {
    const wallet = await getWallet()

    const data = {
      fee: '0',
      type: 'OrderMatching',
      maker: {
        nonce: 1,
        price: '1500000000000000000',
        amount: '100000000000000000000',
        isSell: 0,
        slotId: 1,
        feeRatio1: 5,
        feeRatio2: 10,
        accountId: 6,
        signature: {
          pubKey: '191f5a474b7b8af67e4338c169b16093a8662bd9fd825b88ec97f987e6453e1c',
          signature:
            'df557d94e1c6cbafb09afa1582fcbb41c89dd1a93b56aa71af840c34c5d1ee9cf8f9d790202b51defbbd954307b0f98b5f14d944dedfe14bd86eee1ef73f0500',
        },
        validFrom: 0,
        validUntil: 9007199254740991,
        baseTokenId: 6,
        quoteTokenId: 7,
        subAccountId: 1,
      },
      nonce: 0,
      taker: {
        nonce: 0,
        price: '1500000000000000000',
        amount: '1000000000000000000',
        isSell: 1,
        slotId: 3,
        feeRatio1: 5,
        feeRatio2: 10,
        accountId: 6,
        signature: {
          pubKey: '191f5a474b7b8af67e4338c169b16093a8662bd9fd825b88ec97f987e6453e1c',
          signature:
            '95f42b81cd32c1b1ede071db54ac9a436cebac8587712af6a00facd83308380f499528b92acf10e680ba2d5da5dabde243e2727ed6d22a1ca1a3685d12906803',
        },
        validFrom: 0,
        validUntil: 9007199254740991,
        baseTokenId: 6,
        quoteTokenId: 7,
        subAccountId: 1,
      },
      account: '0x3498F456645270eE003441df82C718b56c0e6666',
      feeToken: 7,
      accountId: 6,
      signature: {
        pubKey: '0dd4f603531bd78bbecd005d9e7cc62a794dcfadceffe03e269fbb6b72e9c724',
        signature:
          '46ab809c4a5beacfd423bb05332e818fb65d4d570939852206565c9a22adad8a3c3b4e69832c93f5b54b317bebcb44292bce5142f4bfa39f1b51a1cadcacae03',
      },
      expectBaseAmount: '1000000000000000000',
      expectQuoteAmount: '1500000000000000000',
    }

    const serializedMaker = await serializeOrder(data.maker as any)
    expect(Array.from(serializedMaker)).to.eql(
      [
        255, 0, 0, 0, 6, 1, 1, 0, 0, 0, 1, 0, 6, 0, 7, 0, 0, 0, 0, 0, 0, 0, 20, 209, 18, 13, 123,
        22, 0, 0, 0, 5, 10, 74, 129, 124, 128, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 255, 255, 255,
        255, 255, 255,
      ],
      'serialized maker is incorrect'
    )
    const serializedTaker = await serializeOrder(data.taker as any)
    expect(Array.from(serializedTaker)).to.eql(
      [
        255, 0, 0, 0, 6, 1, 3, 0, 0, 0, 0, 0, 6, 0, 7, 0, 0, 0, 0, 0, 0, 0, 20, 209, 18, 13, 123,
        22, 0, 0, 1, 5, 10, 74, 129, 124, 128, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 255, 255, 255, 255,
        255, 255,
      ],
      'serialized taker is incorrect'
    )
    const maker = await wallet.signSyncOrder(data.maker as any)
    const taker = await wallet.signSyncOrder(data.taker as any)
    expect(maker.tx.signature).to.eql(data.maker.signature, 'maker signature is incorrect')
    expect(taker.tx.signature).to.eql(data.taker.signature, 'taker signature is incorrect')

    const serialized = await serializeOrderMatching(data as any)
    expect(Array.from(serialized)).to.eql(
      [
        11, 0, 0, 0, 6, 52, 152, 244, 86, 100, 82, 112, 238, 0, 52, 65, 223, 130, 199, 24, 181, 108,
        14, 102, 102, 76, 85, 188, 226, 194, 164, 116, 92, 118, 12, 23, 201, 231, 44, 240, 176, 255,
        224, 160, 185, 218, 203, 223, 73, 86, 220, 82, 92, 4, 128, 147, 0, 7, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 13, 224, 182, 179, 167, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 209, 18, 13, 123,
        22, 0, 0,
      ],
      'serialized order matching is incorrect'
    )
    expect(sha256(serialized)).to.eq(
      '0x7481574dbbe3de82866c43dfac8889fc07796c7136309f91fa4ede5df34d8170',
      'sha256 hash is incorrect'
    )

    const signedTransaction = await wallet.signSyncOrderMatching(data as any)
    const { tx } = signedTransaction as any
    // wrong l2 signature: 46ab809c4a5beacfd423bb05332e818fb65d4d570939852206565c9a22adad8a3c3b4e69832c93f5b54b317bebcb44292bce5142f4bfa39f1b51a1cadcacae03
    expect(tx.signature.signature).to.eq(
      'ff270b36263d1209e2f5a3b3ac1947ccac83342adc3dc21cc9c8438081e969062b58dbc5572a80ea6716a1fc38b7e5be9f7260b3709b9ae14e7de995b4f92404',
      'order matching signature is incorrect'
    )
  })
})
