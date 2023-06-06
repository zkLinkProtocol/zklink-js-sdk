import { ErrorCode } from '@ethersproject/logger'
import { BigNumber, BigNumberish, Contract, ContractTransaction, ethers } from 'ethers'
import { Provider } from './provider'
import { Address } from './types'
import {
  ERC20_APPROVE_TRESHOLD,
  IERC20_INTERFACE,
  MAIN_CONTRACT_INTERFACE,
  MAX_ERC20_APPROVE_AMOUNT,
  ZKL_CONTRACT_INTERFACE,
  isTokenETH,
} from './utils'
import { ETHOperation } from './wallet'

const EthersErrorCode = ErrorCode

export class LinkContract {
  constructor(public provider: Provider, public ethSigner: ethers.Signer) {}

  connect(provider: Provider) {
    this.provider = provider
    return this
  }

  static fromEthSigner(provider: Provider, ethSigner: ethers.Signer) {
    return new LinkContract(provider, ethSigner)
  }

  async getMainContract(linkChainId: number) {
    const contractAddress = await this.provider.getContractInfoByChainId(linkChainId)
    return new ethers.Contract(
      contractAddress.mainContract,
      MAIN_CONTRACT_INTERFACE,
      this.ethSigner
    )
  }

  getZKLContract(contractAddress) {
    return new ethers.Contract(contractAddress, ZKL_CONTRACT_INTERFACE, this.ethSigner)
  }

  async isERC20DepositsApproved(
    tokenAddress: Address,
    accountAddress: Address,
    linkChainId: number,
    erc20ApproveThreshold: BigNumber = ERC20_APPROVE_TRESHOLD
  ): Promise<boolean> {
    if (isTokenETH(tokenAddress)) {
      throw Error('ETH token does not need approval.')
    }
    const erc20contract = new Contract(tokenAddress, IERC20_INTERFACE, this.ethSigner)
    const contractAddress = await this.provider.getContractInfoByChainId(linkChainId)
    try {
      const currentAllowance = await erc20contract.allowance(
        accountAddress,
        contractAddress.mainContract
      )
      return BigNumber.from(currentAllowance).gte(erc20ApproveThreshold)
    } catch (e) {
      this.modifyEthersError(e)
    }
  }

  async approveERC20TokenDeposits(
    tokenAddress: Address,
    linkChainId: number,
    max_erc20_approve_amount: BigNumber = MAX_ERC20_APPROVE_AMOUNT
  ): Promise<ContractTransaction> {
    if (isTokenETH(tokenAddress)) {
      throw Error('ETH token does not need approval.')
    }
    const erc20contract = new Contract(tokenAddress, IERC20_INTERFACE, this.ethSigner)
    const contractAddress = await this.provider.getContractInfoByChainId(linkChainId)

    try {
      return erc20contract.approve(contractAddress.mainContract, max_erc20_approve_amount)
    } catch (e) {
      this.modifyEthersError(e)
    }
  }

  async getPendingBalance(pending: {
    account: Address
    tokenAddress: Address
    linkChainId: number
  }): Promise<BigNumber> {
    const exitContract = await this.getMainContract(pending.linkChainId)
    const balance = await exitContract.getPendingBalance(pending.account, pending.tokenAddress)
    return BigNumber.from(balance)
  }
  async getPendingBalances(pending: {
    account: Address
    tokenAddresses: Address[]
    linkChainId: number
  }): Promise<BigNumber[]> {
    const exitContract = await this.getMainContract(pending.linkChainId)
    const balances = await exitContract.getPendingBalances(pending.account, pending.tokenAddresses)
    return balances
  }

  async withdrawPendingBalance(withdraw: {
    account: Address
    tokenAddress: Address
    amount: BigNumberish
    linkChainId: number
  }): Promise<ETHOperation> {
    const exitContract = await this.getMainContract(withdraw.linkChainId)
    const ethTransaction = await exitContract.withdrawPendingBalance(
      withdraw.account,
      withdraw.tokenAddress,
      BigNumber.from(withdraw.amount)
    )
    return new ETHOperation(ethTransaction, this.provider)
  }

  async withdrawMultiplePendingBalance(withdraw: {
    account: Address
    tokenAddresses: Address[]
    amounts: BigNumberish[]
    linkChainId: number
  }): Promise<ETHOperation> {
    const exitContract = await this.getMainContract(withdraw.linkChainId)
    const ethTransaction = await exitContract.withdrawMultiplePendingBalance(
      withdraw.account,
      withdraw.tokenAddresses,
      withdraw.amounts
    )
    return new ETHOperation(ethTransaction, this.provider)
  }

  private modifyEthersError(error: any): never {
    // List of errors that can be caused by user's actions, which have to be forwarded as-is.
    const correct_errors = [
      EthersErrorCode.NONCE_EXPIRED,
      EthersErrorCode.INSUFFICIENT_FUNDS,
      EthersErrorCode.REPLACEMENT_UNDERPRICED,
      EthersErrorCode.UNPREDICTABLE_GAS_LIMIT,
    ]
    if (!correct_errors.includes(error.code)) {
      // This is an error which we don't expect
      error.message = `Ethereum smart wallet JSON RPC server returned the following error while executing an operation: "${error.message}". Please contact your smart wallet support for help.`
    }

    throw error
  }
}
