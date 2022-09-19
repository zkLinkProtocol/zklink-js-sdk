import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { sha256 } from 'ethers/lib/utils'
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
      l1TargetToken: 17,
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
      '030300000001013d809e414ba4893709c85f242ba3617481bc41260001001100000000000000056bb8cd3fbf7bc000334d00000055010032000000000000000000000000ffffffff62552fdb',
      'withdraw serialize bytes'
    )
  })

  it('withdrawFromSyncToEthereum', async function () {
    const wallet = await getWallet()

    const transaction = await wallet.withdrawFromSyncToEthereum({
      toChainId: 2,
      accountId: 1,
      subAccountId: 1,
      amount: BigNumber.from('99995900000000000000'),
      to: '0x3d809e414ba4893709c85f242ba3617481bc4126',
      fastWithdraw: 1,
      fee: BigNumber.from('4100000000000000'),
      nonce: 85,
      l2SourceToken: 1,
      l1TargetToken: 17,
      ts: 1649749979,
      validFrom: 0,
      validUntil: 4294967295,
      withdrawFeeRatio: 50,
    } as any)
    expect(transaction.txData.ethereumSignature.signature).to.eq(
      '0x2499120b362bd835b456f2a8e3e6c4ccef6d0ebbe76fd64d452d5bba600ad574713d6b6af043a8f070c532d1ba879c712235bf8e9af6291aa8bdfb1cbaaa4dc21b',
      'withdraw eth signature is incorrect'
    )
    expect(transaction.txData.tx.signature.signature).to.eq(
      '9c777ed4108f7f16fd1b6702008dbda38850ae2851a62c5fae61ef9f6cba1b8df88f58c107e9e466412904a72c5642964e6538fc99525db1b6c5c57f37c7a403',
      'withdraw signature is incorrect'
    )
  })
})
