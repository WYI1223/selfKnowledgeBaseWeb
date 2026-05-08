import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

/**
 * Wave 6 Stage B.4 e2e_smoke: validates that EditorShellMount.tsx now
 * issues `ApiAdapter` GET (load) + POST (save) against the path-(b)
 * endpoint shipped at PR #99 — closing the user-reported "/notes/<slug>
 * and /notes/<slug>/edit don't sync" gap that was the entire reason
 * Wave 6 Stage B exists.
 *
 * Strategy:
 *   - intercept the POST to /api/notes/<slug> with a route handler so the
 *     test does not mutate `content/notes/sample-mdx-note/index.mdx`
 *     across runs (CI safety; idempotency)
 *   - assert the GET hits the endpoint at mount time
 *   - assert a POST is dispatched after the 800ms debounce when the user
 *     edits, with a NoteState body matching the freeze in ADR-0018 D8
 *
 * Full edit→save→reload-read-route Playwright flow lands at B.5 (Stage B
 * close) — that one needs to commit the actual save against a dedicated
 * test fixture so we can verify the read route reflects it.
 */

const SCREENSHOT_PATH = resolve(
  process.cwd(),
  '../../docs/audits/screenshots/wave-6-stage-b-4-edit-mount-wire.png',
);

test('EditorShellMount issues GET + POST against /api/notes/<slug> via ApiAdapter primary', async ({
  page,
}) => {
  const apiCalls: { method: string; url: string; postBody?: unknown }[] = [];

  // Let the GET pass through to the real endpoint (so the mount loads the
  // existing note's mdxSource), but stub the POST so we don't mutate the
  // sample-mdx-note fixture file. Stubbed POST returns the same { ok: true }
  // shape the real endpoint emits.
  await page.route('**/api/notes/**', async (route) => {
    const request = route.request();
    const method = request.method();
    if (method === 'POST') {
      let postBody: unknown = null;
      try {
        postBody = JSON.parse(request.postData() ?? '{}');
      } catch {
        postBody = null;
      }
      apiCalls.push({ method, postBody, url: request.url() });
      await route.fulfill({
        body: JSON.stringify({ ok: true }),
        contentType: 'application/json',
        status: 200,
      });
      return;
    }
    apiCalls.push({ method, url: request.url() });
    await route.continue();
  });

  await page.goto('/notes/sample-mdx-note/edit');

  // Wait for the Tiptap editor to mount (matches the C.4-1 e2e pattern).
  await expect(page.locator('.ProseMirror').first()).toBeVisible({ timeout: 10_000 });

  // Wait for the GET load to complete — the ready/load chain in
  // EditorShellMount.tsx fires on mount before the editor becomes
  // visible, so by this point the GET has already been observed.
  await expect
    .poll(() => apiCalls.some((c) => c.method === 'GET'), { timeout: 10_000 })
    .toBe(true);
  const getCall = apiCalls.find((c) => c.method === 'GET');
  expect(getCall?.url).toContain('/api/notes/sample-mdx-note');

  // Type into the editor to trigger the 800ms debounce save chain.
  await page.locator('.ProseMirror').first().click();
  await page.keyboard.type(' edit-mount-wire-smoke');

  // Wait up to 5s for the POST. The mount's debounce is 800ms; allow
  // headroom for slow CI runners.
  await expect.poll(() => apiCalls.some((c) => c.method === 'POST'), { timeout: 5_000 }).toBe(true);

  const postCall = apiCalls.find((c) => c.method === 'POST');
  expect(postCall?.url).toContain('/api/notes/sample-mdx-note');

  // The POST body must match the ADR-0018 D8 NoteState freeze:
  // mdxSource: string, lastModified: number, version: number.
  const body = postCall?.postBody as Record<string, unknown> | null;
  expect(body).not.toBeNull();
  expect(typeof body?.mdxSource).toBe('string');
  expect(typeof body?.lastModified).toBe('number');
  expect(typeof body?.version).toBe('number');

  await page.screenshot({ fullPage: true, path: SCREENSHOT_PATH });
});
