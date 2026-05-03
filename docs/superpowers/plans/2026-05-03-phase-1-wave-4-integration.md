# Wave 4 — Phase 1 integration plan

| 字段 | 值 |
| ---- | --- |
| 状态 | locked (post plan-challenger 15/15 absorbtion 2026-05-03) |
| Wave | Phase 1 Wave 4 |
| 起步 HEAD | `876d700` (post Pre-A2 merge; ADR-0014 v0.2 proposed locked) |
| 起步预备 | Pre-A1 (HEAD `9836d67`, codex runbook --yolo + R7 /tmp piping + pipefail) + Pre-A2 (HEAD `876d700`, ADR-0014 design lock) — 2 bootstrap PRs merged 2026-05-03 |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx) |
| 触发 | Wave 3 close ([ADR-0013](../../decisions/ADR-0013-wave-3-close.md)) handed off 5 mandatory carry-overs + 3 gatekeeper smoke findings; Pre-A1+Pre-A2 bootstrap closed 2 of those 5 (R7 piping fix + ADR-0014 design lock) |
| 替代 | 不替代任何 ADR；this is a workplan, not architecture |

## Context

Wave 3 closed 2026-05-02 (ADR-0013, HEAD `4deb5cb` then close-ceremony
at `6ebbe9a`) with 24 main pipeline PRs across Pre-A + 4 stages. Wave 3
deferred 5 mandatory carry-overs and surfaced 3 gatekeeper smoke
findings post-merge. Wave 4 scope = those carry-overs + new scope
determined at this lock.

Pre-A1 (HEAD `9836d67`, 2026-05-03) closed mandatory carry-over #5
(codex audit-log piping fix R7 in runbook) + bootstrap-codified
operational disciplines (`--yolo` flag + `set -o pipefail` + R7 /tmp
piping + R7 `head -2000` truncate to `docs/audits/codex-runs/`). Pre-A2
(HEAD `876d700`, 2026-05-03) closed mandatory carry-over #2
(ADR-0014 candidate) by authoring ADR-0014 v0.2 (proposed status; 12/12
plan-challenger challenges absorbed) + adding W4-1 invariant to
`block-foundation/CONTRACT.md` + refreshing
`docs/decisions/README.md` ADR index.

3 of 5 mandatory carry-overs remain (closed in Stage A or B):
- C4a + C4b + C5 (Stage C completion of Wave 3) → Stage A
- ADR-0012 amendment (PageFind query-time substring) → Stage B
- Path-prose alignment in ADR-0012 → Stage B

3 gatekeeper smoke findings to address:
- #8 sample-assets ship (4 binary files) → Stage B
- #9 sample-blocks intro prose update → Stage B
- #10 ADR-0014 strengthened design (dimensions per kind + skeleton
  visual + zero layout shift) → already absorbed into ADR-0014 v0.2;
  Stage A implementation enforces

ADR-0011 D1 KEPT for Wave 4 unchanged. Operational disciplines from
Pre-A1 (`--yolo` + pipefail + /tmp piping) apply to all Wave 4 codex
dispatches.

Resource baseline:
- 21 packages at HEAD `876d700` (no Wave 3+Pre-A1+Pre-A2 net change)
- ADR roster: 14 ADRs (ADR-0001 to ADR-0014; 0014 proposed pending
  Stage A close promotion)
- 1 long-term Claude session (orchestrator) per ADR-0011 D8 invariant

## Decision

Wave 4 ships **3 stages + open-ended Phase 1 user-iteration scope**.
Total PR count target: **Stage A 7-8 + Stage B 5-6 + Stage C
open-ended** = ~12-14 fixed PRs + N user-iteration PRs.

PR-by-PR breakdown below per ADR-0011 D2 schema (title / files /
test_cases / contracts_affected / adr_touched / acceptance / executor).
**Plan-challenger codex round** validates granularity per ADR-0007 D5
+ R13; absorbtion table at end of this plan locks final scope.

### Stage A — ADR-0014 implementation + Stage C carry-over (~7-8 PRs)

**Goal**: ship the `@skb/heavy-block-boundary` package per ADR-0014
v0.2 D-list; migrate 3 heavy blocks (Jupyter / NnViz / AgentFlow) in
apps/site to use the boundary; close Wave 3 C4a/C4b/C5 carry-overs;
promote ADR-0014 to accepted at Stage A close.

**Stage A close criterion** (gates ALL must pass before A8 proposed):
1. ADR-0014 status `proposed` → `accepted` (1-line ADR header change +
   same-PR sub-task per gatekeeper directive 2026-05-03 #3 — must NOT
   be deferred to Stage B or later)
2. A6 playwright zero-layout-shift test passes (per plan-challenger
   C2 absorbtion — A6 fail blocks Stage A close; if A5 dimensions
   require adjustment from real-render diff, those changes ship in A6
   or pre-A8 fwd-fix)
3. A2 + A3 (HeavyBlockBoundary core impl + retry semantics) regressions
   resolved (per plan-challenger C1 absorbtion — A1 shell + later
   PRs may leave partially-usable API; Stage A close blocked until
   core + retry fully ratified by tests)
