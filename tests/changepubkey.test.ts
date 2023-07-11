import { ChangePubKeyEntries } from '../src/types'
import { serializeChangePubKey } from '../src/utils'
import { getTestWallet } from './utils'

describe('ChangePubKey', () => {
  const entries: ChangePubKeyEntries = {
    subAccountId: 1,
    chainId: 1,
    feeTokenId: 1,
    fee: '0',
    nonce: 0,
    accountId: 2,
    ts: 1654776640,
    ethAuthType: 'EthECDSA',
    mainContract: '0x0000000000000000000000000000000000000000',
    layerOneChainId: 1,
  }
  it('serialize', async () => {
    const wallet = await getTestWallet()
    const data = await wallet.getChangePubKeyData(entries)
    const bytes = serializeChangePubKey(data)
    expect(Buffer.from(bytes).toString('hex')).toBe(
      '06010000000201dbd9c8235e4fc9d5b9b7bb201f1133e8a28c0edd000100000000000062a1e340'
    )
  })
  it('L2 signature', async function () {
    const wallet = await getTestWallet()
    const signedTransaction: any = await wallet.signChangePubKey(entries)
    expect(signedTransaction.tx.ethAuthData.ethSignature).toBe(
      '0xa80272603526ee86c5d27413d8968951b8476a781e0f98e5971ca0185a56d6511836eedc465b27d76363713a148a9726dd5639a9d1bbb6db1437c6bfd3858ad21b'
    )
    expect(signedTransaction.tx.signature.signature).toBe(
      'c752b1a5c0059b35e192d8b051efe11beeb3e3cbdd1803c9ede0b1a1a62f4e1eaff3616c93aeaa837b9ac93db03aa43b65c36ac53464ffd827228e15c82f4c01'
    )
  })
})
