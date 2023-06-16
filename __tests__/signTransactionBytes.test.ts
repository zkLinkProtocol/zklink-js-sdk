import { getTestWallet } from './utils'

describe('signTransaction', function () {
  it('signTransactionBytes', async () => {
    const wallet = await getTestWallet()
    const signature = await wallet.signer?.signTransactionBytes('0xff')
    expect(signature?.signature).toBe(
      '8ed8a83b87a82c2585e954db9c66ae236cfa1ef4a42d07eefc2db3ab4ac15021438224a92b6bd2f3bf44a9a38f24f4b23f81af9130b66e7eb6bece34dc26f003'
    )
  })
})
