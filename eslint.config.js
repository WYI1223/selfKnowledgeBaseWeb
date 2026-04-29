import tseslint from 'typescript-eslint';
import js from '@eslint/js';
import globals from 'globals';

export default tseslint.config(
  // Universal recommended (no type-aware)
  js.configs.recommended,

  // Type-aware lint ONLY for TS files in apps/* and packages/*
  {
    files: ['apps/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Same max-lines rule for non-typed files (config, scripts) without type-aware
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Test files exempt
  {
    files: ['**/*.test.{ts,tsx,js,mjs}'],
    rules: { 'max-lines': 'off' },
  },

  {
    ignores: ['**/dist/**', '**/.astro/**', '**/.turbo/**', '**/node_modules/**'],
  },
);
