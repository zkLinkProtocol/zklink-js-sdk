import { BigNumber } from 'ethers'
import { WithdrawEntries } from '../../src/types'
import { serializeWithdraw } from '../../src/utils'
import { getTestWallet } from '../wallet.test'

describe('withdraw', () => {
  const entries: WithdrawEntries = {
    toChainId: 3,
    withdrawToL1: 1,
    subAccountId: 1,
    accountId: 1,
    from: '0x3498F456645270eE003441df82C718b56c0e6666',
    to: '0x3d809e414ba4893709c85f242ba3617481bc4126',
    l2SourceTokenId: 1,
    l2SourceTokenSymbol: 'USD',
    l1TargetTokenId: 17,
    amount: BigNumber.from('99995900000000000000'),
    withdrawFeeRatio: 50,
    fastWithdraw: 1,
    fee: BigNumber.from('4100000000000000'),
    ts: 1649749979,
    nonce: 85,
  }

  it('serialize', async () => {
    const wallet = await getTestWallet()
    const data = wallet.getWithdrawData(entries)
    const serialized = serializeWithdraw(data)
    expect(Buffer.from(serialized).toString('hex')).toBe(
      '030300000001010000000000000000000000003d809e414ba4893709c85f242ba3617481bc4126000100110100000000000000056bb8cd3fbf7bc000334d0000005501003262552fdb'
    )
  })

  it('zk signature', async () => {
    const wallet = await getTestWallet()
    const signed = await wallet.signWithdrawToEthereum(entries)
    expect(signed.tx.signature?.signature).toBe(
      '9c8810bf73a21f67530d4699cd3890af1217a3d6617da6ec0fcb6bdb7c1f0198024efa73008aecda3968b9deb403306dc7d9eb0e63cc3a169c0cefe8a3cfb801'
    )
  })

  it('eth signature', async () => {
    const wallet = await getTestWallet()
    const signed = await wallet.signWithdrawToEthereum(entries)
    expect(signed.ethereumSignature?.signature).toBe(
      '0x2499120b362bd835b456f2a8e3e6c4ccef6d0ebbe76fd64d452d5bba600ad574713d6b6af043a8f070c532d1ba879c712235bf8e9af6291aa8bdfb1cbaaa4dc21b'
    )
  })
})
