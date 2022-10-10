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
import { JsonRpcProvider } from '@ethersproject/providers'
import { getTestProvider } from './provider.test'
import { Wallet } from '../src'
import { getWallet } from './wallet.test'

const PolygonProvider = new JsonRpcProvider('https://matic-mumbai.chainstacklabs.com', {
  name: 'Polygon Testnet',
  chainId: 80001,
})
describe('ChangePubKey', () => {
  it('L2 signature', async function () {
    const wallet = await getWallet()
    const signedTransaction: any = await wallet.signSetSigningKey({
      linkChainId: 1,
      feeToken: 1,
      fee: '0',
      nonce: 0,
      ethAuthType: 'ECDSA',
      verifyingContract: '0x84434dbDd3f0705ECC599665e6a10dB2c751d0C6',
      chainId: 80001,
      accountId: 2,
      ts: 1654776640,
    } as any)
    expect(signedTransaction.tx.ethAuthData.ethSignature).eq(
      '0xb0f0f5ca9d165dd28561e9a084049d53aa95683937aa0c14ddbfa8478e19168f25e1ac75afd71f2ca8a24672a80fa6424408d6333ffdcbafd61725fa18aa6ec51c'
    )
    expect(signedTransaction.tx.signature.signature).eq(
      'cf4a400da2c2c0b38f83930435f629f73b9acfa5f0e2c12e94d0d6280b8ecc2ef01ebb1a3c8db14475ffd01a32a461962c50097b50b660d89f734fd3c4c46405'
    )
  })
})
