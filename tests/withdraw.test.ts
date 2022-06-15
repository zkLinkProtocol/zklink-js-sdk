import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { describe } from 'mocha'
import { serializeOrder, serializeWithdraw } from '../src/utils'
import { getWallet } from './wallet.test'

describe('withdraw', () => {
  it('serializeWithdraw', () => {
    const serialized = serializeWithdraw({
      toChainId: 3,
      subAccountId: 1,
      accountId: 1,
      from: '0x3498F456645270eE003441df82C718b56c0e6666',
      to: '0x3d809e414ba4893709c85f242ba3617481bc4126',
      l2SourceToken: 1,
      l2TargetToken: 2,
      amount: BigNumber.from('99995900000000000000'),
      withdrawFeeRatio: 50,
      fastWithdraw: 1,
      fee: BigNumber.from('4100000000000000'),
      ts: 1649749979,
      nonce: 85,
      validFrom: 0,
      validUntil: 4294967295,
      type: 'Withdraw',
    })
    expect(Buffer.from(serialized).toString('hex')).eq(
      '030300000001013498f456645270ee003441df82c718b56c0e66663d809e414ba4893709c85f242ba3617481bc41260001000200000000000000056bb8cd3fbf7bc000334d00000055010032000000000000000000000000ffffffff',
      'withdraw serialize bytes'
    )
  })

  it('withdrawFromSyncToEthereum', async function () {
    const wallet = await getWallet()

    const transaction = await wallet.withdrawFromSyncToEthereum({
      toChainId: 3,
      accountId: 1,
      subAccountId: 1,
      amount: BigNumber.from('99995900000000000000'),
      to: '0x3d809e414ba4893709c85f242ba3617481bc4126',
      fastWithdraw: 1,
      fee: BigNumber.from('4100000000000000'),
      nonce: 85,
      l2SourceToken: 1,
      l2TargetToken: 2,
      ts: 1649749979,
      validFrom: 0,
      validUntil: 4294967295,
      withdrawFeeRatio: 50,
    } as any)
    expect(transaction.txData.ethereumSignature.signature).to.eq(
      '0x6cd06b65864161a55fff2375cdbcd346be07019883fc328126b81d537c8f44480cd515487127fdb081e78444d1ddb687468fe3f8378abe8dc636a0c295ad160d1b',
      'withdraw eth signature is incorrect'
    )
    expect(transaction.txData.tx.signature.signature).to.eq(
      '3d3d73471d35fa6d388da78584a6755805f1321aac577c8e0e9a73452c8bae9c435308dab20a70cf37be75b0f083bd8b7c1fce8bad0f91cb89854db456b92105',
      'withdraw signature is incorrect'
    )
  })
})
