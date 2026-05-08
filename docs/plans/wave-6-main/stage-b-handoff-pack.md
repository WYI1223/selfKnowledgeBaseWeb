# Wave 6 Stage B handoff pack

> Stage B closes after this PR (B.5) merges. Pack documents the 5-PR
> Stage B implementation chain, what shipped, what is closed of the
> user-reported "/notes/<slug> and /notes/<slug>/edit don't sync" gap,
> and the static-build read-route caveat that motivates the path-(a)
> Phase 3+ upgrade.

## PR sequence

| PR  | Squash    | Subject                                                                                                                                                                                                                                                                |
| --- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B.1 | `fc7689f` | ADR-0018 v0.6 amendment locking path-(b) Astro mixed-mode endpoint as Wave 6 default                                                                                                                                                                                   |
| B.2 | `100f1dc` | apps/site Node adapter + per-route `prerender = false` endpoint at `/api/notes/[...slug]` + sidecar `state.json` for `{lastModified, version}` (preserves `@skb/content-types` frontmatter authority); ADR-0011 v0.3 D9.1 API-route ui_touch exclusion + 9-point sweep |
| B.3 | `6e88cb4` | `@skb/editor-shell` `ApiAdapter` first-class implementation per ADR-0018 v0.6 D11; vitest contract suite (10 cases) + Playwright e2e_smoke against preview server                                                                                                      |
| B.4 | `376a559` | `EditorShellMount.tsx` wires ApiAdapter primary + LocalStorageAdapter fallback per ADR-0018 v0.6 D13; shared `apps/site/src/__tests__/e2e/api-stub.ts` helper; 3 stale C.4 specs updated to assert the new API-primary contract                                        |
| B.5 | this PR   | Stage B close: end-to-end edit → ApiAdapter POST → filesystem mutated → reload preserves content Playwright spec; this handoff pack; active.md repoint                                                                                                                 |

## What is closed

- **Editor persistence is server-backed**. Saves write to
  `content/notes/<slug>/index.mdx` (frontmatter preserved verbatim,
  body replaced) and `content/notes/<slug>/state.json` (sidecar:
  `{lastModified, version}`). The `@skb/content-types` frontmatter
  schema is unchanged — sidecar isolation keeps that authority intact.
- **Cross-session edit continuity**. Reload the edit route → the
  editor loads via `ApiAdapter.load()` from the persisted MDX +
  sidecar. No localStorage primary path; localStorage is reserved as
  a fallback that fires only on `ApiAdapter.save()` `{ok: false}`.
- **Cross-device edit continuity** (the original motivation for
  Wave 6 Stage B vs the Wave 5 single-device LocalStorageAdapter). Any
  device hitting the same Astro origin reads the same MDX file via
  `GET /api/notes/<slug>`.
- **Authority sister-doc consistency**. The Wave 1+2-era reviewer
  profile names (`pr-gate`, `code-reviewer`) and the ADR-0006
  "8-point" wording were replaced with current `codex-pr-reviewer-55`
  and 9-point language during the B.2 9-point sweep across
  `agent-contract.md`, `team-operations.md`, the 3 generator templates
  under `scripts/render/`, and their 3 regenerated docs.

## What is NOT closed (static-build caveat — read route)

- **`/notes/<slug>` (read route) does NOT auto-rebuild after a save**
  in `astro build && astro preview` mode. The read route HTML is
  prerendered at build time and served as a static asset; mutating
  `content/notes/<slug>/index.mdx` via the API path-(b) endpoint
  updates the source file but does not invalidate the prerendered
  HTML. The user-reported gap is closed in the **editor** sense
  (edit page persists; reload edit page reads back the new content)
  but a fresh visit to the read route still renders the build-time
  HTML.
- **`astro dev` with HMR** — the user's original observation
  (`08:52:49 [200] /notes/sample-blocks 405ms / 08:52:54 [200]
/notes/sample-blocks/edit 5ms`) was against `astro dev`. In dev
  mode, file mutations trigger Vite HMR; the read route DOES reflect
  the API-driven save on next request. The Stage B implementation
  is correct for the dev workflow that motivated the user report.
- **Production / preview rebuild trigger**. Closing the read-route
  gap in production requires either (a) re-running `astro build` on
  every save, or (b) switching `/notes/<slug>` to `prerender = false`
  so the server renders MDX on each request. Both are non-trivial:
  (a) is a deployment concern; (b) regresses the static-first
  invariant that ADR-0018 v0.6 D10 explicitly preserves. Phase 3+
  path-(a) (separate `apps/api` server) handles read-route freshness
  via SSR for `/notes/<slug>` while keeping the rest of the site
  static — this is the upgrade path the original ADR-0018 D8 cites
  for multi-user collab and is the right place to close this gap.

## Test surface

