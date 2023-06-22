import { BigNumber } from 'ethers'
import {
  closestGreaterOrEqPackableTransactionAmount,
  closestGreaterOrEqPackableTransactionFee,
  closestPackableTransactionAmount,
  closestPackableTransactionFee,
  isTransactionAmountPackable,
  isTransactionFeePackable,
} from '../src/utils'

describe('Packing and unpacking', function () {
  it('Test basic fee packing/unpacking', function () {
    let nums = ['0', '1', '2', '2047000', '1000000000000000000000000000000000']
    for (let num of nums) {
      const bigNumberAmount = BigNumber.from(num)
      expect(closestPackableTransactionFee(bigNumberAmount).toString()).toBe(
        bigNumberAmount.toString()
      )
      expect(closestGreaterOrEqPackableTransactionFee(bigNumberAmount).toString()).toBe(
        bigNumberAmount.toString()
      )
      expect(isTransactionAmountPackable(bigNumberAmount)).toBe(true)
      expect(closestPackableTransactionAmount(bigNumberAmount).toString()).toBe(
        bigNumberAmount.toString()
      )
      expect(closestGreaterOrEqPackableTransactionAmount(bigNumberAmount).toString()).toBe(
        bigNumberAmount.toString()
      )
      expect(isTransactionFeePackable(bigNumberAmount)).toBe(true)
    }
    expect(closestPackableTransactionFee('2048').toString()).toBe('2047')
    expect(closestGreaterOrEqPackableTransactionFee('2048').toString()).toBe('2050')
  })
})
