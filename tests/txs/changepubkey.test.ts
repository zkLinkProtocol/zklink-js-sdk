import { ChangePubKeyEntries } from '../../src/types'
import { serializeChangePubKey } from '../../src/utils'
import { getTestWallet } from '../wallet.test'

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
      '0xefd0d9c6beb00310535bb51ee58745adb547e7d875d5823892365a6450caf6c559a6a4bfd83bf336ac59cf83e97948dbf607bf2aecd24f6829c3deac20ecdb601b'
    )
    expect(signedTransaction.tx.signature.signature).toBe(
      'c752b1a5c0059b35e192d8b051efe11beeb3e3cbdd1803c9ede0b1a1a62f4e1eaff3616c93aeaa837b9ac93db03aa43b65c36ac53464ffd827228e15c82f4c01'
    )
  })
})
