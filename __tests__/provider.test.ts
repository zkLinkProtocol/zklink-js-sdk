import { getTestProvider } from './utils'
const tokens = require('./tokens/0.json')

describe('Provider tests', function () {
  it('Update token set', async function () {
    const provider = await getTestProvider()
    for (const token of tokens) {
      expect(token.id).toBe(provider.tokenSet.resolveTokenId(token.symbol))
      expect(token.symbol).toBe(provider.tokenSet.resolveTokenSymbol(token.symbol))
      for (let chainId in token.chains) {
        expect(token.chains[chainId].address).toBe(
          provider.tokenSet.resolveTokenAddress(token.symbol, Number(chainId))
        )
      }
    }
  })
})