| Test                                                             | Coverage                                                                                                           | Status                                                                                                                                                                                            |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/site/src/pages/api/notes/__tests__/notes-endpoint.test.ts` | endpoint: GET 200/404, POST 200/400/404/500, sidecar roundtrip (mocked fs)                                         | 7/7 pass (B.2)                                                                                                                                                                                    |
| `packages/editor-shell/src/__tests__/api-adapter.test.ts`        | ApiAdapter: load 200/404/non-2xx, save 200/non-2xx/network-reject, in-memory roundtrip (mocked fetch)              | 10/10 pass (B.3)                                                                                                                                                                                  |
| `apps/site/playwright/api-adapter-roundtrip.spec.ts`             | ApiAdapter contract against real preview server: GET shape, GET 404 envelope, read route render                    | 3/3 pass (B.3)                                                                                                                                                                                    |
| `apps/site/playwright/edit-mount-api-wire.spec.ts`               | EditorShellMount issues GET + POST against /api/notes/<slug> via ApiAdapter primary (route interception)           | 1/1 pass (B.4)                                                                                                                                                                                    |
| `apps/site/src/__tests__/e2e/c4-{3,4,5}-*.spec.ts`               | Save indicator + roundtrip + close-ceremony specs updated to api-stub                                              | 3/3 pass (B.4)                                                                                                                                                                                    |
| `apps/site/playwright/stage-b-close-roundtrip.spec.ts`           | full edit → ApiAdapter POST → filesystem write (real preview server) → reload preserves content via ApiAdapter GET | 1/1 pass (B.5)                                                                                                                                                                                    |
| `pnpm --filter @skb/site test:visual` (full visual suite)        | regression check                                                                                                   | exit 0 under CI's `retries: 2` budget; flake count + flake name are run-dependent (parallel-load characteristic exposed by B.5 adding real-preview-server load alongside route-stubbed C.4 specs) |

## D9 obligations

D9 obligations + carve-outs by PR (the obligation set differs by PR
because `ui_touch` is computed per diff, and Decision 5 carve-outs
land per PR.md):

- B.1 (ADR amendment-only PR): `ui_touch=false`; no e2e_smoke obligation.
- B.2: `ui_touch=false` (per the ADR-0011 D9.1 API-route exclusion
  amendment shipped in the same PR); no e2e_smoke obligation. Server
  endpoint correctness is covered by the vitest carve-out per Decision 5
  (apps/site/src/pages/api/notes/**tests**/notes-endpoint.test.ts).
- B.3: `ui_touch=true` (`packages/editor-shell/src/**` matches D9.1).
  e2e_smoke entry → `apps/site/playwright/api-adapter-roundtrip.spec.ts`
  - screenshot `docs/audits/screenshots/wave-6-stage-b-3-read-route.png`
    (deterministic content; ≥ 5KB at archive time).
- B.4: `ui_touch=true` (`apps/site/src/components/**` matches D9.1).
  e2e_smoke entry → `apps/site/playwright/edit-mount-api-wire.spec.ts`
  - screenshot `docs/audits/screenshots/wave-6-stage-b-4-edit-mount-wire.png`
    (deterministic content; ≥ 5KB at archive time).
- B.5: **no screenshot archive** — `ui_touch=false` (the diff is
  Playwright spec + content fixture + docs; none match D9.1 path
  patterns), so a screenshot is not a D9 obligation. The product proof
  is in the spec's filesystem-mutation + reload-load assertions
  (frontmatter byte-equal, sidecar `{lastModified, version >= 2}`,
  reload preserves marker via ApiAdapter GET). B.4's wire screenshot
  already documents the EditorShellMount surface visually.

## Wave 6 → Phase 2+ deferred items (carry-forward from Wave 5 ADR-0019 D3)

The Wave 5 close ceremony deferred 9 items. Stage B closed item #2
(ApiAdapter implementation). The remaining 8 items carry forward to
post-Wave-6 phases per ADR-0019 D3:

1. **layoutEpoch sync to NoteState**: ADR-0018 line 464 接口冻结 amendment required
2. ✅ **ApiAdapter implementation** — closed by B.3 + B.4
3. **Mobile/responsive editor polish** (Phase 2+)
4. **a11y / keyboard navigation full audit** (Phase 2+)
5. **Animation tuning / 60fps perf** (Phase 2+)
6. **5 light block CSS migration to v2 OKLCH** (Phase 2+)
7. **Dark theme OKLCH variant** (Phase 2+)
8. **Tailwind preset typography migration** (Phase 2+)
9. **CSP `<meta>` header + self-host Inter+JetBrains Mono woff2** (Phase 2+)

## New deferred items surfaced during Wave 6 Stage B

- **Read-route freshness against API saves** in `astro build`/preview
  mode — the static-build caveat documented above. Phase 3+ path-(a)
  apps/api SSR is the canonical upgrade path; the alternative
  (build-on-save) is a deployment concern out of editor scope.
- **`apps/api` separate server (path-(a))** for multi-user collab,
  auth boundary, conflict detection — explicitly Phase 3+ per
  ADR-0018 v0.6 D9 + D14 sequence note.
- **POST-as-create**: the path-(b) endpoint refuses new-note creation
  (`POST /api/notes/<missing-slug>` returns 404 — body-only POST
  cannot supply the required `title` / `date` / `tags` / `draft`
  frontmatter). New-note creation is a Phase 2+ feature with its own
  ADR (frontmatter generation policy, slug allocation, etc.).
- **AbortSignal / timeout / progress / subscribe**: ADR-0018 v0.6
  D11 Q12 absorbed Phase 2+ extension positions in the
  `NoteSaveAdapter` interface comment block; v1 interface frozen.

## Related

- [ADR-0018 v0.6 amendment](../../decisions/ADR-0018-v2-visual-migration.md) D9-D16 — Stage B authority
- [ADR-0019 D3 deferred items](../../decisions/ADR-0019-wave-5-close.md)
- B.1-B.5 PR.md files in this directory
- [active.md](../active.md) — Stage B repoint after this PR merges
