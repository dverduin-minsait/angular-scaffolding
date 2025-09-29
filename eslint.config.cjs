// Flat ESLint config for ESLint v9+
// Includes custom rule to enforce ButtonDirective import when using appButton
const tsParser = require('@typescript-eslint/parser');
const pluginTs = require('@typescript-eslint/eslint-plugin');
const angularEslint = require('@angular-eslint/eslint-plugin');
const angularTemplate = require('@angular-eslint/eslint-plugin-template');
const appCustom = require('./eslint-rules/plugin');

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  {
    files: ['**/*.ts'],
    ignores: ['dist/**','coverage/**','node_modules/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        sourceType: 'module',
        ecmaVersion: 2022
      }
    },
    plugins: {
      '@typescript-eslint': pluginTs,
      '@angular-eslint': angularEslint,
      'app-custom': appCustom
    },
    rules: {
      ...pluginTs.configs['recommended-type-checked'].rules,
      ...angularEslint.configs['recommended'].rules,
      'app-custom/app-button-import': 'error'
    }
  },
  {
    files: ['**/*.html'],
    plugins: { '@angular-eslint/template': angularTemplate },
    rules: {
      // Add template rules here if needed
    }
  }
];
