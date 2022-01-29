module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: ['eslint:recommended', 'plugin:import/recommended', 'plugin:prettier/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      legacyDecorators: true,
    },
  },
  overrides: [
    {
      files: ['**/*{.js,.jsx}'],
      rules: {
        'no-unused-vars': [
          2,
          {
            varsIgnorePattern: '^_',
            argsIgnorePattern: '^_',
            ignoreRestSiblings: true,
          },
        ],
      },
    },
    {
      files: ['**/*{.ts,.tsx}'],
      parserOptions: {
        project: ['tsconfig.json', 'packages/*/tsconfig.json'],
      },
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:import/typescript',
      ],
      settings: {
        'import/resolver': {
          typescript: {
            alwaysTryTypes: true,
            project: ['tsconfig.json', 'packages/*/tsconfig.json'],
          },
        },
      },
      rules: {
        '@typescript-eslint/explicit-function-return-type': 0,
        '@typescript-eslint/no-unused-vars': [
          2,
          {
            varsIgnorePattern: '^_',
            argsIgnorePattern: '^_',
            ignoreRestSiblings: true,
          },
        ],
      },
    },
    {
      files: ['**/*.config.js', '**/*.{test,spec}{.js,.jsx,.ts,.tsx}'],
      env: {
        jest: true,
      },
      extends: ['plugin:jest/recommended'],
      rules: {
        '@typescript-eslint/ban-ts-ignore': 0,
        '@typescript-eslint/no-var-requires': 0,
      },
    },
    {
      files: ['scripts/**/*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 0,
      },
    },
  ],
};
