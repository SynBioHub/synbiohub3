module.exports = {
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true
  },
  plugins: ['simple-import-sort'],
  settings: {
    react: {
      version: 'detect'
    }
  },
  extends: [
    'eslint:recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
    'plugin:sonarjs/recommended',
    'plugin:unicorn/recommended',
    'plugin:security/recommended',
    'plugin:react-hooks/recommended'
  ],
  rules: {
    'no-console': 'error',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    'unicorn/filename-case': 'off',
    'unicorn/no-null': 'off',
    'jsx-a11y/click-events-have-key-events': 'off', // turn on later for accessibility (sbh3)
    'jsx-a11y/interactive-supports-focus': 'off', // turn on later for accessibility (sbh3)
    'jsx-a11y/no-noninteractive-element-interactions': 'off', // turn on later for accessibility (sbh3)
    'jsx-a11y/no-autofocus': 'off' // consider turnning on later for accessibility (sbh3)
  }
};
