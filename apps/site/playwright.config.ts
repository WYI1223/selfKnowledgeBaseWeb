import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['src/__tests__/**/*.spec.ts', 'playwright/**/*.spec.ts'],
  // Wave 6 cf-25 R3 F7 — `fullyParallel: false` + `workers: 1`. The
  // cf-22 R3 fixture-leak protocol (memory `feedback_we009_*` +
  // `apps/site/playwright/fixtures/sample-blocks-fixture.ts` rule
  // #26) operates on a SHARED on-disk file (`content/notes/sample-blocks/index.mdx`).
  // The protocol's snapshot + restore pattern is correct WITHIN a
  // single worker, but PARALLEL workers writing the same file race
  // each other (one worker's restoreSampleBlocksFixture overwrites
  // another worker's installPersistedOverflowFixture mid-test).
  // Pre-cf-25 the suite was small enough that parallel conflicts
  // were rare; cf-25 added 16 new fixture-touching cases that pushed
  // conflict probability over threshold. Forcing serial execution
  // matches the cf-22 R3 protocol's design assumption.
  //
  // Performance: workers=1 ~= 2-3x slower vs parallel default on CI
  // (4-vCPU runner). Acceptable trade-off for deterministic green
  // builds. Future: extract fixture-mutating specs to a dedicated
  // serial-mode project per Playwright `testProject.workers: 1`
  // (v1.52+) to keep non-mutating specs (theme-toggle, search,
  // visual-smoke baseline) parallel.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4321',
    trace: 'on-first-retry',
    colorScheme: 'light',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // D3 (search index UI) requires `astro build` for `astro-pagefind`'s
    // post-build hook to emit `dist/pagefind/`; `astro dev` skips the
    // hook so SearchBox cannot resolve its runtime + index. Switched
    // from `astro dev` to `astro build && astro preview` so all
    // playwright specs (visual-smoke + search) exercise the same
    // build artifacts they would in production. Pre-build adds ~5s
    // to cold CI runs but unblocks D3 TC3a + TC3b.
    command: 'pnpm exec astro build && pnpm exec astro preview --host 127.0.0.1 --port 4321',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI,
    // 240s headroom across build + preview boot on cold runner
    // (build typically 5–10s; preview boot <1s; vite optimization
    // happens during build).
    timeout: 240_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
