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
    expect(signedTransaction.tx.ethAuthData.ethSignature).eq(
      '0x704dc27a1d4d6c95ebaed6d3487903cdbd4eb7f82c780f358bd98e4bbdf521182cdcaf1de93e257f4f8ecce65c853770d2619188c157ceb048b6752fc268a4321c'
    )
    expect(signedTransaction.tx.signature.signature).eq(
      '0f2d2e2ec5d0618d3e177a525ba2dc7a28b6c9ad4b8ba830c5706041ee389d2f82eb6df01049dcf1995858cee1f0ef25133724a9c85e80cee7f155095f7f9404'
    )
  })
})
