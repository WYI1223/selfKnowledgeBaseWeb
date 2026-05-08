# Wave 6 Stage B.3 — `@skb/editor-shell` ApiAdapter implementation (path-(b) consumer)

> **Wave 6 Stage B 3rd PR** per ADR-0018 v0.6 D14 sequence (B.1
> ADR amendment merged at squash `fc7689f`; B.2 endpoint shipped
> at squash `100f1dc`; this is B.3). Promotes ApiAdapter from the
> C.4-1 COMMENT-only forward-stub to a first-class `NoteSaveAdapter`
> implementation consuming the path-(b) endpoint at
> `apps/site/src/pages/api/notes/[...slug].ts`. Wires nothing to
> the editor mount yet — that lands at B.4. Adapter selection +
> primary/fallback strategy is owned by ADR-0018 v0.6 D13 and
> exercised at B.4. Stage B close + the edit-route persistence-cycle
> Playwright spec (edit → ApiAdapter POST → filesystem write →
> edit-route reload via ApiAdapter GET) lands at B.5; read-route
> freshness against API saves is a static-build caveat deferred
> to Phase 3+ path-(a) per the Stage B handoff pack.

## title

Replace the C.4-1 COMMENT-only `ApiAdapter` forward-stub at
`packages/editor-shell/src/save-adapter.ts` with an executable
`ApiAdapter` class implementing `NoteSaveAdapter` per ADR-0018 v0.6
D11. Constructor `(slug: string, apiBase = '/api/notes')`. `load()`
GETs `${apiBase}/${slug}` and returns the parsed `NoteState`, `null`
on 404 (no saved state), or throws on any other non-2xx so consumers
can fall back. `save()` POSTs JSON, returning `{ ok, error? }`
(never throws). Vitest contract suite (mocked fetch; 10 cases
including roundtrip via in-memory storage fake). Playwright e2e_smoke
(real Astro preview server; GET 200 NoteState shape + GET 404 JSON
envelope + read-route screenshot for D9.5 archive). Sister-doc
`packages/editor-shell/CONTRACT.md` § NoteSaveAdapter section
promotes ApiAdapter from "Phase 2+ comment-only forward stub" to
first-class public surface; `index.ts` re-exports `ApiAdapter`
alongside `LocalStorageAdapter`.

## files

8 files (~360-440 LOC; +1 at R1 to update the C.4-1 e2e spec
that previously enforced the now-superseded comment-only contract):

1. `packages/editor-shell/src/save-adapter.ts` — **MODIFY** (~50
   LOC; -14 stub, +50 class). Replace the COMMENT-only `ApiAdapter`
   forward stub (lines 129-141) with an executable `ApiAdapter`
   class. JSDoc cites ADR-0018 v0.6 D11 as authority + flags Wave 6
   Stage B single-user dev/preview scope vs Phase 3+ path-(a)
   apps/api separation.

2. `packages/editor-shell/src/__tests__/api-adapter.test.ts` —
   **NEW** (~140 LOC). Vitest contract suite with `vi.stubGlobal`
   on `fetch`. Cases: default + custom apiBase; load 200 returns
   NoteState; load 404 returns null; load 500 throws; save 200
   `{ ok: true }`; save 400 returns `{ ok: false, error }`; save
   network reject returns `{ ok: false, error: <msg> }`; save
   non-Error reject returns `{ ok: false, error: 'network error' }`;
   roundtrip POST→GET via in-memory fake fetch.

3. `packages/editor-shell/src/__tests__/save-adapter.test.ts` —
   **MODIFY** (~-30 LOC). Remove the `ApiAdapter forward-stub is
COMMENT-only` regression test + the `executableApiAdapterPattern`
   regex + `countExecutableApiAdapterForms` helper now that ApiAdapter
   is intentionally executable. LocalStorageAdapter assertions
   unchanged.

