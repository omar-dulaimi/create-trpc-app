// ESLint v9 flat config
import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import importPlugin from 'eslint-plugin-import'

export default [
  // Ignore generated/output and template content
  {
    ignores: ['dist/**', 'templates/**', 'package/**']
  },
  // Base JS recommended rules
  js.configs.recommended,
  // TS/JS project rules
  {
    files: ['**/*.{ts,tsx,js}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module'
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin
    },
    rules: {
      'no-console': 'off',
      'import/order': ['warn', { 'newlines-between': 'always' }],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ]
    }
  }
]
