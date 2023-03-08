import { ethers } from 'ethers'
import { arrayify, sha256, toUtf8Bytes } from 'ethers/lib/utils'
import { numberToBytesBE } from '../src/utils'

describe('EthHash to SyncTxHash', () => {
  it('compute hash', async () => {
    const serialId = 0
    const ethHash = '0x1558a4ebb18b35e61642b00213f785eac14c0d588838c49d286581a6530c4fa0'
    const bytes = ethers.utils.concat([numberToBytesBE(serialId, 8), arrayify(ethHash)])
    const r = sha256(bytes)
    expect(r).toBe('0x08040c5fbbac965e3ed5ff99f72adf5fd4ea017fb4785dde5436d84d5420b13b')
  })
})
