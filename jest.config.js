module.exports = {
  modulePathIgnorePatterns: [],
  transform: {
    '^.+\\.(t|j)s?$': [
      '@swc-node/jest',
    ],
  },
}