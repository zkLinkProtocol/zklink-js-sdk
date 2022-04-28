import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { describe } from 'mocha'
import { serializeOrder, serializeWithdraw } from '../src/utils'
import { getTestWallet } from './wallet.test'

describe('withdraw', () => {
  it('serializeWithdraw', () => {
    const serialized = serializeWithdraw({
      toChainId: 3,
      subAccountId: 1,
      accountId: 1,
      from: '0x3498F456645270eE003441df82C718b56c0e6666',
      to: '0x3d809e414ba4893709c85f242ba3617481bc4126',
      tokenId: 2,
      amount: BigNumber.from('99995900000000000000'),
      withdrawFeeRatio: 50,
      fastWithdraw: 1,
      fee: BigNumber.from('4100000000000000'),
      ts: 1649749979,
      nonce: 85,
      validFrom: 0,
      validUntil: 4294967295,
      type: 'Withdraw',
      token: 2,
    })
    expect(serialized).eql(
      new Uint8Array([
        3, 3, 0, 0, 0, 1, 1, 52, 152, 244, 86, 100, 82, 112, 238, 0, 52, 65, 223, 130, 199, 24, 181,
        108, 14, 102, 102, 61, 128, 158, 65, 75, 164, 137, 55, 9, 200, 95, 36, 43, 163, 97, 116,
        129, 188, 65, 38, 0, 2, 0, 0, 0, 0, 0, 0, 0, 5, 107, 184, 205, 63, 191, 123, 192, 0, 51, 77,
        0, 0, 0, 85, 1, 0, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255,
      ])
    )
  })

  it('withdrawFromSyncToEthereum', async function () {
    const wallet = await getTestWallet()

    const transaction = await wallet.withdrawFromSyncToEthereum({
      toChainId: 3,
      accountId: 1,
      subAccountId: 1,
      amount: BigNumber.from('99995900000000000000'),
      to: '0x3d809e414ba4893709c85f242ba3617481bc4126',
      fastWithdraw: 1,
      fee: BigNumber.from('4100000000000000'),
      nonce: 85,
      token: 'USDT',
      ts: 1649749979,
      validFrom: 0,
      validUntil: 4294967295,
      withdrawFeeRatio: 50,
    } as any)
    expect(transaction.txData.ethereumSignature.signature).to.eq(
      '0x52ffffa004c4b9d2bd425bfd5c94a9e0c787be20102baae8f578daaefb0296412dcea35fe60f833537ad0ed3a9b37ffad3ba1c8947f6b01fc3016adc67d33ec31c'
    )
    expect(transaction.txData.tx.signature.signature).to.eq(
      'b51dd7a9b70977f4d92f847009f93c9299b0a3428fe43f76907d55881d6057ae9fbece85794aec72c6626a94840b30eceaba48369b74432951006d19aae6db05'
    )
  })
})
