module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './packages/**/tsconfig.json',
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import', 'prettier', 'simple-import-sort'],
  extends: [
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      node: {},
      typescript: {},
    },
  },
  rules: {
    // import
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          // Side effect imports.
          ['^\\u0000'],
          // Node.js builtins.
          [`^(${require('module').builtinModules.join('|')})(/|$)`],
          // Packages. `react` related packages come first.
          ['^react', '^\\w', '^@\\w'],
          // Type
          [`^(@@types)(/.*|$)`],
          // Internal packages.
          [
            `^(@|${[
              '@api',
              '@assets',
              '@components',
              '@constant',
              '@hooks',
              '@pages',
              '@providers',
              '@routes',
              '@sdk',
              '@services',
              '@utils',
              '@core',
              '@models',
              '@modules',
              'src',
              'public',
            ].join('|')})(/.*|$)`,
          ],
          // Parent imports. Put `..` last.
          ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
          // Other relative imports. Put same-folder imports and `.` last.
          ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
          // Style imports.
          ['^.+\\.s?css$'],
        ],
      },
    ],
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
    'simple-import-sort/exports': 'error',
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'error',
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    'import/no-cycle': 'off',

    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-use-before-define': ['error'],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: ['classProperty'],
        format: ['camelCase', 'snake_case', 'PascalCase'],
        leadingUnderscore: 'allow',
        trailingUnderscore: 'allow',
      },
    ],

    // others
    'no-shadow': 'off', // no need, @typescript-eslint include it
    'no-unused-vars': 'off', // no need, @typescript-eslint include it
    'no-use-before-define': 'off', // no need, @typescript-eslint include it
    'no-nested-ternary': 'off',
    'no-underscore-dangle': 'off',
    'no-plusplus': 'off',
    'no-param-reassign': 'off',
    'consistent-return': 'off',
    'max-classes-per-file': 'off',
    camelcase: 'off', // no need
  },
};
