import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // v7 of eslint-plugin-react-hooks added this rule. The codebase has many
      // intentional setState-on-mount patterns (useIsMobile, useMounted, viewport
      // detection); fixing each properly is a separate refactor track.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      // Vite-specific HMR rule — not relevant for a published library where files
      // can mix component exports with constants/types.
      'react-refresh/only-export-components': 'off',
      // Pre-existing `any` usage; downgrade until a typed refactor pass.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
])
