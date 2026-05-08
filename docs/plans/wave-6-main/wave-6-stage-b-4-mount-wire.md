# Wave 6 Stage B.4 — `EditorShellMount.tsx` wires ApiAdapter primary + LocalStorageAdapter fallback

> **Wave 6 Stage B 4th PR** per ADR-0018 v0.6 D14 sequence. B.1
> ADR amendment merged at squash `fc7689f`; B.2 endpoint at
> `100f1dc`; B.3 ApiAdapter at `6e88cb4`; this is B.4. Switches the
> `/notes/<slug>/edit` mount from LocalStorageAdapter-only to
> **ApiAdapter primary + LocalStorageAdapter fallback** per
> ADR-0018 v0.6 D13. After this PR the editor half of the
> user-reported "/notes/<slug> and /notes/<slug>/edit don't sync"
> gap is closed: saves write to `content/notes/<slug>/index.mdx`
> together with the sibling `state.json` via the path-(b) endpoint,
> and reloading the edit route loads the persisted state via
> ApiAdapter GET. **The read route `/notes/<slug>` does NOT
> auto-rebuild after a save in `astro build && preview` mode**
> (static-build caveat surfaced at B.5 R5; the user's original
> report was against `astro dev` HMR which closes the gap;
> production read-route freshness is a Phase 3+ path-(a) `apps/api`
> SSR concern). B.5 closes Stage B with the edit-route
> persistence-cycle Playwright spec and a handoff pack documenting
> the static-build caveat.

## title

Refactor `apps/site/src/components/EditorShellMount.tsx` to wire
the `ApiAdapter` from `@skb/editor-shell` (shipped at B.3) as the
primary persistence path, with `LocalStorageAdapter` retained as a
fallback per ADR-0018 v0.6 D13. Two new adapter helpers
(`loadWithFallback`, `saveWithBackup`) centralize the primary→fallback
chain. `apps/site/CONTRACT.md` § Edit route § Persistence updated to
describe the two-adapter contract. Playwright e2e_smoke
(`apps/site/playwright/edit-mount-api-wire.spec.ts`) verifies the
GET/POST wire at the network level via route interception (no
filesystem mutation).

## files

9 files (~280-360 LOC; +4 at R1 for the C.4 spec sister-doc-sync
audit per ADR-0006 #6 + the shared api-stub helper that lets the
specs match B.4's API-primary contract without mutating the real
content/notes/<slug>/index.mdx fixture):

1. `apps/site/src/components/EditorShellMount.tsx` — **MODIFY**
   (~50 LOC). Replace the single `adapterRef: LocalStorageAdapter`
   with two refs: `apiAdapterRef: ApiAdapter | null` (primary)
   and `localAdapterRef: LocalStorageAdapter | null` (fallback).
   Add module-level `loadWithFallback()` (try ApiAdapter, fall
   through to LocalStorageAdapter on throw OR null) and
   `saveWithBackup()` (write to ApiAdapter; on `{ ok: false }`
   ALSO write to LocalStorageAdapter as backup; user-visible
   verdict still reflects the primary failure). `handleCreate`
   and `handleChange` switch to the new helpers.

2. `apps/site/CONTRACT.md` — **MODIFY** (~25 LOC). § Edit route
   § Persistence: rewrite the `LocalStorageAdapter`-only paragraph
   to describe the two-adapter primary/fallback contract; add a
   "Closing the user-reported sync gap" bullet that explicitly
   references the path-(b) endpoint write-back. Save trigger
   paragraph updated to mention the new save chain.

3. `apps/site/playwright/edit-mount-api-wire.spec.ts` — **NEW**
   (~85 LOC). Single test:
   - intercepts `**/api/notes/**` via `page.route()`; lets GET
     pass through, stubs POST with `{ ok: true }` so the test does
     not mutate the `sample-mdx-note` fixture
   - `page.goto('/notes/sample-mdx-note/edit')`
   - waits for `.ProseMirror` editor mount
   - asserts GET observed at `/api/notes/sample-mdx-note`
   - types into the editor; waits up to 5s for the POST
   - asserts POST observed; body matches the ADR-0018 D8 NoteState
     shape (`mdxSource: string`, `lastModified: number`,
     `version: number`)
   - takes full-page screenshot to D9.5 archive

4. `docs/plans/wave-6-main/wave-6-stage-b-4-mount-wire.md` —
   **NEW** (PR.md self).

5. `docs/audits/screenshots/wave-6-stage-b-4-edit-mount-wire.png` —
   **NEW** (D9.5 archive; ≥ 5KB; emitted by the new spec).

6. `apps/site/src/__tests__/e2e/api-stub.ts` — **NEW** (~85 LOC;
   R1 fold-in). Shared Playwright helper exposing `attachApiStub(page)`
   that intercepts `**/api/notes/**`: POST stores the body in an
   in-memory map keyed by slug + returns 200 after a 100ms delay
   (so the `Saving...` save-indicator state is reliably observable);
   GET returns the stored state OR a 404 envelope. Returns an
   `ApiStub` handle with `read(slug)`, `hasObservedPost()`,
   `hasObservedGet()` so specs can assert against the in-memory
   store the same way they used to assert against
   `localStorage.getItem('skb-note:<slug>')`.

