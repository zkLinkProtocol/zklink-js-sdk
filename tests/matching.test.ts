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
          pubKey: '167850be112e16a992d27c6119e05ec8aee2b45446b79b1c969a48352d626aa5',
          signature:
            '885fe56579721af575b77fb66abc49a7e0cee00fc1409fcd856ede10d1a2e894076a26859eafb96353c524fcaa7f4e3f924388dc286c28b26d97f0cf4177f800',
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
          pubKey: '167850be112e16a992d27c6119e05ec8aee2b45446b79b1c969a48352d626aa5',
          signature:
            '49884e838d4972772516eaafdc264491c56c23688e936852fcff7fd6f20598175a1a604432794db0a33bcf03f59ad3280e6a7ae113646cfb820c1edec6b95201',
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
      'dd9cd5f62605c5b19e5003ae6ddae8e49510386dbfecb42f13aed1eba06764a72c99122f7ee0c66b3b9864dc3939e2e203c8ba549a520f61c81abeb370d0b901',
      'order matching signature is incorrect'
    )
  })
})
