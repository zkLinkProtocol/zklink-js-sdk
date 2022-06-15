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
  validFrom: defaultValidFrom,
  validUntil: defaultValidUntil,
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
  validFrom: defaultValidFrom,
  validUntil: defaultValidUntil,
}

describe('Order', () => {
  it('serialize order maker', () => {
    const serialized = serializeOrder(orderMaker as any)
    expect(Buffer.from(serialized).toString('hex')).eq(
      'ff0000000201000000000000010002000000000000008ac7230489e8000000050a2540be40090000000000000000001fffffffffffff',
      'maker hex is incorrect'
    )
  })

  it('serialize order taker', () => {
    const serialized = serializeOrder(orderTaker as any)
    expect(Buffer.from(serialized).toString('hex')).eq(
      'ff0000000201010000000000010002000000000000004563918244f4000001050a4a817c80090000000000000000001fffffffffffff',
      'taker hex is incorrect'
    )
  })

  it('serialize order matching', async () => {
    const serialized = await serializeOrderMatching({
      type: 'OrderMatching',
      accountId: 2,
      account: '0xd5bda4d1f6b875b0f96397cf995f4251b77a9104',
      fee: BigNumber.from('0'),
      feeToken: 1,
      nonce: 0,
      validFrom: 0,
      validUntil: 9007199254740991,
      expectBaseAmount: BigNumber.from('500000000000000000'),
      expectQuoteAmount: BigNumber.from('5000000000000000000'),
      maker: orderMaker as any,
      taker: orderTaker as any,
    })

    expect(Buffer.from(serialized).toString('hex')).eq(
      '0b00000002d5bda4d1f6b875b0f96397cf995f4251b77a9104d9bcc0e6e1eaa3ac76c852d7506e4e569586cd43f6cd5f51dce7207467b53400010000000000000000000006f05b59d3b2000000000000000000004563918244f40000',
      'order matching hex is incorrect'
    )
  })

  it('sign sync order', async function () {
    const wallet = await getWallet()
    const signedTransaction = await wallet.signSyncOrder(orderMaker as any)
    expect(signedTransaction.tx.signature.pubKey).eq(
      '167850be112e16a992d27c6119e05ec8aee2b45446b79b1c969a48352d626aa5'
    )
    expect(signedTransaction.tx.signature.signature).eq(
      '12476f90c581aa971ac4a7c056d4d64360fc346171b5861bd8ff0c71f2878b1e6589484da2488ae040f7e2748a6a6bf8f478c05ece0dad80851b49e921914f00'
    )
  })

  it('custom order', async function () {
    const wallet = await getWallet()
    const signedTransaction = await wallet.signSyncOrder({
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
      validFrom: defaultValidFrom,
      validUntil: defaultValidUntil,
    } as any)
    expect(signedTransaction.tx.signature.signature).eq(
      '4bd968c6e0d230d944db951924f6c4f244d757349ffd4bce7dcde84d66246f84fa3454f96f006188bf48bb2b07b0d35929e1fa4831ce0f5ecd55b0c5a90e4605'
    )
  })
})
