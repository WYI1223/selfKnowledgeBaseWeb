import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

// Astro preview spawns playwright from apps/site/, so resolve against
// the monorepo root (one level up from apps/site/) when writing audit
// archives — D9.5's screenshot_archive paths are workspace-relative.
const SCREENSHOT_PATH = resolve(
  process.cwd(),
  '../../docs/audits/screenshots/wave-6-stage-b-3-read-route.png',
);

/**
 * Wave 6 Stage B.3 e2e_smoke: validates the ApiAdapter contract against
 * the real Astro preview server (Node adapter + per-route prerender=false
 * endpoint shipped in PR #99). ADR-0011 D9.1 path-pattern audit fires on
 * `packages/editor-shell/src/save-adapter.ts` change so this spec satisfies
 * the D9.2 e2e_smoke + D9.5 screenshot-archive obligations for B.3.
 *
 * Coverage:
 *   - GET /api/notes/<slug> against an existing note returns the
 *     NoteState shape ApiAdapter.load() consumes
 *   - GET /api/notes/<missing> returns 404 with the JSON error envelope
 *     ApiAdapter.load() reads to resolve null
 *   - The read-route /notes/<slug> renders with the persisted MDX body
 *     (screenshot for D9.5 archive)
 *
 * POST roundtrip is intentionally NOT exercised at B.3 to avoid mutating
 * the `content/notes/sample-mdx-note/index.mdx` fixture. POST coverage
 * lives in:
 *   - packages/editor-shell/src/__tests__/api-adapter.test.ts (mocked fetch)
 *   - apps/site/src/pages/api/notes/__tests__/notes-endpoint.test.ts (mocked fs)
 * Full edit→save→reload-read-route Playwright coverage lands at B.5 close.
 */

test('ApiAdapter GET against /api/notes/sample-mdx-note returns NoteState shape', async ({
  request,
}) => {
  const res = await request.get('/api/notes/sample-mdx-note');
  expect(res.status()).toBe(200);

  const body = (await res.json()) as {
    mdxSource: string;
    lastModified: number;
    version: number;
  };
  expect(typeof body.mdxSource).toBe('string');
  expect(body.mdxSource.length).toBeGreaterThan(0);
  expect(typeof body.lastModified).toBe('number');
  expect(Number.isFinite(body.lastModified)).toBe(true);
  expect(typeof body.version).toBe('number');
  expect(body.version).toBeGreaterThanOrEqual(1);
});

test('ApiAdapter GET against missing slug returns 404 with JSON error envelope', async ({
  request,
}) => {
  const res = await request.get('/api/notes/__definitely_missing_slug__');
  expect(res.status()).toBe(404);

  const body = (await res.json()) as { ok: boolean; error: string };
  expect(body.ok).toBe(false);
  expect(typeof body.error).toBe('string');
});

test('read-route /notes/sample-mdx-note still renders the persisted MDX body', async ({
  page,
}) => {
  const response = await page.goto('/notes/sample-mdx-note');
  expect(response?.status()).toBe(200);

  // Note-specific assertions: the H1 from frontmatter `title` AND a known
  // body string that only appears in this fixture's MDX content. A 404 page
  // would not satisfy either. Catches the trivial-screenshot trap.
  await expect(page.getByRole('heading', { level: 1, name: 'Sample MDX Note' })).toBeVisible();
  await expect(page.getByText('Track A 烟测页面')).toBeVisible();

  await page.screenshot({ fullPage: true, path: SCREENSHOT_PATH });
});
