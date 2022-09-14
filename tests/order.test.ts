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
      '191f5a474b7b8af67e4338c169b16093a8662bd9fd825b88ec97f987e6453e1c'
    )
    expect(signedTransaction.tx.signature.signature).eq(
      '614b8dac98751bbf1480711bc8cbbf653d9ee8610212e551ff33c648865670875c300fb3f287b3b1741ce07aabf26545b191e503c9146758e958044d12dbca01'
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
      'b58972f7fc8b05491d0a3a8abea88be52ab28715271aba716ebc5d40e06bd418876de1baa20e4115a62d2ff2722e362a6f5152817397df1a9795453ae1719303'
    )
  })
})
