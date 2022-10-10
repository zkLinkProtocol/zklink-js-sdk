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
      token: 'USD',
      amount: BigNumber.from('1000000000000000000'),
      fee: BigNumber.from('10000000000'),
      ts: 1646101085,
      nonce: 1,
      validFrom: 0,
      validUntil: 4294967295,
    } as any)

    expect(transaction.txData.ethereumSignature.signature).to.eq(
      '0xf75af5b8223c5e8afa1814e0e74c891ee9ed5f0e7cd0544c463aa33a4859fb8c1ad1facdb95cbac2b846e825c3d1c8468204734a9199090d11640ae9e27aa4f41c'
    )
    expect(transaction.txData.tx.signature.signature).to.eq(
      '67fc9b4c86db57dc640b7149344a7e74acdad5d47e2992f53382695a0e3b8c2300e7dabf0bccba3a1376643121c137502375c71e0ba57c9ebdff521e5fd60102'
    )
  })
})
