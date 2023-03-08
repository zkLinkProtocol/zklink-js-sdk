import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { sha256 } from 'ethers/lib/utils'
import { WithdrawData } from '../src/types'
import { serializeOrder, serializeWithdraw } from '../src/utils'
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
      '030300000001013d809e414ba4893709c85f242ba3617481bc41260001001100000000000000056bb8cd3fbf7bc000334d0000005501003262552fdb',
      'Unexpected withdraw serialize bytes'
    )
    expect(sha256(serialized)).to.eq(
      '0xbbd404c0d33c860127452dbd8cff7ff70825437415a4579459fab14e8a0329ca',
      'Unexpected withdraw tx hash'
    )
    expect(signed.ethereumSignature?.signature).to.eq(
      '0x2499120b362bd835b456f2a8e3e6c4ccef6d0ebbe76fd64d452d5bba600ad574713d6b6af043a8f070c532d1ba879c712235bf8e9af6291aa8bdfb1cbaaa4dc21b',
      'Unexpected withdraw eth signature'
    )
    expect(signed.tx.signature?.signature).to.eq(
      'dc4be429a40f11ca56fbe8204e1310fc780ba8787548c2382b46aa06aee7d917ba8c64fa9b89f4201b9c75e1c321dc4a1df47023bbf74de4cde383b81f704f02',
      'Unexpected withdraw tx signature'
    )
  })
})
