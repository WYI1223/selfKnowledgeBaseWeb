import tseslint from 'typescript-eslint';
import js from '@eslint/js';
import globals from 'globals';

export default tseslint.config(
  // Universal recommended (no type-aware)
  js.configs.recommended,

  // Type-aware lint for TS files in apps/*, packages/*, and scripts/
  {
    files: ['apps/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}', 'scripts/**/*.ts'],
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

  // Same max-lines rule for non-typed JS files (config, mjs/cjs tooling)
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
    ignores: [
      '**/dist/**',
      '**/.astro/**',
      '**/.turbo/**',
      '**/node_modules/**',
      // Python virtualenv + tool caches under apps/api ship third-party JS
      // (e.g. urllib3 emscripten worker) that fails our globals lint.
      // .gitignore already excludes these from VCS; mirror that for ESLint.
      '**/.venv/**',
      '**/__pycache__/**',
      '**/.pytest_cache/**',
      '**/.mypy_cache/**',
      '**/.ruff_cache/**',
    ],
  },
);
