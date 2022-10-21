import { expect } from 'chai'
import { _TypedDataEncoder } from '@ethersproject/hash'
import { describe } from 'mocha'
import { JsonRpcProvider } from '@ethersproject/providers'
import { getWallet } from './wallet.test'

describe('ChangePubKey', () => {
  it('L2 signature', async function () {
    const wallet = await getWallet()
    const signedTransaction: any = await wallet.signChangePubKey({
      chainId: 1,
      ethAuthType: 'EthECDSA',
      feeToken: 1,
      fee: '0',
      nonce: 0,
      accountId: 2,
      ts: 1654776640,
    } as any)
    expect(signedTransaction.tx.ethAuthData.ethSignature).eq(
      '0xafabda44618bac69a68dfec8b67ccedd1c77fc7f51e0d1a0cd1db99e8250fc0473fb3a4b0e60b2a5136c4807a47e2d7803d64777fbbbebc41a21297e5586deb31c'
    )
    expect(signedTransaction.tx.signature.signature).eq(
      '42000608865054d1326383fec686d673658aa430f73c3c4c2876a68590e1ad20d309de3ebac0031f06211eadf3b610eb884f5a051320ec87f3fe4fd4362f2505'
    )
  })
})
