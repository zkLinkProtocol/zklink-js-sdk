import { ForcedExitEntries } from '../src/types'
import { serializeForcedExit } from '../src/utils'
import { getTestWallet } from './utils'

describe('forcedExit', () => {
  const entries: ForcedExitEntries = {
    toChainId: 1,
    initiatorSubAccountId: 0,
    initiatorAccountId: 1,
    target: '0x3498F456645270eE003441df82C718b56c0e6666',
    targetSubAccountId: 0,
    exitAmount: '4100000000000000',
    initiatorNonce: 85,
    l2SourceTokenId: 1,
    l1TargetTokenId: 17,
    ts: 1649749979,
  }

  it('serialize', async () => {
    const wallet = await getTestWallet()
    const data = wallet.getForcedExitData(entries)
    const serialized = serializeForcedExit(data)
    expect(Buffer.from(serialized).toString('hex')).toBe(
      '070100000001000000000000000000000000003498f456645270ee003441df82c718b56c0e66660000010011000000550000000000000000000e90eda394400062552fdb'
    )
  })

  it('signature', async () => {
    const wallet = await getTestWallet()
    const signed = await wallet.signForcedExit(entries)
    expect(signed.ethereumSignature).toBeUndefined()
    expect(signed.tx.signature?.signature).toBe(
      'da738109b1864b162eba33a3e8a1a9c142dcadfd5d11c0fda37f6a4b0e12cea70f15e605b5f90c655b5a5b0e4e367f62d30d3d70157047db21dd2c70d482d302'
    )
  })
})
