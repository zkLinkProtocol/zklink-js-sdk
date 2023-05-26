import { expect } from 'chai'
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
      feeToken: 1,
      fee: '4100000000000000',
      nonce: 85,
      l2SourceToken: 1,
      l1TargetToken: 17,
      ts: 1649749979,
    }
    const serialized = serializeForcedExit(data)
    const signed = await wallet.signForcedExit(data)
    expect(Buffer.from(serialized).toString('hex')).eq(
      '070100000001000000000000000000000000003498f456645270ee003441df82c718b56c0e666600000100110001334d0000005562552fdb',
      'Unexpected serialized bytes'
    )
    expect(sha256(serialized)).to.eq(
      '0x48b25e383fd609d1180f21a713ae3084457269878ada1cfa25434cb226ab93ce',
      'Unexpected tx hash'
    )
    expect(signed.ethereumSignature?.signature).eq(
      '0x3a3d6baad0a1897712f534b9a899cdd58c8e8ad2200b406c85c0b18c98233efc1f26ba62e2e9fdb7f91b61080fa49d7d88ee9db8ca3be96d0315b6511de13ef21c',
      'Unexpected ForcedExit ethereum signature'
    )
    expect(signed.tx.signature?.signature).to.eq(
      '028decf18ec8a3550bcf0d46085c8fbd3e1f427e89fd9c4be0d27c1838ad4710ca873ed1a93daf415521aabb529d7b1f3efabfb446f467683f78083b8103e703',
      'Unexpected tx signature'
    )
  })
})
