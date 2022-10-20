import { expect } from 'chai'
import { _TypedDataEncoder } from '@ethersproject/hash'
import { describe } from 'mocha'
import { JsonRpcProvider } from '@ethersproject/providers'
import { getWallet } from './wallet.test'

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
      'fde82c9fff8a16d47fa4ebc0e43ee7c6b236664735cb6e43dd5c0129f53456abe02e422eda6e8712c98c4d677fe2825b985a859e337e8ec486c405fec48a7702'
    )
  })
})
