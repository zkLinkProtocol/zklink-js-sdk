import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { parseEther, sha256 } from 'ethers/lib/utils'
import { describe } from 'mocha'
import {
  closestPackableTransactionAmount,
  serializeOrder,
  serializeOrderMatching,
} from '../src/utils'
import { getTestWallet, getWalletFromPrivateKey } from './wallet.test'

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
    const wallet = await getWalletFromPrivateKey()
    const signedTransaction = await wallet.signSyncOrder(orderMaker as any)
    expect(signedTransaction.ethereumSignature.signature).eq(
      '0x915d197bad1a7d6c3e840fd62607df97b007f9faa3843639342b62348170e3d700d0cc333d00630de65830d3028abcc81f4f2dc9caf71bcea5a31cc42dd9c2db1c'
    )
    expect(signedTransaction.tx.signature.pubKey).eq(
      '0dd4f603531bd78bbecd005d9e7cc62a794dcfadceffe03e269fbb6b72e9c724'
    )
    expect(signedTransaction.tx.signature.signature).eq(
      '0e1b8df4a234422c3167725b98f591ae7b6ed5563f2d68786c82c966b1ad35a393a3d4a3570a9ebdb5d2dbdc9fc37c66d4d5ce682a2dd236e4073a5f078b9004'
    )
  })

  it('custom order', async function () {
    const wallet = await getWalletFromPrivateKey()
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
      'e84a62b9dc183b361ef2d81a1d02d91bf88c674fcbf9098772b3da01c3df299d791da8face13cb123ce403c777b45643881f045b3ea0f850a541cd819b93b300'
    )
  })
})
