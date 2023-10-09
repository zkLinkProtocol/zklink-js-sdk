import { OrderData, OrderMatchingEntries } from '../../src/types'
import { serializeOrder, serializeOrderMatching } from '../../src/utils'
import { getTestWallet } from '../wallet.test'

describe('matching', () => {
  const makerData = {
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
  const takerData = {
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
    const serializedMaker = serializeOrder(makerData as any)
    expect(Buffer.from(serializedMaker).toString('hex')).toBe(
      'ff00000006010001000001002000010000000000000014d1120d7b16000000050a004a817c800a'
    )
    const serializedTaker = serializeOrder(takerData as any)
    expect(Buffer.from(serializedTaker).toString('hex')).toBe(
      'ff00000006010003000000002000010000000000000014d1120d7b16000001050a004a817c8008'
    )
  })

  it('order signature', async () => {
    const wallet = await getTestWallet()
    const maker = await wallet.signOrder(makerData as any)
    expect(maker.tx.signature?.pubKey).toBe(
      '77aa48808967258ac4c115ab14249a4d0b9888360bfb0079ab981822195b3d0c'
    )
    expect(maker.tx.signature?.signature).toBe(
      '1fee27ea1eaf7efea57a2d179b8bd64fbb73f5073151c157fa52c97fd94c3724e2dec952b9faba271cc0574b5bddcd1845e298529dff9e232773e264d45a1000'
    )

    const taker = await wallet.signOrder(takerData as any)
    expect(taker.tx.signature?.pubKey).toBe(
      '77aa48808967258ac4c115ab14249a4d0b9888360bfb0079ab981822195b3d0c'
    )
    expect(taker.tx.signature?.signature).toBe(
      'c44a72431d0776850173dd44142cc9bfbe3a4622ce9e4c7a6003fe5378080f8c3a9ec2c0991c3fd59e155f2c73140ec325ab242ad0cbfd085d5278eb58cfe905'
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
      '0800000006014614c7aa5772f9287aaba2986a5f700b9d05732e53439d061f02f9df14e14f0001000000000000000000000de0b6b3a7640000000000000000000014d1120d7b160000'
    )
  })

  it('matching signature', async () => {
    const wallet = await getTestWallet()
    const signed = await wallet.signOrderMatching(matchingEntries)
    expect(signed.tx.signature?.pubKey).toBe(
      '77aa48808967258ac4c115ab14249a4d0b9888360bfb0079ab981822195b3d0c'
    )
    expect(signed.tx.signature?.signature).toBe(
      '1f4b66b115af944b1c9df87b2af275b5cf747543b53d7f47bbcb9786f8a049094e4dd22522bec5c6477b0aaf3898c09589f199de39714ac9016160e7f6385801'
    )
  })
})
