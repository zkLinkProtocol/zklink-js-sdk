import { expect } from 'chai'
import {
  closestGreaterOrEqPackableTransactionAmount,
  closestGreaterOrEqPackableTransactionFee,
  closestPackableTransactionAmount,
  closestPackableTransactionFee,
  isTransactionAmountPackable,
  isTransactionFeePackable,
} from '../src/utils'
import { BigNumber } from 'ethers'

describe('Packing and unpacking', function () {
  it('Test basic fee packing/unpacking', function () {
    let nums = ['0', '1', '2', '2047000', '1000000000000000000000000000000000']
    for (let num of nums) {
      const bigNumberAmount = BigNumber.from(num)
      expect(closestPackableTransactionFee(bigNumberAmount).toString()).equal(
        bigNumberAmount.toString(),
        'fee packing'
      )
      expect(closestGreaterOrEqPackableTransactionFee(bigNumberAmount).toString()).equal(
        bigNumberAmount.toString(),
        'fee packing up'
      )
      expect(isTransactionAmountPackable(bigNumberAmount), 'check amount pack').eq(true)
      expect(closestPackableTransactionAmount(bigNumberAmount).toString()).equal(
        bigNumberAmount.toString(),
        'amount packing'
      )
      expect(closestGreaterOrEqPackableTransactionAmount(bigNumberAmount).toString()).equal(
        bigNumberAmount.toString(),
        'amount packing up'
      )
      expect(isTransactionFeePackable(bigNumberAmount), 'check fee pack').eq(true)
    }
    expect(closestPackableTransactionFee('2048').toString()).equal('2047', 'fee packing')
    expect(closestGreaterOrEqPackableTransactionFee('2048').toString()).equal(
      '2050',
      'fee packing up'
    )
  })
})
