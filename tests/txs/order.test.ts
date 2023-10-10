import { BigNumber } from 'ethers'
import { serializeOrder } from '../../src/utils'
import { getTestWallet } from '../wallet.test'

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
    const serialized = serializeOrder({ ...orderMaker } as any)
    expect(Buffer.from(serialized).toString('hex')).toBe(
      'ff0000000201000000000000010002000000000000008ac7230489e8000000050a002540be4009'
    )
  })

  it('serialize order maker, subsidy fee', () => {
    const serialized = serializeOrder({
      ...orderMaker,
      feeRates: [-5, 10],
    } as any)
    expect(Buffer.from(serialized).toString('hex')).toBe(
      'ff0000000201000000000000010002000000000000008ac7230489e8000000050a002540be4009'
    )
  })

  it('serialize order taker', () => {
    const serialized = serializeOrder(orderTaker as any)
    expect(Buffer.from(serialized).toString('hex')).toBe(
      'ff0000000201000100000000010002000000000000004563918244f4000001050a004a817c8009'
    )
  })

  it('sign sync order', async function () {
    const wallet = await getTestWallet()
    const signedTransaction = await wallet.signOrder({ ...orderMaker } as any)
    expect(signedTransaction?.tx?.signature?.pubKey).toBe(
      '77aa48808967258ac4c115ab14249a4d0b9888360bfb0079ab981822195b3d0c'
    )
    expect(signedTransaction?.tx?.signature?.signature).toBe(
      '8ee9dc660b6709b2d74340e0800f3f78e6f7b64b40151421127347cb243f4a13c068fd610a57976c028565381ad312b737e25cef232d2475f5732cfbdc1e1e05'
    )
  })

  it('sign sync order, subsidy fee', async function () {
    const wallet = await getTestWallet()
    const signedTransaction = await wallet.signOrder({
      ...orderMaker,
      feeRates: [-5, 10],
    } as any)
    expect(signedTransaction?.tx?.signature?.pubKey).toBe(
      '77aa48808967258ac4c115ab14249a4d0b9888360bfb0079ab981822195b3d0c'
    )
    expect(signedTransaction?.tx?.signature?.signature).toBe(
      '3f42164b271709aec85b9ede857cf82ee9390436e84c7811048061636fc5269f7df520977ce91609a8522723bf8aa49fa207a47decbfbb346b5888ec73921502'
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
      '8aeb3f5df5929a42fa056dc8fdb7f9c670c02bb929241280a1c8a174d5847828ffc2d5ddacac5652621ebf26b037fa4e431dbe0649d78246497c50f9f55f2d05'
    )
  })
})
