import { parseEther } from 'ethers/lib/utils'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { describe } from 'mocha'
import { serializeForcedExit, serializeOrder, serializeWithdraw } from '../src/utils'
import { getWallet } from './wallet.test'

describe('forcedExit', () => {
  it('serializeForcedExit', () => {
    const serialized = serializeForcedExit({
      type: 'ForcedExit',
      toChainId: 1,
      subAccountId: 0,
      initiatorAccountId: 1,
      target: '0x3498F456645270eE003441df82C718b56c0e6666',
      feeToken: 0,
      fee: BigNumber.from('4100000000000000'),
      nonce: 85,
      validFrom: 0,
      validUntil: 4294967295,
      l2SourceToken: 1,
      l1TargetToken: 2,
      ts: 1649749979,
    })
    expect(Buffer.from(serialized).toString('hex')).eq(
      '070100000001003498f456645270ee003441df82c718b56c0e6666000100020000334d00000055000000000000000000000000ffffffff62552fdb'
    )
  })

  it('syncForcedExit', async function () {
    const wallet = await getWallet()

    const transaction = await wallet.syncForcedExit({
      toChainId: 1,
      subAccountId: 0,
      target: '0x3498F456645270eE003441df82C718b56c0e6666',
      l2SourceToken: 1,
      l1TargetToken: 2,
      feeToken: 2,
      fee: BigNumber.from(parseEther('0.001')),
      ts: 1649749979,
    } as any)
    expect(transaction.txData.tx.signature.signature).eq(
      '8c2a91ef7efd35b0e047fe0fba2867695f391db3dcc375fb12fb2dd9e6b65911f281d381d574793249acf21be4348e665808e972b6b52c9c2cc1774d93582200'
    )
  })
})
