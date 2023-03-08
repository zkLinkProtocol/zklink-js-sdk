import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { getTestWallet } from './utils'

describe('transfer', () => {
  it('transfer signature', async function () {
    const wallet = await getTestWallet()
    const transaction = await wallet.sendTransfer({
      fromSubAccountId: 6,
      toSubAccountId: 6,
      to: '0x3498F456645270eE003441df82C718b56c0e6666',
      token: 1,
      amount: BigNumber.from('1000000000000000000'),
      fee: BigNumber.from('10000000000'),
      ts: 1646101085,
      nonce: 1,
    })

    expect(transaction.txData.ethereumSignature.signature).to.eq(
      '0xf75af5b8223c5e8afa1814e0e74c891ee9ed5f0e7cd0544c463aa33a4859fb8c1ad1facdb95cbac2b846e825c3d1c8468204734a9199090d11640ae9e27aa4f41c'
    )
    expect(transaction.txData.tx.signature.signature).to.eq(
      '296419b36bee95903233d94ee913684076b51c92bae67ebf22efb0da612bc0222ff2ac598c68d3d8519700f5687cd61fa80e2747fa95c146e8f523d733078102'
    )
  })
})
