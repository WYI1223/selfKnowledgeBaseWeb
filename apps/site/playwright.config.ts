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
    // Skip the pnpm script wrapper and invoke astro directly so signal
    // forwarding and stdio piping go straight from Playwright to astro
    // (pnpm-as-middleman has been observed to swallow ready-state output
    // on slow CI runners, causing Playwright's URL polling to time out
    // even though the server is up).
    command: 'pnpm exec astro dev --host 127.0.0.1 --port 4321',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI,
    // 120s was tight on cold CI runners (vite dep optimization + content
    // sync on a fresh ~/.cache). 240s gives headroom; if it still trips,
    // the stdout pipe below will surface the real cause in CI logs.
    timeout: 240_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
