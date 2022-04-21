import { expect } from "chai";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { describe } from "mocha";
import { closestPackableTransactionAmount, serializeOrder } from "../src/utils";
import { getTestWallet } from "./wallet.test";


describe('order', () => {

  it('serializeOrder', () => {
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
      validUntil: 9007199254740991
    })
    expect(serialized).eql(new Uint8Array([
      255,   0,   0,   0,   1,   1,   0,   0, 0, 0, 0,
        0,   1,   0,   2,   0,   0,   0,   0, 0, 0, 0,
       13, 224, 182, 179, 167, 100,   0,   0, 1, 0, 0,
        0,   1,  64,   0,   0,   0,   0,   0, 0, 0, 0,
        0,  31, 255, 255, 255, 255, 255, 255
    ]))
    
    expect(Buffer.from(serialized).toString('hex')).eq('ff0000000101000000000000010002000000000000000de0b6b3a76400000100000001400000000000000000001fffffffffffff')

  })

  it('signature order', async function () {
    const wallet = await getTestWallet()
    const signedTransaction = await wallet.signSyncOrder({
      accountId: 4,
      subAccountId: 4,
      slotId: 0,
      nonce: 0,
      basedTokenId: 3,
      quoteTokenId: 2,
      isSell: 0,
      amount: closestPackableTransactionAmount(parseEther('1')),
      price: parseEther('1')
    } as any)

    expect(signedTransaction.ethereumSignature.signature).eq('0x1efd9e668351d47d5b20c446a2cdd0840dfee67e3a32fd1a7f7d7eb71784fa045b2e482c8fa9462c4df6351caa9a874fd2180301754cf7954c001c78341b28171c')
    expect(signedTransaction.tx.signature.pubKey).eq('167850be112e16a992d27c6119e05ec8aee2b45446b79b1c969a48352d626aa5')
    expect(signedTransaction.tx.signature.signature).eq('3bb0235fe8c1e22380d82ac40316b86c4744fca7a92a13996b13c734b70fdc06381d653dfcbcb33369957ec4719cd1e848805c9b9e7781b4208715abd1ae0805')
  });

})