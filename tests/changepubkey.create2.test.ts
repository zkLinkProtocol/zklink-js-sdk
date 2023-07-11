import { ChangePubKeyEntries } from '../src/types'
import { Wallet as LinkWallet } from '../src/wallet'
import { getTestWallet } from './utils'

describe('Create2 ChangePubKey', () => {
  it('signature', async () => {
    const DeployerAddress = '0x71Eeff03cAe4825E8Aa8647E62296E91176806Ea'
    const AliceAddress = '0xF9690910533F09B98a5c800Bc931747e2677397C'
    const AlicePrivateKey =
      '0x43be0b8bdeccb5a13741c8fd076bf2619bfc9f6dcc43ad6cf965ab489e156ced'
    const AccountMockCodeHash =
      '0x668ee252a9ca183e2ca7813e5c4ccc8791c6a699f097d2d83f24e958ed520c32'

    const wallet = await getTestWallet(AlicePrivateKey as any)

    const create2Data = {
      creatorAddress: DeployerAddress,
      saltArg:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      codeHash: AccountMockCodeHash,
    }
    const create2Wallet = await LinkWallet.fromCreate2Data(
      wallet.signer!,
      wallet.ethSigner,
      create2Data
    )
    expect(create2Wallet.address()).toBe(
      '0x02632c1812cbbcb827ab923a8402fbf3df9df037'
    )
    const entries: ChangePubKeyEntries = {
      ethAuthType: 'EthCREATE2',
      chainId: 2,
      account: '0x62b23B5DfD7dDf643DBaB3Bc475398D5a7e3891f',
      accountId: 15,
      subAccountId: 0,
      fee: '0',
      feeTokenId: 18,
      nonce: 0,
      ts: 1668054154,
      mainContract: '0x0000000000000000000000000000000000000000',
      layerOneChainId: 1,
    }

    const signed = await create2Wallet.signChangePubKey(entries)
    expect(signed.tx.signature).toStrictEqual({
      pubKey:
        '0b3e7d5328193b9cda3d5372cece28be209b4c7c136e734c6261c4fda965e710',
      signature:
        'e0c5a37155760d23e682df94e59f6be11decb38688a5f3b587308732e3d4e729ffc58b972e859687efa61f0045bc4362684107a89c58a162501d8d5e2b09a503',
    })
  })
})
