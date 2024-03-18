module.exports = {
  parserOptions: {
    project: './tsconfig.json',
  },
  extends: ['airbnb-base', 'airbnb-typescript/base', '../../.eslintrc.js'],
  rules: {
    'class-methods-use-this': 'off',
  },
};
