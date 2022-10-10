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
            '3e82ff5f01b74614b55c2f39a99bb393fc00afca71d68f29b72bbe01053f10a716384ea8e95f6d67cc72819ecb5af4eb5caca7cc0602a5ef32b46f40a7690601',
        },
        baseTokenId: 32,
        quoteTokenId: 1,
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
            '520b7982580eaeaba6ecc8c6448deb4ddfa1a2f96bf5c513b152b7775922d3a4c48d54458a8d1ca52a55e7ecf32a88f2b55a6565e7583d42551898f9abf68f01',
        },
        baseTokenId: 32,
        quoteTokenId: 1,
        subAccountId: 1,
      },
      account: '0x3498F456645270eE003441df82C718b56c0e6666',
      feeToken: 1,
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
    expect(Buffer.from(serializedMaker).toString('hex')).to.eq(
      'ff00000006010100000001002000010000000000000014d1120d7b16000000050a4a817c800a',
      'serialized maker is incorrect'
    )
    const serializedTaker = await serializeOrder(data.taker as any)

    expect(Buffer.from(serializedTaker).toString('hex')).to.eq(
      'ff00000006010300000000002000010000000000000014d1120d7b16000001050a4a817c8008',
      'serialized taker is incorrect'
    )
    const maker = await wallet.signSyncOrder(data.maker as any)
    const taker = await wallet.signSyncOrder(data.taker as any)
    expect(maker.tx.signature).to.eql(data.maker.signature, 'maker signature is incorrect')
    expect(taker.tx.signature).to.eql(data.taker.signature, 'taker signature is incorrect')

    const serialized = await serializeOrderMatching(data as any)

    expect(Buffer.from(serialized).toString('hex')).to.eq(
      '0b000000063498f456645270ee003441df82c718b56c0e6666f99c088c238aa3ee951c48ce736a411289336a4e3226b525bf0d511655249d0001000000000000000000000de0b6b3a7640000000000000000000014d1120d7b160000',
      'serialized order matching is incorrect'
    )

    const signedTransaction = await wallet.signSyncOrderMatching(data as any)
    const { tx } = signedTransaction as any
    // wrong l2 signature: 46ab809c4a5beacfd423bb05332e818fb65d4d570939852206565c9a22adad8a3c3b4e69832c93f5b54b317bebcb44292bce5142f4bfa39f1b51a1cadcacae03
    expect(tx.signature.signature).to.eq(
      'a3694c4d6b09ef559782edd507d5a7daa7e000ad56060522b86ed42b222ca7128609ccddae7f01bd7760023a5c902e2afd0f93027c1803f7084af8d91c5eec05',
      'order matching signature is incorrect'
    )
  })
})
