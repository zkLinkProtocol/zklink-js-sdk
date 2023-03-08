import { expect } from 'chai'
import { _TypedDataEncoder } from '@ethersproject/hash'
import { describe } from 'mocha'
import { JsonRpcProvider } from '@ethersproject/providers'
import {
  ALICE_ADDRESS,
  BOB_ADDRESS,
  BOB_PK,
  getOnlineLinkWallet,
  SUB_ACCOUNT_ID,
} from './wallet.test'
import { parseEther } from 'ethers/lib/utils'

describe('Online: OrderMatching', () => {
  it('signSyncOrderMatching', async function () {
    const walletAlice = await getOnlineLinkWallet()
    const walletBob = await getOnlineLinkWallet(BOB_PK)

    const maker = await walletAlice.signSyncOrder({
      type: 'Order',
      accountId: walletAlice.accountId!,
      nonce: 0,
      price: parseEther('0.01').toString(),
      amount: parseEther('0.01').toString(),
      isSell: 0,
      slotId: 1,
      feeRatio1: 5,
      feeRatio2: 10,
      baseTokenId: 33,
      quoteTokenId: 17,
      subAccountId: SUB_ACCOUNT_ID,
    })
    const taker = await walletBob.signSyncOrder({
      type: 'Order',
      accountId: walletBob.accountId!,
      nonce: 0,
      price: parseEther('0.01').toString(),
      amount: parseEther('0.01').toString(),
      isSell: 1,
      slotId: 1,
      feeRatio1: 5,
      feeRatio2: 10,
      baseTokenId: 33,
      quoteTokenId: 17,
      subAccountId: SUB_ACCOUNT_ID,
    })
    const tx = await walletAlice.signSyncOrderMatching({
      accountId: walletAlice.accountId!,
      subAccountId: SUB_ACCOUNT_ID,
      account: walletAlice.address(),
      maker,
      taker,
      expectBaseAmount: parseEther('0.01'),
      expectQuoteAmount: parseEther('0.01'),
      fee: parseEther('0.00002'),
      feeToken: 17,
      nonce: 0,
    })
    console.log(tx)
  })
})
