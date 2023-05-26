import { serializeAddress } from '../src/utils'

describe('address length', () => {
  it('pad zero', () => {
    const previous = serializeAddress('0x3498F456645270eE003441df82C718b56c0e6666')
    expect(Buffer.from(previous).toString('hex')).toBe(
      '0000000000000000000000003498f456645270ee003441df82c718b56c0e6666'
    )
  })
})