7. `apps/site/src/__tests__/e2e/c4-3-save-indicator.spec.ts` —
   **MODIFY** (~5 LOC; R1 fold-in). Add `attachApiStub(page)` at
   test setup. The 100ms POST delay makes the `Saving...` transient
   state deterministic under the new ApiAdapter-primary path.

8. `apps/site/src/__tests__/e2e/c4-4-save-roundtrip.spec.ts` —
   **MODIFY** (~25 LOC; R1 fold-in). Replace the
   `localStorage.getItem('skb-note:<slug>')` assertions with
   `apiStub.read(slug)` + `apiStub.hasObservedPost()` so the spec
   asserts against the in-memory ApiAdapter sink instead of the
   localStorage fallback path. Test description updated to "API
   primary".

9. `apps/site/src/__tests__/e2e/c4-5-edit-flow-e2e.spec.ts` —
   **MODIFY** (~12 LOC; R1 fold-in). Same pattern: stub the API,
   assert against the in-memory store, drop the localStorage
   evaluator. mvp-7 (persistence) verification now reads from the
   API stub, matching the new B.4 wire.

## D2 trigger judgment

Row 1 (CONTRACT.md change in apps/site for § Edit route § Persistence
adapter wiring) + Row 5 (cross-package: apps/site consumes
`@skb/editor-shell` ApiAdapter shipped at B.3). PRE-COMMIT CLAUDE
REVIEW fires per Row 1.

## ui_touch

`true` — `apps/site/src/components/EditorShellMount.tsx` matches
the ADR-0011 D9.1 path pattern `apps/site/src/components/**`.

## e2e_smoke

- flow: `/notes/<slug>/edit` mount loads via ApiAdapter GET
  primary; user edit triggers 800ms debounce that POSTs the
  NoteState body to the path-(b) endpoint
  target_url: /notes/sample-mdx-note/edit
  playwright_spec: apps/site/playwright/edit-mount-api-wire.spec.ts:"EditorShellMount issues GET + POST against /api/notes/<slug> via ApiAdapter primary"
  screenshot_archive: docs/audits/screenshots/wave-6-stage-b-4-edit-mount-wire.png
  assertions:
  - .ProseMirror editor is visible within 10s of page load
  - GET /api/notes/sample-mdx-note is observed by route interceptor before editor visible
  - typing in the editor triggers a POST /api/notes/sample-mdx-note within 5s (covers the 800ms debounce + headroom)
  - POST body has typeof mdxSource === 'string'
  - POST body has typeof lastModified === 'number'
  - POST body has typeof version === 'number'
  - screenshot saved to docs/audits/screenshots/wave-6-stage-b-4-edit-mount-wire.png with size ≥ 5KB

## decision-log

### Decision 1 — Helper functions, not a unifying adapter wrapper

ADR-0018 v0.6 D13 specifies "ApiAdapter primary + LocalStorageAdapter
fallback" as the mount-time selection; it does NOT introduce a
third adapter that wraps both. Defining a `CompositeAdapter`
implementing `NoteSaveAdapter` would force a contract amendment
(would the wrapped `slug` be one of the two? would `load()` return
type widen? etc.). Two module-level helpers in
`EditorShellMount.tsx` (`loadWithFallback`, `saveWithBackup`) keep
the wiring local, the public `NoteSaveAdapter` contract unchanged,
and the per-call decision auditable.

### Decision 2 — `load()` falls through to LocalStorageAdapter on `null` AND on throw

Per ADR-0018 v0.6 D11 `ApiAdapter.load()` returns `null` on HTTP 404
(no saved state) and throws on any other non-2xx. Wave 6 Stage B's
goal is the server file as source of truth; `null` from the API is
treated as "no server state for this slug" which justifies trying
the local cache. Throws are network/5xx — same treatment. If the
local cache also returns `null`, the editor seeds from `initialMdx`
(unchanged from the C.4-prelude behavior).

### Decision 3 — `save()` writes the local backup ALWAYS on primary failure

ADR-0018 v0.6 D13 lists the option "ApiAdapter only-write +
LocalStorage backup-on-error". B.4 implements that exact shape:
when ApiAdapter returns `{ ok: false }`, the mount additionally
issues `LocalStorageAdapter.save()` to retain the user's edit
across the next page load. The user-visible save indicator still
reflects the primary failure (`status: 'error'`) so the user knows
the server didn't accept the save. On primary success the local
cache is NOT updated — keeping the server file as the single
source of truth.

### Decision 4 — Playwright spec uses route interception (no filesystem mutation)

