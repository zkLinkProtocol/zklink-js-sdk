import { expect } from "chai";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { describe } from "mocha";
import { closestPackableTransactionAmount, serializeOrder, serializeOrderMatching } from "../src/utils";
import { getTestWallet, getWalletFromPrivateKey } from "./wallet.test";

describe('OrderMatching', () => {

  it('serialize', async () => {
    const serialized = await serializeOrderMatching({
      type: 'OrderMatching',
      accountId: 1,
      account: '0x3c205ce80bae33700b8a0448a9fbe5b5e5d6b38f',
      fee: BigNumber.from('0'),
      feeToken: 1,
      nonce: 0,
      validFrom: 0,
      validUntil: 9007199254740991,
      maker: {
        type: 'Order',
        subAccountId: 1,
        accountId: 1,
        slotId: 0,
        nonce: 0,
        basedTokenId: 1,
        quoteTokenId: 2,
        price: BigNumber.from('1'),
        amount: BigNumber.from('5'),
        isSell: 0,
        validFrom: 0,
        validUntil: 9007199254740991
      },
      taker: {
        type: 'Order',
        subAccountId: 1,
        accountId: 1,
        slotId: 1,
        nonce: 0,
        basedTokenId: 1,
        quoteTokenId: 2,
        price: BigNumber.from('1'),
        amount: BigNumber.from('5'),
        isSell: 1,
        validFrom: 0,
        validUntil: 9007199254740991
      },
    })
    
    expect(Buffer.from(serialized).toString('hex')).eq('0b000000013c205ce80bae33700b8a0448a9fbe5b5e5d6b38fef66ebd6f587fc7a9954c104383c7fe85e693716d0b35a269f666e614985fd00010000')

  })

  it('signature', async function () {
    const wallet = await getWalletFromPrivateKey()
    const signedTransaction = await wallet.signSyncOrderMatching({
      type: 'OrderMatching',
      accountId: 1,
      account: '0x3c205ce80bae33700b8a0448a9fbe5b5e5d6b38f',
      fee: BigNumber.from('0'),
      feeToken: 1,
      nonce: 0,
      validFrom: 0,
      validUntil: 9007199254740991,
      maker: {
        type: 'Order',
        subAccountId: 1,
        accountId: 1,
        slotId: 0,
        nonce: 0,
        basedTokenId: 1,
        quoteTokenId: 2,
        price: BigNumber.from('1'),
        amount: BigNumber.from('5'),
        isSell: 0,
        validFrom: 0,
        validUntil: 9007199254740991
      },
      taker: {
        type: 'Order',
        subAccountId: 1,
        accountId: 1,
        slotId: 1,
        nonce: 0,
        basedTokenId: 1,
        quoteTokenId: 2,
        price: BigNumber.from('1'),
        amount: BigNumber.from('5'),
        isSell: 1,
        validFrom: 0,
        validUntil: 9007199254740991
      }
    } as any)
    console.log(signedTransaction);
    expect(signedTransaction.ethereumSignature.signature).eq('0x073c5819f823ff5081c308a4ec96398d3df25a73704d1fd4e5cd7de350b2c16602c0d1a1f01037ae0d664b88d277b9b330ed9344b796f13214fe1f73a65d2b4a1c')
    expect(signedTransaction.tx.signature.pubKey).eq("0dd4f603531bd78bbecd005d9e7cc62a794dcfadceffe03e269fbb6b72e9c724")
    expect(signedTransaction.tx.signature.signature).eq('07708b0d80e25857852299289dd14329946eabff770dc5b114e7bb9f26b1d2237385f2bedc4b52d30fb0a29e8beb56186529a7a4fd1d7a9ec806d86f13912203')
  });

})