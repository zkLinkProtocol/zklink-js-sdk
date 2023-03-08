import { getTestWallet } from '../utils'

describe('Wallet eth signature type', function () {
  it('fromEthSignature', async () => {
    const wallet = await getTestWallet()
    console.log(wallet)
  })
})
