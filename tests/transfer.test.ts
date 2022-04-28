import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { describe } from 'mocha'
import { getTestWallet } from './wallet.test'

describe('transfer', () => {
  it('transfer signature', async function () {
    const wallet = await getTestWallet()
    const transaction = await wallet.syncTransfer({
      fromSubAccountId: 6,
      toSubAccountId: 6,
      to: '0x3498F456645270eE003441df82C718b56c0e6666',
      token: 'USDT',
      amount: BigNumber.from('1000000000000000000'),
      fee: BigNumber.from('10000000000'),
      ts: 1646101085,
      nonce: 1,
      validFrom: 0,
      validUntil: 4294967295,
    } as any)

    expect(transaction.txData.ethereumSignature.signature).to.eq(
      '0x282e7a4ee9a5999c1f5746ca881c306fcefde2eae00c380e92a4eaff1bbaa7c668fc65672643ba2801ec0d4c3ee2438a4afed0805322d92f37336b9cda3460d81b'
    )
    expect(transaction.txData.tx.signature.signature).to.eq(
      '6887c1e4ccbc7ebb8d03c829e163066521d3f815622acc1f91f00844143daf85a0ba309bc711020a462493494eed555ef1edec0377b22637290115e9387a4205'
    )
  })
})
