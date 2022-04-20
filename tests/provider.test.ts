import { expect } from 'chai';
import { Provider } from '../src/provider';
const tokens = require('./tokens/0.json')

describe('Provider tests', function () {
    it('Update token set', async function () {
        const key = new Uint8Array(new Array(32).fill(5));

        const provider = await Provider.newMockProvider('mainnet', key, () => tokens);

        // for (const token of tokens) {
        //     const resolvedToken = {
        //         symbol: provider.tokenSet.resolveTokenSymbol(token.symbol),
        //         decimals: provider.tokenSet.resolveTokenDecimals(token.symbol),
        //         address: provider.tokenSet.resolveTokenAddress(token.symbol),
        //         // name is not stored in tokenSet, so we just have to copy it
        //     };
        //     // expect(resolvedToken).to.eql(token, 'Token set has not been updated');
        // }
    });
});
