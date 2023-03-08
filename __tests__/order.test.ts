import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { parseEther, sha256 } from 'ethers/lib/utils'
import {
  closestPackableTransactionAmount,
  serializeOrder,
  serializeOrderMatching,
} from '../src/utils'
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
      'ff0000000201000000000000010002000000000000008ac7230489e8000000050a2540be4009',
      'maker hex is incorrect'
    )
  })

  it('serialize order taker', () => {
    const serialized = serializeOrder(orderTaker as any)
    expect(Buffer.from(serialized).toString('hex')).eq(
      'ff0000000201000100000000010002000000000000004563918244f4000001050a4a817c8009',
      'taker hex is incorrect'
    )
  })

  it('sign sync order', async function () {
    const wallet = await getTestWallet()
    const signedTransaction = await wallet.signOrder(orderMaker as any)
    expect(signedTransaction?.tx?.signature?.pubKey).eq(
      '191f5a474b7b8af67e4338c169b16093a8662bd9fd825b88ec97f987e6453e1c'
    )
    expect(signedTransaction?.tx?.signature?.signature).eq(
      'd5d5bbb4cfd5dc659ec5373bb62d33ca93e9424ff6d5f971edaf1d29451ae707f054fd178abc2213d26f35d5f46c5062e02ecf05a4de3ffc8fb48e390ce26b01'
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
      feeRatio1: 5,
      feeRatio2: 10,
    } as any)
    expect(signedTransaction?.tx?.signature?.signature).eq(
      '235a9ab68f2e53ae721c1ddbcdf71bee170cab6504906bbfec03f3c5923ebc1e018c07ff03e24f546cbbb75651be2a108e4c352d1abf7f63417359b55ede4c00'
    )
  })
})
