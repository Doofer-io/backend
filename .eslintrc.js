module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'prettier'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'prettier',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'prettier/prettier': 'error',
    'no-console': 'warn',
    'no-debugger': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/ban-types': 'warn',
    '@typescript-eslint/no-empty-interface': 'warn',
    'prefer-const': 'warn',
    'no-var': 'error',
    eqeqeq: ['error', 'always'], // требует использования === и !==
    'no-multi-spaces': 'error', // запрещает несколько пробелов на одном уровне
    'no-redeclare': 'error', // запрещает повторное объявление переменной
    'no-return-await': 'error', // запрещает ненужное использование await при возврате промиса
    'no-shadow': 'error', // запрещает переопределение переменных
    'no-use-before-define': 'error', // запрещает использование переменных, функций, классов и т.д. до их объявления
    'no-useless-return': 'error', // запрещает бессмысленные return
    'no-async-promise-executor': 'error', // запрещает использование async функции в качестве параметра для new Promise
    'prefer-promise-reject-errors': 'error', // требует использование Error объектов как Promise отказов
  },
};
