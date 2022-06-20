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
      '030300000001013d809e414ba4893709c85f242ba3617481bc41260001000200000000000000056bb8cd3fbf7bc000334d00000055010032000000000000000000000000ffffffff',
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
      '0x6cd06b65864161a55fff2375cdbcd346be07019883fc328126b81d537c8f44480cd515487127fdb081e78444d1ddb687468fe3f8378abe8dc636a0c295ad160d1b',
      'withdraw eth signature is incorrect'
    )
    expect(transaction.txData.tx.signature.signature).to.eq(
      '2a6ced719f7d06d82a4036d6a040d9351ae2a30f7b1115606cae1cc76f4a6a047024c1755e06545f2041121c9988a541aa976d6260743f36366e5bb0abbb7e04',
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
      '0xef1c23c3c05b9329b226b47082aa0f9c0b66ce3b4c004a1c363f6377a575996b'
    )
    expect(Buffer.from(serialized).toString('hex')).eq(
      '0301000000020000000000000000000000000000000000000000000001001600000000000000000000000000000000000000000000010001000000000000000000000000ffffffff',
      'withdraw serialize bytes'
    )
  })
})
