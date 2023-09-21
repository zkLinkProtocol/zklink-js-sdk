import { hexlify } from 'ethers/lib/utils'
import { ContractData, ContractMatchingData } from '../../src/types'
import {
  TxType,
  serializeContract,
  serializeContractMatching,
} from '../../src/utils'
import { getTestWallet } from '../wallet.test'

const data = {
  type: 9,
  maker: [
    {
      size: '300000000000000000',
      nonce: 2,
      price: '41000000000000000000000',
      slotId: 1,
      feeRates: [20, 10],
      pairId: 3,
      accountId: 101,
      direction: 0,
      signature: {
        pubKey:
          '77aa48808967258ac4c115ab14249a4d0b9888360bfb0079ab981822195b3d0c',
        signature:
          '571f3ba33118d8b7332acb3b3656e20dc7c0cd1a9b4a8fbf4f226335b8c1e70439eccf68f18c14245b47805388a70c0b0e55a4f10c423da8b60d27fcaaffd602',
      },
      subAccountId: 1,
    },
  ],
  taker: {
    size: '200000000000000000',
    nonce: 9,
    price: '42000000000000000000000',
    slotId: 1,
    feeRates: [20, 10],
    pairId: 3,
    accountId: 100,
    direction: 1,
    signature: {
      pubKey:
        '77aa48808967258ac4c115ab14249a4d0b9888360bfb0079ab981822195b3d0c',
      signature:
        '300d8c8566642757a18e70ed20d9d173f4248bd473c61f04a59a6165e712561a8b4bed11104bd0ef48c9e32c7bb988e930a63fb91fb589714bf3a1114716e100',
    },
    subAccountId: 1,
  },
  fee: '1',
  accountId: 0,
  signature: {
    pubKey: '191f5a474b7b8af67e4338c169b16093a8662bd9fd825b88ec97f987e6453e1c',
    signature:
      '828284cd88f648b9253a14b900207e32d5dc73add49acf604c22ae7e03b3f3906d009b5bebd6b1e5f6604743521200c9e060697bf4fcc2f00607da7178713000',
  },
  feeToken: 1,
  subAccountId: 1,
}

describe('Contract Transaction', () => {
  it('serialize maker', () => {
    const bytes = serializeContract(data.maker[0] as ContractData)
    // bytes: [254, 0, 0, 0, 101, 1, 0, 1, 0, 0, 2, 3, 0, 223, 132, 117, 128, 7, 0, 0, 0, 0, 0, 8, 174, 157, 76, 212, 176, 167, 160, 0, 0, 20, 10]
    expect(hexlify(bytes)).toBe(
      '0xfe000000650100010000020300df84758007000000000008ae9d4cd4b0a7a00000140a'
    )
  })

  it('sign maker', async () => {
    const wallet = await getTestWallet()
    const signedTransaction = await wallet.signContract(data.maker[0] as any)
    expect(signedTransaction?.tx?.signature?.pubKey).toBe(
      '77aa48808967258ac4c115ab14249a4d0b9888360bfb0079ab981822195b3d0c'
    )
    expect(signedTransaction?.tx?.signature?.signature).toBe(
      '571f3ba33118d8b7332acb3b3656e20dc7c0cd1a9b4a8fbf4f226335b8c1e70439eccf68f18c14245b47805388a70c0b0e55a4f10c423da8b60d27fcaaffd602'
    )
  })

  it('serialize taker', () => {
    const bytes = serializeContract(data.taker as ContractData)
    // bytes: [254, 0, 0, 0, 100, 1, 0, 1, 0, 0, 9, 3, 1, 149, 2, 249, 0, 7, 0, 0, 0, 0, 0, 8, 228, 211, 22, 130, 118, 134, 64, 0, 0, 20, 10]
    expect(hexlify(bytes)).toBe(
      '0xfe0000006401000100000903019502f90007000000000008e4d316827686400000140a'
    )
  })

  it('sign taker', async () => {
    const wallet = await getTestWallet()
    const signedTransaction = await wallet.signContract(data.taker as any)
    expect(signedTransaction?.tx?.signature?.pubKey).toBe(
      '77aa48808967258ac4c115ab14249a4d0b9888360bfb0079ab981822195b3d0c'
    )
    expect(signedTransaction?.tx?.signature?.signature).toBe(
      '300d8c8566642757a18e70ed20d9d173f4248bd473c61f04a59a6165e712561a8b4bed11104bd0ef48c9e32c7bb988e930a63fb91fb589714bf3a1114716e100'
    )
  })

  it('serialize ContractMatching', async () => {
    const bytes = await serializeContractMatching(data as any)
    // bytes: [9, 0, 0, 0, 0, 1, 68, 185, 138, 42, 155, 175, 87, 117, 255, 137, 104, 36, 73, 89, 134, 163, 253, 66, 129, 169, 143, 32, 150, 252, 10, 78, 166, 53, 10, 133, 128, 0, 1, 0, 32]
    expect(hexlify(bytes)).toBe(
      '0x09000000000144b98a2a9baf5775ff896824495986a3fd4281a98f2096fc0a4ea6350a858000010020'
    )
  })

  it('sign ContractMatching', async () => {
    const wallet = await getTestWallet()
    const signedTransaction = await wallet.signContractMatching(data as any)
    const tx = signedTransaction.tx as ContractMatchingData
    const ethereumSignature = signedTransaction.ethereumSignature
    expect(tx.type).toBe(TxType.ContractMatching)
    expect(tx.maker).toBeInstanceOf(Array)
    expect(typeof tx.taker.size).toBe('string')
    expect(typeof tx.taker.price).toBe('string')
    expect(tx.signature?.signature).toBe(
      '1aaa8bf030524f6ea62d7ad009b4507e2a477f090d63b0bcc8da0f6330d5bdab50d9de89e9c631e0c74549ce4d6d140c72d78218984ad63ac46c88d80cf50601'
    )
    expect(ethereumSignature?.signature).toBe(
      '0x27ab5fd0b367e440fb7c9ad48bb675a365504b1fd857f16638d0d9782040ad5f2233da9177f01177d2d1bd8b28d47b4cefa05961a9adceb656e1ba548374807c1c'
    )
  })
})
