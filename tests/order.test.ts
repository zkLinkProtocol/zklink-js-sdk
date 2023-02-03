import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { parseEther, sha256 } from 'ethers/lib/utils'
import {
  closestPackableTransactionAmount,
  serializeOrder,
  serializeOrderMatching,
} from '../src/utils'
import { getWallet } from './wallet.test'

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
  feeRatio1: 5,
  feeRatio2: 10,
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
  feeRatio1: 5,
  feeRatio2: 10,
}

describe('Order', () => {
  it('serialize order maker', () => {
    const serialized = serializeOrder(orderMaker as any)
    expect(Buffer.from(serialized).toString('hex')).eq(
      'ff000000020100000000000000010002000000000000008ac7230489e8000000050a2540be4009',
      'maker hex is incorrect'
    )
  })

  it('serialize order taker', () => {
    const serialized = serializeOrder(orderTaker as any)
    expect(Buffer.from(serialized).toString('hex')).eq(
      'ff000000020100010000000000010002000000000000004563918244f4000001050a4a817c8009',
      'taker hex is incorrect'
    )
  })

  it('sign sync order', async function () {
    const wallet = await getWallet()
    const signedTransaction = await wallet.signOrder(orderMaker as any)
    expect(signedTransaction?.tx?.signature?.pubKey).eq(
      '191f5a474b7b8af67e4338c169b16093a8662bd9fd825b88ec97f987e6453e1c'
    )
    expect(signedTransaction?.tx?.signature?.signature).eq(
      '690617379c614844e4d8cd773a3750131dd79dba8eaba581edae89f1414c6328896ae615f613afcd6ef4a74f94742c4190865d2472bf3157f5534f672532ea00'
    )
  })

  it('custom order', async function () {
    const wallet = await getWallet()
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
      feeRatio1: 5,
      feeRatio2: 10,
    } as any)
    expect(signedTransaction?.tx?.signature?.signature).eq(
      '36400264d769884a4f096d09a0cf00a498dc6b3c9471b63b627bc1a663de3f9e54dce23ccb54f61df0501a3ee15db3d12d1f8f420c2128fb1be2eb6c12fde505'
    )
  })
})
