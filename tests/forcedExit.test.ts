import { parseEther } from 'ethers/lib/utils'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { describe } from 'mocha'
import { serializeForcedExit, serializeOrder, serializeWithdraw } from '../src/utils'
import { getTestWallet } from './wallet.test'

describe('forcedExit', () => {
  it('serializeForcedExit', () => {
    const serialized = serializeForcedExit({
      type: 'ForcedExit',
      toChainId: 1,
      subAccountId: 0,
      initiatorAccountId: 1,
      target: '0x3498F456645270eE003441df82C718b56c0e6666',
      fee: BigNumber.from('4100000000000000'),
      nonce: 85,
      validFrom: 0,
      validUntil: 4294967295,
      token: 2,
      ts: 1649749979,
    })
    expect(serialized).eql(
      new Uint8Array([
        7, 1, 0, 0, 0, 1, 0, 52, 152, 244, 86, 100, 82, 112, 238, 0, 52, 65, 223, 130, 199, 24, 181,
        108, 14, 102, 102, 0, 2, 51, 77, 0, 0, 0, 85, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255,
        255, 255, 98, 85, 47, 219,
      ])
    )
  })

  it('syncForcedExit', async function () {
    const wallet = await getTestWallet()

    const transaction = await wallet.syncForcedExit({
      toChainId: 1,
      subAccountId: 0,
      target: '0x3498F456645270eE003441df82C718b56c0e6666',
      token: 'USDT',
      fee: BigNumber.from(parseEther('0.001')),
      ts: 1649749979,
    } as any)
    expect(transaction.txData.tx.signature.signature).eq(
      'f85b3d2dfe42aa94da12cfaf1be01433fcc962fdc3d2b86c52c93a2c0d9793a1e409a2682fd77e41c5f603686a24480f4b4722b63d7da8e74245188d78e40803'
    )
  })
})
