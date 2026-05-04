# C.1-2 — PDF iframe 黑屏 fix + C-4 chunk-leak NO-OP measure

> **Wave 5 Stage C.1 2nd implementation PR** of the locked 3-PR sequence
> (C.1-1 → C.1-2 → C.1-3; per Wave 5 plan v1.0 §455-463). Two-track
> diff: (a) **C-3 PDF iframe 黑屏 fix** — single-line CSS removal in
> `packages/block-pdf/src/ui-default/pdf.css` deleting the redundant
> `background: rgb(var(--color-surface-1))` declaration on the iframe
> rule that, in dark theme, drags the iframe rect to slate-800
> (`--color-surface-1: 31 41 55` per `packages/design-tokens/src/tokens-dark.css`
> L13) and is perceived as "全黑" when the browser-native PDF viewer
> doesn't fully cover the iframe (load state / aspect mismatch). The
> container `[data-block='pdf']` rule keeps its `background:
> rgb(var(--color-surface-1))` (sits behind the iframe; semantically
> sufficient). (b) **C-4 chunk-leak NO-OP measure** — write a perf
> audit MD codifying the verdict that chunk-leak is structurally
> impossible at HEAD post-C.1-1: the heavy block plugin placeholder
> tier removed all dynamic-import chains rooted in apps/site for the 3
> heavy packages, so prose-only routes cannot leak `pyodide` /
> `tensorflow` / `reactflow` symbols. Evidence: `apps/site/src/__tests__/lazy-chunking.test.ts`
> TC1 + TC3 PASS at HEAD `44a2e53`. Decision authority: ADR-0015 D3
> ("if plugin placeholder makes it moot, NO-OP"). **NO source-code
> change for chunk-leak track.** **D2 trigger: NONE (Standard PR)**;
> Stage 4 PRE-COMMIT CLAUDE REVIEW NOT required (no contract change /
> no ADR amendment / single-package CSS-only change + new audit MD).

## title

Two-track Wave 5 Stage C.1-2 PR. (1) Remove the 1-line
`background: rgb(var(--color-surface-1))` declaration from the
`[data-block='pdf'] > iframe` rule in
`packages/block-pdf/src/ui-default/pdf.css` (≈ L29; verify exact line at
EXECUTE). The container rule `[data-block='pdf']` at L14-21 keeps its
own `background: rgb(var(--color-surface-1))` (visual continuity
preserved on the wrapper; the iframe stacks on top transparently — the
browser-native PDF viewer fills the rect when the PDF loads, and during
load / aspect mismatch the parent wrapper's surface-1 token shows
through instead of a redundant slate-800 layer that bled visibly in
dark theme). NO markup change to `Pdf.tsx` / `Pdf.astro` /
`render-pdf.ts`; NO token-value change to design-tokens (deferred to
ADR-0018 OKLCH switchover Stage C.3). NO change to vitest assertions
because byte-equivalence + SSR-render specs cover MARKUP only (not
CSS), and ui-default test is already CSS-rule-shape-agnostic. (2)
Author NEW perf audit MD `docs/audits/perf-2026-05-wave-5-c4-chunk-leak.md`
(~80-120 LOC) codifying the C-4 chunk-leak NO-OP verdict per ADR-0015
D3: investigation timeline, lazy-chunking spec evidence (TC1 prose-only
heavy-string scan PASS + TC3 gzip budget PASS at HEAD `44a2e53`
post-C.1-1; TC2 chunk-existence deferred to C5 per `it.skip` at L135),
structural reason chunk-leak is moot (placeholder tier removes the
dynamic-import root), and 1-2 forward-pointer notes for Phase 2+
plugin-real-runtime tier (when dynamic imports return, this verdict
revisits — re-run lazy-chunking spec + add `manualChunks` integrity
checks). PR.md self-listed per ADR-0006 D8 strict-whitelist.

## files

3 canonical files at PLAN time. NO `package.json` /
`pnpm-lock.yaml` change (no new deps; pure CSS deletion + new MD). NO
`astro.config.mjs` change (manualChunks pins remain; reframe v2 forward-pointer
intact). NO new ADR file (D2 trigger NONE; ADR-0015 D3 already authorizes
the NO-OP verdict). NO change to `Pdf.tsx` / `Pdf.astro` /
`render-pdf.ts` / `pdf-tokens.ts` / `pdf.ui.ts` (markup is correct;
only CSS changes). NO change to `apps/site/**` source (chunk-leak is
verified, not mutated). PR.md self-listed.

- `packages/block-pdf/src/ui-default/pdf.css` — **MODIFIED** (~1-2 LOC
  net delta; ≈ -1 line). Delete the `background: rgb(var(--color-surface-1))`
  declaration on line ≈ 29 inside the `[data-block='pdf'] > iframe`
  rule. Preserve the rest of that rule (`display: block;`,
  `width: 100%;`, `height: 70vh;`, `min-height: 480px;`, `border: 0;`).
  Preserve the container `[data-block='pdf']` rule (L14-21) verbatim
  (its `background: rgb(var(--color-surface-1))` stays — sits behind
  the iframe and provides the visual surface continuity). Preserve the
  `[data-block='pdf'][data-searchable='true']::after` rule (L39-42)
  verbatim (Wave 3 forward-pointer for searchable fallback).
  Header comment block (L1-12) unchanged. Optional: append a 1-line
  inline comment near the deletion site explaining the rationale (e.g.
  `/* iframe is transparent so container surface-1 shows through; avoids
  redundant slate-800 layer in dark theme. */`); reviewer accepts either
  form. **Whole-file post-edit**: 41-42 LOC (was 42 LOC).

