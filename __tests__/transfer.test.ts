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
      ts: 1646101085,
      nonce: 1,
    })

    expect(transaction.txData.ethereumSignature.signature).toBe(
      '0x6d0d198993f9f4ed5bd25405689b5d50c0a6f0a7a4f3501518bec32598719eae4cccfec6c4b8b7bc97b09823f78500b7619a86d34beb7bb6453f8f1c7ba2c0b41b'
    )
    expect(transaction.txData.tx.signature.signature).toBe(
      'e308239849ab967f1a3e8300d7fd5373606b11d369287ad10aa04de2130dcb83cb978a1f586c7f9e9b44b8d2a82131ccb425dac0543329b3acedc9b53b97b905'
    )
  })
})
