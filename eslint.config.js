const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  ...expoConfig,
  prettierConfig,
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // React Native has no HTML renderer — unescaped entities are fine
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    ignores: ['node_modules/', '.expo/', 'dist/', 'db/migrations/migrations.js'],
  },
];
