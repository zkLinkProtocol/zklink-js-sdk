import { ForcedExitEntries } from '../../src/types'
import { serializeForcedExit } from '../../src/utils'
import { getTestWallet } from '../wallet.test'

describe('forcedExit', () => {
  const entries: ForcedExitEntries = {
    toChainId: 1,
    withdrawToL1: 1,
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
      '070100000001000000000000000000000000003498f456645270ee003441df82c718b56c0e66660000010011000000550000000000000000000e90eda39440000162552fdb'
    )
  })

  it('signature', async () => {
    const wallet = await getTestWallet()
    const signed = await wallet.signForcedExit(entries)
    expect(signed.ethereumSignature).toBeUndefined()
    expect(signed.tx.signature?.signature).toBe(
      '5adbdc54f70c7ced9a0012117fa62c05ee37b972f2f569b8e6cc217ab598da15a4cb63dae1127be654eba3611b92fdeea5b923c809ea2824f608ec50e3757101'
    )
  })
})
