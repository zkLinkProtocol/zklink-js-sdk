module.exports = {
  watchAll: false,
  transform: {
    '^.+\\.(t|j)s?$': [
      '@swc-node/jest',
    ],
  },
}