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
    const signedTransaction = await wallet.signSyncTransfer({
      accountId: 6,
      amount: BigNumber.from('998000000000000000'),
      chainId: "3",
      fee: BigNumber.from('2000000000000000'),
      fromChainId: 3,
      nonce: 1,
      to: "0x3498F456645270eE003441df82C718b56c0e6666",
      toChainId: 3,
      token: "USDT",
      tokenId: 2,
      ts: 1645007804,
      validFrom: 0,
      validUntil: 4294967295
    } as any)

  });

})
