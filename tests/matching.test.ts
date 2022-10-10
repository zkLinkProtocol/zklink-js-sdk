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
            '9868b21aa2eaaca277e4e729258cf4186e4c7ea4b6679030b0f31d07d12e8c193f8d807bbce4a5bf7ce8ff06d9a1f20cdbbac057850b3878542a5c0829ffa402',
        },
        validFrom: 0,
        validUntil: 9007199254740991,
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
            '64344a0ebb9d72ad672b8035076032e676b8e2c63ad026776c5e9b6c55e483a8093bd84db8f59afd16ff67acd5eefc8d03704ccdeaa9c124da803c0566666401',
        },
        validFrom: 0,
        validUntil: 9007199254740991,
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
      'ff00000006010100000001002000010000000000000014d1120d7b16000000050a4a817c800a0000000000000000001fffffffffffff',
      'serialized maker is incorrect'
    )
    const serializedTaker = await serializeOrder(data.taker as any)

    expect(Buffer.from(serializedTaker).toString('hex')).to.eq(
      'ff00000006010300000000002000010000000000000014d1120d7b16000001050a4a817c80080000000000000000001fffffffffffff',
      'serialized taker is incorrect'
    )
    const maker = await wallet.signSyncOrder(data.maker as any)
    const taker = await wallet.signSyncOrder(data.taker as any)
    expect(maker.tx.signature).to.eql(data.maker.signature, 'maker signature is incorrect')
    expect(taker.tx.signature).to.eql(data.taker.signature, 'taker signature is incorrect')

    const serialized = await serializeOrderMatching(data as any)

    expect(Buffer.from(serialized).toString('hex')).to.eq(
      '0b000000063498f456645270ee003441df82c718b56c0e666658adffc2cbf9f8849a4c7bf356bd0f7564fdafc946de4c1a074d46647da7d90001000000000000000000000de0b6b3a7640000000000000000000014d1120d7b160000',
      'serialized order matching is incorrect'
    )

    const signedTransaction = await wallet.signSyncOrderMatching(data as any)
    const { tx } = signedTransaction as any
    // wrong l2 signature: 46ab809c4a5beacfd423bb05332e818fb65d4d570939852206565c9a22adad8a3c3b4e69832c93f5b54b317bebcb44292bce5142f4bfa39f1b51a1cadcacae03
    expect(tx.signature.signature).to.eq(
      '7b988abaebbee8f3f2c542e471ee90503fd0546b4133f2080581e80ad7c6ea8d6248ebfff203547a05cdfcf83ab3dc412c305eb93af319263f0251e6f220bb02',
      'order matching signature is incorrect'
    )
  })
})
