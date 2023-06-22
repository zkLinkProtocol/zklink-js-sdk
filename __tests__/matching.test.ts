import { sha256 } from 'ethers/lib/utils'
import { OrderData, OrderMatchingData } from '../src/types'
import { serializeOrder, serializeOrderMatching } from '../src/utils'
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
    expect(Buffer.from(serializedMaker).toString('hex')).toBe(
      'ff00000006010001000001002000010000000000000014d1120d7b16000000050a4a817c800a'
    )
    const serializedTaker = serializeOrder(takerData as any)
    expect(Buffer.from(serializedTaker).toString('hex')).toBe(
      'ff00000006010003000000002000010000000000000014d1120d7b16000001050a4a817c8008'
    )
    const maker = await wallet.signOrder(makerData)
    expect(maker.tx.signature?.pubKey).toBe(
      '77aa48808967258ac4c115ab14249a4d0b9888360bfb0079ab981822195b3d0c'
    )
    expect(maker.tx.signature?.signature).toBe(
      '2cd57a2c1b3477994b224e9c3bc04e913d31b94b540d7c0bb918b2f54430da18f309a1613e97d5b7168b6a8b176d0cc6c0b444cb03918be187b2d7d97265af03'
    )

    const taker = await wallet.signOrder(takerData)
    expect(taker.tx.signature?.pubKey).toBe(
      '77aa48808967258ac4c115ab14249a4d0b9888360bfb0079ab981822195b3d0c'
    )
    expect(taker.tx.signature?.signature).toBe(
      'd5fb216a16a2de103f8f8281b631825c5ecc923012269f88fa3eb170dd20628f48a540ef7baf29ac9de2ee6e552c504bc5c34623a9f1782ed229b1930c99a900'
    )

    const matching: OrderMatchingData = {
      fee: '0',
      type: 'OrderMatching',
      subAccountId: 1,
      maker: maker.tx as OrderData,
      taker: taker.tx as OrderData,
      account: '0x3498F456645270eE003441df82C718b56c0e6666',
      feeToken: 0,
      accountId: 6,
      expectBaseAmount: '1000000000000000000',
      expectQuoteAmount: '1500000000000000000',
    }
    const serialized = await serializeOrderMatching(matching)

    expect(Buffer.from(serialized).toString('hex')).toBe(
      '08000000060183be69c82b2c56df952594436bd024ce85ed2eaee63dadb5b3a3e1aec623880000000000000000000000000de0b6b3a7640000000000000000000014d1120d7b160000'
    )

    const signed = await wallet.signOrderMatching(matching)

    expect(sha256(serialized)).toBe(
      '0x56fabbc07de5fc7ec7e766601543caafb8b7779478113fe9360396cb6b83e42f'
    )
    expect(signed.tx.signature?.pubKey).toBe(
      '77aa48808967258ac4c115ab14249a4d0b9888360bfb0079ab981822195b3d0c'
    )
    expect(signed.tx.signature?.signature).toBe(
      '1ea1d57bb4555f777ade53c0533bb3c7c33c7038fe05c0b6e2e96e8a88f4ab2c2339552129b801956eef5450ab1fc5038b963424be242de90ab3c0d5e39e9501'
    )
  })

  const data = {
    type: 'OrderMatching',
    accountId: 4,
    subAccountId: 1,
    taker: {
      accountId: 15,
      subAccountId: 1,
      slotId: 888,
      nonce: 239,
      baseTokenId: 40,
      quoteTokenId: 1,
      amount: '43000000000000000',
      price: '26944960000000000000000',
      isSell: 1,
      feeRatio1: 5,
      feeRatio2: 10,
      signature: {
        pubKey: '82117d3ba5d989c438f08566835dc3320f2293234142c87849932750c28add1f',
        signature:
          '5a10a9a6e7e78e6d676de03e64cc00a8687a15f5a8262d1734b4f7cda95565017ff3c537aaae811bbb74a0d7f26c5e3208e5f5793d81a54d0b29d13d404fa305',
      },
    },
    maker: {
      accountId: 2695,
      subAccountId: 1,
      slotId: 2,
      nonce: 1,
      baseTokenId: 40,
      quoteTokenId: 1,
      amount: '134310000000000000',
      price: '26988000000000000000000',
      isSell: 0,
      feeRatio1: 5,
      feeRatio2: 10,
      signature: {
        pubKey: 'ed1964fad861d801e5aa1f87f8a276491121ef6e48de1fa8cd2388bd06032a00',
        signature:
          '3a6aa8e5a26a5611b78b09b60d8f06177d374b231e76e38224275fc95a4daa1bab59e858cf10dd02ea412092b59056949ba0784b8316a665ba6d7544dd4e2201',
      },
    },
    fee: '0',
    feeToken: 0,
    expectBaseAmount: '43000000000000000',
    expectQuoteAmount: '1160484000000000000000',
    signature: {
      pubKey: 'e32ce4a89e2cc9702dc756e54479934c95cc7001114615a5b06a4d2386074c9d',
      signature:
        '744fc8d74a1fc218b764b95135e8c36d6455d9caef2aff34c28c20f7093f8687f9ed07b4149b7cf9a632901ed1e2c8aee69e4aebe83ef471efe2b714569ddb03',
    },
  }

  test('bytes and signature by data', async function () {
    const matching: OrderMatchingData = {
      fee: data.fee,
      type: 'OrderMatching',
      subAccountId: data.subAccountId,
      maker: data.maker as OrderData,
      taker: data.taker as OrderData,
      account: '0x3498F456645270eE003441df82C718b56c0e6666',
      feeToken: data.feeToken,
      accountId: data.accountId,
      expectBaseAmount: data.expectBaseAmount,
      expectQuoteAmount: data.expectQuoteAmount,
    }

    const serialized = await serializeOrderMatching(matching)
    const txHash = sha256(serialized)
    const wallet = await getTestWallet(
      '0xf3b4f9d137cd7c9ca53ac1c2d2a11384c799b8da5a25a1b00ea9085bd0fe7655' as any
    )
    const sign = await wallet?.signer?.signTransactionBytes(txHash)
    expect(sign?.pubKey).toBe('643a80bc00a25c84ade07cb40db832e9144a7d5316589bb0e550f8cb442cfa15')
    expect(sign?.signature).toBe(
      '5740bb39f4c617ad0bc2ef75afc5d3ac2d16a16e2a27670f6aff01da0e00f5a8ae283adb85cfa10283052520f0ed9264d6d2201a9d771b7a0260847f069be205'
    )
  })
})
