import { expect } from 'chai'
import { _TypedDataEncoder } from '@ethersproject/hash'
import { describe } from 'mocha'
import { BOB_ADDRESS, getOnlineLinkWallet, SUB_ACCOUNT_ID } from './wallet.test'
import { parseEther } from 'ethers/lib/utils'
import { BigNumber } from 'ethers'

describe('Online: Transfer', () => {
  it('syncTransfer', async function () {
    const wallet = await getOnlineLinkWallet()
    const tx = await wallet.syncTransfer({
      fromSubAccountId: SUB_ACCOUNT_ID,
      toSubAccountId: SUB_ACCOUNT_ID,
      to: BOB_ADDRESS,
      token: 17,
      amount: BigNumber.from('10000000000000000'),
    })
  })
})
