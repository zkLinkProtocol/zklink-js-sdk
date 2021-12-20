import { BigNumber } from "@ethersproject/bignumber"
import { serializeCurveAddLiquidity } from "../src/utils"


describe('serialize', () => {
  it('', () => {
    const serialized = serializeCurveAddLiquidity({
      account: "0x3498F456645270eE003441df82C718b56c0e6666",
      amounts: [BigNumber.from("1000000000000000000"), BigNumber.from("2000000000000000000"), BigNumber.from("3000000000000000000"), BigNumber.from("4000000000000000000")],
      chains: [1, 2, 3, 4],
      collectFees: [],
      fee: BigNumber.from("0"),
      feeToken: 4,
      fromChain: 1,
      lpQuantity: BigNumber.from("0"),
      minLpQuantity: BigNumber.from("0"),
      nonce: 1,
      pairAddress: "0x7b57d974abde4a29093dec235d9fa64ce9f96553",
      tokens: [4, 4, 4, 4],
      type: "L2CurveAddLiq",
      validFrom: 0,
      validUntil: 4294967295
    })
    console.log(serialized);
  })
})