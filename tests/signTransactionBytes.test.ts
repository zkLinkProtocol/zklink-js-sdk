import { expect } from 'chai'
import { arrayify, parseEther } from 'ethers/lib/utils'
import { describe } from 'mocha'
import { serializeAmountPacked } from '../src/utils'
import { getWallet } from './wallet.test'

describe('signTransaction', function () {
  it('signTransactionBytes', async () => {
    const wallet = await getWallet()
    const signature = await wallet.signer?.signTransactionBytes('0xff')
    expect(signature?.signature).to.eq(
      '0a36a9de1e36720012871a0a96fd5e0a46ad3ec761357dfc57e2cd534bb563aa21cfd45aa60e59e76410294d3c9724373107bec6c1fd571231c45fedb888ea05'
    )
  })
})
