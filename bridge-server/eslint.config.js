import js from '@eslint/js';
import globals from 'globals';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { prettier: prettierPlugin },
    languageOptions: {
      globals: globals.node,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      ...js.configs.recommended.rules, // include recommended ESLint rules
      ...prettierConfig.rules, // turn off rules that conflict with Prettier
      'prettier/prettier': 'error', // enforce Prettier as an ESLint error
      'no-console': 'off', // allow console.log (useful for servers)
    },
  },
]);
