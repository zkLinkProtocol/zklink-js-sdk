/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  watchAll: false,
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  testPathIgnorePatterns: [
    "__tests__/online/"
  ]
};