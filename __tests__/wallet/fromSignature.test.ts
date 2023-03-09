import { ethers } from 'ethers'
import { Wallet } from '../../src/wallet'
import { getTestProvider } from '../utils'

describe('Wallet Instance', function () {
  it('From eth signature', async () => {
    const ethWallet = new ethers.Wallet(new Uint8Array(new Array(32).fill(5)))
    const mockProvider = await getTestProvider()
    const walletFromSigner = await Wallet.fromEthSigner(ethWallet, mockProvider)

    expect(walletFromSigner.signer?.seed).toMatchObject(
      ethers.utils.arrayify(
        '0xb3cd50e87d134abec95a9b3c98b43f39e1aceadeaacc7158c568fdbae639afb23384d0877ce3fa40b06e0daada859462d578c91bc188862984dbe68249b85b511b'
      )
    )

    const walletFromSignature = await Wallet.fromEthSignature(
      ethWallet,
      mockProvider,
      ethers.utils.hexlify(walletFromSigner.signer?.seed!)
    )
  })
})