4. `packages/editor-shell/src/index.ts` — **MODIFY** (~1 LOC). Add
   `ApiAdapter` to the `save-adapter` re-export tuple alongside
   `LocalStorageAdapter`.

5. `packages/editor-shell/CONTRACT.md` — **MODIFY** (~25 LOC).
   §"NoteSaveAdapter (Wave 5; contract hardened at C.4-1)" — add
   `ApiAdapter` bullet to public exports list with constructor
   signature + load/save semantics + path-(a)/path-(b) cross-ref.
   Replace the "Phase 2+ ApiAdapter is intentionally comment-only at
   C.4-1" paragraph with a "Wave 6 Stage B.3 promotes ApiAdapter to
   first-class public surface" paragraph.

6. `apps/site/playwright/api-adapter-roundtrip.spec.ts` — **NEW**
   (~60 LOC). 3 tests against the Astro preview webServer (B.2's
   Node adapter + per-route prerender=false endpoint serves under
   `astro preview`):
   - GET `/api/notes/sample-mdx-note` returns 200 with NoteState
     shape (`mdxSource: string`, `lastModified: number`,
     `version: number`)
   - GET `/api/notes/__definitely_missing_slug__` returns 404 with
     `{ ok: false, error: string }` JSON envelope
   - `page.goto('/notes/sample-mdx-note')` renders and captures a
     full-page screenshot to `docs/audits/screenshots/wave-6-stage-b-3-read-route.png`

7. `docs/plans/wave-6-main/wave-6-stage-b-3-api-adapter.md` —
   **NEW** (PR.md self).

8. `apps/site/src/__tests__/e2e/c4-1-note-save-adapter.spec.ts` —
   **MODIFY** (~10 LOC; R1 fold-in). The C.4-1 visual-smoke spec
   previously enforced the now-superseded comment-only ApiAdapter
   contract via `expect(saveAdapterSource).toContain('// TODO Phase
2+ ApiAdapter…')` + `countExecutableApiAdapterForms === 0`. With
   B.3 making `ApiAdapter` intentionally executable per ADR-0018
   v0.6 D11, the assertion is inverted to require BOTH
   `LocalStorageAdapter` and `ApiAdapter` as `export class …` AND
   verify the old TODO comment is gone. Test description renamed
   to "save-adapter exposes both LocalStorageAdapter and
   ApiAdapter".

## D2 trigger judgment

Row 1 (CONTRACT.md change in `@skb/editor-shell`) + Row 5
(cross-package: editor-shell adapter consumes apps/site endpoint
shipped in B.2). PRE-COMMIT CLAUDE REVIEW fires per Row 1.

## ui_touch

`true` — `packages/editor-shell/src/save-adapter.ts` matches the
ADR-0011 D9.1 path pattern `packages/editor-shell/src/**`. The
B.2 amendment that excludes `apps/site/src/pages/api/**` does NOT
extend to `editor-shell` adapter internals; the editor-shell pattern
historically catches both UI and adapter changes (per the D9.1 cell
note "任何文件改动；含逻辑 + 视觉"). e2e_smoke obligation is
satisfied below by exercising the ApiAdapter contract against the
real preview server.

## e2e_smoke

- flow: ApiAdapter contract round-trip against the real Astro
  preview server — GET an existing note returns NoteState shape;
  GET a missing note returns the 404 JSON envelope; read-route
  `/notes/<slug>` still renders persisted MDX body
  target_url: /api/notes/sample-mdx-note + /notes/sample-mdx-note
  playwright_spec: apps/site/playwright/api-adapter-roundtrip.spec.ts:"ApiAdapter GET against /api/notes/sample-mdx-note returns NoteState shape" + ":\"ApiAdapter GET against missing slug returns 404 with JSON error envelope\"" + ":\"read-route /notes/sample-mdx-note still renders the persisted MDX body\""
  screenshot_archive: docs/audits/screenshots/wave-6-stage-b-3-read-route.png
  assertions:
  - GET /api/notes/sample-mdx-note response.status === 200
  - response JSON has typeof mdxSource === 'string' && mdxSource.length > 0
  - response JSON has typeof lastModified === 'number' && Number.isFinite()
  - response JSON has typeof version === 'number' && version >= 1
  - GET `/api/notes/__definitely_missing_slug__` response.status === 404
  - 404 response JSON has ok === false && typeof error === 'string'
  - GET /notes/sample-mdx-note response.status === 200
  - page H1 'Sample MDX Note' is visible (from frontmatter title)
  - page body text 'Track A 烟测页面' is visible (note-specific MDX body content; rules out 404 page)
  - screenshot saved to docs/audits/screenshots/wave-6-stage-b-3-read-route.png with size ≥ 5KB

