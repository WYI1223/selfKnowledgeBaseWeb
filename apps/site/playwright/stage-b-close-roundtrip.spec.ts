import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

/**
 * Wave 6 Stage B.5 close-ceremony spec — proves the full editor
 * persistence cycle against the real Astro preview server + path-(b)
 * endpoint shipped at PR #99 + ApiAdapter wired at PR #101:
 *
 *   1. open /notes/__test_smoke__/b5-roundtrip/edit
 *   2. type a known MARKER into the editor
 *   3. wait for the 800ms debounce save (ApiAdapter POST → filesystem)
 *   4. assert the on-disk MDX body contains the MARKER (frontmatter
 *      preserved verbatim) AND the sibling state.json sidecar is
 *      present with the new {lastModified, version}
 *   5. reload the edit route; ApiAdapter GET returns the persisted state;
 *      the editor loads with the MARKER present (no localStorage path)
 *
 * What this spec does NOT assert: the read route /notes/<slug> showing
 * the updated content on next visit. apps/site builds with `output:
 * 'static'`, so the read route HTML is generated at `astro build` and
 * does NOT auto-rebuild when the API mutates the source MDX. In
 * `astro dev` (HMR) the read route would reflect updates. Closing the
 * production read-route gap requires either an `astro dev` workflow
 * (already works for the user-reported regression) or a deploy/rebuild
 * trigger after a save (Phase 3+ path-(a) `apps/api` server-render
 * obviates this entirely). The Stage B handoff pack documents this
 * trade-off explicitly.
 *
 * Fixture safety: the spec snapshots `content/notes/__test_smoke__/b5-roundtrip/`
 * (index.mdx + optional state.json) at test setup and restores both
 * files in afterAll, so the working tree stays clean even if the test
 * fails midway.
 */

const FIXTURE_DIR = resolve(process.cwd(), '../../content/notes/__test_smoke__/b5-roundtrip');
const FIXTURE_MDX = resolve(FIXTURE_DIR, 'index.mdx');
const FIXTURE_SIDECAR = resolve(FIXTURE_DIR, 'state.json');
const SLUG = '__test_smoke__/b5-roundtrip';
const MARKER = 'B5-CLOSE-MARKER';

interface FixtureSnapshot {
  mdx: string;
  sidecar: string | null;
}

let snapshot: FixtureSnapshot;

test.beforeAll(() => {
  snapshot = {
    mdx: readFileSync(FIXTURE_MDX, 'utf8'),
    sidecar: existsSync(FIXTURE_SIDECAR) ? readFileSync(FIXTURE_SIDECAR, 'utf8') : null,
  };
  // Precondition: fixture must NOT already contain the MARKER, else
  // the post-edit assertion would pass against pre-existing state
  // (e.g. left-over from an interrupted prior run). The afterAll
  // restore should normally guarantee this; the explicit assertion
  // catches cases where a previous run was killed mid-test.
  if (snapshot.mdx.includes(MARKER)) {
    throw new Error(
      `B.5 fixture starts with stale MARKER "${MARKER}" — restore content/notes/__test_smoke__/b5-roundtrip/index.mdx from HEAD before rerunning`,
    );
  }
  // Clean any left-over sidecar to make the post-save sidecar
  // assertion (`existsSync` true + `version >= 2`) actually probative.
  if (existsSync(FIXTURE_SIDECAR)) {
    unlinkSync(FIXTURE_SIDECAR);
  }
});

test.afterAll(() => {
  writeFileSync(FIXTURE_MDX, snapshot.mdx, 'utf8');
  if (snapshot.sidecar !== null) {
    writeFileSync(FIXTURE_SIDECAR, snapshot.sidecar, 'utf8');
  } else if (existsSync(FIXTURE_SIDECAR)) {
    unlinkSync(FIXTURE_SIDECAR);
  }
});

test('Stage B close — edit → ApiAdapter POST → filesystem mutated → reload preserves content', async ({
  page,
}) => {
  // Sanity: fixture starts at the snapshotted bytes (no leftover state
  // from a previous failed run).
  expect(readFileSync(FIXTURE_MDX, 'utf8')).toBe(snapshot.mdx);

  await page.goto(`/notes/${SLUG}/edit`);
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 10_000 });

  // beforeAll snapshot + afterAll restore + explicit precondition
  // (fixture must not start with MARKER) guarantee the fixed MARKER
  // is a clean assertion handle across runs.
  await editor.click();
  await page.keyboard.type(` ${MARKER}`);
  await expect(editor).toContainText(MARKER, { timeout: 5_000 });

  // Wait for save indicator to settle (covers the 800ms debounce + 250ms
  // post-API settle + any preview-server filesystem latency).
  const indicator = page.locator('[data-skb-save-indicator]').first();
  await expect(indicator).toContainText(/Saved/, { timeout: 5_000 });

  // Assert the filesystem actually got the write — proves the
  // ApiAdapter primary path took effect end-to-end (no localStorage
  // fallback masking).
  const persistedMdx = readFileSync(FIXTURE_MDX, 'utf8');
  expect(persistedMdx).toContain(MARKER);

  // Frontmatter preserved BYTE-EQUAL per the path-(b) endpoint contract
  // — extract the YAML block (`---\n...\n---`) from both the snapshot
  // and the persisted file and assert exact equality. The endpoint
  // promises zero schema drift; substring-only asserts on `title:` /
  // `slug:` would mask reorderings, whitespace tweaks, or field
  // additions that quietly violate `@skb/content-types` authority.
  const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---/;
  const originalFrontmatter = FRONTMATTER_RE.exec(snapshot.mdx)?.[0];
  const persistedFrontmatter = FRONTMATTER_RE.exec(persistedMdx)?.[0];
  expect(originalFrontmatter).toBeTruthy();
  expect(persistedFrontmatter).toBe(originalFrontmatter);

  // Sibling sidecar created with the new metadata; the
  // @skb/content-types frontmatter authority is NOT extended.
  expect(existsSync(FIXTURE_SIDECAR)).toBe(true);
  const sidecar = JSON.parse(readFileSync(FIXTURE_SIDECAR, 'utf8')) as {
    lastModified: number;
    version: number;
  };
  expect(typeof sidecar.lastModified).toBe('number');
  expect(sidecar.version).toBeGreaterThanOrEqual(2);

  // Reload the edit route — ApiAdapter GET must return the persisted
  // NoteState, and the editor must load it (no localStorage path).
  await page.reload();
  await expect(editor).toBeVisible({ timeout: 10_000 });
  await expect(editor).toContainText(MARKER, { timeout: 10_000 });

  // No D9.5 screenshot archive: B.5 is ui_touch=false (the diff is
  // Playwright spec + content fixture + docs; none match D9.1 path
  // patterns), so a screenshot is not a D9 obligation. Earlier B.5
  // drafts archived a full-page screenshot but the editor's surrounding
  // chrome (save indicator timing, palette/toolbar layout) varies
  // enough across runs that the bytes were not deterministic — making
  // the committed PNG a churn surface rather than a stable audit
  // record. The B.4 wire screenshot already documents the
  // EditorShellMount surface; B.5's product proof is the filesystem
  // mutation + reload-load assertions above.
});
