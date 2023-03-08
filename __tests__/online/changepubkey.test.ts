import { expect } from 'chai'
import { _TypedDataEncoder } from '@ethersproject/hash'
import { describe } from 'mocha'
import { JsonRpcProvider } from '@ethersproject/providers'
import { getOnlineLinkWallet, SUB_ACCOUNT_ID } from './wallet.test'

describe('Online: ChangePubKey', () => {
  it('setSigningKey', async function () {
    const wallet = await getOnlineLinkWallet()
    const activate = await wallet.setSigningKey({
      chainId: 1,
      feeToken: 17,
      subAccountId: SUB_ACCOUNT_ID,
      ethAuthType: 'ECDSA',
    })
  })
})
