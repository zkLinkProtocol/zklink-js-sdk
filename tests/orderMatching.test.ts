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

describe('OrderMatching', () => {
  it('serialize', async () => {
    const serialized = await serializeOrderMatching({
      type: 'OrderMatching',
      accountId: 1,
      account: '0x3c205ce80bae33700b8a0448a9fbe5b5e5d6b38f',
      fee: BigNumber.from('0'),
      feeToken: 1,
      nonce: 0,
      validFrom: 0,
      validUntil: 9007199254740991,
      maker: {
        type: 'Order',
        subAccountId: 1,
        accountId: 1,
        slotId: 0,
        nonce: 0,
        basedTokenId: 1,
        quoteTokenId: 2,
        price: BigNumber.from('1'),
        amount: BigNumber.from('5'),
        isSell: 0,
        validFrom: 0,
        validUntil: 9007199254740991,
      },
      taker: {
        type: 'Order',
        subAccountId: 1,
        accountId: 1,
        slotId: 1,
        nonce: 0,
        basedTokenId: 1,
        quoteTokenId: 2,
        price: BigNumber.from('1'),
        amount: BigNumber.from('5'),
        isSell: 1,
        validFrom: 0,
        validUntil: 9007199254740991,
      },
    })

    expect(Buffer.from(serialized).toString('hex')).eq(
      '0b000000013c205ce80bae33700b8a0448a9fbe5b5e5d6b38fef66ebd6f587fc7a9954c104383c7fe85e693716d0b35a269f666e614985fd00010000'
    )
  })

  it('signature', async function () {
    const wallet = await getWalletFromPrivateKey()
    const order0 = await wallet.signSyncOrder({
      type: 'Order',
      subAccountId: 1,
      accountId: 1,
      slotId: 0,
      nonce: 0,
      basedTokenId: 1,
      quoteTokenId: 2,
      price: BigNumber.from('1'),
      amount: BigNumber.from('5'),
      isSell: 0,
      validFrom: 0,
      validUntil: 9007199254740991,
    })
    const order1 = await wallet.signSyncOrder({
      type: 'Order',
      subAccountId: 1,
      accountId: 1,
      slotId: 1,
      nonce: 0,
      basedTokenId: 1,
      quoteTokenId: 2,
      price: BigNumber.from('1'),
      amount: BigNumber.from('5'),
      isSell: 1,
      validFrom: 0,
      validUntil: 9007199254740991,
    })
    const signedTransaction = await wallet.signSyncOrderMatching({
      type: 'OrderMatching',
      accountId: 1,
      account: '0x3498F456645270eE003441df82C718b56c0e6666',
      fee: BigNumber.from('0'),
      feeToken: 1,
      nonce: 0,
      validFrom: 0,
      validUntil: 9007199254740991,
      maker: order0.tx,
      taker: order1.tx,
    } as any)
    expect(signedTransaction.ethereumSignature.signature).to.not.empty
    expect(signedTransaction.tx.signature.signature).to.not.empty
  })
})
