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
    expect(Buffer.from(bytes).toString('hex')).toBe(
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
    expect(signedTransaction.tx.ethAuthData.ethSignature).toBe(
      '0x8a9351d39562b4123dccb0491b00575cf69327b18e41512e12802d74c842629867629484c13beee16175b417c71cd13863e2ce16470a1aeb0cb7d86ca05259fc1c'
    )
    expect(signedTransaction.tx.signature.signature).toBe(
      'c752b1a5c0059b35e192d8b051efe11beeb3e3cbdd1803c9ede0b1a1a62f4e1eaff3616c93aeaa837b9ac93db03aa43b65c36ac53464ffd827228e15c82f4c01'
    )
  })
})
