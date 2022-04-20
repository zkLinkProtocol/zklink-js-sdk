import { parseEther } from 'ethers/lib/utils';
import { expect } from "chai";
import { BigNumber } from "ethers";
import { describe } from "mocha";
import { serializeForcedExit, serializeOrder, serializeWithdraw } from "../src/utils";
import { getWallet } from "./wallet.test";


describe('forcedExit', () => {
  it('serializeForcedExit', () => {
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
      7,   1,   0,   0,   0,   1,   0,  52, 152, 244, 86,
    100,  82, 112, 238,   0,  52,  65, 223, 130, 199, 24,
    181, 108,  14, 102, 102,   0,   2,  51,  77,   0,  0,
      0,  85,   0,   0,   0,   0,   0,   0,   0,   0,  0,
      0,   0,   0, 255, 255, 255, 255
  ]))
  })

  it('syncForcedExit', async function () {
    const wallet = await getWallet('0x14075e10e53a752ed31bfd4bfa867402b308b791cba8c6ef22d72faab8adff34' as any, 'rinkeby');
    expect(wallet.address()).eq('0x3498F456645270eE003441df82C718b56c0e6666', 'Wallet address does not match');
  
    const transaction = await wallet.signSyncForcedExit({
      chainId: 1,
      subAccountId: 0,
      target: '0x3498F456645270eE003441df82C718b56c0e6666',
      token: 'USDT',
      fee: BigNumber.from(parseEther('0.001'))
    } as any)
    console.log(transaction);
    // expect(transaction.signature.signature).eq('3b995556b9e938297aa76ddf7303a9a34e5e550cac0f7ed8439be840a60be8895dc247fc3019eeccf750754ab404aca5de2be709f542b27e65a9d26075a8d505')

  });

})
