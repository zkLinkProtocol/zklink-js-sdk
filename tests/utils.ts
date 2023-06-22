import { ethers } from 'ethers'
import { Provider, Wallet } from '../src'
const tokens = require('./tokens/0.json')

export async function getTestProvider(network: string = 'mainnet') {
  const key = new Uint8Array(new Array(32).fill(5))
  const provider = await Provider.newMockProvider(network, key, () => tokens)
  return provider
}

export async function getTestWallet(
  ethPrivateKey?: Uint8Array,
  network: string = 'mainnet'
): Promise<Wallet> {
  const key = ethPrivateKey || new Uint8Array(new Array(32).fill(5))
  const ethWallet = new ethers.Wallet(key)
  const mockProvider = await getTestProvider()
  const wallet = await Wallet.fromEthSigner(ethWallet, mockProvider)
  return wallet
}