4. A7→A8 transition includes formal "post-implementation review of
   ADR-0014 v0.2 against actual implementation" checkpoint (per
   plan-challenger C5 absorbtion — if A1-A7 surface ADR inconsistency,
   open ADR-0014 v0.2.1 amendment BEFORE A8 status flip; do NOT
   retrofit silently)

#### A1 — `@skb/heavy-block-boundary` package creation

- **scope**: `packages/heavy-block-boundary/` package shell —
  `package.json` (peerDeps react ≥18, react-dom ≥18; optional
  `@skb/design-tokens`) + `tsconfig.json` + `CONTRACT.md` (the public
  surface defined in ADR-0014 D1) + `src/index.ts` barrel +
  `src/HeavyBlockBoundary.tsx` placeholder export (signature only,
  body TBD in A2) + `src/__tests__/skeleton.test.ts` (1 trivial test
  to ensure vitest harness wired)
- **size**: ~150 LOC across ~6 files
- **executor**: `codex-generic-executor`
- **D2 trigger judgment** (per gatekeeper 2026-05-03 #1 + plan-challenger
  Q5 absorbtion — Stage 4 = Row 1/4-driven only per ADR-0011 D1; not
  by Row 2 alone):
  - **Row 1** (CONTRACT change): **HIT** — `packages/heavy-block-boundary/CONTRACT.md`
    is NEW (the public-surface contract for ADR-0014 W4-1 invariant
    consumer-side); this is the Stage 4 trigger
  - **Row 2** (package add): flag-only (Stage 4 NOT triggered by
    Row 2 in isolation per ADR-0011 D1; included in PR.md
    `## D2 trigger judgment` for codex-pr-reviewer-55 + ADR-0008 D1
    dead-dep auditor visibility)
  - **Row 4** (new ADR): NO — ADR-0014 already locked at Pre-A2
  - → **D1 stage 4 PRE-COMMIT CLAUDE REVIEW fires** (Row 1 HIT, NEW
    CONTRACT.md)
- **acceptance** (sketched; finalized at PR.md author time per pr-writer):
  - Package builds via `pnpm build --filter=@skb/heavy-block-boundary`
  - vitest skeleton test runs + passes
  - `package.json` declares `peerDependencies` per D7
  - `CONTRACT.md` references ADR-0014 D1 API + W4-1 invariant from
    block-foundation
  - apps/site `package.json` adds `@skb/heavy-block-boundary` to deps
    (proves not-dead; ADR-0008 D1)
  - `pnpm-lock.yaml` updates only by the new package + apps/site dep
- **post-PR codex audits**: `codex-structure-auditor` per
  `per_pr_post_commit` trigger (verify ADR-0008 D1 dead-dep TOTAL_VIOLATIONS=0
  + monitor metrics)

**Note (gatekeeper directive 2026-05-03 #1)**: PR.md `## adr_touched`
explicitly lists ADR-0014; PR.md `## D2 trigger judgment` explicitly
flags `new_package: @skb/heavy-block-boundary`.

#### A2 — HeavyBlockBoundary core implementation (D1 + D2 + D3 mount/load)

- **scope**: `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx` —
  per ADR-0014 D1 props interface + D2 SSR rendering (skeleton +
  `data-block` + `data-deferred` + `aria-busy` + `role=status`) +
  D3 hydration (mount → call `load({ signal })` via `useEffect` →
  `setComponent(LoadedComponent)` on resolve)
- **vitest tests**: AC#1 (component lives in package) / AC#2 (type
  test on generic `<P>`) / AC#3 (SSR/hydration byte-equivalence) /
  AC#6 (successful load path) / AC#10 (mount guard) / AC#11
  (AbortSignal propagation)
- **size**: ~200 LOC + ~150 LOC tests
- **executor**: `codex-generic-executor`
- **D2 trigger judgment**: Row 1 (CONTRACT — new public surface in own
  package) — borderline; Stage 4 NOT mandatory if A1 already committed
  the CONTRACT shape. Treat as standard PR.
- **acceptance**: `pnpm test --filter=@skb/heavy-block-boundary` passes
  AC#1/#2/#3/#6/#10/#11; mount-guard test specifically asserts no
  React state update warning after unmount

#### A3 — Retry + maxRetries + onLoadError telemetry (D3 retry flow)

- **scope**: extend HeavyBlockBoundary.tsx with retry button render +
  attempt counter + `maxRetries` bound + `onLoadError(err, attempt)`
  callback + reject-path UI; `errorText` + `retryLabel` props honored
- **vitest tests**: AC#7 (rejected load path) / AC#8 (retry path) /
  AC#9 (`maxRetries` bound)
- **size**: ~100 LOC + ~120 LOC tests
- **executor**: `codex-generic-executor`
- **D2 trigger judgment**: standard PR
- **acceptance**: rejected-load → error UI + retry button enabled +
  `onLoadError(err, 1)` called; click retry → new AbortController,
  attempt=2, skeleton restored; after `maxRetries=2` → button
  disabled

#### A4 — Skeleton CSS + a11y semantics (D6 + D2 a11y refinements)

- **scope**: `packages/heavy-block-boundary/src/heavy-block-skeleton.css`
  per ADR-0014 D6 (CSS variables driven by `@skb/design-tokens` with
  minimal hex fallbacks; `prefers-reduced-motion` query); refine
  HeavyBlockBoundary.tsx to import + apply CSS classes
