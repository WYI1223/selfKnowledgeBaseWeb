/// <reference types="vitest/config" />

import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    environment: 'happy-dom',
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
    // Run apps/site build once (globalSetup) so every parallel worker
    // can read dist/. Without this, sample-blocks-page.test.ts and
    // lazy-chunking.test.ts both invoke execSync('pnpm build') from
    // beforeAll and race each other on `rm -rf dist`; search-ui.test.ts
    // races them both for read access. Single shared build = no race.
    globalSetup: ['./vitest.global-setup.ts'],
  },
});
