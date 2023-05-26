import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { sha256 } from 'ethers/lib/utils'
import { WithdrawData } from '../src/types'
import { serializeWithdraw } from '../src/utils'
import { getTestWallet } from './utils'

describe('withdraw', () => {
  it('withdraw serialize and signature', async () => {
    const wallet = await getTestWallet()
    const data: WithdrawData = {
      toChainId: 3,
      subAccountId: 1,
      accountId: 1,
      from: '0x3498F456645270eE003441df82C718b56c0e6666',
      to: '0x3d809e414ba4893709c85f242ba3617481bc4126',
      l2SourceToken: 1,
      l1TargetToken: 17,
      amount: BigNumber.from('99995900000000000000'),
      withdrawFeeRatio: 50,
      fastWithdraw: 1,
      fee: BigNumber.from('4100000000000000'),
      ts: 1649749979,
      nonce: 85,
      type: 'Withdraw',
    }
    const serialized = serializeWithdraw(data)
    const signed = await wallet.signWithdrawToEthereum(data)
    expect(Buffer.from(serialized).toString('hex')).eq(
      '030300000001010000000000000000000000003d809e414ba4893709c85f242ba3617481bc41260001001100000000000000056bb8cd3fbf7bc000334d0000005501003262552fdb',
      'Unexpected withdraw serialize bytes'
    )
    expect(sha256(serialized)).to.eq(
      '0x1c353cb6d3bdc763b27125f0dc1ce7cb38bf76e24ef093a89abd9b0fe2bcb2ee',
      'Unexpected withdraw tx hash'
    )
    expect(signed.ethereumSignature?.signature).to.eq(
      '0x2499120b362bd835b456f2a8e3e6c4ccef6d0ebbe76fd64d452d5bba600ad574713d6b6af043a8f070c532d1ba879c712235bf8e9af6291aa8bdfb1cbaaa4dc21b',
      'Unexpected withdraw eth signature'
    )
    expect(signed.tx.signature?.signature).to.eq(
      'c50b647f2eb18d1fcb9a15d86046410a28cfb903cdfafc5a973e96b22d5e192d9f22efdf1ecf9321fead240dde50d898f32e53b3d0e827f04830fc1087b88501',
      'Unexpected withdraw tx signature'
    )
  })
})
