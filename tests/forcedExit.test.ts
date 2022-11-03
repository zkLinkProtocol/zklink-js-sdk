import { parseEther, sha256 } from 'ethers/lib/utils'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { describe } from 'mocha'
import {
  serializeFeePacked,
  serializeForcedExit,
  serializeOrder,
  serializeWithdraw,
} from '../src/utils'
import { getWallet } from './wallet.test'
import { ForcedExitData } from '../src/types'
import { sign } from 'crypto'

describe('forcedExit', () => {
  it('forcedExit serialize and signature', async () => {
    const wallet = await getWallet()
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
      '070100000001003498f456645270ee003441df82c718b56c0e666600000100110001334d0000005562552fdb',
      'Unexpected serialized bytes'
    )
    expect(sha256(serialized)).to.eq(
      '0x5c0dee07e26608bdc1ce7f66a6fc6eefe58012e17ef38b2f224f23b52f1deca1',
      'Unexpected tx hash'
    )
    expect(signed.ethereumSignature?.signature).eq(
      '0x3a3d6baad0a1897712f534b9a899cdd58c8e8ad2200b406c85c0b18c98233efc1f26ba62e2e9fdb7f91b61080fa49d7d88ee9db8ca3be96d0315b6511de13ef21c',
      'Unexpected ForcedExit ethereum signature'
    )
    expect(signed.tx.signature?.signature).to.eq(
      '520892fd7cea7f25a0827c76dcd4babf08dc5f8e40a6adf1ef83f1b946b9caa7285da1b0f8fe2187d365569220cf0473f030fe92cae4bbc84e42c0753baad000',
      'Unexpected tx signature'
    )
  })
})
