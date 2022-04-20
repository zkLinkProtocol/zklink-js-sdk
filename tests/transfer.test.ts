import { expect } from "chai";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { describe } from "mocha";
import { closestPackableTransactionAmount, serializeOrder } from "../src/utils";
import { getWallet } from "./wallet.test";


describe('transfer', () => {

  it('transfer signature', async function () {
    const wallet = await getWallet('0x14075e10e53a752ed31bfd4bfa867402b308b791cba8c6ef22d72faab8adff34' as any, 'rinkeby');
    expect(wallet.address()).eq('0x3498F456645270eE003441df82C718b56c0e6666', 'Wallet address does not match');
    const transaction = await wallet.syncTransfer({
      fromSubAccountId: 6,
      toSubAccountId: 6,
      to: "0x3498F456645270eE003441df82C718b56c0e6666",
      token: "USDT",
      tokenId: 2,
      amount: BigNumber.from('1000000000000000000'),
      fee: BigNumber.from('10000000000')
    } as any)

    expect(transaction.txData.ethereumSignature.signature).eq('0x4a47b294d2f9f56cb54a266e197bd8827164bcbd6f529ac8ee983e2d07a54c177ea2e2515780829e7db47db7e187c32598568a8d51a12dd4678564cf4484ebbf1c')

  });

})
