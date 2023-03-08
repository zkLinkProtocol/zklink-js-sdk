import { expect } from 'chai'
import { _TypedDataEncoder } from '@ethersproject/hash'
import { JsonRpcProvider } from '@ethersproject/providers'
import { utils } from '../src'
import { ChangePubKeyData } from '../src/types'
import { sha256 } from 'ethers/lib/utils'
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
      newPkHash: 'sync:511494921e9aec60dfd65ce125dec96fe7c07133',
    } as ChangePubKeyData)
    expect(Buffer.from(bytes).toString('hex')).to.eq(
      '06010000000201511494921e9aec60dfd65ce125dec96fe7c07133000100000000000062a1e340'
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
      'c7800f77f24bb960b05ba92aec256304154dfc49bb8773f8ddbba5f4f874ae0aecad3a6033455a6fc0a9b1152bbc362e34f60d9a875d9bab035ecab167795e01'
    )
  })
})
