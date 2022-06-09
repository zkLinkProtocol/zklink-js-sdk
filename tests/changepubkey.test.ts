import { expect } from 'chai'
import { BigNumber, ethers } from 'ethers'
import { parseEther, sha256 } from 'ethers/lib/utils'
import { _TypedDataEncoder } from '@ethersproject/hash'
import { describe } from 'mocha'
import {
  closestPackableTransactionAmount,
  serializeOrder,
  serializeOrderMatching,
  signMessageEIP712,
} from '../src/utils'
import { getTestWallet, getWalletFromPrivateKey } from './wallet.test'
import { JsonRpcProvider } from '@ethersproject/providers'
import { getTestProvider } from './provider.test'
import { Wallet } from '../src'

const PolygonProvider = new JsonRpcProvider('https://matic-mumbai.chainstacklabs.com', {
  name: 'Polygon Testnet',
  chainId: 80001,
})
describe('ChangePubKey', () => {
  it('L2 signature', async function () {
    const key = new Uint8Array(new Array(32).fill(5))

    const ethWallet = new ethers.Wallet(key, PolygonProvider)
    const mockProvider = await getTestProvider()
    const wallet = await Wallet.fromEthSigner(ethWallet, mockProvider)
    const signedTransaction = await wallet.signSetSigningKey({
      linkChainId: 1,
      feeToken: 0,
      fee: '0',
      nonce: 0,
      ethAuthType: 'ECDSA',
      verifyingContract: '0x84434dbDd3f0705ECC599665e6a10dB2c751d0C6',
      chainId: 80001,
      accountId: 2,
      ts: 1654776640,
      validFrom: 0,
      validUntil: 4294967295,
    } as any)
    expect(signedTransaction.tx.signature.signature).eq(
      'b668658188d904f89b685a4cd10d11be6cadfcf4818716233a624d2ca8a919ad9f656651c838ce737ab0cd42c2abe3e50340614a855b75e354f18670e8474e05'
    )
  })
})
