import { expect } from 'chai'
import { utils } from '../src'
import { ChangePubKeyData } from '../src/types'
import { getTestWallet } from './utils'

describe('ChangePubKey', () => {
  it('serializeChangePubKey', async () => {
    const bytes = utils.serializeChangePubKey({
      type: 'ChangePubKey',
      subAccountId: 1,
      chainId: 1,
      feeToken: 1,
      fee: '0',
      nonce: 0,
      accountId: 2,
      ts: 1654776640,
      newPkHash: '0x511494921e9aec60dfd65ce125dec96fe7c07133',
    } as ChangePubKeyData)
    expect(Buffer.from(bytes).toString('hex')).to.eq(
      '06010000000201000000000000000000000000511494921e9aec60dfd65ce125dec96fe7c07133000100000000000062a1e340'
    )
  })
  it('L2 signature', async function () {
    const wallet = await getTestWallet()
    const signedTransaction: any = await wallet.signChangePubKey({
      subAccountId: 1,
      chainId: 1,
      ethAuthType: 'EthECDSA',
      feeToken: 1,
      fee: '0',
      nonce: 0,
      accountId: 2,
      ts: 1654776640,
    })
    expect(signedTransaction.tx.ethAuthData.ethSignature).eq(
      '0xafabda44618bac69a68dfec8b67ccedd1c77fc7f51e0d1a0cd1db99e8250fc0473fb3a4b0e60b2a5136c4807a47e2d7803d64777fbbbebc41a21297e5586deb31c'
    )
    expect(signedTransaction.tx.signature.signature).eq(
      'ac82b49d7411d9a1d7bb9387b34d96f7db4dc525a27122ccc680f7ea466f9606d44c54fbca928aba16fe2daabfb3f12c57d86f180ad3881295cc33963b2cf605'
    )
  })
})
