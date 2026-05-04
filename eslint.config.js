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
      // Stage A retro item 4 (Wave 4 B4): allow `_`-prefix args/vars to
      // signal intentional unused parameters per JS/TS convention; mirror
      // typescript-eslint defaults via explicit configuration.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
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

  // apps/site overrides: disable type-aware unsafe-* rules.
  //
  // Astro's virtual modules (`astro:content`, `astro/loaders`) and the
  // generated `.astro/types.d.ts` are only resolvable after `astro sync` /
  // `astro check` / `astro build` has run. CI / fresh checkouts may lint
  // before those run, so root eslint's projectService falls back to
  // unresolved types and floods `no-unsafe-*` errors on otherwise-correct
  // code. apps/site has its own `astro check && tsc --noEmit` gate (see
  // `apps/site/package.json#scripts.typecheck`), so type safety is not lost.
  {
    files: ['apps/site/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },

  // tailwind.config.ts + astro.config.mjs are build-tooling configuration;
  // type-aware lint adds no value and routinely trips on Tailwind's preset
  // typings + Astro integration types. Disable type-checked rules entirely.
  {
    files: ['apps/site/tailwind.config.ts', 'apps/site/astro.config.mjs'],
    ...tseslint.configs.disableTypeChecked,
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
