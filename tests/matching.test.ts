import { OrderData, OrderMatchingEntries } from '../src/types'
import { serializeOrder, serializeOrderMatching } from '../src/utils'
import { getTestWallet } from './utils'

describe('matching', () => {
  const makerData: OrderData = {
    type: 'Order',
    nonce: 1,
    price: '1500000000000000000',
    amount: '100000000000000000000',
    isSell: 0,
    slotId: 1,
    feeRates: [5, 10],
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
    feeRates: [5, 10],
    accountId: 6,
    baseTokenId: 32,
    quoteTokenId: 1,
    subAccountId: 1,
  }

  it('serialize order', async () => {
    const serializedMaker = serializeOrder(makerData)
    expect(Buffer.from(serializedMaker).toString('hex')).toBe(
      'ff00000006010001000001002000010000000000000014d1120d7b16000000050a4a817c800a'
    )
    const serializedTaker = serializeOrder(takerData as any)
    expect(Buffer.from(serializedTaker).toString('hex')).toBe(
      'ff00000006010003000000002000010000000000000014d1120d7b16000001050a4a817c8008'
    )
  })

  it('order signature', async () => {
    const wallet = await getTestWallet()
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
  })
  const matchingEntries: OrderMatchingEntries = {
    subAccountId: 1,
    maker: makerData as OrderData,
    taker: takerData as OrderData,
    account: '0x3498F456645270eE003441df82C718b56c0e6666',
    feeTokenId: 1,
    feeTokenSymbol: 'USD',
    fee: '0',
    accountId: 6,
    expectBaseAmount: '1000000000000000000',
    expectQuoteAmount: '1500000000000000000',
  }

  it('serialize matching', async () => {
    const wallet = await getTestWallet()
    const data = wallet.getOrderMatchingData(matchingEntries)
    const serialized = await serializeOrderMatching(data)

    expect(Buffer.from(serialized).toString('hex')).toBe(
      '08000000060183be69c82b2c56df952594436bd024ce85ed2eaee63dadb5b3a3e1aec623880001000000000000000000000de0b6b3a7640000000000000000000014d1120d7b160000'
    )
  })

  it('matching signature', async () => {
    const wallet = await getTestWallet()
    const signed = await wallet.signOrderMatching(matchingEntries)
    expect(signed.tx.signature?.pubKey).toBe(
      '77aa48808967258ac4c115ab14249a4d0b9888360bfb0079ab981822195b3d0c'
    )
    expect(signed.tx.signature?.signature).toBe(
      '7f8126c3e032cba9f0877f0ad7016b4c14e7171de50aa387f97f89611f2a11976a8ff34ed3bfa1678b52365416f62d9a4f94e29026cb1f23e0d81335c87f6601'
    )
  })
})
