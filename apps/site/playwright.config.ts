import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['src/__tests__/**/*.spec.ts', 'playwright/**/*.spec.ts'],
  fullyParallel: true,
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
