import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { describe } from 'mocha'
import { closestPackableTransactionAmount, serializeOrder } from '../src/utils'
import { getTestWallet, getWalletFromPrivateKey } from './wallet.test'

describe('Order', () => {
  it('serialize', () => {
    const serialized = serializeOrder({
      type: 'Order',
      subAccountId: 1,
      accountId: 1,
      slotId: 0,
      nonce: 0,
      basedTokenId: 1,
      quoteTokenId: 2,
      price: BigNumber.from(Math.pow(10, 18) + ''),
      amount: BigNumber.from(10),
      isSell: 1,
      validFrom: 0,
      validUntil: 9007199254740991,
    })
    expect(serialized).eql(
      new Uint8Array([
        255, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 13, 224, 182, 179, 167,
        100, 0, 0, 1, 0, 0, 0, 1, 64, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 255, 255, 255, 255, 255, 255,
      ])
    )

    expect(Buffer.from(serialized).toString('hex')).eq(
      'ff0000000101000000000000010002000000000000000de0b6b3a76400000100000001400000000000000000001fffffffffffff'
    )
  })

  it('signature', async function () {
    const wallet = await getWalletFromPrivateKey()
    const signedTransaction = await wallet.signSyncOrder({
      accountId: 13,
      subAccountId: 1,
      slotId: 0,
      nonce: 0,
      basedTokenId: 3,
      quoteTokenId: 4,
      isSell: 0,
      amount: closestPackableTransactionAmount(parseEther('2')),
      price: parseEther('1'),
    } as any)

    // expect(signedTransaction.ethereumSignature.signature).eq('0x1efd9e668351d47d5b20c446a2cdd0840dfee67e3a32fd1a7f7d7eb71784fa045b2e482c8fa9462c4df6351caa9a874fd2180301754cf7954c001c78341b28171c')
    expect(signedTransaction.tx.signature.pubKey).eq(
      '0dd4f603531bd78bbecd005d9e7cc62a794dcfadceffe03e269fbb6b72e9c724'
    )
    expect(signedTransaction.tx.signature.signature).eq(
      '6823c7911bdbb394569ddb194b70bd85f9fbd4459f09749e6abf0f206d4a708d241e623ca4e9f5f5c22fd059ce136252ad530c91d9a6e20f282668b09599dd03'
    )
  })
})
