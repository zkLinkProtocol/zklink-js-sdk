import { ChangePubKeyEntries } from '../src/types'
import { Wallet as LinkWallet } from '../src/wallet'
import { getTestWallet } from './utils'

describe('Create2 ChangePubKey', () => {
  it('signature', async () => {
    const DeployerAddress = '0x71Eeff03cAe4825E8Aa8647E62296E91176806Ea'
    const AliceAddress = '0xF9690910533F09B98a5c800Bc931747e2677397C'
    const AlicePrivateKey = '0x43be0b8bdeccb5a13741c8fd076bf2619bfc9f6dcc43ad6cf965ab489e156ced'
    const AccountMockCodeHash = '0x668ee252a9ca183e2ca7813e5c4ccc8791c6a699f097d2d83f24e958ed520c32'

    const wallet = await getTestWallet(AlicePrivateKey as any)

    const create2Data = {
      creatorAddress: DeployerAddress,
      saltArg: '0x0000000000000000000000000000000000000000000000000000000000000000',
      codeHash: AccountMockCodeHash,
    }
    const create2Wallet = await LinkWallet.fromCreate2Data(
      wallet.signer!,
      wallet.ethSigner,
      wallet.provider,
      create2Data
    )
    expect(create2Wallet.address()).toBe('0x31a6b64a162b7e6f8efdf59c0b6f26b60006e040')
    const entries: ChangePubKeyEntries = {
      ethAuthType: 'EthCREATE2',
      chainId: 2,
      account: '0x62b23B5DfD7dDf643DBaB3Bc475398D5a7e3891f',
      accountId: 15,
      subAccountId: 0,
      feeToken: 18,
      nonce: 0,
      ts: 1668054154,
    }

    const signed = await create2Wallet.signChangePubKey(entries)
    expect(signed.tx.signature).toStrictEqual({
      pubKey: '5e1e8f2a972cb702dc55df70310018d63251e6e7698c7079886e3dc07fbb5ea8',
      signature:
        '2eaee8e13f4a0a342d109fd0363491e56063caa6f1044b3c866bd5cf2ed710960175a77c3a000d54652fac61d370a6f4965757c8f324cb1ad7640e2f7d149404',
    })
  })
})
