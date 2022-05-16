import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { parseEther, sha256 } from 'ethers/lib/utils'
import { describe } from 'mocha'
import {
  closestPackableTransactionAmount,
  serializeOrder,
  serializeOrderMatching,
} from '../src/utils'
import { getTestWallet, getWalletFromPrivateKey } from './wallet.test'

const defaultValidFrom = 0
const defaultValidUntil = 9007199254740991

describe('matching', () => {
  it('bytes and signature', async function () {
    const wallet = await getWalletFromPrivateKey()

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
          pubKey: '0dd4f603531bd78bbecd005d9e7cc62a794dcfadceffe03e269fbb6b72e9c724',
          signature:
            '4eb9eda2a7f3314dc8260d379c6d3f46429e554b9eeddd36ad9529d502bac5a4eedaf70eb1f76c0afd989cf4a4fb0da80ab9e07de932712e9dba27348861ae00',
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
          pubKey: '0dd4f603531bd78bbecd005d9e7cc62a794dcfadceffe03e269fbb6b72e9c724',
          signature:
            'e76678aa2ab366f57bd5d1cceea0d7326b5b24a539494544c8dde75b2969882f976f8c2ea15c613d8b117e54bbc52375c2ffc547bb8999931f84c6ee7f572904',
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
      '6dbb217bb70055b4530608b331723d0ce00774962c8dd3a837ca634b33d405828ab38de23ccce1633834d8513b2e2f412f83df7e781f6b5456c5a5072dc6e503',
      'order matching signature is incorrect'
    )
  })
})
