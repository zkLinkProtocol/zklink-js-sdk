import { expect } from "chai";
import { BigNumber, Wallet } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { describe } from "mocha";
import { closestPackableTransactionAmount, serializeAddress, serializeAmountPacked, serializeFeePacked, serializeOrder, serializeTimestamp, serializeTokenId } from "../src/utils";

describe('serialize', function () {
  it('serializeAddress', () => {
    const key = new Uint8Array(new Array(32).fill(5));
    const wallet = new Wallet(key)
    expect(serializeAddress(wallet.address)).eql(new Uint8Array([
      208, 154, 209, 64, 128, 212,
      178,  87, 168, 25, 164, 245,
      121, 184,  72, 91, 232, 143,
        8, 108
    ]))
  })

  it('serializeFeeAmount', () => {

    console.log(serializeAmountPacked(parseEther('10000'))) 
  })
})