- `docs/audits/perf-2026-05-wave-5-c4-chunk-leak.md` — **NEW** (~80-120
  LOC; markdown audit doc, parallels `docs/audits/perf-2026-05-wave-4-close.md`
  format). Sections:
  1. **Frontmatter / context** (~10 LOC): date `2026-05-04`, scope
     `Wave 5 Stage C.1-2 — C-4 chunk-leak measure`, decision
     `NO-OP per ADR-0015 D3`, HEAD pinned `44a2e53` (post-C.1-1).
  2. **Investigation timeline** (~15 LOC): Wave 4 B7 wired heavy
     islands to dynamic `import('@skb/block-{kind}/ui-default')` via
     `HeavyBlockBoundary`; Wave 4 C-4 risk register flagged "chunk-leak
     possible if dynamic imports route prose pages through heavy
     deps". Wave 5 reframe v2 (memory `project_wave4_reframe_v2.md`,
     2026-05-03) replaced the dynamic-import path with a static plugin
     placeholder tier (C.1-1 squash HEAD `4185f67` + revisions through
     `44a2e53`). C.1-2 measures the resulting chunk-leak posture.
  3. **Evidence at HEAD `44a2e53`** (~25 LOC):
     - `pnpm --filter @skb/site exec vitest run src/__tests__/lazy-chunking.test.ts`
       (output: `Test Files 1 passed (1) | Tests 2 passed | 1 skipped`,
       duration ~6.4s; reproduce locally to confirm).
     - TC1 (`keeps heavy dependency strings out of the prose-only route
       chunks`): scans built apps/site assets for `pyodide` /
       `tensorflow` / `reactflow` substrings on prose-only routes;
       PASS (zero hits).
     - TC2 (`emits one named chunk for each heavy block package`):
       deferred to Stage C5 via `it.skip` at L135 (see `apps/site/src/__tests__/lazy-chunking.test.ts`
       L131-137 inline comment); not asserted at v0.4 — chunk-existence
       is independent of chunk-leak prevention; deferred verdict
       documented here.
     - TC3 (`keeps the prose-only route JavaScript within the gzip
       budget`): PASS — total prose-route JS gzip stays under the
       budget set in spec (placeholder tier reduces island-bundle size
       further than B7 baseline).
  4. **Structural reason chunk-leak is moot** (~15 LOC): C.1-1
     rewrote `apps/site/src/islands/{Jupyter,NnViz,AgentFlow}Island.tsx`
     to render a static React shell (no `HeavyBlockBoundary`, no
     dynamic `import('@skb/block-{kind}/ui-default')` arrow). The
     islands no longer participate in any dynamic-import chain rooted
     in apps/site for the 3 heavy packages. Vite's chunk graph cannot
     route a heavy symbol into a prose-only chunk because there is no
     edge from the prose route to the heavy package modules. Only
     `@skb/heavy-block-boundary/heavy-block-skeleton.css` is statically
     imported (CSS-only; no JS payload from heavy packages).
     Conclusion: chunk-leak is structurally impossible at v0.4 — TC1
     PASS is the corollary, not a contingent assertion.
  5. **Decision** (~10 LOC): NO-OP per ADR-0015 D3 carve-out language
     ("if plugin placeholder makes it moot"). NO source-code change
     for chunk-leak track in C.1-2. The `manualChunks` pins in
     `astro.config.mjs` remain as forward-compat seams (Wave 4 C-1
     infrastructure preserved per reframe v2 mandate); they are inert
     at v0.4 because no module imports the pinned packages from the
     prose-only graph.
  6. **Forward-pointers (Phase 2+)** (~10-15 LOC): when the future
     `plugin-real-runtime` tier (ADR-0014 v0.4 D11 forward-pointer)
     restores dynamic-import of `@skb/block-{kind}/ui-default`, this
     verdict revisits. Recommended at that time: re-run lazy-chunking
     spec; un-skip TC2 (chunk-existence assertion); add `manualChunks`
     integrity check that asserts each heavy package compiles into its
     own named chunk; consider a regression spec that injects a
     deliberate prose→heavy edge and confirms TC1 fails (negative-case
     coverage; missing at v0.4 because no edge exists to test against).
     Also flag: Pyodide CDN paragraph in `apps/site/CONTRACT.md` (Wave
     4 C-1 / C.1-1 preserved as Phase 2+ forward-pointer) becomes
     load-bearing again in real-runtime tier.
  7. **Cross-references** (~5-10 LOC): link to ADR-0015 D3 (NO-OP
     authority); ADR-0014 v0.4 D11 (plugin tier split forward-pointer);
     C.1-1 PR.md (predecessor); Wave 5 plan v1.0 §455-463 (Stage C.1
     PR breakdown including C.1-2 row); `apps/site/src/__tests__/lazy-chunking.test.ts`
     (spec authority).

- `docs/plans/wave-5-main/C.1-2-pdf-chunk-leak.md` — **THIS PR.md**
  (self-listed). LOC budget ≤ 500; current draft ~480.

**LOC tally** (rough):
- pdf.css edit: -1 to -2 LOC net (single-declaration removal; optional
  inline comment ~+1 LOC)
