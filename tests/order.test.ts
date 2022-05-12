import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
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
  basedTokenId: 1,
  quoteTokenId: 2,
  price: BigNumber.from('10000000000000000000'),
  amount: BigNumber.from('5000000000000000000'),
  isSell: 0,
  feeRatio: 100,
  validFrom: defaultValidFrom,
  validUntil: defaultValidUntil,
}
const orderTaker = {
  type: 'Order',
  subAccountId: 1,
  accountId: 2,
  slotId: 1,
  nonce: 0,
  basedTokenId: 1,
  quoteTokenId: 2,
  price: BigNumber.from('5000000000000000000'),
  amount: BigNumber.from('10000000000000000000'),
  isSell: 1,
  feeRatio: 100,
  validFrom: defaultValidFrom,
  validUntil: defaultValidUntil,
}

describe('Order', () => {
  it('serialize order maker', () => {
    const serialized = serializeOrder(orderMaker as any)
    expect(Buffer.from(serialized).toString('hex')).eq(
      'ff0000000201000000000000010002000000000000008ac7230489e8000000642540be40090000000000000000001fffffffffffff'
    )
  })

  it('serialize order taker', () => {
    const serialized = serializeOrder(orderTaker as any)
    expect(Buffer.from(serialized).toString('hex')).eq(
      'ff0000000201010000000000010002000000000000004563918244f4000001644a817c80090000000000000000001fffffffffffff'
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
      '0b00000002d5bda4d1f6b875b0f96397cf995f4251b77a910402a34fb9efd2c2caa522d1c750913818d830a9031bf74fb6659c14250cc35e00010000000000000000000006f05b59d3b2000000000000000000004563918244f40000'
    )
  })

  it('signature', async function () {
    const wallet = await getWalletFromPrivateKey()
    const signedTransaction = await wallet.signSyncOrder({
      accountId: 13,
      subAccountId: 1,
      slotId: 0,
      nonce: 0,
      basedTokenId: 3,
      quoteTokenId: 4,
      isSell: 0,
      feeRatio: 100,
      amount: closestPackableTransactionAmount(parseEther('2')),
      price: parseEther('1'),
    } as any)
    // expect(signedTransaction.ethereumSignature.signature).eq('0x1efd9e668351d47d5b20c446a2cdd0840dfee67e3a32fd1a7f7d7eb71784fa045b2e482c8fa9462c4df6351caa9a874fd2180301754cf7954c001c78341b28171c')
    // expect(signedTransaction.tx.signature.pubKey).eq(
    //   '0dd4f603531bd78bbecd005d9e7cc62a794dcfadceffe03e269fbb6b72e9c724'
    // )
    expect(signedTransaction.tx.signature.signature).eq(
      'bef75b5d859baa9fbd421afa2ef56fd00eb4edfbd619647a8bcc2bf9df469a0789af97273bddf0ecf51ef1b2e8856e751a99b4ed614eda2067b1832684b23502'
    )
  })

  it('signature', async function () {
    const wallet = await getWalletFromPrivateKey()
    const maker = await wallet.signSyncOrder(orderMaker as any)
    const taker = await wallet.signSyncOrder(orderTaker as any)
    const bytes = await serializeOrderMatching({
      type: 'OrderMatching',
      accountId: 1,
      account: '0x3498F456645270eE003441df82C718b56c0e6666',
      fee: '0',
      feeToken: 1,
      nonce: 0,
      expectBaseAmount: '50000000000000',
      expectQuoteAmount: '10000000000000',
      validFrom: 0,
      validUntil: 9007199254740991,
      maker: maker.tx,
      taker: taker.tx,
    } as any)
    expect(Buffer.from(bytes).toString('hex')).to.eq(
      '0b000000013498f456645270ee003441df82c718b56c0e666602a34fb9efd2c2caa522d1c750913818d830a9031bf74fb6659c14250cc35e00010000000000000000000000002d79883d20000000000000000000000009184e72a000'
    )
    const signedTransaction = await wallet.signSyncOrderMatching({
      type: 'OrderMatching',
      accountId: 1,
      account: '0x3498F456645270eE003441df82C718b56c0e6666',
      fee: BigNumber.from('0'),
      feeToken: 1,
      nonce: 0,
      expectBaseAmount: BigNumber.from('50000000000000'),
      expectQuoteAmount: BigNumber.from('10000000000000'),
      validFrom: 0,
      validUntil: 9007199254740991,
      maker: maker.tx,
      taker: taker.tx,
    } as any)
    const { tx } = signedTransaction as any
    expect(tx.expectBaseAmount).to.eq('50000000000000')
    expect(tx.expectQuoteAmount).to.eq('10000000000000')
    expect(tx.fee).to.eq('0')

    expect(tx.maker.accountId).to.eq(orderMaker.accountId)
    expect(tx.maker.feeRatio).to.eq(orderMaker.feeRatio)
    expect(tx.maker.price).to.eq(orderMaker.price.toString())
    expect(tx.maker.amount).to.eq(orderMaker.amount.toString())

    expect(tx.taker.accountId).to.eq(orderTaker.accountId)
    expect(tx.taker.feeRatio).to.eq(orderTaker.feeRatio)
    expect(tx.taker.price).to.eq(orderTaker.price.toString())
    expect(tx.taker.amount).to.eq(orderTaker.amount.toString())

    expect(signedTransaction.ethereumSignature.signature).to.not.empty
    expect(tx.signature.signature).to.not.empty
  })
})
