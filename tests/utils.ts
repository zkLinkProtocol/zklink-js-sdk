import { ethers } from 'ethers'
import { Wallet } from '../src'

export async function getTestWallet(
  ethPrivateKey?: Uint8Array
): Promise<Wallet> {
  const key = ethPrivateKey || new Uint8Array(new Array(32).fill(5))
  const ethWallet = new ethers.Wallet(key)
  const wallet = await Wallet.fromEthSigner(ethWallet)
  return wallet
}
