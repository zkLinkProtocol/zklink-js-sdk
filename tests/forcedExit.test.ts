import { parseEther } from 'ethers/lib/utils';
import { expect } from "chai";
import { BigNumber } from "ethers";
import { describe } from "mocha";
import { serializeForcedExit, serializeOrder, serializeWithdraw } from "../src/utils";
import { getTestWallet } from "./wallet.test";


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
    const wallet = await getTestWallet()
  
    const transaction = await wallet.syncForcedExit({
      chainId: 1,
      subAccountId: 0,
      target: '0x3498F456645270eE003441df82C718b56c0e6666',
      token: 'USDT',
      fee: BigNumber.from(parseEther('0.001'))
    } as any)
    expect(transaction.txData.tx.signature.signature).eq('96a3199a1a0d1e5238ae33cb23b01f36d7f9abf65fe059e1ceea520ebcbc88a7871ed28c47da962e84e90f52dcf69c182e136ffff92fc49a64a4f65423dd0400')

  });

})
