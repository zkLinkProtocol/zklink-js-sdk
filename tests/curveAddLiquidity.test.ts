import { BigNumber } from '@ethersproject/bignumber'
import { expect } from 'chai'
import {
  numberToBytesBE,
  serializeCurveAddLiquidity,
  serializeOrder,
  serializeTimestamp,
} from '../src/utils'

describe('curve add liquidity', () => {
  it('serializeCurveAddLiquidity', () => {
    // const serialized = serializeCurveAddLiquidity({
    //   account: "0x3498F456645270eE003441df82C718b56c0e6666",
    //   amounts: [BigNumber.from("1000000000000000000"), BigNumber.from("2000000000000000000"), BigNumber.from("3000000000000000000"), BigNumber.from("4000000000000000000")],
    //   collectFees: [],
    //   fee: BigNumber.from("0"),
    //   feeToken: 4,
    //   lpQuantity: BigNumber.from("0"),
    //   minLpQuantity: BigNumber.from("0"),
    //   nonce: 1,
    //   pairAddress: "0x7b57d974abde4a29093dec235d9fa64ce9f96553",
    //   tokens: [4, 4, 4, 4],
    //   type: "L2CurveAddLiq",
    //   validFrom: 0,
    //   validUntil: 4294967295
    // })
    // expect(serialized).to.eql(new Uint8Array([
    //     9,  52, 152, 244,  86, 100,  82, 112, 238,   0,  52, 65,
    //   223, 130, 199,  24, 181, 108,  14, 102, 102,   0,   4,  0,
    //     4,   0,   4,   0,   4,  74, 129, 124, 128,   8, 149,  2,
    //   249,   0,   8, 223, 132, 117, 128,   8,  29, 205, 101,  0,
    //     9,   0,   0,   0,   0,   0,   0,   4,   0,   0,   0,  0,
    //     0,   1,   0,   0,   0,   0,   0,   0,   0,   0,   0,  0,
    //     0,   0, 255, 255, 255, 255,   0,   0,   0,   0
    // ]))
  })
})