## decision-log

### Decision 1 — Constructor signature: `(slug, apiBase = '/api/notes')`

Match ADR-0018 v0.6 D11 verbatim. `slug` is the route slug per
`NoteSaveAdapter.slug`; `apiBase` defaults to the same-origin
relative path `/api/notes` so the Astro origin browsers run from
serves both the read route and the API endpoint. No auth at Wave 6
Stage B per D11+D12; Phase 3+ multi-user collab consumes path-(a)
`apps/api` (REST `/v1/notes/<slug>` + RFC 7807) and remains out of
scope here.

### Decision 2 — `load()` throws on non-2xx non-404 (let consumers fall back)

ADR-0018 v0.6 D11 returns `null` on 404 (no saved state — caller
falls through to `initialMdx` per B.4 wiring) but throws on any
other non-2xx. The throw lets B.4's mount fall back to
LocalStorageAdapter when the network path is degraded (per
ADR-0018 v0.6 D13 primary/fallback semantics). `save()` does NOT
throw — expected storage failures resolve `{ ok: false, error }`,
matching `LocalStorageAdapter.save()` for adapter-substitutability.

### Decision 3 — POST not exercised at B.3 Playwright level

ApiAdapter `save()` POST coverage lives in (a) the vitest contract
test (mocked fetch; 10 cases) and (b) the apps/site
`notes-endpoint.test.ts` (mocked fs; 7 cases) shipped at PR #99.
Adding a POST roundtrip at B.3 Playwright would mutate
`content/notes/sample-mdx-note/index.mdx` (the only existing
non-test fixture). The full edit-route persistence cycle (edit →
ApiAdapter POST → filesystem write → edit-route reload via
ApiAdapter GET) lands at B.5 against a dedicated `__test_smoke__`
fixture; B.3's Playwright spec covers the GET path + read-route
render to satisfy D9.5 with concrete user-visible evidence.
**Read-route freshness against API saves is a static-build
limitation deferred to Phase 3+ path-(a) `apps/api` SSR per the
Stage B handoff pack — `astro dev` HMR closes the gap for the
dev workflow which is what the user originally reported.**

### Decision 4 — Wire-up deferred to B.4

`EditorShellMount.tsx` continues to use `LocalStorageAdapter` only
in this PR — wiring to `ApiAdapter` primary + `LocalStorageAdapter`
fallback per ADR-0018 v0.6 D13 lands at B.4. Keeping B.3 to
adapter-class scope makes the contract change reviewable in
isolation.

## acceptance

```bash
# AC-1: ui_touch + e2e gates PASS
pnpm exec tsx scripts/check-ui-touch.ts \
  --files packages/editor-shell/src/save-adapter.ts \
          packages/editor-shell/src/__tests__/api-adapter.test.ts \
          packages/editor-shell/src/__tests__/save-adapter.test.ts \
          packages/editor-shell/src/index.ts \
          packages/editor-shell/CONTRACT.md \
          apps/site/playwright/api-adapter-roundtrip.spec.ts \
          docs/plans/wave-6-main/wave-6-stage-b-3-api-adapter.md 2>&1 | tail -1
# Expected: ui_touch=true (editor-shell adapter is logic surface; D9 enforces e2e_smoke)
```

