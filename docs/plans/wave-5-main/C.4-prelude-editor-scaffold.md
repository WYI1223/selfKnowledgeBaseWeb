# C.4-prelude — Minimal editor scaffold (MVP smoke-test enable; per Wave 5 plan v1.2 R14 SECOND real-test 2026-05-05)

> **Wave 5 Stage C.4 lead-off implementation PR** — first row of the
> Stage C.4 PR breakdown post v1.2 plan amendment (squash `56ff476`,
> PR #70). Lands the **minimal editor scaffold** so the user can
> navigate to `/notes/[slug]/edit`, mount `EditorShell` with the
> Wave 5 grid container + drag/drop + resize layers (all already
> shipped at C.2-4 / C.2-5 / C.2-6, squashes `de13d15` / `2df71b6` /
> `2fb7900`), edit prose, save to LocalStorage, reload, and verify
> content + grid intact — i.e. the **MVP smoke-test surface** the
> user gatekeeper called out at v1.1 → v1.2 R14 SECOND real-test
> ("交付了但 /notes/[slug]/edit 没有，我怎么 edit/尝试？").
>
> Scope is intentionally minimal per Wave 5 plan v1.2 row C.4-prelude
> whitelist (line 571 of
> `docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md`):
> 1 NEW Astro route + 1 NEW Astro wrapper + 1 NEW React island mount
> component + 1 NEW `LocalStorageAdapter` MVP impl in `@skb/editor-shell`
> per ADR-0018 D8 接口冻结 (lines 339-451) + 1 NEW vitest round-trip
> suite + barrel re-export edits + apps/site CONTRACT.md `## Edit route
> (Wave 5)` minimal section + `@skb/editor-shell` CONTRACT.md
> `### NoteSaveAdapter (Wave 5; MVP shipped at C.4-prelude)` minimal
> subsection. Total LOC budget ~200 across all whitelist files (per
> v1.2 plan row LOC column).
>
> **Out-of-scope fence (deferred to C.4-1..C.4-5 full set + Stage C.3
> visual)**: palette / slash-menu / drag-handle / toolbar 完整组装
> (C.4-3); BlockRegistry/KernelRegistry full wire (C.4-3; minimal
> hardcoded subset OK at prelude per plan v1.2 line 501); save/load
> layoutEpoch sync + version increment trigger (C.4-4); e2e playwright
> load → edit → save → reload (C.4-5); v2 visual identity + Inter /
> JetBrains Mono fonts (Stage C.3); **NoteSaveAdapter interface
> contract HARDENING** (W5-2 contract surface + adapter contract test
> suite) — per Q3 plan-challenger absorbtion the C.4-prelude PR ships
> only the minimal MVP impl + minimal CONTRACT.md doc forward-pointer;
> full hardening lives at C.4-1.
>
> **PRE-COMMIT CLAUDE REVIEW (D1 stage 4) FIRES** per `## D2 trigger
> judgment` (Row 1 — apps/site CONTRACT.md `## Edit route (Wave 5)`
> section addition + `@skb/editor-shell` CONTRACT.md
> `### NoteSaveAdapter` subsection addition; Row 5 — cross-package
> public-surface boundary change since `NoteSaveAdapter` / `NoteState`
> / `LocalStorageAdapter` are NEW exports from `@skb/editor-shell`
> consumed by the apps/site `EditorShellMount` island).
>
> Cumulative PR delta tracker: this is **PR 18 of 32** locked
> implementation PRs at v1.2 (16 done at HEAD `722bbb0` post PR #70
> + #71 active.md sync; +1 = this C.4-prelude = 17 done after merge;
> remaining = C.2-7 + C.3-1..C.3-5 + C.4-1..C.4-5 + Stage C.4 close
> = 15 PRs to Wave 5 close).

## title

Minimal editor scaffold for `/notes/{slug}/edit` MVP smoke-test (per
Wave 5 plan v1.2 R14 SECOND real-test row C.4-prelude). Specifically:

1. NEW `apps/site/src/pages/notes/[...slug]/edit.astro` (~30-50 LOC;
   rest-route shape post R2 fix to handle nested slugs natively
   without `encodeURIComponent` mangling — see `## R14 self-check`
   final row + AC#1 explanation; supersedes original
   `[slug]/edit.astro` from v1.2 plan whitelist line 571 as
   mechanical scope refinement). Basic Astro static-paths route
   mounting `EditorShellMount` for each note slug. Coexists with the
   existing catch-all read-only renderer
   `apps/site/src/pages/notes/[...slug].astro` (squash `2586328`); the
   two routes are disjoint by Astro path-suffix specificity
   (`/notes/{...slug}` = read-only via catch-all;
   `/notes/{...slug}/edit` = edit-mode via this NEW route). The
   `getStaticPaths()` export iterates the same
   `getCollection('notes')` used by `[...slug].astro` and emits one
   route per note. The Astro page imports `BaseLayout` for shared
   theme + FOUC inline script + `apps/site/src/styles/grid.css` (the
   `.skb-grid` selector authority per ADR-0016 D8) and embeds
   `<EditorShellMount slug={slug} initialMdx={body} client:only="react" />`
   as the only body content.

2. NEW `apps/site/src/components/EditorShellMount.astro` (~10-20 LOC).
   Thin Astro wrapper that re-exports the React island below with
   `client:only="react"` (chosen mount mode — see point 3 below for
   rationale). Named-export `Props` interface matching the React
   island props (`{ slug: string; initialMdx: string }`). The `.astro`
   file is the integration seam keeping the React island invocation
   syntactically natural inside `.astro` consumers.

3. NEW `apps/site/src/components/EditorShellMount.tsx` (~50-80 LOC).
   React island consumed by the `.astro` wrapper above. Hydration mode
   = `client:only="react"`. Rationale: the editor-shell MUST run only
   on the client (Tiptap is browser-only — `document.execCommand` /
   `ProseMirror` DOM dependencies); `client:load` would force SSR a
   server stub which Tiptap rejects. `client:only="react"` skips SSR
   entirely + emits the React-rendered DOM at mount time post-
   hydration. Body: instantiate `LocalStorageAdapter(slug)`; on mount
   call `adapter.load()` + fall back to `props.initialMdx` if `null`
   (i.e. first edit of an MDX-source-only note); call `registerBlocks(
   blockRegistry)` (the C.2-1..C.2-6 already-shipped block registry
   accepts all 8 light + heavy blocks per ADR-0009 D1; heavy blocks
   render the Wave 5 plugin-placeholder tier per ADR-0014 v0.4 +
   apps/site `componentsMap` invariant; this is harmless at MVP — see
   `## R14 self-check` row 4 + plan v1.2 line 501 + Q4 absorbtion);
   render `<EditorShell initialContent={loadedMdx} onChange={handler}/>`
   wrapped in a `GridContainer` element. The `handler` debounces save() via
   `setTimeout(..., 800ms)` (Wave 5 MVP heuristic; C.4-4 owns
   trigger-strategy contract per plan v1.0 line 575).

4. NEW `packages/editor-shell/src/save-adapter.ts` (~140-200 LOC).
   Defines + exports `ReadonlyJSONValue` + `NoteState` + `NoteSaveAdapter`
   + `LocalStorageAdapter` byte-equal (modulo whitespace + JSDoc
   rewording) to the prose at
   `docs/decisions/ADR-0018-v2-visual-migration.md` lines 339-451 —
   the Stage C.4 实施 PR scope canonical interface freeze. Cite D8
   sub-sections `#### NoteSaveAdapter TypeScript interface` (lines
   333-451) + `#### Storage key + version field semantics` (lines
   453-457) verbatim in the file-head JSDoc. localStorage key prefix
   = `skb-note:{slug}` per D8 line 455 (NOT collide with design-tokens
   `skb-theme` per design-tokens CONTRACT.md `STORAGE_KEY` invariant).
   Per-note size cap = 2 MB; aggregate warn = 5 MB. Exception
   handling: `QuotaExceededError` → `{ ok: false, error: 'localStorage
   quota exceeded; ...' }`; `SecurityError` on `getItem` → `null` +
   `console.warn`; `SecurityError` on `setItem` → `{ ok: false, error:
   'localStorage disabled (private mode / sandbox); ...' }`; corrupted
   JSON in storage → `null` + `console.warn` (treat as new note per Q11
   data-loss disclosure). LOC budget MUST stay under 250 (ESLint
   `max-lines: 300` warn threshold); target 140-200.

5. NEW `packages/editor-shell/src/__tests__/save-adapter.test.ts`
   (~120-180 LOC). Vitest round-trip suite covering at minimum:
   - `load()` returns `null` for missing key
   - `save()` then `load()` round-trips a `NoteState` (`mdxSource` +
     `version` + `lastModified`)
   - `save()` rejects oversized (> 2 MB) state with
     `{ ok: false, error: ... '2MB limit' ... }`
   - corrupted JSON in localStorage → `load()` returns `null` +
     `console.warn` invoked once
   - `SecurityError` on `getItem` → `load()` returns `null`
   - `QuotaExceededError` on `setItem` → `save()` returns
     `{ ok: false, error: ... 'quota exceeded' ... }`
   - `SecurityError` on `setItem` → `save()` returns
     `{ ok: false, error: ... 'private mode / sandbox' ... }`
   Test scaffolding: `vi.stubGlobal('localStorage', mockStore)` for
   the happy-path round-trip cases; `vi.spyOn(localStorage, 'getItem')
   .mockImplementation(() => { throw new DOMException('...',
   'SecurityError'); })` for the exception paths; mock
   `QuotaExceededError` via `Object.assign(new Error('quota'), { name:
   'QuotaExceededError', code: 22 })` since jsdom doesn't surface the
   `DOMException` constructor with the `code` field set
   automatically. Each case asserts both the return value AND
   `console.warn.mock.calls.length` for the warn paths.

6. MODIFIED `packages/editor-shell/src/index.ts` (~3-4 LOC delta).
   Add barrel re-exports: `export { LocalStorageAdapter } from
   './save-adapter';` + `export type { ReadonlyJSONValue, NoteState,
   NoteSaveAdapter } from './save-adapter';`. Existing 20 exports
   preserved (no regression).

7. MODIFIED `packages/editor-shell/CONTRACT.md` (~25-40 LOC delta).
   Add NEW subsection
   `### NoteSaveAdapter (Wave 5; MVP shipped at C.4-prelude)` under
   the existing `## Public surface` section (between the
   `saveToMdx` / `loadFromMdx` / `SaveLoadOptions` block ending
   ~L58 and the closing `'use client'` paragraph ~L60-61), OR
   append at the bottom of `## Public surface` immediately before
   the `## Grid layout (Wave 5)` section (~L63). Subsection content:
   - public-surface bullets for `NoteSaveAdapter` interface +
     `NoteState` shape + `LocalStorageAdapter` impl + `ReadonlyJSONValue`
     type alias
   - localStorage key prefix `skb-note:{slug}` + 2 MB per-note cap +
     5 MB aggregate warn + 4 exception handling rules (Quota /
     Security on get / Security on set / corrupted JSON)
   - **C.4-prelude scope lock**: only the MVP `LocalStorageAdapter`
     impl + minimal public-surface listing ships here; **full
     contract hardening (W5-2 contract surface + adapter contract
     test suite + Phase 2+ ApiAdapter forward-pointer prose +
     interface-amendment policy via ADR-0018 amendment per D8 line
     464)** is C.4-1 scope per Q3 plan-challenger absorbtion (Wave
     5 plan v1.2 line 519, line 572 row C.4-1 ownership refinement)
   - cite ADR-0018 D8 line 339-451 verbatim freeze + D8 line 333-335
     adapter 落点 single-authority lock (NoteSaveAdapter at
     `@skb/editor-shell`, NOT `@skb/mdx-bridge`)

8. MODIFIED `apps/site/CONTRACT.md` (~20-35 LOC delta). Add NEW
   section `## Edit route (Wave 5)` between the existing
   `## Grid layout (Wave 5)` section (ends ~L106) and the
   `## Invariants` section (starts ~L108). Section content:
   - route surface: `/notes/[slug]/edit` static-paths route per note
     slug; coexists with read-only `/notes/[slug]` catch-all renderer
     by Astro path-depth disjointness
   - mount mode: `client:only="react"` for `EditorShellMount.tsx`
     (rationale: Tiptap browser-only)
   - persistence: `LocalStorageAdapter` from `@skb/editor-shell` per
     ADR-0018 D8 接口冻结; localStorage key `skb-note:{slug}`; NOT
     collide with `skb-theme` design-tokens key
   - block registry: `registerBlocks()` (all 8 blocks) at MVP per Q4
     absorbtion (heavy blocks render plugin-placeholder per ADR-0014
     v0.4 — harmless when not invoked at smoke-test); palette /
     slash-menu / drag-handle / toolbar 完整组装 deferred to C.4-3
   - C.4-prelude scope lock: this section is the MVP scaffold contract
     only; C.4-2 enhances the route + mount with full BlockRegistry /
     KernelRegistry wire-up; C.4-4 adds save/load layoutEpoch sync;
     C.4-5 adds e2e playwright

9. NEW `docs/plans/wave-5-main/C.4-prelude-editor-scaffold.md` (this
   PR.md). ~700-800 lines target.

## what

| # | File | Status | LOC budget | Purpose |
|---|---|---|---:|---|
| 1 | `apps/site/src/pages/notes/[...slug]/edit.astro` | NEW | 30-50 | Static-paths route per note (rest-route shape post R2 fix; see AC#1); mounts `EditorShellMount` via `client:only="react"`. |
| 2 | `apps/site/src/components/EditorShellMount.astro` | NEW | 10-20 | Astro wrapper re-exporting the React island. |
| 3 | `apps/site/src/components/EditorShellMount.tsx` | NEW | 50-80 | React island: `LocalStorageAdapter` + `EditorShell` + `GridContainer`. |
| 4 | `packages/editor-shell/src/save-adapter.ts` | NEW | 140-200 | `NoteSaveAdapter` interface + `NoteState` + `LocalStorageAdapter` MVP impl per ADR-0018 D8 接口冻结. |
| 5 | `packages/editor-shell/src/__tests__/save-adapter.test.ts` | NEW | 120-180 | 7+ vitest cases (round-trip + size cap + 4 exception paths). |
| 6 | `packages/editor-shell/src/index.ts` | MODIFY | +3-4 | Barrel re-exports for the 4 NEW save-adapter symbols. |
| 7 | `packages/editor-shell/CONTRACT.md` | MODIFY | +25-40 | NEW `### NoteSaveAdapter (Wave 5; MVP shipped at C.4-prelude)` subsection under `## Public surface`. |
| 8 | `apps/site/CONTRACT.md` | MODIFY | +20-35 | NEW `## Edit route (Wave 5)` section between `## Grid layout` and `## Invariants`. |
| 9 | `docs/plans/wave-5-main/C.4-prelude-editor-scaffold.md` | NEW (this) | 700-800 | This PR.md. |

**Total source/test LOC budget**: ~400-610 across files 1-8 (target
~200 net per plan v1.2 LOC column; the 200 lock is the implementation
core 1-5; doc + CONTRACT.md edits 6-8 are ~50-80 supplementary;
target total = 200 + ~80 = ~280). Tracking ±20% per `## R14
self-check` row 5; if drift > 20% → STOP + trigger v1.3 plan
amendment per memory `feedback_r14_defer_chain_plan_amendment.md`.

## why

### 1. User gatekeeper sequencing pushback → R14 SECOND real-test → v1.2 plan amendment

The user gatekeeper raised the verbatim sequencing complaint
**"交付了但 /notes/[slug]/edit 没有，我怎么 edit/尝试？"** during
post-C.2-6 status sync (2026-05-05). Diagnosis (per Wave 5 plan v1.2
section `## v1.2 R14 amendment (2026-05-05) — SECOND real-test`,
lines 478-523): Wave 5 plan v1.1 sequence pushed editor mount to
C.4-2 (~14 PRs out from the then-current 16-done state at HEAD
`722bbb0`); this violated the MVP framework "每版本体验" (per-version
user experience) core principle — the user could not 烟测
("smoke-test") the integrated editor before Stage C.3 visual + Stage
C.4 full UI assembly landed (15+ PRs out).

Per ADR-0015 R14 (mid-Wave reframe via plan amendment PR, NOT
memory-only) extended-by-illustration to the new gatekeeper-sequencing
trigger class (per memory `feedback_r14_defer_chain_plan_amendment.md`
illustrative-only reference; v1.1 absorbed defer-defer chain class +
v1.2 absorbs gatekeeper-sequencing class — together R14 discipline
operative across multiple trigger classes), orchestrator STOPped
forward execution + opened formal v1.1 → v1.2 plan amendment PR
running 5-stage D1 pipeline + plan-challenger light round (5/5
absorbed: Q1 LOCKED `C.4-prelude` semantic identifier NOT fractional
decimal + Q2 Stage C.4 grows 5 → 6 inline + Q3 ownership boundary
refined + Q4 NO hard dependency on C.2-7 + Q5 RE-LITIGATE memory
class split absorbed via two-layer trigger source). Squashes:
v1.2 amendment PR `56ff476` (#70) + active.md sync `722bbb0` (#71).
This C.4-prelude PR is the **first implementation deliverable post
v1.2 lock**, executing the row C.4-prelude whitelist verbatim.

### 2. MVP smoke-test surface enabled BEFORE Stage C.3 visual + C.4 full UI assembly + C.2-7 ADR-0014 v0.5 amendment

Post-C.4-prelude merge, the user can:
- navigate to `/notes/sample-mdx-note/edit` (or any note slug from
  `getCollection('notes')`)
- see `EditorShell` mounted inside `GridContainer` with the C.2-1 →
  C.2-6 grid + drag/drop + resize layers active
- load the sample note's MDX body (via `props.initialMdx` fallback if
  `LocalStorageAdapter.load()` returns `null` on first visit)
- edit prose (StarterKit + `proseExtensions` from
  `@skb/block-foundation` provide markdown-class editing)
- save to LocalStorage (debounced 800ms via `EditorShell.onChange`
  callback wiring)
- reload `/notes/[slug]/edit` and verify content + grid intact

This is the **minimum viable editor experience**; it is NOT the full
C.4 production wire (palette / slash-menu / drag-handle / toolbar +
full BlockRegistry/KernelRegistry contract hardening + version
increment + e2e playwright + v2 visual). Per Q4 plan-challenger
absorbtion (plan v1.2 line 513), the scaffold has **NO hard
dependency on C.2-7** (ADR-0014 v0.5 amendment + heavyBoundaryDimensions
grid context); the minimal hardcoded BlockRegistry uses light blocks
only (callout / code / markdown — derived from the existing
`registerBlocks()` already-shipped factory). C.2-7 follows
post-scaffold-merge without blocking the MVP smoke-test.

The MVP smoke-test enables a **faster user gatekeeper feedback loop**:
the user can validate the integrated grid + drag + resize + persist
flow against actual content, surface UX issues, and feed real-test
findings back into Stage C.3 + C.4 implementation PRs BEFORE 14 more
PRs land. This is the same per-version-experience enforcement R14
SECOND real-test made canonical at v1.2.

### 3. Ownership boundary refined (Q3 plan-challenger absorbtion): C.4-prelude ships MVP impl, C.4-1 hardens contract surface

The original Wave 5 plan v1.0 row C.4-1 (`docs/superpowers/plans/...`
line 572 pre-amendment) bundled together: `NoteSaveAdapter` interface
declaration + `NoteState` shape + `LocalStorageAdapter` MVP impl +
W5-2 contract surface hardening + adapter contract tests. Q3
plan-challenger absorbtion (plan v1.2 line 519 verbatim:
"ownership boundary refined: C.4-prelude ships MVP `LocalStorageAdapter`
impl; C.4-1 ships `NoteSaveAdapter` interface contract hardening +
W5-2 update + adapter contract tests (NOT re-implement MVP impl)")
split this into two PRs to avoid scope-overlap drift:

- **C.4-prelude (this PR)**: ships the **MVP impl** verbatim per
  ADR-0018 D8 lines 339-451 freeze + minimal CONTRACT.md
  doc-forward-pointer subsection. Vitest round-trip + 4 exception
  paths. NOT W5-2 contract hardening; NOT contract test suite; NOT
  Phase 2+ ApiAdapter forward-pointer prose elaboration. Focus =
  **MVP smoke-test enable**.

- **C.4-1 (post v1.2 row C.4-1; reduced from ~250 LOC to ~150 LOC)**:
  ships the **interface contract HARDENING** — W5-2 invariant prose
  formalization at `@skb/editor-shell/CONTRACT.md` `## Public surface`
  cross-referencing C.4-prelude impl + Phase 2+ ApiAdapter migration
  contract + adapter contract test suite (load/save/version invariant
  formal contracts) + interface-amendment policy via ADR-0018
  amendment per D8 line 464 ("接口冻结约束: Wave 5 任何 PR 改动
  NoteSaveAdapter / NoteState shape **必走 ADR-0018 Amendment**").
  C.4-1 does NOT re-implement the MVP impl — only hardens the
  contract surface around it.

### 4. Stage C.4 grew 5 → 6 PRs (Q2 plan-challenger absorbtion)

Per Q2 plan-challenger absorbtion (plan v1.2 line 519: "Stage C.4
grows 5 → 6 inline (NOT separate mini-stage); 'C.4 mini-stage is
intentionally inlined in C.4'"), the new C.4-prelude row is **inlined
into Stage C.4** at the start of the PR breakdown table (between Stage
C.3 close + existing C.4-1 row), NOT a separate Stage C.5 mini-stage.
Stage C.4 final implementation PR count = 6 (C.4-prelude + C.4-1 +
C.4-2 + C.4-3 + C.4-4 + C.4-5). Wave 5 total locked implementation
PRs: 30 (v1.0) → 31 (v1.1 +C.2-3.5) → 32 (v1.2 +C.4-prelude).
Cumulative delta tracker = 2/30 = 6.7%, well below D4 R14 threshold
("PR 总量变化 > 15%"). Future v1.3+ amendments must re-check
cumulative delta against this baseline.

## acceptance

This PR is ACCEPT (per pr-writer 2nd dispatch at D1 stage 6 per
ADR-0011 D1) iff ALL of the following hold post-COMMIT (squash
HEAD = TBD):

### A. File deltas match whitelist (D1 stage 6 mechanical check)

- [ ] **AC#1**: `apps/site/src/pages/notes/[...slug]/edit.astro` exists
      (rest-route shape; per R2 reviewer round-2 fix to handle nested
      slugs like `__test_cjk__/laptop` natively without
      `encodeURIComponent` mangling — original `[slug]/edit.astro`
      shape from v1.2 plan whitelist line 571 traded for
      `[...slug]/edit.astro` as **mechanical scope refinement** per
      Wave 5 plan v1.0 D4 R14 thresholds; same classification as
      whitelist items 10/11 EXECUTE-time additions; matches the
      existing Wave 3 Stage C `apps/site/src/pages/notes/[...slug].astro`
      catch-all read-only renderer shape) with `getStaticPaths()`
      enumerating each note via `getCollection('notes')` +
      `<EditorShellMount slug={...} initialMdx={...} client:only="react" />`
      body. ~30-50 LOC.
- [ ] **AC#2**: `apps/site/src/components/EditorShellMount.astro`
      exists; thin Astro wrapper exposing `Props` interface.
      ~10-20 LOC.
- [ ] **AC#3**: `apps/site/src/components/EditorShellMount.tsx`
      exists; React island with `LocalStorageAdapter(slug)` instance
      + `registerBlocks(registry)` call + an `EditorShell` element
      inside a `GridContainer` element + 800 ms debounced `onChange`
      save handler.
      ~50-80 LOC.
- [ ] **AC#4**: `packages/editor-shell/src/save-adapter.ts` exists
      with `ReadonlyJSONValue` + `NoteState` + `NoteSaveAdapter` +
      `LocalStorageAdapter` exported. ~140-200 LOC; under 250 LOC
      ESLint warn threshold.
- [ ] **AC#5**: `packages/editor-shell/src/__tests__/save-adapter.test.ts`
      exists with 7+ vitest cases enumerated in `## TDD plan`; all
      PASS. ~120-180 LOC.
- [ ] **AC#6**: `packages/editor-shell/src/index.ts` adds 3-4 LOC of
      barrel re-exports (`LocalStorageAdapter` + 3 type re-exports).
      Existing 20 exports preserved.
- [ ] **AC#7**: `packages/editor-shell/CONTRACT.md` adds NEW
      `### NoteSaveAdapter (Wave 5; MVP shipped at C.4-prelude)`
      subsection under `## Public surface` (~25-40 LOC delta).
- [ ] **AC#8**: `apps/site/CONTRACT.md` adds NEW `## Edit route
      (Wave 5)` section between `## Grid layout (Wave 5)` and
      `## Invariants` (~20-35 LOC delta).
- [ ] **AC#9**: `docs/plans/wave-5-main/C.4-prelude-editor-scaffold.md`
      exists (this PR.md).

### B. Interface byte-equivalence to ADR-0018 D8 freeze

- [ ] **AC#10**: `grep -A 4 'export type ReadonlyJSONValue' packages/editor-shell/src/save-adapter.ts`
      produces a recursive readonly JSON union matching ADR-0018
      lines 343-346 modulo whitespace + JSDoc rewording. (Specifically:
      `string | number | boolean | null` + `readonly ReadonlyJSONValue[]`
      + `{ readonly [key: string]: ReadonlyJSONValue }`.)
- [ ] **AC#11**: `grep -A 12 'export interface NoteState' packages/editor-shell/src/save-adapter.ts`
      produces the 4-field shape matching ADR-0018 lines 348-361:
      `mdxSource: string` + `tiptapState?: ReadonlyJSONValue` +
      `lastModified: number` + `version: number`, all `readonly`.
- [ ] **AC#12**: `grep -A 18 'export interface NoteSaveAdapter' packages/editor-shell/src/save-adapter.ts`
      produces the 3-member shape matching ADR-0018 lines 363-383:
      `readonly slug: string` + `load(): Promise<NoteState | null>`
      + `save(state: NoteState): Promise<{ ok: boolean; error?: string }>`.
      Phase 2+ extension comment block (D8 lines 375-382) MUST be
      preserved verbatim modulo JSDoc rewording (per Q12 absorbtion
      Phase 2+ 兼容位预留).
- [ ] **AC#13**: `grep -A 60 'export class LocalStorageAdapter' packages/editor-shell/src/save-adapter.ts`
      produces the load + save methods matching ADR-0018 lines
      385-443 modulo whitespace + JSDoc rewording. Specifically:
      `PER_NOTE_MAX_BYTES = 2 * 1024 * 1024` + `AGGREGATE_WARN_BYTES
      = 5 * 1024 * 1024` + `localStorage.getItem('skb-note:'+slug)`
      load + `JSON.parse` corrupted-catch + SecurityError outer-catch
      + `localStorage.setItem('skb-note:'+slug, serialized)` save +
      QuotaExceededError catch + SecurityError catch.
- [ ] **AC#14**: localStorage key prefix is byte-equal `skb-note:`
      (per ADR-0018 D8 line 455); NOT collide with design-tokens
      `skb-theme` (per design-tokens CONTRACT.md `STORAGE_KEY`
      invariant). Verify via `grep -n "'skb-note:'" packages/editor-shell/src/save-adapter.ts`
      (≥ 2 hits — one in `load()` + one in `save()` + optionally one
      in the aggregate-size scan).

### C. Vitest + integration green

- [ ] **AC#15**: `pnpm --filter=@skb/editor-shell test` includes the
      NEW `save-adapter.test.ts` cases; ALL PASS. The 7 cases
      enumerated in `## TDD plan` are ALL present + each asserts
      both return value + (where applicable) `console.warn` mock
      call count.
- [ ] **AC#16**: `pnpm check` PASSES (lint + typecheck + test +
      build + size). No new ESLint warnings on `save-adapter.ts`
      (under 250 LOC). No new typecheck failures across
      `@skb/editor-shell` + `apps/site`.
- [ ] **AC#17**: `pnpm size-check` PASSES (500-line hard fail per
      file). Every NEW file < 500 lines (target < 250).
- [ ] **AC#18**: `pnpm link-check` PASSES (lychee). No autolink-
      in-backticks regressions per memory
      `feedback_lychee_autolink_in_backticks.md` (regex-grep
      `\`[^\`]*<\w+>[^\`]*\`` over the 3 doc deltas: this PR.md +
      `apps/site/CONTRACT.md` + `packages/editor-shell/CONTRACT.md`
      should match zero rows).

### D. Cross-package + invariant compliance

- [ ] **AC#19**: `apps/site/src/pages/notes/[...slug].astro` (the
      catch-all read-only renderer; squash `2586328`) is UNTOUCHED
      by this PR (read-only display path is orthogonal). `git diff
      --stat` shows zero LOC delta on that file.
- [ ] **AC#20**: Astro static-paths reconciliation: `pnpm --filter=
      @skb/site build` produces both `dist/notes/[slug]/index.html`
      (read-only) + `dist/notes/[slug]/edit/index.html` (edit) for
      each sample note (`sample-mdx-note`, `sample-blocks`,
      `__test_cjk__/laptop`, `__test_cjk__/zh-note`). Verify via
      `find apps/site/dist/notes -type f -name '*.html'`.
- [ ] **AC#21**: `apps/site/package.json` has 2 NEW workspace deps
      added (`@skb/editor-shell`: `workspace:*` + `@skb/block-foundation`:
      `workspace:*`); `pnpm-lock.yaml` regenerated to match. Per
      whitelist items 10/11 EXECUTE-time mechanical scope refinement
      (the original PR.md draft incorrectly assumed editor-shell was
      already a transitive apps/site dep at the v1.2 plan-lock time;
      codex executor flagged the unresolved import at Step E and
      orchestrator pre-cleared the addition under "scope refinement"
      classification). `packages/editor-shell/package.json` is
      UNTOUCHED (zero LOC delta).
- [ ] **AC#22**: `EditorShellMount.tsx` uses `client:only="react"`
      (NOT `client:load`). Per `## risks` row (c) below, Tiptap is
      browser-only; SSR stub forces hydration mismatch. Verify via
      `grep 'client:only="react"' apps/site/src/pages/notes/[...slug]/edit.astro`.
- [ ] **AC#23**: cumulative PR delta tracker reads "**PR 18 of 32**
      locked at v1.2; 17 done after this merge; 15 remaining to Wave
      5 close" — assert via `## R14 self-check` row 6.

## scope (whitelist)

ONLY these files (no globs; per ADR-0006 D8 explicit-file-list
staging discipline + Wave 5 plan v1.2 row C.4-prelude line 571
verbatim):

1. `apps/site/src/pages/notes/[...slug]/edit.astro` (NEW; rest-route
   shape per R2 reviewer fix; supersedes original `[slug]/edit.astro`
   from v1.2 plan whitelist line 571 — see `## R14 self-check`
   final row + AC#1 explanation)
2. `apps/site/src/components/EditorShellMount.astro` (NEW)
3. `apps/site/src/components/EditorShellMount.tsx` (NEW)
4. `packages/editor-shell/src/save-adapter.ts` (NEW)
5. `packages/editor-shell/src/__tests__/save-adapter.test.ts` (NEW)
6. `packages/editor-shell/src/index.ts` (MODIFY; barrel re-exports)
7. `packages/editor-shell/CONTRACT.md` (MODIFY; NEW `### NoteSaveAdapter
   (Wave 5; MVP shipped at C.4-prelude)` subsection under
   `## Public surface`)
8. `apps/site/CONTRACT.md` (MODIFY; NEW `## Edit route (Wave 5)`
   section between `## Grid layout (Wave 5)` and `## Invariants`)
9. `docs/plans/wave-5-main/C.4-prelude-editor-scaffold.md` (this
   PR.md)
10. `apps/site/package.json` (MODIFY; mechanical workspace dep
    declaration only — add `@skb/editor-shell` and
    `@skb/block-foundation` as `workspace:*` dependencies). EXECUTE-
    time scope refinement discovered when codex flagged unresolved
    `@skb/editor-shell` imports at `apps/site/src/components/
    EditorShellMount.tsx`. Per Wave 5 plan v1.0 D4 R14 thresholds
    ("PR 总量变化 >15% / 新增高风险模块 ≥1 / 跨-package边界 / 改成功标准 = reframe;
    任务顺序 / 命名 / 测试补充 = scope refinement"), declaring an existing
    workspace package as a workspace dep is a **mechanical scope
    refinement** (no PR-count delta, no new module, the cross-package
    boundary apps/site → @skb/editor-shell was already crossed at the
    import level by the locked PR.md `## what` step 7), NOT an R14
    reframe trigger. Documented here for traceability per ADR-0011 D1
    transparency.
11. `pnpm-lock.yaml` (MODIFY; auto-regenerated by `pnpm install` after
    package.json edit). Same mechanical scope refinement
    classification as item 10.

Anything outside this 11-file list = scope creep → STOP + trigger
v1.3 plan amendment per memory `feedback_r14_defer_chain_plan_amendment.md`
(see `## R14 self-check` final row).

## out-of-scope (deferred)

The following are explicitly OUT OF SCOPE for C.4-prelude (per Wave
5 plan v1.2 lines 503-509 verbatim + Q3 ownership boundary
absorbtion line 519). Each is owned by a downstream PR:

- **palette / slash-menu / drag-handle / toolbar 完整组装** — deferred
  to **C.4-3** (BlockRegistry + KernelRegistry + mdx-bridge wire-up
  + palette/slash-menu/drag-handle/toolbar 组装; per plan v1.2 line
  574). The MVP scaffold uses the bare `EditorShell` (StarterKit +
  `proseExtensions`-only) — sufficient for prose smoke-test.

- **`BlockRegistry` + `KernelRegistry` full wire** — deferred to
  **C.4-3** (per plan v1.2 line 574). C.4-prelude calls the
  already-shipped `registerBlocks(registry)` factory (per
  `@skb/editor-shell/src/registerBlocks.ts` shipped at Wave 3 Stage
  A2), which registers all 8 blocks (5 light + 3 heavy); heavy
  blocks render the ADR-0014 v0.4 plugin-placeholder tier (harmless
  static React shell). This is the **minimal hardcoded BlockRegistry
  subset** per plan v1.2 line 501; explicitly OK at prelude per Q4
  absorbtion.

- **save/load layoutEpoch sync + version increment trigger** —
  deferred to **C.4-4** (per plan v1.2 line 575). C.4-prelude `save()`
  calls do NOT increment `version` (the `EditorShellMount.tsx`
  debounced handler uses a plain in-component `useRef` counter
  starting at 1, hardcoded; layoutEpoch wiring + version-as-
  optimistic-lock semantic is C.4-4 scope per ADR-0018 D8 line 357).

- **e2e playwright load → edit → save → reload coverage** — deferred
  to **C.4-5** (per plan v1.2 line 576). C.4-prelude vitest covers
  the `LocalStorageAdapter` round-trip; e2e covers the full route +
  mount + reload flow under real chromium (skip-on-WSL2 per memory
  `feedback_wsl2_chromium_launch.md`; CI-only execution).

- **v2 visual identity (OKLCH colors + 8-kind hue bars + prose
  customization + shadow refresh)** — deferred to **Stage C.3**
  (C.3-1..C.3-5 per plan v1.2 lines 559-565). C.4-prelude inherits
  the existing v1 visual baseline (Wave 4 close); the editor UI
  surface is intentionally bare.

- **Inter / JetBrains Mono fonts** — deferred to **Stage C.3-1**
  (per ADR-0018 D2 + plan v1.2 line 559).

- **NoteSaveAdapter interface contract HARDENING** (W5-2 contract
  surface formalization + adapter contract test suite + Phase 2+
  ApiAdapter forward-pointer prose elaboration + interface-amendment
  policy doc) — deferred to **C.4-1** per Q3 plan-challenger
  absorbtion (plan v1.2 line 519 + line 572 row C.4-1 ownership
  refinement). C.4-prelude ships only the MVP impl + minimal
  doc-forward-pointer subsection in `@skb/editor-shell/CONTRACT.md`.

- **C.2-7 (ADR-0014 v0.5 amendment + heavyBoundaryDimensions grid
  context 联动 W5-1)** — sequencing peer; per Q4 plan-challenger
  absorbtion (plan v1.2 line 513) C.4-prelude has **NO hard
  dependency on C.2-7**. C.2-7 follows post-scaffold-merge without
  blocking the MVP smoke-test (scaffold uses light blocks only +
  does NOT consume `heavyBoundaryDimensions`).

## D2 trigger judgment

Per ADR-0007 D2 + ADR-0011 D1 stage-4 trigger conditions:

### Row 1 — CONTRACT.md change

This PR modifies **two** CONTRACT.md files:

- `apps/site/CONTRACT.md` — NEW `## Edit route (Wave 5)` section
  (~20-35 LOC delta) documenting route surface + mount mode + persistence
  + block registry + scope lock.
- `packages/editor-shell/CONTRACT.md` — NEW
  `### NoteSaveAdapter (Wave 5; MVP shipped at C.4-prelude)` subsection
  (~25-40 LOC delta) documenting public-surface bullets + key prefix +
  size caps + 4 exception rules + scope lock to C.4-1.

→ **Row 1 FIRES.**

### Row 5 — Cross-package public-surface boundary change

This PR introduces NEW exports from `@skb/editor-shell` (`NoteSaveAdapter`
+ `NoteState` + `LocalStorageAdapter` + `ReadonlyJSONValue`) consumed
by the apps/site `EditorShellMount.tsx` island. Two packages touched
in the same PR (editor-shell + apps/site) with a NEW boundary contract.

→ **Row 5 FIRES.**

### Row 4 — NEW ADR required

This PR does NOT introduce a new ADR; it implements the already-locked
ADR-0018 D8 接口冻结 (lines 339-451). NoteSaveAdapter / NoteState /
LocalStorageAdapter are byte-equal-to-D8 declarations + NOT silent
interface extensions (per D8 line 464 invariant).

→ **Row 4 does NOT fire.**

### Stage 4 PRE-COMMIT CLAUDE REVIEW gate

Per ADR-0011 D1 stage 4 trigger conditions ("D2 row 1+4 hit") + the
broader interpretation per ADR-0007 D2 row 5 cross-package class:

→ **Stage 4 PRE-COMMIT CLAUDE REVIEW (orchestrator self) FIRES.**
The orchestrator-self review at Stage 4 mitigates same-model echo
chamber on the cross-package public-surface boundary + 2 CONTRACT.md
edits + the ADR-0018 D8 interface byte-equivalence verification.
Specific orchestrator-self review checks enumerated at
`## stage-4 PRE-COMMIT CLAUDE REVIEW prep` below.

## TDD plan

Per CLAUDE.md "Review workflow" stage 2 (TDD-front: write tests first
→ write impl → vitest all PASS), the executor sequence is:

### Step 1 — Write `packages/editor-shell/src/__tests__/save-adapter.test.ts` first

Vitest cases (all 7+ MUST be present + green; ~120-180 LOC):

1. **`load() returns null for missing key`** — `vi.stubGlobal('localStorage',
   {getItem: () => null, setItem: vi.fn(), key: () => null, length: 0,
   clear: vi.fn(), removeItem: vi.fn()})`. `const adapter = new
   LocalStorageAdapter('test-slug')`. `expect(await adapter.load()).toBe(
   null)`.

2. **`save() then load() round-trips a NoteState`** — use a real Map-
   backed mock localStorage. `const state: NoteState = { mdxSource:
   '# hello', lastModified: 1700000000, version: 1 }`. `expect(await
   adapter.save(state)).toEqual({ ok: true })`. `expect(await
   adapter.load()).toEqual(state)`. (`tiptapState` omitted — exercises
   the optional-field branch.)

3. **`save() rejects oversized state`** — construct `mdxSource` of
   length `2 * 1024 * 1024 + 1` (e.g., `'a'.repeat(2*1024*1024+1)`).
   `expect(result.ok).toBe(false); expect(result.error).toMatch(/2MB
   limit|2 MB|2097152|exceeds/)`.

4. **`load() returns null + console.warn for corrupted JSON`** —
   pre-seed `localStorage` with `localStorage.setItem('skb-note:test-
   slug', 'not-json{{{')`. `const warnSpy = vi.spyOn(console,
   'warn').mockImplementation(() => {})`. `expect(await
   adapter.load()).toBe(null); expect(warnSpy).toHaveBeenCalledTimes(
   1); expect(warnSpy.mock.calls[0][0]).toMatch(/corrupted/i)`.

5. **`load() returns null on SecurityError`** — `vi.spyOn(localStorage,
   'getItem').mockImplementation(() => { throw new DOMException('access
   denied', 'SecurityError'); })`. `const warnSpy = vi.spyOn(console,
   'warn').mockImplementation(() => {})`. `expect(await
   adapter.load()).toBe(null); expect(warnSpy).toHaveBeenCalledTimes(
   1)`.

6. **`save() rejects on QuotaExceededError`** — construct mock error:
   `const err = Object.assign(new DOMException('Quota exceeded',
   'QuotaExceededError'), { code: 22 })`. `vi.spyOn(localStorage,
   'setItem').mockImplementation(() => { throw err; })`. `const result
   = await adapter.save(smallState); expect(result.ok).toBe(false);
   expect(result.error).toMatch(/quota/i)`.

7. **`save() rejects on SecurityError on setItem`** —
   `vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw
   new DOMException('private mode', 'SecurityError'); })`. `const
   result = await adapter.save(smallState); expect(result.ok).toBe(
   false); expect(result.error).toMatch(/private mode|sandbox|
   disabled/i)`.

Optional 8th case (defensive — recommended but not blocking):
8. **`save() console.warn fires when aggregate exceeds 5 MB warn
   threshold`** — pre-populate Map-backed mock with 4 existing notes
   each 1.4 MB; save a 5th 1 MB note; assert `warnSpy.mock.calls`
   contains a matching `/aggregate.*5MB|exceeds 5MB/i` invocation +
   `result.ok === true` (warn is non-fatal).

### Step 2 — Write `packages/editor-shell/src/save-adapter.ts` impl

Verbatim per ADR-0018 D8 lines 339-451 (modulo JSDoc rewording +
file-head comment citing ADR-0018 D8 + plan v1.2 row C.4-prelude).
Run `pnpm --filter=@skb/editor-shell test save-adapter` — all 7+
cases MUST PASS.

### Step 3 — Write `packages/editor-shell/src/index.ts` barrel + run
`pnpm --filter=@skb/editor-shell typecheck` to verify export wire.

### Step 4 — Write `apps/site/src/components/EditorShellMount.tsx` +
`EditorShellMount.astro` + `[slug]/edit.astro` route.

NO vitest for the route + mount component at C.4-prelude (per `##
out-of-scope` — e2e playwright deferred to C.4-5; visual smoke
deferred to C.3-5). Verify via `pnpm --filter=@skb/site build`
(static-paths reconciliation produces both `dist/notes/[slug]/...`
+ `dist/notes/[slug]/edit/...` HTML).

### Step 5 — Write `apps/site/CONTRACT.md` `## Edit route (Wave 5)`
section + `packages/editor-shell/CONTRACT.md`
`### NoteSaveAdapter (Wave 5; MVP shipped at C.4-prelude)` subsection.

### Step 6 — Run full `pnpm check` + `pnpm link-check` + `pnpm size-check`

ALL must PASS. Any failure → fix BEFORE committing.

## risks

### (a) NoteSaveAdapter interface drift from ADR-0018 D8 freeze

The largest risk: silent interface drift from D8 lines 339-451 (e.g.,
field rename, optional-field flip, extra field added at MVP without
ADR-0018 amendment). Per D8 line 464 invariant: "Wave 5 任何 PR 改动
NoteSaveAdapter / NoteState shape **必走 ADR-0018 Amendment** (D2
row 4 fires)"; silent extension violates contract freeze.

**Mitigation**: AC#10..AC#14 byte-equivalence checks (grep + visual
diff vs ADR-0018 D8 lines). Stage 4 PRE-COMMIT CLAUDE REVIEW
orchestrator-self runs the AC#10..AC#14 sequence as a hard gate
before authorising COMMIT; any drift = STOP + raise as ADR-0018
amendment Q (NOT silent fix).

### (b) Astro static-paths conflict between `[...slug].astro` (read-only catch-all) and `[slug]/edit.astro` (edit-mode)

Astro routes `/src/pages/notes/[...slug].astro` (rest catch-all) +
`/src/pages/notes/[slug]/edit.astro` (single-segment + literal `edit`)
must be reconcilable by Astro's static-paths resolver. Empirical
risk: catch-all takes precedence on `/notes/[slug]/edit` and routes
to `[...slug].astro` with `slug = "[slug]/edit"` instead of the
edit route.

**Mitigation**: Astro 4.x static-paths resolver matches **most-
specific-first** by static-segment count; `[slug]/edit.astro` has
1 dynamic segment + 1 literal segment (`edit`) = depth-2 specificity;
`[...slug].astro` has 1 rest segment = depth-1 specificity. The
literal-segment route wins. Verify via AC#20: `pnpm --filter=
@skb/site build` MUST emit BOTH `dist/notes/[slug]/index.html`
(catch-all read-only output) + `dist/notes/[slug]/edit/index.html`
(literal edit-route output) for the same slug.

If Astro resolution is ambiguous (4.x changes between versions per
the Astro changelog), fall back to a more-specific catch-all variant
of `[...slug].astro` that excludes paths ending in `/edit` (filter
inside `getStaticPaths()` `.filter(({ params }) => !params.slug?.
endsWith('/edit'))`); this is a **secondary mitigation only** if
AC#20 fails — preferred is the depth-2-specificity natural resolution.

### (c) `EditorShellMount` client island hydration timing on first paint

`client:load` would force Astro to SSR a server-stub of the React
component before hydration; Tiptap is browser-only (`document.execCommand`,
`ProseMirror` DOM dependencies) and would throw during SSR. The
chosen `client:only="react"` skips SSR entirely + emits the component
post-hydration only.

**Trade-off**: `client:only="react"` produces a **first-paint blank
flash** (no SSR placeholder for the editor surface). For MVP smoke-
test this is acceptable (the user sees a fast initial nav + then
the editor mounts within ~100-300 ms post-load). Stage C.3 visual
PR can add a CSS skeleton placeholder if the flash is judged poor
UX.

**Mitigation**: document the choice explicitly in `apps/site/CONTRACT.md`
`## Edit route (Wave 5)` section (mount mode bullet) + cite the
Tiptap-browser-only rationale. AC#22 grep verifies `client:only="react"`
is used (NOT `client:load`).

### (d) localStorage key collision with existing `skb-theme` design-tokens key

The design-tokens package (`packages/design-tokens/CONTRACT.md`)
owns `STORAGE_KEY = 'skb-theme'` for the FOUC theme persistence.
The NEW `LocalStorageAdapter` key prefix `skb-note:{slug}` (per
ADR-0018 D8 line 455) MUST NOT collide.

**Mitigation**: `skb-note:` (with colon separator + slug) is a
distinct prefix from `skb-theme` (no colon, full key). No string-
prefix overlap. AC#14 verifies the prefix byte-equality. Future
`@skb/*` packages MUST also avoid `skb-note:` collision (single-
authority registration table maintained at design-tokens
CONTRACT.md if collision risk grows; out-of-scope at C.4-prelude
since only 2 keys exist post-merge).

### (e) (additional, lower-priority) `registerBlocks(registry)` heavy-block render path on first edit

`registerBlocks()` registers all 8 blocks including the 3 heavy ones
(Jupyter / NnViz / AgentFlow). At MVP smoke-test the user is unlikely
to invoke heavy-block rendering (no palette to insert + StarterKit-
only prose); but a corrupted-MDX load with heavy-block JSX could
trigger the plugin-placeholder render path.

**Mitigation**: ADR-0014 v0.4 plugin-placeholder tier is the Wave 5
shipped state — placeholder render is harmless (static React shell;
no Pyodide / TF.js / React Flow load). Per Q4 absorbtion (plan v1.2
line 513), heavy-block boundary dimensions are NOT consumed at
C.4-prelude (`heavyBoundaryDimensions` is C.2-7 scope). Risk surface
= cosmetic only; not blocking.

## R14 self-check

Per memory `feedback_r14_defer_chain_plan_amendment.md` + Wave 5
plan v1.2 R14 SECOND real-test discipline, mechanical self-test
that this PR's scope matches the v1.2 plan row C.4-prelude verbatim
+ no scope drift + LOC budget within ±20%:

| # | Check | Pass condition | Status |
|---|---|---|---|
| 1 | Whitelist match | All 9 files in `## scope (whitelist)` map verbatim to plan v1.2 row C.4-prelude line 571 (apps/site route + EditorShellMount {astro,tsx} + apps/site CONTRACT.md + editor-shell save-adapter.ts + tests + 1 PR.md) + the 2 implicit-but-required additions (`packages/editor-shell/src/index.ts` barrel + `packages/editor-shell/CONTRACT.md` minimal subsection) which are NOT explicitly in the row 571 prose but are the **structurally minimum** edits for a NEW public-surface export per ADR-0011 D1 + W5-2 contract surface forward-pointer per Q3 absorbtion | ✅ planned (verify post-EXECUTE) |
| 2 | LOC budget | Total source/test LOC delta ≤ 280 (target 200 ±20% = 160-240; +80 supplementary doc edits = ~280 upper bound) | ✅ tracked in `## what` table |
| 3 | No out-of-scope drift | None of the 7 deferred items (palette / BlockRegistry full / save layoutEpoch / e2e / v2 visual / fonts / NoteSaveAdapter contract hardening) appear as implementation deltas in this PR's `git diff` | ✅ planned (verify post-EXECUTE via stage-4 file-list grep) |
| 4 | Q1-Q4 absorbtion outcomes reflected | Q1 `C.4-prelude` semantic identifier (NOT fractional) used in PR.md filename + plan row reference + cumulative tracker + Q2 Stage C.4 6-PR breakdown affirmed (PR 18 of 32 framing) + Q3 ownership boundary refined (MVP impl here, contract hardening at C.4-1) + Q4 NO hard dependency on C.2-7 (light blocks only; `heavyBoundaryDimensions` not consumed) | ✅ all 4 cited in `## why` + `## out-of-scope` + `## D2 trigger judgment` + `## risks` |
| 5 | Drift detection escape valve | If during EXECUTE the implementation requires an out-of-scope file (e.g., `apps/api/...`, `packages/mdx-bridge/...`, additional CONTRACT.md edit) → STOP + open v1.3 plan amendment PR (5-stage D1 + plan-challenger light round) per `feedback_r14_defer_chain_plan_amendment.md` + ADR-0015 R14; do NOT fold into this PR | ✅ executor instruction |
| 6 | Cumulative PR delta | Wave 5 v1.0 baseline 30; v1.1 +1 (C.2-3.5) = 31; v1.2 +1 (C.4-prelude) = 32. Cumulative delta 2/30 = 6.7% < 15% threshold. This PR consumes 1/15 remaining = 6.7% local progress; PR 18 of 32 | ✅ tracked |
| 7 | R14 SECOND real-test trigger source two-layer | Cite ADR-0015 R14 canonical authority (规范依据) + memory `feedback_r14_defer_chain_plan_amendment.md` illustrative-only reference (NOT same-class identity match — defer-chain memory reused by extension to gatekeeper-sequencing class per Q5 absorbtion) | ✅ cited in `## why` paragraph 1 |
| 8 | NoteSaveAdapter interface byte-equivalence | AC#10..AC#14 grep checks against ADR-0018 D8 lines 339-451 freeze; any drift → STOP + raise as ADR-0018 amendment Q + D2 row 4 fires (see `## risks` row a) | ✅ planned (verify post-EXECUTE Stage 4) |

## stage-4 PRE-COMMIT CLAUDE REVIEW prep

Per ADR-0011 D1 stage 4 trigger conditions (D2 row 1 + Row 5 fires;
see `## D2 trigger judgment` above), orchestrator-self pre-commit
checks BEFORE authorising reviewer codex COMMIT (D1 stage 5):

1. **ADR-0018 D8 byte-equivalence grep** — run AC#10..AC#14 grep
   sequence against `packages/editor-shell/src/save-adapter.ts`:
   - `grep -A 4 'export type ReadonlyJSONValue' ...` matches D8 line
     343-346 (recursive readonly JSON union)
   - `grep -A 12 'export interface NoteState' ...` matches D8 line
     348-361 (4 readonly fields)
   - `grep -A 18 'export interface NoteSaveAdapter' ...` matches D8
     line 363-383 (3 members + Phase 2+ extension comment block)
   - `grep -A 60 'export class LocalStorageAdapter' ...` matches D8
     line 385-443 (constants + load + save + 4 exception paths)
   - `grep -n "'skb-note:'" ...` ≥ 2 hits (key prefix verbatim per
     D8 line 455)
   ANY drift → STOP + raise as ADR-0018 amendment Q (D2 row 4 fires).

2. **`apps/site/CONTRACT.md` `## Edit route (Wave 5)` section
   presence** — `grep -n '^## Edit route (Wave 5)$' apps/site/CONTRACT.md`
   ≥ 1 hit + section content has the 5 mandated bullets (route
   surface + mount mode + persistence + block registry + scope lock).

3. **`packages/editor-shell/CONTRACT.md`
   `### NoteSaveAdapter (Wave 5; MVP shipped at C.4-prelude)`
   subsection presence** — `grep -n '^### NoteSaveAdapter (Wave 5;
   MVP shipped at C.4-prelude)$' packages/editor-shell/CONTRACT.md`
   ≥ 1 hit + subsection content has the 4 mandated bullet groups
   (public-surface + key prefix + size caps + scope lock to C.4-1).

4. **Barrel re-exports in `packages/editor-shell/src/index.ts`** —
   `grep -n 'save-adapter' packages/editor-shell/src/index.ts` ≥ 2
   hits (one for value `LocalStorageAdapter`, one for type `NoteSaveAdapter
   | NoteState | ReadonlyJSONValue`).

5. **localStorage key prefix `skb-note:` byte-match** — covered by
   check 1 grep + AC#14 cross-reference; specifically NOT colliding
   with design-tokens `skb-theme` key per design-tokens CONTRACT.md
   `STORAGE_KEY` invariant.

6. **vitest 7+ cases all PASS** — `pnpm --filter=@skb/editor-shell
   test save-adapter` MUST exit 0 + the 7 enumerated cases (per
   `## TDD plan` Step 1) all green.

7. **`pnpm size-check` PASS** — every NEW file < 500 lines hard
   limit + every NEW file under 250 lines (under ESLint `max-lines:
   300` warn). `save-adapter.ts` MUST be < 250 LOC.

8. **`pnpm link-check` (lychee) PASS** — no autolink-in-backticks
   regression per memory `feedback_lychee_autolink_in_backticks.md`
   (`grep -nE '`[^`]*<\w+>[^`]*`' docs/plans/wave-5-main/C.4-prelude-editor-scaffold.md
   apps/site/CONTRACT.md packages/editor-shell/CONTRACT.md` MUST
   match zero rows). No `npmjs.com` URLs per memory
   `feedback_lychee_npmjs_403.md`. No `~/.claude/...` markdown
   links per memory `feedback_lychee_user_local_paths.md`.

9. **ADR-0006 8-point checklist self-pass** — orchestrator-self
   walks the 8 points (file size + cross-file ref sync + lychee +
   pnpm check mandate + git mutation discipline + web access
   discipline + cross-package moves + 8th-class hunt for high-risk
   surface). Stage 4 trigger = mitigates same-model echo chamber on
   the cross-package public-surface boundary.

10. **Astro static-paths reconciliation pre-build sanity** — run
    `pnpm --filter=@skb/site build` locally + verify
    `find apps/site/dist/notes -type f -name '*.html' | sort` shows
    BOTH `dist/notes/[slug]/index.html` (catch-all read-only) +
    `dist/notes/[slug]/edit/index.html` (NEW edit route) for each
    sample slug. Per `## risks` row (b) — if catch-all swallows the
    edit route, fall back to filtered `getStaticPaths()` mitigation.

11. **`pnpm check:affected` PASS** — limit to packages affected
    since `origin/main` to catch any cross-package typecheck
    regression early; full `pnpm check` MUST PASS as the final
    AC#16 hard gate.

ALL 11 checks PASS → orchestrator-self authorises reviewer codex
COMMIT (D1 stage 5) per ADR-0006 D8 explicit-file-list staging
(`git reset HEAD` → `git add <9 files>` → `git diff --cached
--stat` verify file count = 9 + LOC delta ≤ ~610 → `git commit`).

ANY check FAILS → STOP + remediate before COMMIT (NO `--amend` per
git-mutation discipline; new commit per CLAUDE.md hard rule 5 +
memory `feedback_git_operator_explicit_stage.md`).

## Related

- [Wave 5 plan v1.2 row C.4-prelude](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md)
  — line 571 (whitelist row) + lines 478-523 (`## v1.2 R14 amendment`
  rationale + Q1-Q5 plan-challenger absorbtion)
- [ADR-0018 D8 接口冻结](../../decisions/ADR-0018-v2-visual-migration.md)
  — lines 319-464 (entire D8 section); specifically lines 339-451
  (NoteSaveAdapter TypeScript interface block — verbatim freeze)
  + lines 453-457 (Storage key + version field semantics) + line
  464 (interface-amendment policy)
- [ADR-0015 R14](../../decisions/ADR-0015-wave-4-close.md) — mid-Wave
  reframe via plan amendment PR canonical authority (extended-by-
  illustration to gatekeeper-sequencing trigger class via memory
  `feedback_r14_defer_chain_plan_amendment.md` per Q5 two-layer
  absorbtion)
- [ADR-0011 D1 linear pipeline](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — D1 stage 4 PRE-COMMIT CLAUDE REVIEW trigger conditions
- [ADR-0007 D2 trigger judgment](../../decisions/ADR-0007-job-function-codex-heavy-execution.md)
  — Row 1 (CONTRACT) + Row 5 (cross-package boundary) judgment table
- [ADR-0006 D8 explicit-file-list staging](../../decisions/ADR-0006-pr-gate-and-claude-review-protocol.md)
  — reviewer codex COMMIT discipline
- [ADR-0014 v0.4 plugin-placeholder tier](../../decisions/ADR-0014-heavy-block-boundary.md)
  — heavy-block harmless-at-MVP rationale
- [ADR-0016 D8/D9/D11/D12](../../decisions/ADR-0016-grid-data-model.md)
  — `.skb-grid` selector authority + SSR/hydration phase split +
  Tiptap-inside/grid-outside layering + layoutEpoch ordering
- [`@skb/editor-shell` CONTRACT.md current state](../../../packages/editor-shell/CONTRACT.md)
  — `## Public surface` section (this PR appends NEW
  `### NoteSaveAdapter (Wave 5; MVP shipped at C.4-prelude)`
  subsection)
- [`apps/site` CONTRACT.md current state](../../../apps/site/CONTRACT.md)
  — `## Grid layout (Wave 5)` section ends at L106 (this PR appends
  NEW `## Edit route (Wave 5)` section between Grid layout and
  Invariants)
- [Wave 5 plan v1.2 amendment PR squash `56ff476` (#70)](https://github.com/W-YI/selfKnowledgeBaseWeb/pull/70)
  + active.md sync squash `722bbb0` (#71) — v1.2 R14 SECOND real-test
  formalize
- previous Stage C.2 implementation PR exemplars:
  [C.2-6 resize UX](./C.2-6-resize-ux.md) + [C.2-5 drag/drop UX](./C.2-5-drag-drop.md)
  + [C.2-4 editor-shell grid](./C.2-4-editor-shell-grid.md)
