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
      l1TargetToken: 2,
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
      '030300000001013d809e414ba4893709c85f242ba3617481bc41260001000200000000000000056bb8cd3fbf7bc000334d00000055010032000000000000000000000000ffffffff62552fdb',
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
      l1TargetToken: 2,
      ts: 1649749979,
      validFrom: 0,
      validUntil: 4294967295,
      withdrawFeeRatio: 50,
    } as any)
    expect(transaction.txData.ethereumSignature.signature).to.eq(
      '0xbfe055acee3438a4aa87b51ad3238047907dce479e8835b5dd31631da06edee952b9660273c29b2e4966cd6d6e968676d8ed58b91e329091b7f6a20cff35cc8b1b',
      'withdraw eth signature is incorrect'
    )
    expect(transaction.txData.tx.signature.signature).to.eq(
      '075844bf1bc1a47572dc355f18c641ad69f38188ab889148c66060ee51050bb0c4027da0e7f42c225dabdec6c5e9889380e887846ce09d1e9db2b862ed528005',
      'withdraw signature is incorrect'
    )
  })

  it('serializeWithdraw', async () => {
    const wallet = await getWallet()

    const transaction = await wallet.withdrawFromSyncToEthereum({
      toChainId: 1,
      subAccountId: 0,
      accountId: 2,
      from: '0x6ceb6c36cf84334bafc3ae93bdb9d625b67cd8f8',
      to: '0x0000000000000000000000000000000000000000',
      l2SourceToken: 1,
      l1TargetToken: 22,
      amount: BigNumber.from('0'),
      withdrawFeeRatio: 1,
      fastWithdraw: 1,
      fee: BigNumber.from('0'),
      ts: 1655193833,
      nonce: 0,
      validFrom: 0,
      validUntil: 4294967295,
      type: 'Withdraw',
    } as any)

    const serialized = serializeWithdraw({
      toChainId: 1,
      subAccountId: 0,
      accountId: 2,
      from: '0x6ceb6c36cf84334bafc3ae93bdb9d625b67cd8f8',
      to: '0x0000000000000000000000000000000000000000',
      l2SourceToken: 1,
      l1TargetToken: 22,
      amount: BigNumber.from('0'),
      withdrawFeeRatio: 1,
      fastWithdraw: 1,
      fee: BigNumber.from('0'),
      ts: 1655193833,
      nonce: 0,
      validFrom: 0,
      validUntil: 4294967295,
      type: 'Withdraw',
    })
    expect(sha256(serialized)).to.eq(
      '0xa116b7a4dcf8e0f766cdcb92a4e0edbf298ef5abc2a760cb289e08ff3f0d9b51'
    )
    expect(Buffer.from(serialized).toString('hex')).eq(
      '0301000000020000000000000000000000000000000000000000000001001600000000000000000000000000000000000000000000010001000000000000000000000000ffffffff62a840e9',
      'withdraw serialize bytes'
    )
  })
})
