import { expect } from 'chai'
import { BigNumber, constants, ethers } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { Wallet } from '../src'
import { getFastSwapUNonce, MAX_UNONCE } from '../src/utils'
import { Provider } from './../src/provider'
import account from './accounts/main'
const tokens = require('./tokens/0.json')

describe('fast swap', () => {
  // const web3Provider = new ethers.providers.JsonRpcProvider('https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', {
  //   name: 'Goerli',
  //   chainId: 5,
  // })
  // const web3Wallet = new ethers.Wallet(account.privateKey, web3Provider)
  // it('getFastSwapUNonce', async () => {
  //   const unonce = getFastSwapUNonce()
  //   expect(unonce).lessThan(MAX_UNONCE + 1)
  //   expect(unonce).greaterThan(0)
  // })
  // it('fastSwapAccepts', async () => {
  //   const syncProvider = await Provider.newHttpProvider('http://39.98.119.16:30000/rpc', '3');
  //   const unonce = getFastSwapUNonce()
  //   const r = await syncProvider.fastSwapAccepts({
  //     receiver: account.address,
  //     tokenId: 1,
  //     amount: parseEther('1'),
  //     withdrawFee: 100,
  //     ethSigner: web3Wallet,
  //     uNonce: unonce,
  //   })
  //   console.log('accepts address', r);
  //   expect(r).to.eq(constants.AddressZero)
  // })
  // it('fastSwapUNonce', async () => {
  //   const syncProvider = await Provider.newHttpProvider('http://39.98.119.16:30000/rpc', '3');
  //   const r = await syncProvider.fastSwapUNonce({
  //     receiver: account.address,
  //     tokenId: 1,
  //     amount: parseEther('1'),
  //     withdrawFee: 100,
  //     ethSigner: web3Wallet,
  //   })
  //   console.log('uNonce', r);
  //   expect(r).lessThan(MAX_UNONCE + 1)
  //   expect(r).greaterThan(0)
  // })
  // it('fastSwapUNonce', async () => {
  //   const syncProvider = await Provider.newHttpProvider('http://39.98.119.16:30000/rpc', '3');
  //   // const payload = {
  //   //   fromChainId: 0,
  //   //   toChainId: 1,
  //   //   from,
  //   //   to,
  //   //   tokenId0,
  //   //   token0,
  //   //   tokenId1,
  //   //   token1,
  //   //   amountIn: closestPackableTransactionAmount(parseToken18(amountIn)),
  //   //   amountOutMin: closestPackableTransactionAmount(parseToken18(amountOut)),
  //   //   withdrawFee,
  //   //   ethSigner,
  //   // }
  //   // const r = await syncProvider.fastSwapUNonce({
  //   //   receiver: account.address,
  //   //   tokenId: 1,
  //   //   amount: parseEther('1'),
  //   //   withdrawFee: 100,
  //   //   ethSigner: web3Wallet,
  //   // })
  //   // console.log('uNonce', r);
  //   // expect(r).lessThan(MAX_UNONCE + 1)
  //   // expect(r).greaterThan(0)
  // })
})
