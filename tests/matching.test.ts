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

describe('Order', () => {
  // it('sign sync order matching 1', async function () {
  //   const wallet = await getWalletFromPrivateKey()

  //   const data = {
  //     fee: '0',
  //     type: 'OrderMatching',
  //     maker: {
  //       nonce: 1,
  //       price: '1500000000000000000',
  //       amount: '100000000000000000000',
  //       isSell: 0,
  //       slotId: 1,
  //       feeRatio: 10,
  //       accountId: 6,
  //       signature: {
  //         pubKey: '0dd4f603531bd78bbecd005d9e7cc62a794dcfadceffe03e269fbb6b72e9c724',
  //         signature:
  //           '36525971db902fb7f8af094b24a835c9868b07599514670a93328da09357eb2e4dd3af60c89d401a682a9ec917ae8c4030a75e3dfc6f04aa9cecd17d13bb9101',
  //       },
  //       validFrom: 0,
  //       validUntil: 9007199254740991,
  //       baseTokenId: 6,
  //       quoteTokenId: 7,
  //       subAccountId: 1,
  //     },
  //     nonce: 0,
  //     taker: {
  //       nonce: 0,
  //       price: '1500000000000000000',
  //       amount: '1000000000000000000',
  //       isSell: 1,
  //       slotId: 3,
  //       feeRatio: 10,
  //       accountId: 6,
  //       signature: {
  //         pubKey: '0dd4f603531bd78bbecd005d9e7cc62a794dcfadceffe03e269fbb6b72e9c724',
  //         signature:
  //           '44ebf850ea8a3324f8ddc42e0ba9925678cf79e9909d3b9281724dc7b3076028d40aef64bfe6fc78b2d427f4b3ea8867de1f7774d40bccdcb4cce946472d0c03',
  //       },
  //       validFrom: 0,
  //       validUntil: 9007199254740991,
  //       baseTokenId: 6,
  //       quoteTokenId: 7,
  //       subAccountId: 1,
  //     },
  //     account: '0x3498F456645270eE003441df82C718b56c0e6666',
  //     feeToken: 7,
  //     accountId: 6,
  //     signature: {
  //       pubKey: '0dd4f603531bd78bbecd005d9e7cc62a794dcfadceffe03e269fbb6b72e9c724',
  //       signature:
  //         '46ab809c4a5beacfd423bb05332e818fb65d4d570939852206565c9a22adad8a3c3b4e69832c93f5b54b317bebcb44292bce5142f4bfa39f1b51a1cadcacae03',
  //     },
  //     expectBaseAmount: '1000000000000000000',
  //     expectQuoteAmount: '1500000000000000000',
  //   }
  //   const maker = await wallet.signSyncOrder(data.maker as any)
  //   const taker = await wallet.signSyncOrder(data.taker as any)

  //   const signedTransaction = await wallet.signSyncOrderMatching({
  //     type: 'OrderMatching',
  //     accountId: 1,
  //     account: '0x3498F456645270eE003441df82C718b56c0e6666',
  //     fee: BigNumber.from('0'),
  //     feeToken: 7,
  //     nonce: 0,
  //     expectBaseAmount: BigNumber.from('1000000000000000000'),
  //     expectQuoteAmount: BigNumber.from('1500000000000000000'),
  //     validFrom: 0,
  //     validUntil: 9007199254740991,
  //     maker: maker.tx,
  //     taker: taker.tx,
  //   } as any)
  //   const { tx } = signedTransaction as any
  //   expect(tx.signature.signature).to.eq(
  //     '55ef8ca1910f545a4998ede5d6975aae71b2a8f631b7066febf832975fe041ae8fdeeab1ab2a4b23b36c3fdb7a2d7420c7c5dbe5a52c4e595524731b2dd6de01'
  //   )
  // })
  it('sign sync order matching 2', async function () {
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
        feeRatio: 10,
        accountId: 6,
        signature: {
          pubKey: '0dd4f603531bd78bbecd005d9e7cc62a794dcfadceffe03e269fbb6b72e9c724',
          signature:
            '36525971db902fb7f8af094b24a835c9868b07599514670a93328da09357eb2e4dd3af60c89d401a682a9ec917ae8c4030a75e3dfc6f04aa9cecd17d13bb9101',
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
        feeRatio: 10,
        accountId: 6,
        signature: {
          pubKey: '0dd4f603531bd78bbecd005d9e7cc62a794dcfadceffe03e269fbb6b72e9c724',
          signature:
            '44ebf850ea8a3324f8ddc42e0ba9925678cf79e9909d3b9281724dc7b3076028d40aef64bfe6fc78b2d427f4b3ea8867de1f7774d40bccdcb4cce946472d0c03',
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
        22, 0, 0, 0, 10, 74, 129, 124, 128, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 255, 255, 255, 255,
        255, 255,
      ],
      'serialized maker is incorrect'
    )
    const serializedTaker = await serializeOrder(data.taker as any)
    expect(Array.from(serializedTaker)).to.eql(
      [
        255, 0, 0, 0, 6, 1, 3, 0, 0, 0, 0, 0, 6, 0, 7, 0, 0, 0, 0, 0, 0, 0, 20, 209, 18, 13, 123,
        22, 0, 0, 1, 10, 74, 129, 124, 128, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 255, 255, 255, 255,
        255, 255,
      ],
      'serialized taker is incorrect'
    )
    const maker = await wallet.signSyncOrder(data.maker as any)
    const taker = await wallet.signSyncOrder(data.taker as any)

    expect(maker.tx.signature).to.eql(data.maker.signature)
    expect(taker.tx.signature).to.eql(data.taker.signature)

    const serialized = await serializeOrderMatching(data as any)
    expect(Array.from(serialized)).to.eql(
      [
        11, 0, 0, 0, 6, 52, 152, 244, 86, 100, 82, 112, 238, 0, 52, 65, 223, 130, 199, 24, 181, 108,
        14, 102, 102, 241, 104, 100, 48, 30, 162, 254, 184, 214, 120, 15, 29, 8, 222, 135, 121, 7,
        206, 184, 73, 146, 189, 124, 6, 231, 240, 64, 224, 104, 251, 221, 0, 7, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 13, 224, 182, 179, 167, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 209, 18, 13, 123,
        22, 0, 0,
      ],
      'serialized order matching is incorrect'
    )
    expect(sha256(serialized)).to.eq(
      '0x9606e83984e7174072331f4eec61385928886071bdfe197667114447172977fa',
      'sha256 hash is incorrect'
    )

    const signedTransaction = await wallet.signSyncOrderMatching(data as any)
    const { tx } = signedTransaction as any
    // wrong l2 signature: 46ab809c4a5beacfd423bb05332e818fb65d4d570939852206565c9a22adad8a3c3b4e69832c93f5b54b317bebcb44292bce5142f4bfa39f1b51a1cadcacae03
    expect(tx.signature.signature).to.eq(
      'ed1a16e7682df3c5ce1befa6d9c0756d9f7f9bb758529836f43b0eb7e97c8b9bb1b2a98791d0482189128282eae78e61353e555a93b07f4d4b04397432b44605',
      'order matching signature is incorrect'
    )
  })
})
