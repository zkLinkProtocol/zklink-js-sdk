import { sha256 } from 'ethers/lib/utils'
import { ForcedExitData } from '../src/types'
import { serializeForcedExit } from '../src/utils'
import { getTestWallet } from './utils'

describe('forcedExit', () => {
  it('forcedExit serialize and signature', async () => {
    const wallet = await getTestWallet()
    const data: ForcedExitData = {
      type: 'ForcedExit',
      toChainId: 1,
      initiatorSubAccountId: 0,
      initiatorAccountId: 1,
      target: '0x3498F456645270eE003441df82C718b56c0e6666',
      targetSubAccountId: 0,
      exitAmount: '4100000000000000',
      initiatorNonce: 85,
      l2SourceToken: 1,
      l1TargetToken: 17,
      ts: 1649749979,
    }
    const serialized = serializeForcedExit(data)
    const signed = await wallet.signForcedExit(data)
    expect(Buffer.from(serialized).toString('hex')).toBe(
      '070100000001000000000000000000000000003498f456645270ee003441df82c718b56c0e66660000010011000000550000000000000000000e90eda394400062552fdb'
    )
    expect(sha256(serialized)).toBe(
      '0x7107170ae24c09a77715b63c6f931443ae9571663128729645dc26171e1b3ba7'
    )
    expect(signed.ethereumSignature).toBeUndefined()
    expect(signed.tx.signature?.signature).toBe(
      'da738109b1864b162eba33a3e8a1a9c142dcadfd5d11c0fda37f6a4b0e12cea70f15e605b5f90c655b5a5b0e4e367f62d30d3d70157047db21dd2c70d482d302'
    )
  })
})
