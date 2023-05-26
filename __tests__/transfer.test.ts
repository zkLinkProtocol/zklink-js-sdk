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
      '99d27127b8fd7c852663c257f8a1cc8c5f24243695fcc07743a42406f1ec378252680aad30a48d4a932e37201e4d765ffad4001cf8be8f15dc1281af23bfb501'
    )
  })
})
