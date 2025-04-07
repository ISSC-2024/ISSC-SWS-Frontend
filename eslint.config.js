import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'

export default defineConfig(
  [
    { files: ['**/*.{js,mjs,cjs,ts,vue}'] },
    { files: ['**/*.{js,mjs,cjs,ts,vue}'], languageOptions: { globals: globals.browser } },
    { files: ['**/*.{js,mjs,cjs,ts,vue}'], plugins: { js }, extends: ['js/recommended'] },
    tseslint.configs.recommended,
    pluginVue.configs['flat/essential'],
    { files: ['**/*.vue'], languageOptions: { parserOptions: { parser: tseslint.parser } } },
    { rules: { '@typescript-eslint/no-explicit-any': 'warn', 'vue/require-toggle-inside-transition': 'warn' } },
  ],
  globalIgnores([
    // Ignore node_modules
    'node_modules/**',
    // Ignore .git
    '.git/**',
    // Ignore .vscode
    '.vscode/**',
    // Ignore dist
    'dist/**',
    // Ignore public/unity
    'public/unity/**',
    // Ignore cli
    'cli/**',
    // Ignore .github
    '.github/**',
    // Ignore .husky
    '.husky/**',
    // Ignore .idea
    '.idea/**',
    // Ignore coverage
    'coverage/**',
  ]),
)
