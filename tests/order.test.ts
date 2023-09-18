import { BigNumber } from 'ethers'
import { serializeOrder } from '../src/utils'
import { getTestWallet } from './utils'

const orderMaker = {
  type: 'Order',
  subAccountId: 1,
  accountId: 2,
  slotId: 0,
  nonce: 0,
  baseTokenId: 1,
  quoteTokenId: 2,
  price: BigNumber.from('10000000000000000000'),
  amount: BigNumber.from('5000000000000000000'),
  isSell: 0,
  feeRates: [5, 10],
}
const orderTaker = {
  type: 'Order',
  subAccountId: 1,
  accountId: 2,
  slotId: 1,
  nonce: 0,
  baseTokenId: 1,
  quoteTokenId: 2,
  price: BigNumber.from('5000000000000000000'),
  amount: BigNumber.from('10000000000000000000'),
  isSell: 1,
  feeRates: [5, 10],
}

describe('Order', () => {
  it('serialize order maker', () => {
    const serialized = serializeOrder(orderMaker as any)
    expect(Buffer.from(serialized).toString('hex')).toBe(
      'ff0000000201000000000000010002000000000000008ac7230489e8000000050a2540be4009'
    )
  })

  it('serialize order taker', () => {
    const serialized = serializeOrder(orderTaker as any)
    expect(Buffer.from(serialized).toString('hex')).toBe(
      'ff0000000201000100000000010002000000000000004563918244f4000001050a4a817c8009'
    )
  })

  it('sign sync order', async function () {
    const wallet = await getTestWallet()
    const signedTransaction = await wallet.signOrder(orderMaker as any)
    expect(signedTransaction?.tx?.signature?.pubKey).toBe(
      '77aa48808967258ac4c115ab14249a4d0b9888360bfb0079ab981822195b3d0c'
    )
    expect(signedTransaction?.tx?.signature?.signature).toBe(
      '381a682a9d8732c66971fa5703a1accf3de9371abf6779cf441cc584ea1df692b170b3c918104e992c9920ba79793ed0138f2423e953a5facef2be96a608f305'
    )
  })

  it('custom order', async function () {
    const wallet = await getTestWallet()
    const signedTransaction = await wallet.signOrder({
      subAccountId: 1,
      accountId: 5,
      slotId: 6,
      nonce: 0,
      baseTokenId: 6,
      quoteTokenId: 7,
      price: BigNumber.from('900000000000000000'),
      amount: BigNumber.from('10000000000000000000'),
      isSell: 0,
      feeRates: [5, 10],
    } as any)
    expect(signedTransaction?.tx?.signature?.signature).toBe(
      '43a2b06e196f85d93ed5ed759b767238e0dde7949859ca80153add1b57af9b95969d9a60d5c64fef712e021460103e369d40ea83d98e782b9aecd7e230841402'
    )
  })
})
