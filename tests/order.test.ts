import { expect } from "chai";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { describe } from "mocha";
import { closestPackableTransactionAmount, serializeOrder } from "../src/utils";
import { getWallet } from "./wallet.test";

function u8To16(uint8Array) {
  return Array.prototype.map.call(uint8Array, (x) => ('00' + x.toString(16)).slice(-2)).join('')
}

describe('order', () => {

  it('serializeOrder', () => {
    const serialized = serializeOrder({
      type: 'Order',
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
    console.log(serialized);
    expect(serialized).to.eql(new Uint8Array([
      255,   0,   0,   0,   1,   0,   0, 0, 0, 0,  0,
        1,   0,   2,   0,   0,   0,   0, 0, 0, 0, 13,
      224, 182, 179, 167, 100,   0,   0, 1, 0, 0,  0,
        1,  64,   0,   0,   0,   0,   0, 0, 0, 0,  0,
       31, 255, 255, 255, 255, 255, 255
    ]))
    expect(u8To16(serialized)).to.eq('ff00000001000000000000010002000000000000000de0b6b3a76400000100000001400000000000000000001fffffffffffff')

  })

  it('Wallet has valid address', async function () {
    const key = new Uint8Array(new Array(32).fill(5));
    const wallet = await getWallet(key, 'mainnet');
    expect(wallet.address()).eq('0xd09Ad14080d4b257a819a4f579b8485Be88f086c', 'Wallet address does not match');

    const signedTransaction = await wallet.signSyncOrder({
      accountId: 0,
      slotId: 0,
      nonce: 0,
      basedTokenId: 0,
      quoteTokenId: 1,
      amount: closestPackableTransactionAmount(parseEther('1')),
      price: parseEther('1')
    } as any)

    console.log(signedTransaction);
});

})