- **vitest tests**: AC#4 (exact CSS class/size/style at first paint)
  / AC#12 (a11y semantics: `role=status` + `aria-busy` toggling +
  `aria-live=polite` only on text + `aria-hidden` on spinner) / AC#14
  (prefers-reduced-motion)
- **size**: ~80 LOC CSS + ~30 LOC TSX + ~120 LOC tests
- **executor**: `codex-css-stylist` (D7 routing — first viable
  scaffolder for design-token-driven CSS)
- **D2 trigger judgment**: Row 1 (CONTRACT minor — CSS class names
  exposed); standard PR
- **acceptance**: CSS asset exported + classes match D6 names; a11y
  test passes; reduced-motion media query honored
- **post-PR codex audits**: `codex-css-stylist` retrospective sanity
  check

#### A5 — `heavyBoundaryDimensions` exports + 3 heavy block migration

- **scope**: 3 heavy block packages each gain a
  `heavyBoundaryDimensions: HeavyBlockDimensions` export from
  `ui-default/<kind>.ui.ts` (D5 default values: jupyter 600×400 /
  nn-viz 500×400 / agent-flow 600×400 — initial; gatekeeper #10
  validation occurs at A6 playwright test); `apps/site/src/components.ts`
  replaces `makeHeavyBlockPlaceholder` with `HeavyBlockBoundary` calls
  per ADR-0014 D8 + uses the per-block adapter pattern
  (`.then((m) => ({ default: m.<Kind>RenderView }))` per D8 R-fix)
- **vitest tests**: AC#13 (plugin extensibility) / AC#15 (dimensions
  sourced from heavy block packages)
- **size**: ~50 LOC across heavy block packages + ~80 LOC apps/site
  rewrite + ~80 LOC tests
- **executor**: `codex-generic-executor`
- **D2 trigger judgment** (per plan-challenger Q5 absorbtion — Row 1
  requires CONTRACT.md touch; Row 5 alone does NOT fire Stage 4):
  - **Row 1** (CONTRACT): HIT — A5 MUST update each heavy block
    package's CONTRACT.md to document the new `heavyBoundaryDimensions`
    public export (per ADR-0011 D2 v0.1.1 SOTed discipline + ADR-0008
    D2 RFC consumer touch-protocol)
  - **Row 5** (cross ≥3 packages): flag-only — block-jupyter +
    block-nn-viz + block-agent-flow + apps/site all touched; NOT a
    Stage 4 trigger in isolation per ADR-0011 D1
  - → D1 stage 4 PRE-COMMIT CLAUDE REVIEW fires (Row 1, multiple
    CONTRACT.md touched)
- **dependency ordering** (per plan-challenger C1 absorbtion): A5 is
  BLOCKED until A2 (HeavyBlockBoundary core impl) AND A3 (retry
  semantics) merge. apps/site `components.ts` cannot reasonably consume
  HeavyBlockBoundary if its core/retry contracts are unstable.
- **acceptance**: 3 heavy block packages export
  `heavyBoundaryDimensions`; apps/site/components.ts uses
  `HeavyBlockBoundary` for all 3 + imports the dims from each package
  (NOT inline literals); MDX render path sees skeleton on SSR + real
  component after hydration

#### A6 — Playwright zero-layout-shift test

- **scope**: playwright spec exercising sample-blocks page (post-A5
  migration); compares `getBoundingClientRect()` at T0 (initial render
  with skeleton) vs T1 (post-hydration with real heavy block); width
  identical, height delta ≤ 5px
- **vitest tests**: AC#5 (zero layout shift)
- **size**: ~120 LOC playwright spec
- **executor**: `codex-generic-executor`
- **D2 trigger judgment**: standard PR
- **acceptance**: playwright spec runs in CI (lint/test/build/lighthouse
  workflow); T0/T1 rect comparison passes for all 3 heavy blocks
- **note**: leverages Wave 3 sample-blocks page; depends on A5 being
  merged first

#### A7 — C4a + C4b consolidated `.astro` variant integration (5 .astro variants in one PR per gatekeeper directive 2026-05-03 #2)

- **scope**: wire the 5 existing `.astro` variants
  (`packages/block-{math,pdf,jupyter,nn-viz,agent-flow}/src/ui-default/<Kind>.astro`)
  into `apps/site` for direct Astro page consumers (orphan today;
  Wave 3 left them unused). Use `codex-block-generator` clone pattern:
  write 1 template integration (e.g., Math.astro consumer wrapper) +
  clone to other 4 with parameter substitution.
- **size**: ~30 LOC × 5 + ~20 LOC apps/site index = ~170 LOC total
  (clone-driven; high template ratio)
- **executor**: `codex-block-generator`
- **D2 trigger judgment** (per plan-challenger Q5 absorbtion — Row 5
  alone does NOT fire Stage 4):
  - **Row 1** (CONTRACT): possibly — apps/site CONTRACT.md may add
    `## Astro variants` section; if so, Stage 4 fires
  - **Row 5** (cross ≥3 packages): flag-only
  - → D1 stage 4 fires ONLY IF apps/site CONTRACT.md touched;
    otherwise standard PR
