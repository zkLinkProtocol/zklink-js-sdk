import { BigNumber } from 'ethers'
import { getTestWallet } from '../utils'

describe('Wallet with mock provider', function () {
  it('Wallet has valid address', async function () {
    const wallet = await getTestWallet()
    expect(wallet.address()).toBe('0xd09Ad14080d4b257a819a4f579b8485Be88f086c')
    expect(await wallet?.signer?.pubKeyHash()).toBe('0xdbd9c8235e4fc9d5b9b7bb201f1133e8a28c0edd')
  })

  it("Wallet's account info has the same address as the wallet itself", async function () {
    const key = new Uint8Array(new Array(32).fill(10))
    const wallet = await getTestWallet(key, 'mainnet')
    const accountState = await wallet.getAccountState()
    expect(accountState.address).toBe(wallet.address())
  })

  it('Wallet has defined account id', async function () {
    const key = new Uint8Array(new Array(32).fill(14))
    const wallet = await getTestWallet(key, 'mainnet')
    const accountId = await wallet.getAccountId()
    expect(accountId).toBe(42)
  })

  it('Wallet has expected committed balances', async function () {
    const key = new Uint8Array(new Array(32).fill(40))
    const wallet = await getTestWallet(key, 'mainnet')
    const balance = await wallet.getTokenBalance(1, 0)
    expect(balance).toBe(BigNumber.from(12345).toString())
  })

  it('Wallet do not have unexpected committed balances', async function () {
    const key = new Uint8Array(new Array(32).fill(40))
    const wallet = await getTestWallet(key, 'mainnet')

    expect(await wallet.getTokenBalance(17, 0)).toBeUndefined()
  })
})
