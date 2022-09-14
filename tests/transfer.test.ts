import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { describe } from 'mocha'
import { getWallet } from './wallet.test'

describe('transfer', () => {
  it('transfer signature', async function () {
    const wallet = await getWallet()
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
      '05537f642fe1b060fdd4694e385331c5b92e7952402731bf3fd467789c7bba9ae4f81be239a157b6a455c7e8b6e41223e3995f1afa126b7e63d664a042b72b05'
    )
  })
})
