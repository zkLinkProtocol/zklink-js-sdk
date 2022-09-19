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
      feeToken: 1,
      fee: BigNumber.from('4100000000000000'),
      nonce: 85,
      validFrom: 0,
      validUntil: 4294967295,
      l2SourceToken: 1,
      l1TargetToken: 17,
      ts: 1649749979,
    })
    expect(Buffer.from(serialized).toString('hex')).eq(
      '070100000001003498f456645270ee003441df82c718b56c0e6666000100110001334d00000055000000000000000000000000ffffffff62552fdb'
    )
  })

  it('syncForcedExit', async function () {
    const wallet = await getWallet()

    const transaction = await wallet.syncForcedExit({
      toChainId: 1,
      subAccountId: 0,
      target: '0x3498F456645270eE003441df82C718b56c0e6666',
      l2SourceToken: 1,
      l1TargetToken: 17,
      feeToken: 1,
      fee: BigNumber.from(parseEther('0.001')),
      ts: 1649749979,
    } as any)
    expect(transaction.txData.ethereumSignature.signature).eq(
      '0x20bd5e4b5c61f064ae61c3281051e5f403d33bedf8272ffb2f420b8f32dbeab35f7a92495ebf0545178f7ede5420a681f3e20ee4d33331768cd142d63d7dd5421b'
    )
    expect(transaction.txData.tx.signature.signature).eq(
      'a156951f90dfc66f0628ebdccf7ac5a21f411f7a888c70f9ae4e084a2c2a8e9b7698cd264d0b46bcbc36ea2606bfb1ed9fc3a4ad52937d755a52a7046b54c900'
    )
  })
})
