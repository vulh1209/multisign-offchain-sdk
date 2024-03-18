module.exports = {
  parserOptions: {
    project: './tsconfig.json',
  },
  extends: ['plugin:@next/next/recommended', '../../.eslintrc.js'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/forbid-prop-types': 'off',
    'react/jsx-filename-extension': 'off',
    'react/function-component-definition': 'off',
    'react/no-unescaped-entities': 'off',
  },
};
