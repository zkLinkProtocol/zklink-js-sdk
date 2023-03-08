import { ethers } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { Provider } from '../../src'
import { Wallet } from '../../src/wallet'

describe('deposit', function () {
  it('deposit eth', async () => {
    const privateKey = '0x5c0d8796562247e1c5610d7288e3050b7f7324426958ba33fbc65a20ede2044b'

    const AvalancheProvider = new ethers.providers.JsonRpcProvider(
      'https://api.avax-test.network/ext/bc/C/rpc',
      {
        name: 'Avalanche Testnet',
        chainId: 43113,
      }
    )
    const ethWallet = new ethers.Wallet(privateKey, AvalancheProvider)
    const provider = await Provider.newHttpProvider('https://dev-gw-v1.zk.link')
    const wallet = await Wallet.fromEthSigner(ethWallet, provider)

    const usdc = '0x2645b73C58702aB81904a6CABdF63340B4ce29D3'
    const tx = await wallet.sendDepositFromEthereum({
      subAccountId: 2,
      depositTo: '0xdddd547fa95ade4ef0c8b517da7889a5f110ea38',
      token: usdc,
      amount: parseEther('0.1'),
      linkChainId: 2,
      mapping: false,
    })
    console.log(tx)
  }, 30000)
})
