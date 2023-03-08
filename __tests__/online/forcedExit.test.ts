import { expect } from 'chai'
import { _TypedDataEncoder } from '@ethersproject/hash'
import { describe } from 'mocha'
import { JsonRpcProvider } from '@ethersproject/providers'
import { ALICE_ADDRESS, BOB_ADDRESS, getOnlineLinkWallet, SUB_ACCOUNT_ID } from './wallet.test'
import { parseEther } from 'ethers/lib/utils'

describe('Online: forcedExit', () => {
  it('syncForcedExit', async function () {
    const wallet = await getOnlineLinkWallet()
    const tx = await wallet.syncForcedExit({
      target: BOB_ADDRESS,
      targetSubAccountId: SUB_ACCOUNT_ID,
      initiatorSubAccountId: SUB_ACCOUNT_ID,
      toChainId: 1,
      l2SourceToken: 17,
      l1TargetToken: 17,
      feeToken: 17,
    })
  })
})