- audit MD NEW: ~80-120 LOC (single decision + evidence + forward-pointers)
- PR.md: ~480 LOC (this file; doc-class, separate from impl LOC budget;
  Wave 5 R23 leaner-PR.md discipline; well under 800 LOC C.1-1
  ceiling because scope is much smaller)
- **Implementation total: ~120 LOC delta** ≤ Wave 5 plan v1.0 row C.1-2
  ~150 LOC budget ≤ R23 LOC discipline 500 cap.

## test_cases

TDD-front per Wave 5 plan v1.0 + ADR-0011 D2 schema. CSS-only fix
means no NEW vitest is written for the markup (markup unchanged); the
existing block-pdf vitest suite re-runs unchanged and must remain
green. The audit MD has no executable assertion — verification is via
`grep -F` against the file content (see acceptance below).

1. **vitest TC1 — block-pdf SSR-render preserved** (EXISTING; no
   change expected)
   - location: `packages/block-pdf/src/__tests__/ssr-render.test.ts`
   - input: SSR-render the `Pdf` component to HTML.
   - expected: PASS — the markup contract (`data-block='pdf'` outer
     wrapper + iframe with `src` from props) is unchanged. CSS edit
     has no markup effect.

2. **vitest TC2 — block-pdf byte-equivalence preserved** (EXISTING;
   no change expected)
   - location: `packages/block-pdf/src/__tests__/byte-equivalence.test.tsx`
   - input: SSR Pdf React variant + Astro variant, byte-compare HTML.
   - expected: PASS — both variants emit identical markup; CSS edit
     does not touch either variant.

3. **vitest TC3 — block-pdf core preserved** (EXISTING)
   - location: `packages/block-pdf/src/__tests__/core.test.ts`
   - expected: PASS — core schema / props validation unchanged.

4. **vitest TC4 — block-pdf registry-integration preserved** (EXISTING)
   - location: `packages/block-pdf/src/__tests__/registry-integration.test.ts`
   - expected: PASS — block-foundation registry registration unchanged.

5. **vitest TC5 — block-pdf ui-default preserved** (EXISTING)
   - location: `packages/block-pdf/src/__tests__/ui-default.test.ts`
   - expected: PASS — ui-default surface unchanged (CSS-rule-shape-agnostic
     spec; only verifies the export shape, not the rule body).

