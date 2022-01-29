module.exports = {
  transform: {
    '^.+\\.[tj]s$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/../../tsconfig.json',
    },
    __DEV__: true,
    __VERSION__: require('./package.json').version,
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    /**
     * Since `<rootDir>` will be packages/*.
     */
    '^@mono/(.*?)$': '<rootDir>/../$1/src',
  },
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/'],
  coveragePathIgnorePatterns: ['/node_modules/'],
};
