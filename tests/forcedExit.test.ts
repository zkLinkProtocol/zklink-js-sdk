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
    expect(transaction.txData.ethereumSignature.signature).eq(
      '0x06b33a4c2be90fffa50e977470ae71c221f115545f979bbaae0d185a3aef1a26714b472507f7be1f7c61f2433637946bc8146558d52a86410e1ea9b65095b6941c'
    )
    expect(transaction.txData.tx.signature.signature).eq(
      '98c66766be0ec532178abcb16c88796f2e165d0a47e37f36077202c7340d8c90b30ec733640ea84543db9ea3d3ae145f80d4aefb17d98210c9e8672efa5f6c00'
    )
  })
})
