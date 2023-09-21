import { BigNumber } from 'ethers'
import { TransferEntries, serializeTransfer } from '../../src'
import { getTestWallet } from '../wallet.test'

describe('Transfer', () => {
  const entries: TransferEntries = {
    accountId: 1,
    fromSubAccountId: 1,
    toSubAccountId: 1,
    to: '0x0000000000000000000000000000000000000000',
    tokenId: 1,
    tokenSymbol: 'USD',
    amount: BigNumber.from('1000000000000000000'),
    fee: BigNumber.from('10000000000'),
    ts: 1646101085,
    nonce: 1,
  }

  it('serialize', async () => {
    const wallet = await getTestWallet()
    const data = wallet.getTransferData(entries)
    const serialized = serializeTransfer(data)
    expect(Buffer.from(serialized).toString('hex')).toBe(
      '04000000010100000000000000000000000000000000000000000000000000000000000000000100014a817c80087d0700000001621d825d'
    )
  })

  it('zk signature', async () => {
    const wallet = await getTestWallet()
    const signed = await wallet.signTransfer(entries)
    expect(signed.tx.signature?.signature).toBe(
      '2aa6ebe4695f2c57e79fc284f87098ffefed9d4a53adadcd601b69bc3825511e5c859a5345526e52a77660e993dd92322fef64ad4521847ecd0215b556487902'
    )
  })

  it('eth signature', async () => {
    const wallet = await getTestWallet()
    const signed = await wallet.signTransfer(entries)
    expect(signed.ethereumSignature?.signature).toBe(
      '0x08c9cd25416c871a153e9d51385c28413311e8ed055a195e4f5e8c229244e1a05bab15a9e6eb1cff9a5d237d878c41553215341742779745574a631d89e09a831b'
    )
  })
})
