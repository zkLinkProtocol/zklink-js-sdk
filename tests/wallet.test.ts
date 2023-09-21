import { ethers } from 'ethers'
import { hexlify } from 'ethers/lib/utils'
import { Wallet } from '../src'

export async function getTestWallet(
  ethPrivateKey?: Uint8Array
): Promise<Wallet> {
  const key = ethPrivateKey || new Uint8Array(new Array(32).fill(5))
  const ethWallet = new ethers.Wallet(key)
  const wallet = await Wallet.fromEthSigner(ethWallet)
  return wallet
}

describe('Wallet with mock provider', function () {
  it('Wallet has valid address', async function () {
    const wallet = await getTestWallet()
    expect(wallet.address()).toBe('0xd09Ad14080d4b257a819a4f579b8485Be88f086c')
    expect(await wallet?.signer?.pubKeyHash()).toBe(
      '0xdbd9c8235e4fc9d5b9b7bb201f1133e8a28c0edd'
    )
  })

  it('Wallet get privateKey', async function () {
    const wallet = await getTestWallet()
    expect(hexlify(wallet?.signer!.getPrivateKey())).toBe(
      '0x026104a0198c09afc53bf58085170357f153cd83239746873c8ccb14f5d70fd5'
    )
  })
})
