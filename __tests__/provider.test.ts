import { expect } from 'chai'
import { getTestProvider } from './utils'
const tokens = require('./tokens/0.json')

describe('Provider tests', function () {
  it('Update token set', async function () {
    const provider = await getTestProvider()
    for (const token of tokens) {
      expect(token.id).to.eq(provider.tokenSet.resolveTokenId(token.symbol), 'unexpected token id')
      expect(token.symbol).to.eq(
        provider.tokenSet.resolveTokenSymbol(token.symbol),
        'unexpected token symbol'
      )
      for (let chainId in token.chains) {
        expect(token.chains[chainId].address).to.includes(
          provider.tokenSet.resolveTokenAddress(token.symbol, Number(chainId))
        )
      }
    }
  })
})