```bash
# AC-2: ApiAdapter executable class with the documented signature
grep -cE 'export class ApiAdapter' packages/editor-shell/src/save-adapter.ts
# Expected: 1
grep -cE 'apiBase: string = ' packages/editor-shell/src/save-adapter.ts
# Expected: 1
```

```bash
# AC-3: vitest contract suite passes
pnpm --filter @skb/editor-shell test src/__tests__/api-adapter.test.ts 2>&1 | grep -E 'Tests'
# Expected: 10 passed
```

```bash
# AC-4: index.ts re-exports ApiAdapter alongside LocalStorageAdapter
grep -cE 'ApiAdapter, LocalStorageAdapter|LocalStorageAdapter, ApiAdapter' packages/editor-shell/src/index.ts
# Expected: 1
```

```bash
# AC-5: CONTRACT.md sister-doc updated
grep -cE 'Wave 6 Stage B\.3 promotes ApiAdapter' packages/editor-shell/CONTRACT.md
# Expected: 1
grep -cE 'COMMENT-only forward-stub|comment-only at C\.4-1' packages/editor-shell/CONTRACT.md
# Expected: 0
```

```bash
# AC-6: pnpm check exit 0
pnpm check
```

```bash
# AC-7: Playwright spec runs against preview server
pnpm --filter @skb/site exec playwright test playwright/api-adapter-roundtrip.spec.ts --reporter=line 2>&1 | tail -5
# Expected: 3 passed
```

```bash
# AC-8: screenshot archive exists with size ≥ 5KB
test -f docs/audits/screenshots/wave-6-stage-b-3-read-route.png
test "$(stat -c '%s' docs/audits/screenshots/wave-6-stage-b-3-read-route.png)" -ge 5120
```

```bash
# AC-9: scope-fence — exactly 8 source files (excl. audit logs + screenshot)
git diff --name-only main..HEAD -- ':!docs/audits/codex-runs/' ':!docs/audits/screenshots/' | sort | wc -l
# Expected: 8
```

```bash
# AC-10: visual-smoke suite passes (regression-checks the C.4-1
# spec update at R1 + the new B.3 spec). Cross-spec consistency —
# no other test still encodes the comment-only ApiAdapter contract.
pnpm --filter @skb/site test:visual 2>&1 | tail -5
# Expected: passed (1 + previously-skipped C.4-1 + B.3 spec entries reflect new contract)
```

## Out-of-scope

- **B.4**: `EditorShellMount.tsx` wire to ApiAdapter primary +
  LocalStorageAdapter fallback per ADR-0018 v0.6 D13.
- **B.5**: Stage B close + edit-route persistence-cycle (edit → POST → filesystem → reload edit route via ApiAdapter GET); read-route freshness deferred per static-build caveat
  Playwright spec + handoff pack.
- **Multi-user auth boundary**: Phase 3+ path-(a) `apps/api`.
- **AbortSignal / timeout / onProgress** save options: ADR-0018
  v0.6 D11 deferred to Phase 2+ ADR amendment per Q12.
- **Subscribe / WebSocket collaborative**: same Phase 2+ deferral.

## Related

- [ADR-0018 v0.6 D11 (ApiAdapter contract)](../../decisions/ADR-0018-v2-visual-migration.md) — authority
- [ADR-0018 v0.6 D13 (adapter selection)](../../decisions/ADR-0018-v2-visual-migration.md) — B.4 scope
- [PR #99 squash `100f1dc`](../../../apps/site/src/pages/api/notes/%5B...slug%5D.ts) — endpoint shipped
- [B.1 ADR amendment PR.md](wave-6-stage-b-1-adr-0018-amendment.md)
- [B.2 endpoint PR.md](wave-6-stage-b-2-astro-hybrid-endpoint.md)
- Sister: B.4 (mount wire), B.5 (close + e2e + handoff)
