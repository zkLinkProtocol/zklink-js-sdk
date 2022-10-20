import { expect } from 'chai'
import { BigNumber, ethers } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { Wallet } from '../src/wallet'
import { getTestProvider } from './provider.test'

export async function getWallet(
  ethPrivateKey?: Uint8Array,
  network: string = 'mainnet'
): Promise<Wallet> {
  const key = ethPrivateKey || new Uint8Array(new Array(32).fill(5))
  const ethWallet = new ethers.Wallet(key)
  const mockProvider = await getTestProvider()
  const wallet = await Wallet.fromEthSigner(ethWallet, mockProvider)
  return wallet
}

describe('Wallet with mock provider', function () {
  it('Wallet has valid address', async function () {
    const key = new Uint8Array(new Array(32).fill(5))
    const wallet = await getWallet(key, 'mainnet')
    expect(wallet.address()).eq(
      '0xd09Ad14080d4b257a819a4f579b8485Be88f086c',
      'Wallet address does not match'
    )
    expect(await wallet.signer.pubKeyHash()).eq('sync:511494921e9aec60dfd65ce125dec96fe7c07133')
  })

  it("Wallet's account info has the same address as the wallet itself", async function () {
    const key = new Uint8Array(new Array(32).fill(10))
    const wallet = await getWallet(key, 'mainnet')
    const accountState = await wallet.getAccountState()
    expect(accountState.address).eq(
      wallet.address(),
      'Wallet address does not match the accountState.address'
    )
  })

  it('Wallet has defined account id', async function () {
    const key = new Uint8Array(new Array(32).fill(14))
    const wallet = await getWallet(key, 'mainnet')
    const accountId = await wallet.getAccountId()
    expect(accountId).eq(42, "Wallet's accountId does not match the hardcoded mock value")
  })

  it('Wallet has expected committed balances', async function () {
    const key = new Uint8Array(new Array(32).fill(40))
    const wallet = await getWallet(key, 'mainnet')
    const balance = await wallet.getBalance('USD', 0)
    expect(balance).eql(
      BigNumber.from(12345),
      "Wallet's committed balance does not match the hardcoded mock value"
    )
  })

  it('Wallet do not have unexpected committed balances', async function () {
    const key = new Uint8Array(new Array(32).fill(40))
    const wallet = await getWallet(key, 'mainnet')

    expect(await wallet.getBalance('USDC', 0), 'getBalance call was expected to undefined').to.be
      .undefined
  })
})
