// ESLint v9 flat config
import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import importPlugin from 'eslint-plugin-import'
import globals from 'globals'

export default [
  // Ignore generated/output and template content
  {
    ignores: ['dist/**', 'templates/**', 'package/**']
  },
  // Linter options
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off'
    }
  },
  // Base JS recommended rules
  js.configs.recommended,
  // TS/JS project rules
  {
    files: ['**/*.{ts,tsx,js,mjs,cjs}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.es2022,
        ...globals.node
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin
    },
    rules: {
      // Keep linting lightweight for this CLI repo
      'no-console': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-empty': 'off',
      'no-useless-escape': 'off',
      'no-extra-boolean-cast': 'off',
      'import/order': 'off',
      '@typescript-eslint/no-unused-vars': 'off'
    }
  }
]
