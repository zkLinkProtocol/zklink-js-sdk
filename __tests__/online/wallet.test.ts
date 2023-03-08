import { JsonRpcProvider } from '@ethersproject/providers'
import ethers from 'ethers'
import { Wallet as Web3Wallet } from '@ethersproject/wallet'
import { Provider, Wallet, wallet } from '../../src'
const web3RpcUrl = 'http://192.168.103.107:8545'
const chainId = 10001
const linkRpcUrl = 'http://192.168.103.107:3030'

// Account #19
export const FEE_ADDRESS = '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199'
export const FEE_PK = '0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e'
// Account #1
export const ALICE_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
export const ALICE_PK = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
// Account #2
export const BOB_ADDRESS = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
export const BOB_PK = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'
// Bob is the owner of this account
export const CREATE2_ACCOUNT_ADDRESS_OWNED_BY_BOB = '0x292eE095b94618671dEd594dc5A07bA856789ca4'
export const SUB_ACCOUNT_ID = 0

export const onlineWeb3Provider = new JsonRpcProvider(web3RpcUrl, {
  chainId,
  name: 'local network',
})

export async function getOnlineLinkWallet(pk = ALICE_PK) {
  const onlineWeb3Wallet = new Web3Wallet(pk, onlineWeb3Provider)
  const onlinLinkProvider = await Provider.newHttpProvider(linkRpcUrl)
  const onlineLinkWallet = await Wallet.fromEthSigner(onlineWeb3Wallet, onlinLinkProvider)
  return onlineLinkWallet
}

describe('Online: wallet', () => {
  it('Onlien: wallet address', async () => {
    const wallet = await getOnlineLinkWallet()
    console.log('----------------- pubKey -----------------')
    console.log('pubKey', await wallet.signer?.pubKey())
    console.log('----------------- pubKeyHash -----------------')
    console.log('pubKeyHash', await wallet.signer?.pubKeyHash())
    console.log('----------------- get_support_chains -----------------')
    const contractInfo = wallet.provider.contractInfo
    console.log(contractInfo)
    console.log('----------------- tokens -----------------')
    console.log(wallet.provider.tokenSet)
    console.log('----------------- block_info -----------------')
    const blockInfo = await wallet.provider.getBlockInfo()
    console.log(blockInfo)
    console.log('----------------- account_info_by_address -----------------')
    console.log(await wallet.getAccountState())
    console.log('----------------- account_info_by_id -----------------')
    console.log(await wallet.provider.transport.request('account_info_by_id', [2]))
    console.log('----------------- account_balances without subAccountId -----------------')
    console.log(await wallet.getBalances())
    console.log('----------------- account_balances with subAccountId -----------------')
    console.log(await wallet.getBalances(SUB_ACCOUNT_ID))
    console.log('----------------- account_balances with incorrect subAccountId -----------------')
    console.log(await wallet.getBalances(2))
    console.log('----------------- account_order_slots -----------------')
    console.log(
      await wallet.provider.transport.request('account_order_slots', [wallet.accountId, null])
    )
    console.log('----------------- token_remain -----------------')
    console.log(await wallet.provider.transport.request('token_remain', [17]))
    console.log('----------------- balances_updates -----------------')
    console.log(
      await wallet.provider.transport.request('balances_updates', [
        wallet.accountId,
        SUB_ACCOUNT_ID,
        blockInfo.lastBlockNumber,
      ])
    )
    console.log('----------------- order_nonce_updates -----------------')
    console.log(
      await wallet.provider.transport.request('order_nonce_updates', [
        wallet.accountId,
        SUB_ACCOUNT_ID,
        blockInfo.lastBlockNumber,
      ])
    )

    const isActivated = await wallet.isSigningKeySet()
    console.log('----------------- is activated -----------------')
    console.log(isActivated)
  })
})
