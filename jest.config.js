/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/lab01/tsconfig.json' }],
  },
  testMatch: ['<rootDir>/lab01/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  roots: ['<rootDir>'],
};
