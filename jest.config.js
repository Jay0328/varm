const rootDir = __dirname;

module.exports = {
  transform: {
    '^.+\\.[tj]s$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: `${rootDir}/tsconfig.json`,
    },
    __DEV__: true,
    __VERSION__: require('./package.json').version,
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    '^@varm/(.*?)$': `${rootDir}/packages/$1/src`,
    '__fixtures__/(.*?)$': `${rootDir}/__fixtures__/$1`,
  },
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/'],
  coveragePathIgnorePatterns: ['/node_modules/'],
};
