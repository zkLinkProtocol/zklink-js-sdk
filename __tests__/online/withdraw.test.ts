import { expect } from 'chai'
import { _TypedDataEncoder } from '@ethersproject/hash'
import { describe } from 'mocha'
import { JsonRpcProvider } from '@ethersproject/providers'
import { ALICE_ADDRESS, BOB_ADDRESS, getOnlineLinkWallet, SUB_ACCOUNT_ID } from './wallet.test'
import { parseEther } from 'ethers/lib/utils'

describe('Online: Withdraw', () => {
  it('withdrawToEthereum', async function () {
    const wallet = await getOnlineLinkWallet()
    const tx = await wallet.withdrawToEthereum({
      toChainId: 1,
      subAccountId: SUB_ACCOUNT_ID,
      to: ALICE_ADDRESS,
      l2SourceToken: 17,
      l1TargetToken: 17,
      amount: parseEther('0.01'),
      withdrawFeeRatio: 50,
      fastWithdraw: 0,
    })
  })
})
