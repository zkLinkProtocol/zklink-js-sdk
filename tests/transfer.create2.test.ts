import { Wallet as LinkWallet } from '../src/wallet'
import { Provider as LinkProvider } from '../src/provider'
import { Wallet } from '@ethersproject/wallet'
import { BigNumber, providers, utils } from 'ethers'
import { ChangePubKeyEntries, TransferEntries } from '../src/types'
import { parseEther } from 'ethers/lib/utils'
import { getWallet } from './wallet.test'
import { getOnlineLinkWallet } from './online/wallet'

describe('Create2 Transfer', () => {
  it('signature', async () => {
    const DeployerAddress = '0x71Eeff03cAe4825E8Aa8647E62296E91176806Ea'
    const AliceAddress = '0xF9690910533F09B98a5c800Bc931747e2677397C'
    const AlicePrivateKey = '0x43be0b8bdeccb5a13741c8fd076bf2619bfc9f6dcc43ad6cf965ab489e156ced'
    const AccountMockCodeHash = '0x668ee252a9ca183e2ca7813e5c4ccc8791c6a699f097d2d83f24e958ed520c32'

    const wallet = await getOnlineLinkWallet(AlicePrivateKey)
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
    const entries: TransferEntries = {
      fromSubAccountId: 0,
      toSubAccountId: 0,
      to: '0x41d2c5c3699f15f37fda93586a9233ce54e2e5b4',
      token: 18,
      amount: BigNumber.from('2000000000000000'),
      nonce: 1,
      ts: 1668061052,
      fee: BigNumber.from('216000000000000'),
    }

    const signed = await create2Wallet.signTransfer(entries)

    expect(signed.ethereumSignature).toStrictEqual({
      type: 'EIP1271Signature',
      signature:
        '0xf1dc8955302b3dc5f164947e4301ef3a71f4566c04080432e28db882e4f7c76d0ec588abc104e4acc4169d028193dd122b8b4ed93db5f7d33e882b92ba28c7ef1b',
    })

    expect(signed.tx.signature).toStrictEqual({
      pubKey: '5e1e8f2a972cb702dc55df70310018d63251e6e7698c7079886e3dc07fbb5ea8',
      signature:
        'd83104d0c31e65ed0f763b0e8a08c99d40d647d45fa526c0e94217182b03f5ae6c1650125ab74d22dbc563110977e602b246d299ef3781661605e75b8e438b04',
    })
  })
})
