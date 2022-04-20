import { expect } from "chai";
import { BigNumber } from "ethers";
import { describe } from "mocha";
import { serializeForcedExit, serializeOrder, serializeWithdraw } from "../src/utils";
import { getWallet } from "./wallet.test";


describe('withdraw', () => {
  it('serializeWithdraw', () => {
    const serialized = serializeForcedExit({
      type: 'ForcedExit',
      chainId: 1,
      subAccountId: 0,
      initiatorAccountId: 1,
      target: '0x3498F456645270eE003441df82C718b56c0e6666',
      fee: BigNumber.from('4100000000000000'),
      nonce: 85,
      validFrom: 0,
      validUntil: 4294967295,
      token: 2
    })
    expect(serialized).eql(new Uint8Array([
        3,   3,   0,   0,   0,   1,   1,  52, 152, 244,  86, 100,
      82, 112, 238,   0,  52,  65, 223, 130, 199,  24, 181, 108,
      14, 102, 102,  61, 128, 158,  65,  75, 164, 137,  55,   9,
      200,  95,  36,  43, 163,  97, 116, 129, 188,  65,  38,   0,
        2,   0,   0,   0,   0,   0,   0,   0,   5, 107, 184, 205,
      63, 191, 123, 192,   0,  51,  77,   0,   0,   0,  85,   1,
        0,  50,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
        0,   0, 255, 255, 255, 255,  98,  85,  47, 219
    ]))
  })

  it('serializeWithdraw', async function () {
    const wallet = await getWallet('0x14075e10e53a752ed31bfd4bfa867402b308b791cba8c6ef22d72faab8adff34' as any, 'rinkeby');
    expect(wallet.address()).eq('0x3498F456645270eE003441df82C718b56c0e6666', 'Wallet address does not match');
  
    const transaction = await wallet.signWithdrawFromSyncToEthereum({
      chainId: 3,
      accountId: 1,
      subAccountId: 1,
      amount: BigNumber.from('99995900000000000000'),
      to: "0x3d809e414ba4893709c85f242ba3617481bc4126",
      fastWithdraw: 1,
      fee: BigNumber.from('4100000000000000'),
      nonce: 85,
      token: "USDT",
      tokenId: 2,
      ts: 1649749979,
      validFrom: 0,
      validUntil: 4294967295,
      withdrawFeeRatio: 50
    } as any)
    expect(transaction.tx.signature.signature).eq('3b995556b9e938297aa76ddf7303a9a34e5e550cac0f7ed8439be840a60be8895dc247fc3019eeccf750754ab404aca5de2be709f542b27e65a9d26075a8d505')

  });

})
