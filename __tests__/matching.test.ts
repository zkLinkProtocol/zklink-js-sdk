import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { parseEther, sha256 } from 'ethers/lib/utils'
import { OrderData, OrderMatchingData } from '../src/types'
import {
  closestPackableTransactionAmount,
  serializeOrder,
  serializeOrderMatching,
} from '../src/utils'
import { getTestWallet } from './utils'

describe('matching', () => {
  it('bytes and signature', async function () {
    const wallet = await getTestWallet()

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
      'ff00000006010001000001002000010000000000000014d1120d7b16000000050a4a817c800a',
      'Unexpected maker serialize bytes'
    )
    const serializedTaker = serializeOrder(takerData as any)
    expect(Buffer.from(serializedTaker).toString('hex')).to.eq(
      'ff00000006010003000000002000010000000000000014d1120d7b16000001050a4a817c8008',
      'Unexpected taker serialize bytes'
    )
    const maker = await wallet.signOrder(makerData)
    expect(maker.tx.signature?.pubKey).to.eq(
      '191f5a474b7b8af67e4338c169b16093a8662bd9fd825b88ec97f987e6453e1c',
      'Unexpected maker pubKey'
    )
    expect(maker.tx.signature?.signature).to.eq(
      '6dc92f9bf96fae1fcdd6de9cb0ef44157535b354f6fcc73efa935c255d7b011583843a51099bf720b56c1bb07f247f392ad0f2e4852264f79b241756d21e9502',
      'Unexpected maker signature'
    )

    const taker = await wallet.signOrder(takerData)
    expect(taker.tx.signature?.pubKey).to.eq(
      '191f5a474b7b8af67e4338c169b16093a8662bd9fd825b88ec97f987e6453e1c',
      'Unexpected taker pubKey'
    )
    expect(taker.tx.signature?.signature).to.eq(
      '22d0af59458b7efe82b58b7f71bdc0ac894ba791e5923b879894059305344290e3eade79e3e329fffa9de84018beadb4e58cc78be3a96faaacdfa79c5dc82e00',
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
      '08000000060183be69c82b2c56df952594436bd024ce85ed2eaee63dadb5b3a3e1aec623880001000000000000000000000de0b6b3a7640000000000000000000014d1120d7b160000',
      'Unexpected matching serialize bytes'
    )

    const signed = await wallet.signOrderMatching(matching)

    expect(sha256(serialized)).to.eq(
      '0x2a85e0d5fc683da1f00019366444f9e9bf419b973cacb41e9fc4a3b44ed66421',
      'Unexpected matching tx hash'
    )
    expect(signed.tx.signature?.pubKey).to.eq(
      '191f5a474b7b8af67e4338c169b16093a8662bd9fd825b88ec97f987e6453e1c',
      'Unexpected matching tx pubKey'
    )
    expect(signed.tx.signature?.signature).to.eq(
      'ec7493d6151fbe1673f8bfefc4f5544b86eeef7010b0bc3500d4036f7e36a0a1e1a31f28015fd27258ad5782c0676b97bda3a4380284903e15eec6b2c7836105',
      'Unexpected matching tx signature'
    )
  })
})
