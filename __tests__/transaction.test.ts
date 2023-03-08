import { expect } from 'chai'
import { Transaction } from '../src/wallet'
import { getTestProvider } from './utils'

describe('Transaction', () => {
  it('Transaction getTxReceipt', async () => {
    const provider = await getTestProvider()
    const receipt = await provider.getTxReceipt(
      'sync-tx:4221afe405566e4b057d36060e6a5d33151a10a1b9b00da71705e534b6646f22'
    )
    expect(receipt.block).to.eq(3947)
    expect(receipt.success).to.eq(true)
  })

  it('Construction transaction', async () => {
    const provider = await getTestProvider()
    const transaction = new Transaction(
      {},
      'sync-tx:4221afe405566e4b057d36060e6a5d33151a10a1b9b00da71705e534b6646f22',
      provider
    )
    const receipt = await transaction.awaitReceipt()
    expect(receipt.block).to.eq(3947)
    expect(receipt.success).to.eq(true)
  })
})
