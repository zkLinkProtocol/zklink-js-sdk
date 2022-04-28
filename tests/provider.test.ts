import { expect } from 'chai'
import { Provider } from '../src/provider'
const tokens = require('./tokens/0.json')

export async function getTestProvider(network: string = 'mainnet') {
  const key = new Uint8Array(new Array(32).fill(5))
  const provider = await Provider.newMockProvider(network, key, () => tokens)
  return provider
}

describe('Provider tests', function () {
  it('Update token set', async function () {
    const provider = await getTestProvider()
    for (const token of tokens) {
      expect(token.id).to.eq(provider.tokenSet.resolveTokenId(token.symbol))
      expect(token.symbol).to.eq(provider.tokenSet.resolveTokenSymbol(token.symbol))
      expect(token.address).to.includes(
        provider.tokenSet.resolveTokenAddress(token.symbol, token.chains[0])
      )
    }
  })
})
