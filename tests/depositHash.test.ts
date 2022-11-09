import { ethers } from 'ethers'
import { arrayify, sha256, toUtf8Bytes } from 'ethers/lib/utils'

describe('Eth hash to SyncTxHash', () => {
  it('sync-tx', async () => {
    const serialId = 0
    const ethHash = '0x88e2a08488e03d7c5c6795c26429c5f8d4988a487df75ac79156b94379454a36'
    const bytes = ethers.utils.concat([arrayify(serialId), ethHash])

    const r = sha256(bytes)

    expect(r).toBe('0xac2147a10a548cd6e5a383c41d02964039267182ba13c116e40d17703219e32b')
  })
})
