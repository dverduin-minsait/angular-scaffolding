// Flat ESLint config for ESLint v9+
// Includes custom rule to enforce ButtonDirective import when using appButton
const tsParser = require('@typescript-eslint/parser');
const pluginTs = require('@typescript-eslint/eslint-plugin');
const angularEslint = require('@angular-eslint/eslint-plugin');
const angularTemplate = require('@angular-eslint/eslint-plugin-template');
const angularTemplateParser = require('@angular-eslint/template-parser');
const appCustom = require('./eslint-rules/plugin');

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  {
    files: ['src/**/*.ts', 'eslint-rules/**/*.ts'],
    ignores: ['dist/**','coverage/**','node_modules/**', '**/*.spec.ts'],
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
      
      // Custom application rules
      'app-custom/app-button-import': 'error',
      'app-custom/signal-naming-convention': ['warn', {
        'exported': 'Signal',
        'private': 'underscore', 
        'computed': 'descriptive'
      }],
      'app-custom/signals-over-rxjs': 'warn',
      'app-custom/prefer-barrel-imports': 'warn',
      'app-custom/component-max-lines': ['warn', { 'max': 350, 'skipBlankLines': true }],
      'app-custom/no-business-logic-in-components': 'warn',
      
      // Enhanced TypeScript rules for signals
      '@typescript-eslint/prefer-readonly': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { 
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_' 
      }],
      '@typescript-eslint/explicit-function-return-type': ['warn', {
        'allowExpressions': true,
        'allowTypedFunctionExpressions': true
      }]
    }
  },
  {
    files: ['*.config.ts', 'vitest.config.ts'],
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2022
      }
    },
    plugins: {
      '@typescript-eslint': pluginTs
    },
    rules: {
      ...pluginTs.configs['recommended'].rules,
      '@typescript-eslint/no-unused-vars': ['error', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_'
      }]
    }
  },
  {
    files: ['**/*.html'],
    languageOptions: {
      parser: angularTemplateParser
    },
    plugins: { '@angular-eslint/template': angularTemplate },
    rules: {
      // Add template rules here if needed
      '@angular-eslint/template/no-negated-async': 'error',
      '@angular-eslint/template/banana-in-box': 'error',
      '@angular-eslint/template/no-any': 'warn'
    }
  }
];