The B.3 spec carved out POST coverage to vitest because POSTing to
`sample-mdx-note` would mutate the fixture. B.4 is at the mount
level so route interception is natural: stub the POST with
`{ ok: true }` to verify the wire issues a POST without persisting
it. The B.5 close-ceremony spec performs the real filesystem write
against a dedicated `__test_smoke__/b5-roundtrip` fixture to prove
the edit-route persistence cycle (edit → ApiAdapter POST →
filesystem write → edit-route reload via ApiAdapter GET).
**Read-route freshness against API saves is a static-build caveat
deferred to Phase 3+ path-(a) per the Stage B handoff pack — the
B.5 spec does NOT assert /notes/<slug> reflects the save on next
visit because `astro build && preview` does not auto-rebuild
prerendered pages.**

### Decision 5 — Editor-shell CONTRACT.md unchanged

`@skb/editor-shell/CONTRACT.md` § NoteSaveAdapter already documents
both `LocalStorageAdapter` and `ApiAdapter` as public-surface
exports (per B.3). The mount-time selection logic lives in apps/site
(consumer) and does not change the editor-shell contract. No sister-
doc edit needed.

## acceptance

```bash
# AC-1: ui_touch + e2e gates PASS
pnpm exec tsx scripts/check-ui-touch.ts \
  --files apps/site/src/components/EditorShellMount.tsx \
          apps/site/CONTRACT.md \
          apps/site/playwright/edit-mount-api-wire.spec.ts \
          docs/plans/wave-6-main/wave-6-stage-b-4-mount-wire.md 2>&1 | tail -1
# Expected: ui_touch=true
```

```bash
# AC-2: ApiAdapter import + primary/fallback helpers present
# Multiline imports: count lines that mention ApiAdapter inside an import block.
grep -cE "^\s*ApiAdapter,?\s*$" apps/site/src/components/EditorShellMount.tsx
# Expected: ≥ 1
grep -cE "function loadWithFallback|function saveWithBackup" apps/site/src/components/EditorShellMount.tsx
# Expected: 2
```

```bash
# AC-3: handleCreate + handleChange use the helpers (not the bare adapter)
grep -cE "loadWithFallback\(apiAdapter, localAdapter\)" apps/site/src/components/EditorShellMount.tsx
# Expected: ≥ 2 (useEffect + handleCreate)
grep -cE "saveWithBackup\(apiAdapter, localAdapter," apps/site/src/components/EditorShellMount.tsx
# Expected: 1
```

```bash
# AC-4: Playwright spec passes against preview server
pnpm --filter @skb/site exec playwright test playwright/edit-mount-api-wire.spec.ts --reporter=line 2>&1 | tail -3
# Expected: 1 passed
```

```bash
# AC-5: pnpm check exit 0
pnpm check
```

```bash
# AC-6: CONTRACT.md sister-doc updated
grep -cE 'ApiAdapter.* primary .*LocalStorageAdapter.* fallback' apps/site/CONTRACT.md
# Expected: ≥ 1
# CONTRACT prose contains the literal `sync"` (with closing quote) followed by ` gap` (with leading space) — match either form.
grep -cE "sync.{0,3}gap" apps/site/CONTRACT.md
# Expected: ≥ 1
```

```bash
# AC-7: screenshot archive exists with size ≥ 5KB
test -f docs/audits/screenshots/wave-6-stage-b-4-edit-mount-wire.png
test "$(stat -c '%s' docs/audits/screenshots/wave-6-stage-b-4-edit-mount-wire.png)" -ge 5120
```

```bash
# AC-8: scope-fence — exactly 8 source files (excl. screenshot + audit
# logs). Trajectory: pre-R1 = 4 (mount + CONTRACT + B.4 spec + PR.md);
# R1 +4 (api-stub helper + 3 C.4 spec sister-doc-sync updates).
git diff --name-only main..HEAD -- ':!docs/audits/codex-runs/' ':!docs/audits/screenshots/' | sort | wc -l
# Expected: 8
```

```bash
# AC-9: visual-smoke suite passes (ensures C.4-* specs still pass with the new wire)
pnpm --filter @skb/site test:visual 2>&1 | tail -3
# Expected: passed (no regressions)
```

## Out-of-scope

- **B.5**: Stage B close + edit-route persistence-cycle (edit → POST → filesystem → reload edit route via ApiAdapter GET) against
  a dedicated test fixture + handoff pack.
- **Multi-user auth boundary** (Phase 3+ path-(a) `apps/api`).
- **AbortSignal / timeout / progress** save options: Phase 2+ ADR
  amendment per ADR-0018 v0.6 D11 Q12.

## Related

- [ADR-0018 v0.6 D13 (adapter selection)](../../decisions/ADR-0018-v2-visual-migration.md) — authority
- PR #99 squash `100f1dc` — B.2 endpoint
- PR #100 squash `6e88cb4` — B.3 ApiAdapter
- [B.3 PR.md](wave-6-stage-b-3-api-adapter.md)
- Sister: B.5 (close + e2e + handoff pack)