- **acceptance** (per plan-challenger Q1 + C3 absorbtion):
  - 5 Astro consumer wrappers in apps/site, verifying orphan files
    now reach a build target
  - **per-variant compile + render smoke check** (per Q1 absorbtion):
    each `.astro` integration must have an explicit smoke assertion
    (build succeeds + at least 1 element renders) so cross-variant
    regression is caught early
  - **explicit revert steps documented in PR.md** (per C3 absorbtion):
    if any one `.astro` integration fails, the rollback path (remove
    apps/site entries + re-run fallback build check) is documented
    per-variant for clean isolation
  - lighthouse audit confirms no bundle regression
- **note (gatekeeper #2 + plan-challenger Q1 absorbtion)**:
  consolidation locked at 1 PR for all 5 (codex-block-generator clone
  pattern). Per Q1 verdict (medium): "wrapper/template pattern is
  mechanically similar across all five files; source size is small
  enough that one PR should stay reviewable". Risk mitigated by per-variant
  smoke checks + revert steps. Split-fallback only if implementation
  surfaces variant-specific deltas.

#### A8 — C5 Phase 2 selective chunking + perf baseline + ADR-0014 promotion (Stage A close)

- **scope**: refine `apps/site/astro.config.mjs` `manualChunks` to
  Phase 2 selective per-block chunking strategy (C5 carry-over) **only
  if data justifies** (per plan-challenger C4 absorbtion — measure
  bundle impact first via codex-perf-auditor; only add a dedicated
  `manualChunks` rule for `@skb/heavy-block-boundary` if perf data
  shows boundary code leaking into prose-only chunks; do NOT
  preemptively split without data); dispatch `codex-perf-auditor` for
  baseline (Lighthouse + size-limit + Astro --analyze); record output
  to `docs/audits/perf-2026-05-XX.md`; **promote ADR-0014 from
  `proposed` → `accepted`** in same PR (1-line change at top of
  ADR-0014 + add `## Status updated 2026-05-XX` log line); refresh
  `docs/decisions/README.md` ADR-0014 row status accordingly
- **pre-promotion review** (per plan-challenger C5 absorbtion): A8
  PR.md MUST include explicit "## Pre-promotion review" section that
  walks A1-A7 implementation against ADR-0014 v0.2 D-list. If any
  ADR inconsistency surfaces, **OPEN ADR-0014 v0.2.1 amendment first**
  (separate small PR) THEN promote. Do NOT silently retrofit.
- **size**: ~40 LOC astro.config.mjs (data-driven; may be 0 LOC if
  no leak) + ~10 LOC ADR-0014 + ~5 LOC README + new perf audit file
  (~200 LOC)
- **executor**: `codex-generic-executor` for chunking + ADR/README
  edits; `codex-perf-auditor` for baseline (separate dispatch);
  orchestrator-self for ADR promotion language
- **D2 trigger judgment** (per plan-challenger Q5 absorbtion):
  - **Row 1** (CONTRACT): NO (apps/site CONTRACT.md not changed unless
    chunking strategy changes consumer surface)
  - **Row 4** (new ADR): NO — promoting existing ADR is not
    "new ADR creation"; tracking via ADR's own Amendments section
  - **Row 8** (perf): borderline — perf-auditor dispatched; not CI
    workflow change
  - Stage 4 NOT mandatory per ADR-0011 D1 D2 row table; orchestrator-self
    review at minimum (per plan-challenger Q5 absorbtion)
- **acceptance**: ADR-0014 status `accepted` at top + Amendments §
  v0.2.1 logs the promotion timestamp; perf audit committed under
  `docs/audits/`; chunking config either ships a justified
  `manualChunks` rule (with perf evidence) OR documents the no-op
  decision (also with perf evidence)

**Stage A close criterion** (per gatekeeper #3): A8 PR commit MUST
contain ADR-0014 `proposed` → `accepted` 1-line change + Amendments
§ v0.2.1 log line. If A8 PR ships Phase 2 chunking but defers ADR
promotion, that's a Stage A close violation requiring forward-fix
PR before Stage B opens.

### Stage B — Wave 3 retrospective items + smoke #8/#9 + structure-baseline §6 (~5-6 PRs)

**Goal**: close the 3 remaining Wave 3 mandatory carry-overs not
covered by Stage A; close gatekeeper smoke findings #8 + #9; close
Wave 3 close §6 structure-baseline binding follow-up (b).

**Stage B close criterion**: all carry-overs cleared; structure
baseline can re-baseline against Wave 4 work.

#### B1 — ADR-0012 amendment (PageFind query-time substring + path prose)

- **scope**: amend `docs/decisions/ADR-0012-search-index-stack.md` —
  criterion 4 inverse-discriminator clause: (a) describe substring
  fallback as expected behavior + explicitly waive inverse assertion,
  OR (b) introduce custom query parser path (would require
  pagefind-upstream feature OR app-side post-filter); plus
  path-prose alignment (`_pagefind/` → `pagefind/` per ADR-0013 D3).
  Add `## Amendments` section v0.1.1 entry per ADR-0011 v0.1.1
  precedent.
- **size**: ~80 LOC ADR prose
- **executor**: orchestrator-self (doc-only ADR amendment)
- **D2 trigger judgment**: Row 4 (ADR amendment) — same precedent as
  ADR-0011 v0.1.1 (Pre-B1 Wave 3); Stage 4 fires
- **acceptance**: ADR-0012 criterion 4 reflects D3 runtime finding
  truthfully; amendment self-documents via Amendments section; no
  apps/site source change (decision-only)
- **note**: gatekeeper smoke evidence (CJK substring noise on `笔记本`
  query matching `笔记测试`) is the empirical evidence. Plan-challenger
  validates option (a) vs (b) lean.

#### B2 — sample-assets ship (4 binary files)

- **scope**: `apps/site/public/sample-assets/{diagram-small.png,
  figure-1.png, whitepaper.pdf}` + `apps/site/public/favicon.ico`
- **size**: ~0 LOC code (binary files)
- **executor**: orchestrator-self (manual binary file placement)
- **D2 trigger judgment**: standard PR (no CONTRACT/ADR touch)
- **acceptance**: sample-blocks page Image/Pdf blocks render real
  binaries instead of alt-text + 404 iframes; visual smoke verifies
- **note**: PNG content can be any architecture/diagram placeholder
  PNG; PDF can be any 1-3 page placeholder PDF (1 + 3 page references
  in fixture). User may supply preferred binaries.

#### B3 — sample-blocks intro prose update

- **scope**: `content/notes/sample-blocks/index.mdx` intro paragraph —
  remove obsolete "Wave 3 mdx-bridge integration WILL register" prose
  (that's done); reflect Wave 3 + Wave 4 Stage A status (5 light blocks
  real-render + 3 heavy blocks via HeavyBlockBoundary); update Note on
  draft to remove outdated language
- **size**: ~30 LOC MDX prose
- **executor**: orchestrator-self (doc-only prose update)
- **D2 trigger judgment**: standard PR
- **acceptance**: intro paragraph accurate to current state; no
  broken `<Image>` / `<Pdf>` references (depends on B2)

#### B4 — content/notes/__test_cjk__ relocation

- **scope**: move `content/notes/__test_cjk__/{zh-note,laptop}` test
  fixtures out of production content collection. Options: (a) symlink
  at vitest setup time + add `.gitignore` entry, (b) build-time
  content-collection filter excluding `__test_*` prefix slugs from
  production output. Plan-challenger validates option choice.
- **size**: ~60 LOC config + content move
- **executor**: `codex-generic-executor`
- **D2 trigger judgment**: standard PR
- **acceptance**: production `astro build` doesn't include
  `__test_cjk__` in `dist/notes/`; vitest tests still find fixtures
  at test path; CJK regression test (search-cjk.test.ts) still passes

#### B5a — Stage A retrospective items 2-6 absorbtion (cast / UIDefault / ESLint / mdx-bridge)

- **scope** (per plan-challenger Q3 absorbtion — split B5 into 2 PRs
  to keep contract/type/fixtures concerns coherent within PR boundary):
  - Item 2: cast asymmetry (5/3 cast pattern in registerBlocks) —
    type narrowing cleanup (Wave 3 deferred per ADR-0013 D3)
  - Item 3: UIDefault casing (`jupyterUiDefault` vs
    `jupyterUIDefault` symmetry) — 1-character renames
  - Item 4: ESLint argsIgnorePattern adoption
  - Item 6: mdx-bridge per-block fixture symmetry
- **size**: ~120 LOC total across various touch points
- **executor**: `codex-generic-executor`
- **D2 trigger judgment**: Row 1 likely HIT (cast asymmetry implies
  registerBlocks contract narrowing); Stage 4 fires if Row 1 confirmed
  at PR.md author time
- **acceptance**: each retrospective item closed; per-item evidence
  in PR.md acceptance bullets

#### B5b — codex profile prefix consistency (R3) + generated docs sync

- **scope** (per plan-challenger Q3 absorbtion — separate from B5a
  to isolate tooling/config/doc concerns):
  - Item 7: codex profile prefix consistency (R3) — agent-contract.md
    `tool_patterns:` `profile:` field uses `codex-` prefix consistently
    (currently inconsistent: scaffolder/plan-challenger no prefix;
    codex-pr-reviewer-55 has prefix; generic-executor / structure-auditor
    / perf-auditor / mdx-doctor no prefix)
  - regenerated downstream surfaces: `docs/runbooks/codex-tool-invocations.md`
    + `tmp/codex-profiles.toml` + AGENTS.md (if affected)
- **size**: ~60 LOC agent-contract.md + regen artifacts
- **executor**: orchestrator-self (authority touch + regen)
- **D2 trigger judgment**: Row 1 HIT (agent-contract.md = authority
  document; same pattern as Pre-A1); Stage 4 fires
- **acceptance**: all 11 codex profiles use `codex-` prefix in
  `agent-contract.md` `tool_patterns:` `profile:` field;
  `~/.codex/config.toml` user-side merge guidance updated in runbook
  to reflect new canonical names; idempotent regen produces no diff

#### B6 — Wave 4 close ceremony preparation

- **scope**: optional pre-close audit dispatches:
  `codex-structure-auditor` (Wave 4 baseline + dead-dep + drift),
  `codex-perf-auditor` (post-Stage-A bundle baseline),
  `codex-mdx-doctor` (RTT fixtures still pass);
  refresh `docs/audits/structure-2026-05-wave-4-prep.md`
- **size**: ~200 LOC audit summary
- **executor**: orchestrator (curates codex audit outputs)
- **D2 trigger judgment**: standard
- **acceptance**: 3 codex audits run; orchestrator-curated summary
  committed; Wave 4 close-ceremony ADR (ADR-0015) drafting can begin

### Stage C — Phase 1 user-iteration scope (open-ended; NOT pre-locked per gatekeeper directive 2026-05-03 #4)

**Framework** (per gatekeeper directive #4 + MVP framework 2026-05-02
lock): Stage C is intentionally NOT a fixed PR list. It opens after
Stage B close, runs for 1-2 weeks (or longer) of user-driven note
authoring, and closes when user subjectively judges "够好" (per MVP
framework). Each PR is triggered by a user-reported finding from
real-world note-taking sessions.

**Candidate areas** (illustrative; NOT prescriptive — plan-challenger
must NOT compress these into a fixed list):
- Tiptap necessity evaluation (per Wave 3 retrospective — does the
  editor scope justify Tiptap dep weight?)
- Grid layout 进 MVP 决策 (currently absent; user may want)
- Palette/theme UX polish per real authoring feedback
- Agent CLI 起步 (orchestrator-CLI bridge for user task triggering)
- Search UX refinements post ADR-0012 amendment (B1)
- Block authoring edge-cases surfaced by user
- Performance regressions surfaced by perf baseline

**Stage C close criterion**: user MVP-judgment (per 2026-05-02 framework).
Wave 4 close ceremony (ADR-0015) opens at this point.

**Hard guardrails** (Stage C operates within these):
- ADR-0011 D1 pipeline still applies per PR
- ADR-0014 W4-1 invariant honored for new heavy blocks
- ADR-0008 D1 dead-dep policy honored for any new package
- 200 LOC + 1 narrow responsibility per ADR-0011 D2

**Stage C orchestration checklist** (per plan-challenger C7
absorbtion — "concise checklist for orchestration only, NOT a fixed
PR rollup"):
- User explicitly approves opening Stage C ("ok, Wave 4 Stage A+B
  done, let's do Stage C user-iteration scope")
- After each user-feedback PR ships, orchestrator + user briefly
  review unresolved-issue trend (subjective; e.g., "too many rough
  edges still pop up — not yet 够好" vs "this version is solid for
  daily use — Wave 4 close ceremony time")
- Wave 4 close ceremony triggers when user judges 够好 per MVP
  framework (2026-05-02 lock); NOT a hard PR count or test gate

## Wave 4 close ceremony (post-Stage-C close — OUT OF SCOPE for this plan)

Pattern follows ADR-0010 (Wave 2 close) + ADR-0013 (Wave 3 close):
- New ADR-0015 (Wave 4 close) ratifying full PR roster + retrospective
  items + ADR-0014 promotion confirmation
- Structure-baseline audit refreshed (`docs/audits/structure-2026-XX-wave-4-close.md`)
- `docs/plans/active.md` repointed to Wave 5 (or Phase 2 if Phase 1 done)
- MEMORY.md retrospective entries codified per discovered learnings

**Explicit out-of-scope per plan-challenger C9 absorbtion**: ADR-0015
authoring is NOT in Stage A or B lock scope; NOT in Stage C lock
scope. It belongs to the close-ceremony work that begins AFTER
Stage C closes (when user MVP-judgment fires). Treating it earlier
risks premature lock + retrospective gap.

Wave 4 close ≠ MVP launch (per 2026-05-02 framework). MVP launch is
user subjective + decoupled from wave structure.

## D-list summary

| # | Item | Rationale |
|---|---|---|
| D1 | **Stage A = 8 PRs** (locked post plan-challenger Q1+Q2; A1 package + A2 core + A3 retry + A4 CSS/a11y + A5 dims+migration + A6 playwright + A7 5×.astro consolidated + A8 perf+chunking+ADR-promote) | Plan-challenger Q1: option (a) consolidated A7 with per-variant smoke checks. Q2: keep A2/A3/A4 split (separate contracts, easier validation) |
| D2 | Stage A close MUST include ADR-0014 `proposed`→`accepted` promotion in A8 same commit + 4 close gates (ADR promote + A6 pass + A2/A3 stable + A7→A8 ADR review) | Per gatekeeper directive #3 + plan-challenger C2+C5 absorbtion (gates prevent Stage A close miss) |
| D3 | **Stage B = 6 PRs** (locked post plan-challenger Q3; B1 ADR-0012 amend + B2 sample-assets + B3 intro prose + B4 __test_cjk__ relocate + B5a retrospective items 2-6 + B5b codex profile prefix + B6 Wave 4 close-ceremony prep) | Plan-challenger Q3: split B5 → B5a (cast/UIDefault/ESLint/mdx-bridge) + B5b (codex profile prefix + generated docs). Note: B5b counts as the +1 making Stage B = 6 not 5 |
| D4 | Stage C open-ended Phase 1 user-iteration (NOT pre-locked) + orchestration checklist for open/close signaling | Per gatekeeper directive #4 + plan-challenger C7 absorbtion (concise checklist for orchestration only, no fixed PR rollup) |
| D5 | Stage A A1 (`@skb/heavy-block-boundary` package creation) D2 trigger = Row 1 (NEW CONTRACT.md) → stage 4 fires; Row 2 (package add) is flag-only | Per gatekeeper directive #1 + plan-challenger Q5 absorbtion (Stage 4 = Row 1/4-driven only per ADR-0011 D1; Row 2/5 alone don't fire) |
| D6 | All Wave 4 codex dispatches use Pre-A1 discipline (`--yolo` + `set -o pipefail` + /tmp piping + head -2000 archive) | Pre-A1 codified; runbook canonical |
| D7 | Plan-challenger codex round MANDATORY before lock | Per ADR-0007 D5 + R13 + Pre-A2 precedent (12/12 absorbed); Pre-A3 (Wave 4 plan-draft) absorbtion table 15/15 immediately below |
| D8 | **AC#2 (TypeScript generic `<P>` coverage) MUST specify mechanism**: either `tsc --noEmit` on a fixture file asserting generic inference OR `vitest`/`tsd` type assertion file pinned in `src/__tests__/`. Locked at Stage A2 PR.md author time. | Per plan-challenger C8 absorbtion; "type test" prose alone is not auditable |
| D9 | **A5 BLOCKED until A2 + A3 merge**: dependency ordering enforced; A5 cannot ship while HeavyBlockBoundary core/retry contracts are unstable | Per plan-challenger C1 absorbtion (A1 shell creates partially-usable API risk; downstream consumer migration must wait for stable core) |
| D10 | **A8 manualChunks rule data-driven** (per plan-challenger C4): only add a dedicated chunk for `@skb/heavy-block-boundary` if codex-perf-auditor data shows leak into prose-only chunks; NOT preemptive | Per plan-challenger C4 absorbtion (measure first; split only with data) |
| D11 | **ADR-0015 (Wave 4 close ceremony) explicit OUT-OF-SCOPE** for Stage A/B/C lock | Per plan-challenger C9 absorbtion; close-ceremony work begins AFTER Stage C closes (user MVP judgment fires) |

## Acceptance criteria for plan lock

This plan is locked when:
1. Plan-challenger codex round dispatched + absorbtion table populated
   (every challenge ABSORBED or NOT-ABSORBED with rationale)
2. Stage A PR count locked (7-8 per gatekeeper #2 — final count post
   plan-challenger; A7 consolidation choice made)
3. Stage B PR count locked (5-6 — final count post plan-challenger)
4. Stage C remains open-ended framework (NOT compressed by plan-challenger
   per gatekeeper #4)
5. ADR-0014 promotion in A8 explicitly noted (gatekeeper #3)
6. A1 D2 row 1+2 trigger explicitly noted (gatekeeper #1)
7. orchestrator-self review confirms gatekeeper directives 1-4 honored

## Plan-challenger codex absorbtion (locked at lock-time)

per [ADR-0007 D5](../../decisions/ADR-0007-job-function-codex-heavy-execution.md) +
[ADR-0011 D2](../../decisions/ADR-0011-linear-pipeline-execution-model.md) v0.1.1
SOTed-PR.md amendment + memory `feedback_soted_pr_md_discipline.md` +
ADR-0013 D4 R13 + Pre-A2 precedent (Wave 4 first 12/12 absorbed).

dispatch: `codex exec --yolo --profile plan-challenger ...` (Wave 4
plan-draft); audit log path: `/tmp/codex-runs/2026-05-03-Pre-A3-plan-challenge.txt`
raw + `docs/audits/codex-runs/2026-05-03-Pre-A3-plan-challenge.txt`
truncated archive.

| # | Challenge | Verdict | Reason |
|---|---|---|---|
| Q1 | A7 consolidation: 1 PR for 5 .astro variants vs split 3+2 | **ABSORBED** | Option (a) consolidated; per-variant smoke checks + revert steps documented in A7 acceptance (per Q1 verdict + C3 absorbtion). Locked at D1. |
| Q2 | Stage A A2/A3/A4 granularity: keep split or collapse | **ABSORBED** | Keep split per Q2 verdict (high-strength). Each PR an independently-validated contract. Locked at D1. |
| Q3 | Stage B B5 split into multiple PRs | **ABSORBED** | Split into B5a (cast/UIDefault/ESLint/mdx-bridge) + B5b (codex profile prefix + generated docs). Stage B count locked at 6 PRs. Locked at D3. |
| Q4 | Stage C open-ended framework | **ABSORBED (no change)** | Per gatekeeper directive #4 + Q4 verdict (low-strength). Stage C remains open-ended; orchestration checklist added per C7 separately. |
| Q5 | D2 trigger judgments per PR (A1/A5/A7/A8 reclass) | **ABSORBED** | Stage 4 = Row 1/4-driven ONLY per ADR-0011 D1. Row 2/5 alone do NOT fire Stage 4. A1 trigger is Row 1 (NEW CONTRACT.md), not Row 2. A5 trigger is Row 1 (each heavy block CONTRACT.md adds export doc), not Row 5. A7 standard PR (Row 5 alone). A8 orchestrator-self minimum. B1 Row 4 hit. Locked across A1-A8 + B1 sections. |
| Q6 | AC#1-AC#15 test coverage: AC#2 mechanism unclear | **ABSORBED** | AC#2 mechanism must be locked at Stage A2 PR.md author time (per D8): `tsc --noEmit` on fixture OR `vitest`/`tsd` type assertion. Coverage intent confirmed complete across A1-A6. |
| C1 | A1 shell creates partially-usable API surface | **ABSORBED** | A5 BLOCKED until A2 + A3 merge (per D9). Stage A close gate #3: A2/A3 regressions resolved before A8. Locked at Stage A close criterion. |
| C2 | A6 Playwright fail vs Stage A close | **ABSORBED** | Stage A close gate #2: A6 must pass before A8 proposed. A5 dimensions adjustable from real-render diff if needed. Locked at Stage A close criterion. |
| C3 | A7 rollback for orphan .astro paths under-defined | **ABSORBED** | A7 acceptance includes per-variant compile + render smoke + explicit revert steps documented in PR.md. Locked at A7 section. |
| C4 | Bundle impact + manualChunks + new package | **ABSORBED** | A8 manualChunks data-driven (per D10): measure-before-add via codex-perf-auditor; only add rule if leak data present. Locked at A8 section + D10. |
| C5 | ADR-0014 promotion timing (A7→A8 transition) | **ABSORBED** | A8 PR.md MUST include explicit `## Pre-promotion review` section walking A1-A7 implementation against ADR-0014 v0.2 D-list. ADR-0014 v0.2.1 amendment opens BEFORE A8 status flip if inconsistency surfaces. Locked at A8 section + Stage A close gate #4. |
| C6 | Bootstrap PR pattern: should Pre-A3 plan-lock follow bootstrap-flavored path? | **PARTIALLY ABSORBED** | Plan-challenger correct that bootstrap exception is intended for infrastructure-level meta-changes (Pre-A1 codifying runbook discipline; Pre-A2 ratifying ADR-0014). Pre-A3 plan-lock is plan-class change, NOT infrastructure. **However**, orchestrator-self EXECUTE remains appropriate (no codex EXECUTE for plan-prose authoring; matches Pre-A2 doc-only pattern). Stage A1+ uses standard D1 stage 5 reviewer-codex-commit per ADR-0011 D1; Pre-A3 follows orchestrator-self commit per Pre-A1+Pre-A2 short-term consistency, with note that this is the **last** orchestrator-self commit; Stage A1 onwards is reviewer-codex-commit. |
| C7 | Stage C open signal vs Wave 4 close signal ambiguity | **ABSORBED** | Stage C orchestration checklist added (per C7 verdict): user explicit approval to open + per-PR unresolved-issue trend review + user MVP judgment closes. NOT a fixed PR rollup. Locked at Stage C section. |
| C8 | AC#2 TypeScript coverage mechanism | **ABSORBED** | Same as Q6 above; locked at D8. |
| C9 | ADR-0015 (Wave 4 close ceremony) placement | **ABSORBED** | Explicit OUT-OF-SCOPE for Stage A/B/C lock (per D11). Authoring begins AFTER Stage C closes. Locked at Wave 4 close ceremony section + D11. |

**Result**: 15/15 challenges addressed (14 ABSORBED + 1 PARTIALLY ABSORBED [C6 with explicit rationale]). Plan v0.1 (initial draft) → v0.2 (post-absorbtion). No challenge rejected; orchestrator did not push back fundamentally on plan-challenger verdicts.

**Lock evidence**: this absorbtion table + each verdict cross-references the D-section / Stage section / acceptance criterion that codifies the change. Reviewers verify by walking each row's "Reason" link to the corresponding section.

**Stage final counts (locked)**: Stage A = 8 PRs (A1-A8). Stage B = 6 PRs (B1-B4 + B5a + B5b + B6). Stage C = open-ended (no lock count per gatekeeper directive #4 + Q4 absorbtion).

## Related

- [ADR-0011 D1 linear pipeline execution model](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
- [ADR-0013 D3 Wave 4 deferred items](../../decisions/ADR-0013-wave-3-close.md) — 5 mandatory carry-overs source
- [ADR-0014 HeavyBlockBoundary wrapper](../../decisions/ADR-0014-heavy-block-boundary.md) — Stage A implementation target
- [Wave 3 close structure baseline §6](../../audits/structure-2026-05-wave-3-close.md) — content/notes/__test_cjk__ relocation follow-up
- [docs/plans/active.md](../../plans/active.md) — currently points to Wave 4 plan-draft (this file); will repoint at lock
- [Pre-A1 PR.md](../../plans/wave-4-main/Pre-A1-codex-runbook-yolo-tmp-piping.md)
- [Pre-A2 PR.md](../../plans/wave-4-main/Pre-A2-adr-0014-heavy-block-boundary.md)
- gatekeeper directives (2026-05-02 + 2026-05-03 #1-#4) — orchestrator session inputs (not git-tracked but used at plan-lock time)
