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
    expect(Buffer.from(serialized).toString('hex')).toBe(
      '030300000001010000000000000000000000003d809e414ba4893709c85f242ba3617481bc41260001001100000000000000056bb8cd3fbf7bc000334d0000005501003262552fdb'
    )
    expect(sha256(serialized)).toBe(
      '0x1c353cb6d3bdc763b27125f0dc1ce7cb38bf76e24ef093a89abd9b0fe2bcb2ee'
    )
    expect(signed.ethereumSignature?.signature).toBe(
      '0xbbd09c19da6b60169d36e8f25869e3fcc64b0f98fca5fed0bda9a6d7ee68b19f3bdfd9ed1915a450cd08ac3291d68f42cb024960abf0be9e8ac55fd3b907f7531b'
    )
    expect(signed.tx.signature?.signature).toBe(
      'abafec01592cc846e394691456d15518dde2a0bb13db2709c066a4e4ffb1b0a503e539bee8abc57e861975a5f411f314bafa920d70f001605147bef0fb129d03'
    )
  })
})
