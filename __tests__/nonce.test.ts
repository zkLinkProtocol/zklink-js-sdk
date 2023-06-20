import { getTestWallet } from './utils'

describe('nonce', () => {
  it('getNonce', async () => {
    const wallet = await getTestWallet()
    const nonce = await wallet.getNonce()
    expect(nonce).toBe(0)
  })

  it('getSubNonce 0', async () => {
    const wallet = await getTestWallet()
    const subNonce = await wallet.getSubNonce(0)
    expect(subNonce).toBe(5)
  })
  it('getSubNonce 1', async () => {
    const wallet = await getTestWallet()
    const subNonce = await wallet.getSubNonce(1)
    expect(subNonce).toBe(10)
  })
})
