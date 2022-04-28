import { expect } from 'chai'
import { BigNumber, ethers } from 'ethers'
import { Wallet } from '../src/wallet'
import { getTestProvider } from './provider.test'

export async function getTestWallet(
  ethPrivateKey?: Uint8Array,
  network: string = 'mainnet'
): Promise<Wallet> {
  const key = ethPrivateKey || new Uint8Array(new Array(32).fill(5))
  const ethWallet = new ethers.Wallet(key)
  const mockProvider = await getTestProvider()
  const wallet = await Wallet.fromEthSigner(ethWallet, mockProvider)
  return wallet
}
export async function getWalletFromPrivateKey() {
  return await getTestWallet(
    '0x14075e10e53a752ed31bfd4bfa867402b308b791cba8c6ef22d72faab8adff34' as any,
    'rinkeby'
  )
}
describe('Wallet with mock provider', function () {
  it('Wallet has valid address', async function () {
    const key = new Uint8Array(new Array(32).fill(5))
    const wallet = await getTestWallet(key, 'mainnet')
    expect(wallet.address()).eq(
      '0xd09Ad14080d4b257a819a4f579b8485Be88f086c',
      'Wallet address does not match'
    )
    expect(await wallet.signer.pubKeyHash()).eq('sync:05ded0fbbe3c269ed1a8d17b3a9f973ad78be767')
  })

  it('Test Wallet', async function () {
    const wallet = await getWalletFromPrivateKey()
    expect(wallet.address()).eq(
      '0x3498F456645270eE003441df82C718b56c0e6666',
      'Wallet address does not match'
    )
  })

  //     it("Wallet's account info has the same address as the wallet itself", async function () {
  //         const key = new Uint8Array(new Array(32).fill(10));
  //         const wallet = await getWallet(key, 'mainnet');
  //         const accountState = await wallet.getAccountState();
  //         expect(accountState.address).eq(wallet.address(), 'Wallet address does not match the accountState.address');
  //     });

  //     it('Wallet has defined account id', async function () {
  //         const key = new Uint8Array(new Array(32).fill(14));
  //         const wallet = await getWallet(key, 'mainnet');
  //         const accountId = await wallet.getAccountId();
  //         expect(accountId).eq(42, "Wallet's accountId does not match the hardcoded mock value");
  //     });

  //     it('Wallet has expected committed balances', async function () {
  //         const key = new Uint8Array(new Array(32).fill(40));
  //         const wallet = await getWallet(key, 'mainnet');
  //         const balance = await wallet.getBalance('DAI', 'committed');
  //         expect(balance).eql(
  //             BigNumber.from(12345),
  //             "Wallet's committed balance does not match the hardcoded mock value"
  //         );
  //     });

  //     it('Wallet do not have unexpected committed balances', async function () {
  //         const key = new Uint8Array(new Array(32).fill(40));
  //         const wallet = await getWallet(key, 'mainnet');

  //         let thrown = false;
  //         try {
  //             await wallet.getBalance('ETH', 'committed');
  //         } catch {
  //             thrown = true;
  //         }

  //         expect(thrown, 'getBalance call was expected to throw an exception').to.be.true;
  //     });

  //     it('Wallet has expected verified balances', async function () {
  //         const key = new Uint8Array(new Array(32).fill(50));
  //         const wallet = await getWallet(key, 'mainnet');
  //         const balance = await wallet.getBalance('USDC', 'verified');
  //         expect(balance).eql(
  //             BigNumber.from(98765),
  //             "Wallet's committed balance does not match the hardcoded mock value"
  //         );
  //     });

  //     it('Wallet do not have unexpected verified balances', async function () {
  //         const key = new Uint8Array(new Array(32).fill(50));
  //         const wallet = await getWallet(key, 'mainnet');

  //         let thrown = false;
  //         try {
  //             await wallet.getBalance('ETH', 'verified');
  //         } catch {
  //             thrown = true;
  //         }

  //         expect(thrown, 'getBalance call was expected to throw an exception').to.be.true;
  //     });

  //     it("Wallet's signing key checking", async function () {
  //         const key = new Uint8Array(new Array(32).fill(60));
  //         const wallet = await getWallet(key, 'mainnet');
  //         expect(await wallet.isSigningKeySet()).eq(true, "Wallet's signing key is unset");
  //     });
})
