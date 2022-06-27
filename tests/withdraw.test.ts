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
      '0x6cd06b65864161a55fff2375cdbcd346be07019883fc328126b81d537c8f44480cd515487127fdb081e78444d1ddb687468fe3f8378abe8dc636a0c295ad160d1b',
      'withdraw eth signature is incorrect'
    )
    expect(transaction.txData.tx.signature.signature).to.eq(
      '8abae5f85038ff5431712db50690fc142582a62f79bcb8d9a724611a8d66ff06f734c660d0025d4ff312918cff3f8a9695ad6b79dce4948025c2f678b38a2f03',
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
