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
      '070100000001000000000000000000000000003498f456645270ee003441df82c718b56c0e6666000001001101000000550000000000000000000e90eda394400062552fdb'
    )
  })

  it('signature', async () => {
    const wallet = await getTestWallet()
    const signed = await wallet.signForcedExit(entries)
    expect(signed.ethereumSignature).toBeUndefined()
    expect(signed.tx.signature?.signature).toBe(
      '1b9759525d01c781bcf20154de8c7a4eb21a8fe98fc8c39093f0519f83071717dcac6209eabe45f28b56fab7a1899a1202b97c1e440870165d536e164f0df701'
    )
  })
})
