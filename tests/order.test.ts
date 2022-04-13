import { expect } from "chai";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { describe } from "mocha";
import { closestPackableTransactionAmount, serializeOrder } from "../src/utils";
import { getWallet } from "./wallet.test";


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
    const wallet = await getWallet('0x14075e10e53a752ed31bfd4bfa867402b308b791cba8c6ef22d72faab8adff34' as any, 'mainnet');
    expect(wallet.address()).eq('0x3498F456645270eE003441df82C718b56c0e6666', 'Wallet address does not match');

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

    expect(signedTransaction.ethereumSignature.signature).eq('0x915d197bad1a7d6c3e840fd62607df97b007f9faa3843639342b62348170e3d700d0cc333d00630de65830d3028abcc81f4f2dc9caf71bcea5a31cc42dd9c2db1c')
    expect(signedTransaction.tx.signature.pubKey).eq('0dd4f603531bd78bbecd005d9e7cc62a794dcfadceffe03e269fbb6b72e9c724')
    expect(signedTransaction.tx.signature.signature).eq('b1aec8a083f02895c3dbcb1bc549f44750cce361a366124ea8ad2f1b1eaa299eec5f947598bc540ebd72cbc116b91cf372d89b00b525d885af46e241b52e4803')
  });

  it('signature order 1', async function () {
    const wallet = await getWallet('0xdf8eaa5f7581d6c04e988932b97366d746c6ab45a61d411503da1f02c41b7351' as any, 'mainnet');
    expect(wallet.address()).eq('0x199AaA230f18432a715528B4091120cdCc7D9779', 'Wallet address does not match');
    expect(await wallet.signer.pubKeyHash()).eq('sync:772d51f4755bcb6254530e0f95e7fcdb03dbea06')
    const signedTransaction = await wallet.signSyncOrder({
      accountId: 4,
      subAccountId: 4,
      slotId: 0,
      nonce: 0,
      basedTokenId: 3,
      quoteTokenId: 2,
      isSell: 0,
      amount: parseEther('1'),
      price: parseEther('1')
    } as any)
    expect(signedTransaction.tx.signature).eql({
      pubKey: 'dad5e08206f93ce40baeecc3d456c4bef90fb66fd28c260fa8c510df0bcd69aa',
      signature: '5ee06ebec1fbf974c6a62878a8fc0db41faa357aefc3f5011c3cc7a81a58ed1eeb78345ebc3bdf91ac65187f6b24efac9e192d24c345ae72f8d03d5ebb412102'
    })
  });
  // it('signature order 2', async function () {
  //   const wallet = await getWallet('0xdf8eaa5f7581d6c04e988932b97366d746c6ab45a61d411503da1f02c41b7351' as any, 'mainnet');
  //   expect(wallet.address()).eq('0x199AaA230f18432a715528B4091120cdCc7D9779', 'Wallet address does not match');

  //   const signedTransaction = await wallet.signSyncOrder({
  //     accountId: 5,
  //     slotId: 0,
  //     nonce: 0,
  //     basedTokenId: 3,
  //     quoteTokenId: 2,
  //     isSell: 1,
  //     amount: parseEther('1'),
  //     price: parseEther('1')
  //   } as any)
  //   console.log(signedTransaction);
  // });

})