6. **vitest TC6 — apps/site lazy-chunking preserved** (EXISTING; the
   chunk-leak NO-OP verdict's primary evidence)
   - location: `apps/site/src/__tests__/lazy-chunking.test.ts`
   - expected: PASS (TC1 prose-only heavy-string scan + TC3 gzip
     budget). TC2 stays `it.skip` (chunk-existence; deferred to C5
     per existing spec comment at L131-137). The audit MD cites this
     run as primary evidence; reviewer re-runs to confirm verdict.

7. **vitest TC7 — apps/site overall preserved** (EXISTING)
   - location: `apps/site/src/__tests__/**`
   - expected: PASS — apps/site spec suite unchanged; CSS edit in
     block-pdf does not cross package boundary into apps/site
     specs.

8. **playwright AC#5 + AC#16 — heavy-block-layout-shift unaffected**
   (EXISTING; CI canonical; WSL2 skip preserved)
   - location: `apps/site/playwright/heavy-block-layout-shift.spec.ts`
   - expected: PASS — block-pdf is NOT a heavy block (Wave 4 baseline
     classifies PDF as a light block per `apps/site/CONTRACT.md`
     L88-98 5-light + 3-heavy split); the heavy-block layout-shift
     spec does not assert on block-pdf, so the CSS edit is orthogonal.
     Sanity: still PASS.

9. **No NEW vitest for the audit MD** — markdown verification is via
   `grep -F` on file content (see acceptance AC#5-AC#10). Adding a
   vitest that scans the audit MD would be over-engineering; reviewer
   verifies via `grep` per the standard audit-MD pattern (parallels
   `docs/audits/perf-2026-05-wave-4-close.md` review pattern).

## contracts_affected

- `apps/site/CONTRACT.md` — **NOT touched**. C.1-1 already updated the
  3 sections to describe the placeholder tier; C.1-2 doesn't change
  the contract surface (CSS-only edit + NEW audit doc; no public
  surface change).
- `packages/block-pdf/CONTRACT.md` — **NOT touched** (if file exists).
  CSS rule-body change does not affect public exports / data attributes
  / ARIA contract; markup byte-identical pre/post.
- `@skb/heavy-block-boundary/CONTRACT.md` — **NOT touched** (Wave 4
  lock; orthogonal to PDF block).
- No new contract surface introduced by the audit MD — audit docs are
  read-only deliverables, not contracts.

## adr_touched

- **NONE**. ADR-0015 D3 ("if plugin placeholder makes it moot,
  NO-OP") is the existing authority for the chunk-leak NO-OP verdict;
  no new amendment / no Status line change. ADR-0014 v0.4 D11 is
  cross-referenced in the audit MD as forward-pointer for Phase 2+
  but not amended. ADR-0018 untouched (OKLCH switchover Stage C.3
  scope; PDF iframe background fix uses existing
  `--color-surface-1` token semantics, not OKLCH).

## acceptance

Verifiable per AC# below; reviewer (stage 3) + pr-writer ACCEPT (stage
6) re-execute these. NO orchestrator stage 4 (D2 trigger NONE).

- **AC#1 — pdf.css iframe rule no longer has background declaration**:
  - Inspect the `[data-block='pdf'] > iframe { ... }` rule body (≈
    L23-30 pre-edit; L23-29 post-edit) and confirm the `background:`
    line is absent. One concrete grep:
    `awk '/\[data-block=.pdf.\] > iframe \{/,/\}/' packages/block-pdf/src/ui-default/pdf.css | grep -c background`
    → `0` (zero `background:` declarations within the iframe rule
    block).
  - Whole-file `grep -c '^  background:' packages/block-pdf/src/ui-default/pdf.css`
    → `1` (exactly 1 surviving `background:` line, on the container
    rule at L19; `grep -c` matches lines starting with two spaces +
    `background:`).

- **AC#2 — pdf.css container rule preserved**:
  - `grep -F "[data-block='pdf'] {" packages/block-pdf/src/ui-default/pdf.css`
    → matches (container selector intact; the JSX-equivalent variant
    `[data-block=\"pdf\"]` may also be the form on disk — accept both
    quoting styles).
  - `awk '/\[data-block=.pdf.\] \{/,/\}/' packages/block-pdf/src/ui-default/pdf.css | grep -F 'background: rgb(var(--color-surface-1))'`
    → matches (container's surface-1 background preserved).
  - `grep -F 'border: 1px solid rgb(var(--color-border))' packages/block-pdf/src/ui-default/pdf.css`
    → matches (container border preserved).

- **AC#3 — pdf.css iframe rule body otherwise intact**:
  - `grep -F 'height: 70vh' packages/block-pdf/src/ui-default/pdf.css`
    → matches.
  - `grep -F 'min-height: 480px' packages/block-pdf/src/ui-default/pdf.css`
    → matches.
  - `grep -F 'border: 0' packages/block-pdf/src/ui-default/pdf.css`
    → matches.
  - `grep -F 'width: 100%' packages/block-pdf/src/ui-default/pdf.css`
    → matches.

- **AC#4 — pdf.css `:after` searchable fallback preserved**:
  - `grep -F "[data-block='pdf'][data-searchable='true']::after" packages/block-pdf/src/ui-default/pdf.css`
    → matches (Wave 3 fallback rule untouched; accept both quoting
    styles).

- **AC#5 — audit MD exists with substantive content**:
  - `test -f docs/audits/perf-2026-05-wave-5-c4-chunk-leak.md && wc -l docs/audits/perf-2026-05-wave-5-c4-chunk-leak.md | awk '{print ($1>=50)}'`
    → `1` (file exists and ≥ 50 LOC).

- **AC#6 — audit MD contains decision marker**:
  - `grep -F 'NO-OP' docs/audits/perf-2026-05-wave-5-c4-chunk-leak.md`
    → matches at least once.
  - `grep -F 'ADR-0015 D3' docs/audits/perf-2026-05-wave-5-c4-chunk-leak.md`
    → matches at least once (decision authority cited).

- **AC#7 — audit MD cites lazy-chunking spec evidence**:
  - `grep -F 'lazy-chunking' docs/audits/perf-2026-05-wave-5-c4-chunk-leak.md`
    → matches at least once (spec name cited).
  - `grep -E 'pyodide|tensorflow|reactflow' docs/audits/perf-2026-05-wave-5-c4-chunk-leak.md`
    → matches at least once (heavy-string scan rationale cited).
  - `grep -F 'PASS' docs/audits/perf-2026-05-wave-5-c4-chunk-leak.md`
    → matches at least once (evidence outcome).

- **AC#8 — audit MD cites HEAD context**:
  - `grep -F 'placeholder' docs/audits/perf-2026-05-wave-5-c4-chunk-leak.md`
    → matches (C.1-1 placeholder tier rationale carried forward).
  - `grep -F 'plugin-real-runtime' docs/audits/perf-2026-05-wave-5-c4-chunk-leak.md`
    → matches (Phase 2+ forward-pointer per ADR-0014 v0.4 D11).

- **AC#9 — block-pdf vitest suite preserved**:
  - `pnpm --filter @skb/block-pdf test` → all PASS (TC1-TC5 above).

- **AC#10 — apps/site lazy-chunking spec preserved**:
  - `pnpm --filter @skb/site exec vitest run src/__tests__/lazy-chunking.test.ts`
    → 2 passed (1 skipped); duration roughly comparable to baseline
    ~6.4s.

- **AC#11 — `pnpm check:affected` green**:
  - `pnpm check:affected` → PASS (lint + typecheck + test + build +
    size-check across affected packages: `@skb/block-pdf` for the CSS
    edit; `apps/site` re-runs the lazy-chunking spec).

- **AC#12 — link-check green** (CI canonical; lychee binary often
  missing locally per memory `feedback_wsl2_chromium_launch.md`
  parallel):
  - CI workflow `link-check` job runs `pnpm link-check` → PASS (no
    broken markdown links introduced by audit MD or PR.md).
  - Pre-empt scan (orchestrator self-walk per memory
    `feedback_lychee_autolink_in_backticks`): grep this PR's NEW
    content (PR.md plus audit MD) for the pattern of an angle-bracketed
    word inside inline backticks; the match count MUST be zero. Same
    care for `feedback_lychee_line_anchor` (no `:line` suffix on
    relative file links), `feedback_lychee_npmjs_403` (cite npm via
    GitHub repo URL only — none expected here; no npm citations in
    this PR), and `feedback_lychee_user_local_paths` (use prose plus
    tilde-path inside backticks for memory references, not markdown
    link form).

- **AC#13 — size-check green**:
  - `pnpm size-check` → PASS (CSS-only deletion + new MD; markdown is
    exempt from `scripts/check-size-limits.mjs` per existing
    EXTENSIONS regex; CSS file shrinks by ~1-2 LOC well under the
    cap).

## verification required

Per Wave 5 plan v1.0 §192-225 verification block + ADR-0011 D2 schema.
Reviewer (stage 3) + pr-writer ACCEPT (stage 6) run these. Stage 4
PRE-COMMIT CLAUDE REVIEW NOT required (D2 trigger NONE).

| Stage | Step | Command | Expected |
|---|---|---|---|
| 3 / 6 | File existence | `ls packages/block-pdf/src/ui-default/pdf.css docs/audits/perf-2026-05-wave-5-c4-chunk-leak.md` | 2 paths exist |
| 3 / 6 | Iframe rule no background | `awk '/\[data-block=.pdf.\] > iframe \{/,/\}/' packages/block-pdf/src/ui-default/pdf.css \| grep -c background` | `0` |
| 3 / 6 | Container rule background preserved | `awk '/\[data-block=.pdf.\] \{/,/\}/' packages/block-pdf/src/ui-default/pdf.css \| grep -F 'background: rgb(var(--color-surface-1))'` | matches |
| 3 / 6 | Iframe rule body intact | `grep -E '70vh\|480px\|border: 0\|width: 100%' packages/block-pdf/src/ui-default/pdf.css \| wc -l` | `≥ 4` |
| 3 / 6 | Searchable fallback preserved | `grep -F 'data-searchable' packages/block-pdf/src/ui-default/pdf.css` | matches |
| 3 / 6 | Audit MD exists ≥ 50 LOC | `wc -l docs/audits/perf-2026-05-wave-5-c4-chunk-leak.md` | `≥ 50` |
| 3 / 6 | Audit MD decision marker | `grep -F 'NO-OP' docs/audits/perf-2026-05-wave-5-c4-chunk-leak.md` | matches |
| 3 / 6 | Audit MD authority citation | `grep -F 'ADR-0015 D3' docs/audits/perf-2026-05-wave-5-c4-chunk-leak.md` | matches |
| 3 / 6 | Audit MD spec evidence | `grep -F 'lazy-chunking' docs/audits/perf-2026-05-wave-5-c4-chunk-leak.md` | matches |
| 3 / 6 | Audit MD forward-pointer | `grep -F 'plugin-real-runtime' docs/audits/perf-2026-05-wave-5-c4-chunk-leak.md` | matches |
| 3 / 6 | block-pdf vitest | `pnpm --filter @skb/block-pdf test` | PASS |
| 3 / 6 | apps/site lazy-chunking vitest | `pnpm --filter @skb/site exec vitest run src/__tests__/lazy-chunking.test.ts` | 2 passed, 1 skipped |
| 3 / 6 | Lint + typecheck + test + build + size | `pnpm check:affected` | PASS |
| 3 / 6 | Lychee link-check (CI canonical; local lychee binary often missing) | `pnpm link-check` (CI) OR orchestrator-self prose-walk per AC#12 | PASS in CI; zero pitfalls locally |
| 6 (ACCEPT) | LOC budget | `git diff --stat main -- packages/block-pdf/src/ui-default/pdf.css docs/audits/perf-2026-05-wave-5-c4-chunk-leak.md docs/plans/wave-5-main/C.1-2-pdf-chunk-leak.md \| tail -1` | `≤ 500 changed lines` |
| 6 (ACCEPT) | Astro / TSX markup unchanged | `git diff main -- packages/block-pdf/src/ui-default/Pdf.tsx packages/block-pdf/src/ui-default/Pdf.astro packages/block-pdf/src/ui-default/render-pdf.ts \| wc -l` | `0` |
| 6 (ACCEPT) | design-tokens unchanged | `git diff main -- packages/design-tokens \| wc -l` | `0` |

## Plan-challenger absorbtion

**NOT applicable.** C.1-2 is an implementation PR (NOT a Pre-A
ADR-class lock). Per ADR-0007 D5 + ADR-0011 D2 + Wave 5 plan v1.0 D7,
plan-challenger codex round is mandatory at Pre-A ADR-class locks
only. Implementation PRs rely on Stage 3 codex-pr-reviewer-55
(line-level + spec-match + ADR-0006 8-point checklist). Stage 4
PRE-COMMIT CLAUDE REVIEW NOT required for this PR (D2 trigger NONE).

C.1-2's design ("PDF iframe background bleed in dark theme; remove
the redundant declaration" + "C-4 chunk-leak NO-OP per ADR-0015 D3
because placeholder tier removes the dynamic-import root") is a
single-line CSS deletion + audit doc capturing an existing structural
fact. The chunk-leak NO-OP verdict is authorized by ADR-0015 D3
verbatim language; the iframe background fix follows from a direct
token-value trace in `packages/design-tokens/src/tokens-dark.css` L13.
No NEW design surface that plan-challenger would re-litigate.

## R14 self-check

Per Wave 5 plan v1.0 D4 + Pre-A1 R14 self-check precedent.

1. **Stage C.1 scope-fence** (D12 whitelist L198-205): all touched
   files (`packages/block-pdf/src/ui-default/pdf.css` + 1 NEW audit
   MD under `docs/audits/` + 1 PR.md) are inside C.1 scope. **PASS**.
2. **Scope-fence blacklist** (D12 L207-210): NO files under
   `packages/heavy-block-boundary/**` (Wave 4 lock; v0.5 amendment in
   Stage C.2). NO files under `editor-shell` / `mdx-bridge` /
   `block-foundation`. NO files under `packages/design-tokens` /
   OKLCH (Stage C.3 scope; this PR uses existing `--color-surface-1`
   semantics; no token-value change). NO `apps/site/src/**` source
   change (chunk-leak verified, not mutated). **PASS**.
3. **D2 trigger NONE confirmed**: no contract change (CONTRACT.md
   files untouched), no ADR amendment (audit MD is a perf doc, not an
   ADR), no package add, no cross-package shape change, no public TS
   API change, no spec / agent-contract / CLAUDE.md edit, no
   astro.config.mjs / pnpm-lock.yaml / hooks change. Standard PR;
   Stage 4 PRE-COMMIT CLAUDE REVIEW NOT required. **PASS**.
4. **LOC budget**: ~120 LOC implementation diff (mostly audit MD;
   CSS edit is ~1-2 LOC) ≤ 150 LOC plan v1.0 row C.1-2 budget ≤ R23
   LOC discipline 500 cap. PR.md ~480 LOC ≤ 500 LOC self-target
   (Wave 5 R23 leaner-PR.md discipline; well under C.1-1's 800 LOC
   ceiling because scope is much smaller). **PASS**.
5. **No new package; no cross-package boundary change**: the CSS
   edit is contained in `@skb/block-pdf`; the audit MD lives in
   `docs/audits/`; PR.md lives in `docs/plans/wave-5-main/`. No NEW
   cross-package edges. **PASS**.
6. **Already-absorbed design**: chunk-leak NO-OP verdict is
   authorized by ADR-0015 D3 verbatim language ("if plugin
   placeholder makes it moot"); the iframe background fix follows
   from a deterministic token-value trace. No NEW design surface;
   this PR is implementation + measurement. plan-challenger NOT
   required. **PASS**.
7. **Memory-applied**: lychee 4 pitfalls (autolink-in-backticks,
   line-anchor, npmjs-403, user-local-paths); codex audit-log
   recursion (audit log path + watchdog); git-operator explicit-stage
   (commit staging); WSL2 chromium (CI canonical for any visual
   verification — though this PR has no playwright assertion on
   block-pdf). **PASS**.

R14 self-check: 7/7 PASS. No re-litigation required; proceed to
EXECUTE.

## D2 trigger judgment

Per ADR-0007 D2 + ADR-0011 D2 row table.

| Row | Description | Hit? | Evidence |
|---|---|---|---|
| 1 | Contract change (`packages/*/CONTRACT.md` OR `apps/*/CONTRACT.md`) | NO | No CONTRACT.md edits. CSS-rule-body change does not affect public surface. |
| 2 | Package add/remove | NO | No `package.json` / workspace add. |
| 3 | Cross-package shape (block-foundation / mdx-bridge / heavy-block-boundary core types) | NO | block-pdf only; no boundary type / shape changes. |
| 4 | NEW ADR or substantive ADR amendment | NO | Audit MD is a perf doc per ADR-0015 D3 carve-out; no new ADR file; no Status line change. |
| 5 | Cross 3+ packages | NO | Single package (block-pdf) + one new audit doc + PR.md. |
| 6 | Public TS API surface widen / narrow | NO | No TS edit; CSS-only. |
| 7 | Spec / agent-contract / CLAUDE.md change | NO | No edits. |
| 8 | CI / deploy / auth / security | NO | No `astro.config.mjs` / `pnpm-lock.yaml` / hooks change. |

**Verdict**: Zero rows HIT → **Standard PR**; Stage 4 PRE-COMMIT
CLAUDE REVIEW **NOT required**. Stage 3 codex-pr-reviewer-55 still
runs (mandatory per D1 stage 3 for every PR).

## Risk register

1. **PDF iframe visual regression on light theme** — Light-theme
   `--color-surface-1: 249 250 251` (near-white per
   `packages/design-tokens/src/tokens.css` L15) was already
   visually fine pre-fix; removing the iframe's redundant
   slate-800-in-dark-theme declaration cannot regress light theme
   because the token is unchanged AND the container's surface-1
   background still sits behind the iframe. **Mitigation**: container
   rule preserves `background: rgb(var(--color-surface-1))`; the only
   visual change is in dark theme where the previous redundant layer
   was the bug source. Light-theme contrast unchanged.
2. **Audit MD scope creep** — Risk that the executor over-elaborates
   the audit doc into Phase 2+ design content. **Mitigation**: ≤ 150
   LOC ceiling on the audit MD; sections enumerated above (single
   decision NO-OP + evidence + 1-2 forward-pointer notes); reviewer
   rejects if the doc pivots from measurement to design. The forward-pointer
   notes for Phase 2+ stay short and reference ADR-0014 v0.4 D11
   without re-deriving the design.
3. **Browser-native PDF viewer behavior on different platforms** —
   The fix doesn't change viewer behavior; it only removes the
   iframe's redundant CSS background. Existing browser-support
   contract (Chrome / Edge / Firefox / Safari handle `application/pdf`
   per browser-native viewer; no JS-side viewer wired) unchanged.
   **Mitigation**: no markup / no MIME / no router change — only the
   iframe's CSS background declaration is removed.
4. **Test fixture `whitepaper.pdf` is small (~1185 bytes; 3 pages)** —
   visual verification at a tiny fixture is limited; the bleed
   bug surfaces most strongly when the PDF page aspect doesn't fully
   cover the iframe rect (e.g. wide aspect, short PDF). CI canonical
   visual smoke (per Wave 4 + Wave 5 standard pattern) provides the
   integrative check; local WSL2 chromium-broken environment skips
   per memory `feedback_wsl2_chromium_launch.md`. **Mitigation**:
   reviewer reads CSS rule-body diff + token-value trace as the
   primary evidence; CI smoke is corroborative.
5. **Lazy-chunking spec drift between PLAN-time and EXECUTE-time** —
   PR.md cites `2 passed | 1 skipped` at HEAD `44a2e53` (post-C.1-1).
   If a sibling PR / unrelated change between PLAN and EXECUTE
   modifies `apps/site/src/__tests__/lazy-chunking.test.ts` (un-skips
   TC2, adds new heavy strings, etc.), the audit MD's evidence numbers
   need refreshing. **Mitigation**: executor re-runs the spec at
   EXECUTE-time and pins the actual numbers in the audit MD
   (instead of copying the PR.md numbers verbatim). PR.M1 numbers
   are illustrative reference; executor's run is authoritative for
   the audit MD. PRs run strictly serial per Wave 5 plan v1.0
   (next PR's PLAN waits for previous PR's ACCEPT) — the only PRs
   between C.1-1 ACCEPT and C.1-2 EXECUTE are C.1-2 itself, so drift
   risk is bounded.

## Out of scope (deferred — explicit list)

- **C.1-3** `apps/site/test-results/` gitignore housekeeping (third
  PR in Stage C.1; per Wave 5 plan v1.0 §461 row C.1-3 + ADR-0015
  D3).
- **ADR-0014 v0.5 amendment** (HeavyBlockBoundary grid-context dims;
  Stage C.2-7 per Wave 5 plan v1.0 §475).
- **ADR-0018 OKLCH switchover** (Stage C.3; PDF iframe background
  fix uses existing `--color-surface-1` RGB-channel semantics; OKLCH
  migration is Stage C.3 scope and orthogonal to this fix's correctness).
- **block-pdf markup change** — Pdf.tsx / Pdf.astro / render-pdf.ts /
  pdf-tokens.ts / pdf.ui.ts unchanged (markup is correct; only CSS
  changes).
- **design-tokens edits** — out-of-scope for C.1-2; OKLCH switchover
  is Stage C.3.
- **`/sample-blocks-astro` route alternate consumer surface** — uses
  Astro variants directly; not affected by the CSS edit (CSS rule
  applies via `[data-block='pdf']` attribute selector, which both
  variants emit; the fix lands consistently for both consumer
  surfaces).
- **`@skb/block-pdf/CONTRACT.md` edits** (if file exists) — public
  surface unchanged (markup contract preserved; CSS rule-body change
  is a presentational detail not gated by the contract).
- **`manualChunks` integrity check spec** (Phase 2+; recommended
  forward-pointer in audit MD for when plugin-real-runtime tier
  restores dynamic imports — un-skip TC2 + add chunk-existence
  assertion at that time).
- **Negative-case regression spec** (Phase 2+; recommended forward-pointer
  in audit MD — would inject a deliberate prose→heavy edge and
  confirm TC1 fails to validate the heavy-string scan; missing at
  v0.4 because no edge exists to test against).
- **Visual smoke baseline screenshot regen** — deferred to Stage
  C.3-5 per Wave 5 plan v1.0 §492 (block-pdf is light-block; no Wave
  4 baseline anchor on PDF surface, so no regen needed at C.1-2
  regardless).
- **Plugin-real-runtime tier reactivation** — Phase 2+ scope; audit
  MD includes Phase 2+ forward-pointer but ships no feature flag /
  conditional tier code.

## executor

- **Stage 1 PLAN**: pr-writer Claude subagent (this dispatch). Output
  = locked PR.md.
- **Stage 2 EXECUTE**: `codex-generic-executor` (`--yolo` profile;
  per Wave 4 + Wave 5 plan v1.0 D6). The codex executor reads PR.md +
  performs the 1-line CSS deletion in
  `packages/block-pdf/src/ui-default/pdf.css` + writes the NEW audit
  MD `docs/audits/perf-2026-05-wave-5-c4-chunk-leak.md`. NO TDD
  cycle for the CSS edit (no NEW vitest; markup unchanged); the
  executor verifies block-pdf vitest suite remains PASS post-edit
  and lazy-chunking spec remains PASS. Audit log path:
  `docs/audits/codex-runs/2026-05-04-C.1-2-execute.txt` (per memory
  `feedback_codex_audit_log_recursion.md` watchdog kill at ~500 KB;
  audit log piped to `/tmp` first if recursion risk surfaces).
- **Stage 3 REVIEW**: `codex-pr-reviewer-55` (5.5). 8-point checklist
  + spec match. Audit log path:
  `docs/audits/codex-runs/2026-05-04-C.1-2-review.txt`.
- **Stage 4 PRE-COMMIT CLAUDE REVIEW**: **NOT required** (D2 trigger
  NONE — no contract change, no ADR amendment, single-package
  CSS-only change + new audit MD).
- **Stage 5 COMMIT**: reviewer codex with ADR-0006 D8 explicit-file-list
  staging discipline (see `## Codex commit (D1 stage 5) staging`
  below).
- **Stage 6 ACCEPT**: pr-writer second invocation. Read PR.md
  `acceptance:` block + run `verification required` table + verify
  diff matches each AC#. ACCEPT or REJECT-with-residue.

## Codex commit (D1 stage 5) staging

Per ADR-0006 D8 explicit-file-list staging + memories
`feedback_git_operator_explicit_stage` +
`feedback_git_operator_ci_verification`. Reviewer codex (NOT
pr-writer; ADR-0011 D1+D4 git mutation discipline) runs:

1. **Reset stage**: `git reset HEAD` (clear any prior partial stage).
2. **Add explicit whitelist**:
   ```bash
   git add \
     packages/block-pdf/src/ui-default/pdf.css \
     docs/audits/perf-2026-05-wave-5-c4-chunk-leak.md \
     docs/plans/wave-5-main/C.1-2-pdf-chunk-leak.md
   ```
   **NEVER** `git add -A` / `git add .` (per memory rule). 3
   explicit paths only.
3. **Verify staged scope**: `git diff --cached --stat`. Expected: 3
   paths above; NO `pnpm-lock.yaml`; NO Astro / TSX markup files
   (block-pdf Pdf.tsx / Pdf.astro / render-pdf.ts unchanged); NO
   `apps/site/src/**`; NO `packages/design-tokens/**`; total
   `{changed-lines}` ≤ 500. If diff includes anything outside the
   whitelist, abort + restore + ask orchestrator.
4. **Lockfile contamination scan** (per memory): if
   `pnpm-lock.yaml` shows in cached diff, restore from clean
   historical blob: `git restore --source=main --staged --worktree
   pnpm-lock.yaml`. Re-verify step 3.
5. **Pre-push uncached typecheck** (per memory
   `feedback_git_operator_ci_verification`): `pnpm typecheck` (NOT
   cached via turbo) before push to catch tsc errors that vitest +
   turbo cache miss. Particularly relevant if the audit MD references
   any TS module names — typo in a module name surfaces only via
   uncached typecheck on the consumer side.
6. **Commit + push**: standard squash-friendly commit message
   following Wave 5 plan v1.0 commit style. Subject prefix
   `Wave 5 C.1-2 — `. Include `ADR-0015 D3` token in body for future
   grep (NO-OP authority).
7. **CI verification**: `gh run view --json conclusion --jq .conclusion`
   on push (NOT `gh run watch --exit-status`; per memory). If
   `success` → push gate; orchestrator merges via `gh pr merge --squash
   --delete-branch` per memory `feedback_wave3_auto_merge` Wave 3
   auto-merge directive carried into Wave 4+5.

## Related

- [Wave 5 plan v1.0](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md)
  §192-225 (Stage C.1 scope-fence) + §455-463 (Stage C.1 PR breakdown
  table; row C.1-2 is this PR's authoritative scope).
- [ADR-0015 wave-4-close](../../decisions/ADR-0015-wave-4-close.md)
  D3 (NO-OP carve-out for chunk-leak when plugin placeholder makes it
  moot — authority for the C-4 NO-OP verdict captured in the audit
  MD).
- [ADR-0014 heavy-block-boundary](../../decisions/ADR-0014-heavy-block-boundary.md)
  v0.4 D11 (plugin tier split forward-pointer; cited in audit MD for
  Phase 2+ plugin-real-runtime tier when the chunk-leak verdict
  revisits).
- [ADR-0018 v2 visual migration](../../decisions/ADR-0018-v2-visual-migration.md)
  (NOT touched; OKLCH switchover is Stage C.3 scope; this PR's iframe
  background fix uses existing `--color-surface-1` token semantics
  unchanged).
- [C.1-1 PR.md](./C.1-1-heavy-block-plugin-placeholder.md)
  predecessor — placeholder tier rewrite that makes the chunk-leak
  verdict moot at HEAD `44a2e53`.
- [`apps/site/src/__tests__/lazy-chunking.test.ts`](../../../apps/site/src/__tests__/lazy-chunking.test.ts)
  spec authority for the chunk-leak NO-OP verdict (TC1 + TC3 PASS
  evidence; TC2 deferred to C5).
- [`packages/block-pdf/src/ui-default/pdf.css`](../../../packages/block-pdf/src/ui-default/pdf.css)
  (touched).
- [`packages/design-tokens/src/tokens-dark.css`](../../../packages/design-tokens/src/tokens-dark.css)
  L13 (`--color-surface-1: 31 41 55` — slate-800; the dark-theme value
  that bled visibly through the iframe and motivated the fix).
- [`packages/design-tokens/src/tokens.css`](../../../packages/design-tokens/src/tokens.css)
  L15 (`--color-surface-1: 249 250 251` — light-theme value; preserved
  by the container rule; light theme unaffected).
- Memories applied: `feedback_codex_stdin` (codex
  open-bracket-`/dev/null`), `feedback_codex_audit_log_recursion`
  (audit log path plus watchdog), `feedback_lychee_line_anchor` plus
  `feedback_lychee_npmjs_403` plus `feedback_lychee_user_local_paths`
  plus `feedback_lychee_autolink_in_backticks` (lychee discipline),
  `feedback_git_operator_explicit_stage` plus
  `feedback_git_operator_ci_verification` (commit staging),
  `feedback_wsl2_chromium_launch` (any playwright run is CI canonical
  if added; this PR has no playwright assertion specific to block-pdf),
  `feedback_wave3_auto_merge` (orchestrator merges post ACCEPT-PASS).
