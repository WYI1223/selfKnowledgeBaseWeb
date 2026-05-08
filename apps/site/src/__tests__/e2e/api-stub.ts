import type { Page } from '@playwright/test';

/**
 * Wave 6 Stage B.4: legacy C.4-* specs were written against the
 * LocalStorageAdapter-only mount. After B.4 wires the mount to
 * `ApiAdapter` primary + `LocalStorageAdapter` fallback per
 * ADR-0018 v0.6 D13, those specs must (1) avoid mutating the real
 * `content/notes/<slug>/index.mdx` + sibling `state.json` fixture
 * and (2) accommodate the longer save round-trip the real network
 * path would otherwise need. This module provides a single helper
 * that both stubs the API and exposes the in-memory store so
 * specs can assert against it the same way they used to assert
 * against `localStorage.getItem('skb-note:<slug>')`.
 *
 * The store key is the slug suffix after `/api/notes/`, matching
 * the `[...slug].ts` route pattern. POST stores `NoteState`; GET
 * returns the stored state, or 404 with the canonical
 * `{ ok: false, error: 'note not found' }` envelope when the slug
 * has no saved state — equivalent to the live endpoint's behavior
 * but in memory so the test is hermetic.
 */
export interface ApiStub {
  /** Reads the stored NoteState for the slug suffix, or null. */
  read(slug: string): Record<string, unknown> | null;
  /** Returns true once at least one POST has been observed. */
  hasObservedPost(): boolean;
  /** Returns true once at least one GET has been observed. */
  hasObservedGet(): boolean;
}

export interface ApiStubOptions {
  /**
   * Delay applied to POST responses (ms). Defaults to 100 so the
   * `Saving...` save-indicator state is reliably observable in
   * Playwright (the mount applies a 250ms settle on top of this).
   */
  postDelayMs?: number;
}

export async function attachApiStub(page: Page, options: ApiStubOptions = {}): Promise<ApiStub> {
  const { postDelayMs = 100 } = options;
  const store = new Map<string, Record<string, unknown>>();
  let observedGet = false;
  let observedPost = false;

  await page.route('**/api/notes/**', async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const slug = url.pathname.replace(/^\/api\/notes\//, '');

    if (method === 'POST') {
      observedPost = true;
      const raw = request.postData() ?? '{}';
      try {
        const body = JSON.parse(raw) as Record<string, unknown>;
        store.set(slug, body);
      } catch {
        // Treat unparseable bodies as save-with-empty-state — caller
        // never sends those in practice.
      }
      if (postDelayMs > 0) await new Promise((r) => setTimeout(r, postDelayMs));
      await route.fulfill({
        body: JSON.stringify({ ok: true }),
        contentType: 'application/json',
        status: 200,
      });
      return;
    }

    if (method === 'GET') {
      observedGet = true;
      const stored = store.get(slug);
      if (stored !== undefined) {
        await route.fulfill({
          body: JSON.stringify(stored),
          contentType: 'application/json',
          status: 200,
        });
        return;
      }
      await route.fulfill({
        body: JSON.stringify({ error: 'note not found', ok: false }),
        contentType: 'application/json',
        status: 404,
      });
      return;
    }

    await route.continue();
  });

  return {
    hasObservedGet: () => observedGet,
    hasObservedPost: () => observedPost,
    read: (slug) => store.get(slug) ?? null,
  };
}
