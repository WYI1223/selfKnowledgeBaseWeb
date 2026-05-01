# Phase 1 Wave 3 — Integration layer Implementation Plan

> **For ADR-0011 D1 linear pipeline**: each numbered PR below is a single
> pipeline unit (PLAN → EXECUTE → REVIEW → \[D2 row 1+4 PRE-COMMIT\] →
> COMMIT → ACCEPT). PRs run **strictly serial**. Per-PR pr-writer
> Claude subagent expands each entry into the ADR-0011 D2 schema PR.md
> (`title` / `files` / `test_cases` / `contracts_affected` / `adr_touched`
> / `acceptance` / `executor`) at PLAN stage; codex-generic-executor (or
> specialized scaffolder; or ux-ui-lead Claude subagent) writes
> TDD-front-style tests + impl at EXECUTE stage.

**Goal:** Wire the 8 Wave 2 block packages, 3 editor sub-modules, kernel
adapter, and mdx-bridge into a working integration layer — apps/site
renders MDX with React component blocks, editor-shell composes into a
usable editing surface, mdx-bridge round-trips all 8 block kinds (8 ×
2 invariants × 1 fixture), and a static search index ships at build time.

**Architecture:** Wave 3 introduces a single new package (`editor-shell`,
the terminal consumer that closes 13 of 13 expected orphans simultaneously)
and extends mdx-bridge's existing prose-only walker to handle
`mdxJsxFlowElement` for component blocks. apps/site adopts a
PascalCase-to-React-component map keyed off BlockRegistry; heavy blocks
(Pyodide / TF.js / React Flow) load lazily per route to avoid front-loading
~13 MB of client-side runtime. Search ships as a build-time client-side
index (PageFind chosen pending Stage D ADR).

**Tech Stack:** Tiptap (editor-shell composition), Astro 4 (apps/site SSR
+ MDX integration), unified/remark/mdast (mdx-bridge), PageFind or
lunr.js (search; ADR pending). All Wave 1+2 dependencies carry over;
**no new heavy runtime additions in Wave 3** beyond the search index lib.

---

## Wave 3 stage decomposition

| Stage | Theme | PR count | Estimated LOC budget | Dependencies |
|---|---|---:|---:|---|
| Pre-A | Bootstrap codex profiles (codex TOML merge gate) | 1 | ~30 (runbook + verification) | none |
| A | editor-shell skeleton (new package) | 5 | ~750 (5 × ~150) | Pre-A |
| B | mdx-bridge component-block round-trip | 8 | ~1200 (8 × ~150) | A1-A3 (BlockRegistry boot) |
| C | apps/site BlockRegistry routing + chunking | 6 | ~900 (6 × ~150) | A1, B1; **C4 split into C4a + C4b** |
| D | Search index | 4 | ~600 (4 × ~150) | C2 stable (route/build); **D1 split into D1a + D1b** |

**Total: 24 PRs.** Each PR ≤ 200 LOC + ≤ 1 narrow responsibility per
ADR-0011 D2. PR ordering: Pre-A → A1 → A2 → ... → A5 → B1 → ... → B8 →
C1 → C2 → C3 → C4a → C4b → C5 → D1a → D1b → D2 → D3.

**Plan-challenger absorption (codex 5.5 round, 2026-05-01):** 12 of 13
suggestions absorbed; declined #8 (registerBlocks/registerKernels
authority placement) — rationale: editor-shell is the composition layer;
the lower-level primitives ARE in block-foundation `BlockRegistry` and
kernel-registry; the `registerBlocks` / `registerKernels` helpers in
editor-shell are composition orchestration, not authority duplication.
Plan-challenger output saved to
`.codex-runs/wave-3-prep/wave-3-plan-challenge.txt`.

**Wall-clock estimate:** ~35-55 hours active throughput, ~4.5-7 working
days under strict serialization. User authorized this trade-off (faster
rollback when issues arise) at Wave 3 prep #1 commit.

---

## Pre-A — Bootstrap codex profile availability (1 PR)

### Pre-A1: codex profile TOML merge + runbook update

**Goal:** Ensure `codex-pr-reviewer-55` + `generic-executor` +
`structure-auditor` + `perf-auditor` + `mdx-doctor` + `plan-challenger`
profiles are present in user's `~/.codex/config.toml` BEFORE Stage A
starts. Without them, the D1 stage 3 review uses transitional `pr-gate`
alias (works but gives stale profile name in audit logs).

**Files:**
- Modify: `docs/runbooks/codex-tool-invocations.md` (add a "Profile
  TOML merge" section at the top describing the manual-merge step from
  `tmp/codex-profiles.toml` → `~/.codex/config.toml`; verification
  `grep '^\\[profiles\\.' ~/.codex/config.toml` shows all 7 profile
  names from `tmp/codex-profiles.toml`)
- Modify: `agent-contract.md` `tool_patterns:` (no shape change; the
  invocation strings already reference the new profile names)
- Re-run `pnpm generate:configs` (idempotent — should produce zero
  diff if PR #1 was applied correctly; verifies idempotency)

**test_cases:**
- TC1 input: `grep '^\\[profiles\\.codex-pr-reviewer-55\\]' ~/.codex/config.toml`;
  expected: 1 hit; location: this PR's commit message links runbook
  step.
- TC2 input: `pnpm generate:configs && git status --short`; expected:
  empty (idempotent); location: shell.

**contracts_affected:** `docs/runbooks/codex-tool-invocations.md` (gen
artifact; this PR adds the manual-merge instruction prose).

**adr_touched:** None.

**executor:** orchestrator-self (single-line documentation edit;
codex-generic-executor not strictly necessary).

**D2 trigger:** Row 1 (runbook prose change but it's a generated
artifact — gen-source is the renderer). NOT row 4. D1 stage 4 fires.

**Estimated LOC:** ~30 (runbook edit + verification step prose).

**Acceptance:**
1. Runbook documents the manual TOML merge step at session start
2. User can verify with the documented grep
3. No source/test changes (pure runbook prose)

---

## Stage A — editor-shell skeleton (5 PR)

**Goal:** New `packages/editor-shell` package that composes Wave 2's
3 editor sub-modules + 8 block packages + kernel-registry into a usable
Tiptap-based editor surface. Wave 3's terminal consumer; closes the
"editor-shell composition" deferral from ADR-0010 D7 #3.

### A1: editor-shell package skeleton

**Files:**
- Create: `packages/editor-shell/package.json`
- Create: `packages/editor-shell/tsconfig.json`
- Create: `packages/editor-shell/vitest.config.ts`
- Create: `packages/editor-shell/CONTRACT.md`
- Create: `packages/editor-shell/src/index.ts` (empty barrel)
- Create: `packages/editor-shell/src/__tests__/smoke.test.ts`
- Modify: `pnpm-workspace.yaml` (no change — `packages/*` glob matches)
- Modify: `tsconfig.json` (root) — add `editor-shell` to references
- Modify: `pnpm-lock.yaml` (regen post `pnpm install`)

**test_cases (ADR-0011 D2):**
- TC1 input: `import { } from '@skb/editor-shell'`; expected: imports
  resolve; location: `src/__tests__/smoke.test.ts`.
- TC2 input: `pnpm --filter=@skb/editor-shell typecheck`; expected: 0;
  location: shell.

**contracts_affected:** `packages/editor-shell/CONTRACT.md` (NEW); root
`tsconfig.json` references graph.

**adr_touched:** None (new package addition is D2 row 2 trigger but
NOT row 4 — no ADR required for additive package).

**executor:** `codex-generic-executor` (with `codex-test-scaffolder` for
the vitest skeleton).

**D2 trigger:** Row 1 (CONTRACT.md NEW) + Row 2 (package add). D1 stage 4
fires (row 1 hit). pnpm-lock.yaml in stage; ADR-0006 D8 lockfile-blob
sub-rule applies.

**Estimated LOC:** ~80 (package.json + tsconfig + smoke test + CONTRACT
prose stub).

**Acceptance:**
1. `pnpm --filter=@skb/editor-shell typecheck` exit 0
2. `pnpm --filter=@skb/editor-shell test` exit 0 (smoke test passes)
3. Root `tsconfig.json` references list now contains `editor-shell`
4. `structure-auditor` next sweep recognizes the new package + CONTRACT

### A2: editor-shell Tiptap container

**Files:**
- Create: `packages/editor-shell/src/EditorShell.tsx` (functional component;
  Tiptap `useEditor` + StarterKit prose extensions only — no block-* yet)
- Create: `packages/editor-shell/src/__tests__/EditorShell.test.tsx`
  (mount + type → reads back doc shape)
- Modify: `packages/editor-shell/src/index.ts` (export `EditorShell`)
- Modify: `packages/editor-shell/CONTRACT.md` (Public surface += EditorShell)
- Modify: `packages/editor-shell/package.json` (add `@tiptap/react`,
  `@tiptap/starter-kit`, `react`, `react-dom` peer deps)
- Modify: `pnpm-lock.yaml`

**test_cases:**
- TC1: render `<EditorShell />` in happy-dom; type "hello"; reads back
  `{type: 'doc', content: [{type: 'paragraph', content: [{type: 'text',
  text: 'hello'}]}]}`; location: `src/__tests__/EditorShell.test.tsx:N`.
- TC2: empty `<EditorShell />` produces an empty paragraph (ProseMirror
  default); location: same file.

**contracts_affected:** editor-shell/CONTRACT.md.

**adr_touched:** None.

**executor:** `codex-generic-executor`.

**D2 trigger:** Row 1 (CONTRACT change). D1 stage 4 fires.

**Estimated LOC:** ~120.

**Acceptance:**
1. `<EditorShell />` mounts cleanly in happy-dom
2. Typing produces expected Tiptap doc shape
3. CONTRACT.md documents the public surface

### A3: editor-shell BlockRegistry boot

**Files:**
- Create: `packages/editor-shell/src/registerBlocks.ts` (calls
  `BlockRegistry.registerCore` for each of the 8 block-* core defs +
  `BlockRegistry.registerUI` for each ui-default; takes registry as
  argument so consumers can use a custom registry; also handles prose
  via `proseExtensions` from block-foundation)
- Create: `packages/editor-shell/src/__tests__/registerBlocks.test.ts`
- Modify: `packages/editor-shell/src/index.ts` (export `registerBlocks`)
- Modify: `packages/editor-shell/CONTRACT.md`
- Modify: `packages/editor-shell/package.json` (add 8 `@skb/block-*` +
  `@skb/block-foundation` workspace deps)
- Modify: `pnpm-lock.yaml`

**test_cases:**
- TC1: After `registerBlocks(registry)`, `registry.listCores()` returns
  exactly 8 entries with names `['callout', 'code', 'image', 'math',
  'pdf', 'jupyter', 'nn-viz', 'agent-flow']`. location:
  `__tests__/registerBlocks.test.ts:N`.
- TC2: For each of the 8, `registry.getUI(name)` returns the
  `<name>UIDefault` definition (uiId='default').
- TC3: `BlockKind` distribution matches ADR-0009: 3 component + 2 render
  + 3 viz.

**contracts_affected:** editor-shell/CONTRACT.md.

**adr_touched:** None (consumes existing BlockRegistry surface; no shape
change).

**executor:** `codex-generic-executor`.

**D2 trigger:** Row 1 + Row 5 (cross ≥ 3 packages — touches editor-shell
+ all 8 block-* + block-foundation = 10 packages). Row 1 → D1 stage 4
fires; row 5 → heightened codex stage 3 review.

**Estimated LOC:** ~160 (~20 LOC per block × 8 + boilerplate).

**Acceptance:**
1. All 8 blocks registered with correct `kind`
2. ui-defaults registered + first-registered = default lookup
3. structure-auditor reports no orphan packages for the 8 blocks (saturated)

### A4 edge case (kernel session-collision per plan-challenger #7)

The A4 + A5 PRs MUST include a regression test for the case where two
block-jupyter instances spawn with identical kernel session ids. Per
[block-jupyter/CONTRACT.md](../../../packages/block-jupyter/CONTRACT.md)
"Per-block isolated session" invariant, each NodeView mount calls
`adapter.startSession(uniqueSessionId)` with a unique id. The
regression test asserts: if two `createKernelBridge` consumers pass the
same id, the second one either errors out (preferred) or generates a
suffix (acceptable; documented in `kernel-pyodide/CONTRACT.md`).
Test fixture: `packages/editor-shell/src/__tests__/kernel-session-collision.test.ts`
in A4 + A5 sub-test of saveLoad in A5.

### A4: editor-shell kernel-registry boot

**Files:**
- Create: `packages/editor-shell/src/registerKernels.ts` (registers
  `PyodideAdapter` into `kernel-registry`; consumers can override)
- Create: `packages/editor-shell/src/__tests__/registerKernels.test.ts`
- Modify: `packages/editor-shell/src/index.ts` (export `registerKernels`)
- Modify: `packages/editor-shell/CONTRACT.md`
- Modify: `packages/editor-shell/package.json` (add `@skb/kernel-registry`
  + `@skb/kernel-pyodide` deps)
- Modify: `pnpm-lock.yaml`

**test_cases:**
- TC1: After `registerKernels(registry)`, `registry.list()` returns
  `['pyodide']`. location: `__tests__/registerKernels.test.ts:N`.
- TC2: `registry.get('pyodide')` returns a `PyodideAdapter` instance
  (mocked at fixture-level — real Pyodide load is too heavy for unit
  test, gated by Wave 3 separate integration smoke).

**contracts_affected:** editor-shell/CONTRACT.md.

**adr_touched:** None.

**executor:** `codex-generic-executor`.

**D2 trigger:** Row 1 (CONTRACT change). D1 stage 4 fires.

**Estimated LOC:** ~80.

**Acceptance:**
1. PyodideAdapter registered under id `'pyodide'`
2. block-jupyter consumer pattern verified end-to-end via mocked adapter

### A5: editor-shell save-load round-trip (prose-only skeleton)

**Files:**
- Create: `packages/editor-shell/src/saveLoad.ts` (`saveToMdx(editor) →
  string` + `loadFromMdx(editor, mdxString) → void`; calls
  `mdxToTiptap` + `tiptapToMdx`)
- Create: `packages/editor-shell/src/__tests__/saveLoad.test.ts`
  (prose-only RTT with 3 fixtures: heading + list + paragraph)
- Modify: `packages/editor-shell/src/index.ts`
- Modify: `packages/editor-shell/CONTRACT.md`
- Modify: `packages/editor-shell/package.json` (add `@skb/mdx-bridge` dep)
- Modify: `pnpm-lock.yaml`

**test_cases:**
- TC1: `loadFromMdx(editor, fixture)` then `saveToMdx(editor)` returns
  the original fixture (prose round-trip; component blocks deferred to
  Stage B). location: `__tests__/saveLoad.test.ts:N`.
- TC2: `saveToMdx` on empty editor returns frontmatter-less empty doc.
- TC3 (registry-thread guard, per plan-challenger R2 #3): `saveToMdx`
  + `loadFromMdx` MUST thread the editor's `blockRegistry` through to
  `mdxToTiptap` / `tiptapToMdx`'s per-call `{ blockRegistry }` option;
  test that omitting the registry from either callsite fails loudly
  (no silent prose-only fallback when components are present).
  location: same file.

**contracts_affected:** editor-shell/CONTRACT.md.

**adr_touched:** None.

**executor:** `codex-generic-executor`.

**D2 trigger:** Row 1. D1 stage 4 fires.

**Estimated LOC:** ~140.

**Acceptance:**
1. Prose RTT works (component blocks land in Stage B)
2. CONTRACT.md documents save/load API surface
3. Stage A complete; editor-shell is a usable Tiptap container with
   BlockRegistry + kernel-registry boot wired in

---

## Stage B — mdx-bridge component-block round-trip (8 PR)

**Goal:** Extend mdx-bridge from prose-only (Wave 1) to full 8-block-kind
support. Each PR adds one block's fixture + parse/serialize routing,
asserting the two RTT invariants (parsed-doc + editor-built-doc canonical
reconstruction; per `mdx-bridge/CONTRACT.md` "Round-trip invariant").
Closes ADR-0010 D7 #2.

### B1: mdx-bridge `mdxJsxFlowElement` routing infrastructure

**Files:**
- Modify: `packages/mdx-bridge/src/parse.ts` — extend `mdxToTiptap` to
  accept an optional `{ blockRegistry }` second argument (per-call
  injection per plan-challenger #9; NO global setter to avoid hidden
  state); `mdastBlockToTiptap` dispatches on `node.type === 'mdxJsxFlowElement'`
  → `blockRegistry.getCore(node.name)?.parseMdx?.(node)`; fail-loud
  if name unknown.
- Modify: `packages/mdx-bridge/src/serialize.ts` — `tiptapToMdx` accepts
  same optional second arg; `tiptapToMdastBlock` dispatches on the
  block's `type` registered in BlockRegistry → `getCore(type)?.serializeMdx?.(node)`;
  fail-loud.
- Modify: `packages/mdx-bridge/src/index.ts` (export
  `MdxBridgeOptions` interface w/ `blockRegistry?: BlockRegistry`).
- Modify: `packages/mdx-bridge/package.json` (add `@skb/block-foundation`
  dep — finally consumed; ADR-0008 forward-compat clause activates).
- Modify: `packages/mdx-bridge/CONTRACT.md` (lift "Forward-compat
  consumers (Wave 2+)" into "Public surface" + "Implementation notes";
  document per-call injection pattern, NO `setBlockRegistry` global).
- Modify: `packages/mdx-bridge/tsconfig.json` (add reference to
  block-foundation).
- Create: `packages/mdx-bridge/src/__tests__/jsx-routing.test.ts`.
- Modify: `pnpm-lock.yaml`.

**test_cases (with negative + nested edge cases per plan-challenger #4 + #6):**
- TC1 (positive): `mdxToTiptap(fixture, { blockRegistry })` with a
  registered Callout block round-trips. location: `__tests__/jsx-routing.test.ts:N`.
- TC2 (negative — unknown JSX): `mdxToTiptap('<UnknownBlock />', { blockRegistry })`
  throws `mdx-bridge: unsupported block type "UnknownBlock"...` per
  CONTRACT fail-loud rule.
- TC3 (negative — missing registry): `mdxToTiptap(fixture)` (no
  options) treats `mdxJsxFlowElement` as the existing Wave 1 fail-loud
  branch (preserves prose-only behavior; doesn't crash silently).
- TC4 (sister-symmetry): `tiptapToMdx({type: 'unknownBlock'}, { blockRegistry })`
  throws same message shape.
- TC5 (nested edge — plan-challenger #6): `<Callout><Callout /></Callout>`
  parses + serializes byte-equivalently when both are registered.
  Documents the nesting behavior in CONTRACT.md.
- TC6 (registry-state isolation — plan-challenger #9): two parallel
  `mdxToTiptap` calls with DIFFERENT `blockRegistry` instances do NOT
  interfere; the per-call injection pattern is verified state-clean.

**contracts_affected:** mdx-bridge/CONTRACT.md (Wave 1 invariants
extended; per-call injection pattern); block-foundation/CONTRACT.md
(BlockRegistry now has documented mdx-bridge consumer pattern).

**adr_touched:** None (existing fail-loud rule from CONTRACT generalizes;
no new ADR required since the contract was forward-declared in Wave 1
"Forward-compat consumers" prose).

**executor:** `codex-generic-executor`.

**D2 trigger:** Row 1 (mdx-bridge CONTRACT.md change — high-value
authority) + Row 5 (cross ≥ 3 packages: mdx-bridge + block-foundation +
8 indirect block consumers). Row 1 → D1 stage 4 fires; row 5 → heightened
codex review.

**Estimated LOC:** ~190 (parse.ts + serialize.ts dispatch + per-call
options API + fail-loud + 6 test cases).

**Acceptance:**
1. mdx-bridge can dispatch `mdxJsxFlowElement` via per-call injection
   to any block-foundation-registered core
2. NO global `setBlockRegistry` setter — pure per-call injection
3. Fail-loud rule preserved (5 throw sites at Wave 1, ≥ 7 at Wave 3
   post-PR; +unknown JSX block parse + +unknown block-type serialize)
4. Nested component blocks round-trip (Callout inside Callout)
5. CONTRACT.md fixture count growing-from-9 announcement

### B2 — B8: per-block fixtures (callout / code / image / math / pdf /
jupyter / nn-viz / agent-flow)

Identical shape across the 7 follow-on PRs. Documenting once; pr-writer
substitutes per block at PLAN stage.

**Per-PR template (Bx where x ∈ {2..8}, block name = `<NAME>`,
fixture id = 21+x):**

**Files:**
- Create: `packages/mdx-bridge/src/__tests__/fixtures/<id>-<name>.mdx`
  (a real MDX snippet using `<Name attr=...>...</Name>`)
- Modify: `packages/mdx-bridge/src/__tests__/round-trip.test.ts` (add a
  test row for the new fixture; the table-driven loop picks it up
  automatically via filesystem read — no per-fixture `it()` block to
  add unless the block needs special-case handling)
- Modify: `packages/mdx-bridge/CONTRACT.md` (Wave 2+ fixture table grows
  from 9 → 9+x)

**test_cases:**
- TC1 idempotent invariant: `tiptapToMdx(mdxToTiptap(fixture)).trim() ===
  fixture.trim()`. location: round-trip.test.ts table-driven assertion.
- TC2 lossless invariant: stripping `_mdast` then serializing produces
  the same MDX. location: same.

**contracts_affected:** mdx-bridge/CONTRACT.md (fixture table).

**adr_touched:** None (additive fixture).

**executor:** `codex-generic-executor` for callout/code/image/math/pdf
(simple). For jupyter/nn-viz/agent-flow (kind=viz), additional handling
of expression-attrs (JSON-encoded `nodes`/`edges`/`layers`/`libraries`
arrays) — `codex-generic-executor` still applicable since the block
core's serialize/parse hooks handle this.

**D2 trigger:** Row 1 (CONTRACT.md fixture table change). D1 stage 4
fires per-PR. mdx-doctor (codex-mdx-doctor) MUST also run — fixture
addition trigger.

**Estimated LOC:** ~100 per PR (~30 lines fixture + ~70 lines test
adjustments + CONTRACT.md table line).

**Acceptance per PR:**
1. New fixture round-trips byte-equivalently
2. Both invariants pass for the new fixture
3. mdx-bridge CONTRACT.md fixture table grows by exactly 1 row
4. mdx-doctor (codex profile) green

**Per-PR specifics:**
- B2: callout — 4 variants × {with title / without title} = 8 case grid
  but **1 fixture** capturing one canonical instance (other shapes
  already covered by `block-callout/__tests__/` unit tests).
- B3: code — language + showLineNumbers attrs.
- B4: image — src + alt + optional width/height.
- B5: math — inline display + complex KaTeX expression.
- B6: pdf — iframe URL only (no extracted text in fixture).
- B7: jupyter — code attr + libraries array (JSON-encoded expression-attr).
- B8: combined PR for nn-viz + agent-flow (shorter blocks; both have
  expression-attr arrays; bundled to keep total wave PR count at 21
  per user spec). Two fixtures (28 + 29) committed together; otherwise
  identical to other Bx PRs.

---

## Stage C — apps/site BlockRegistry routing + dynamic chunking (5 PR)

**Goal:** apps/site renders MDX with the 8 PascalCase component blocks
hydrated client-side; heavy blocks (jupyter / nn-viz / agent-flow ≈
13 MB combined) chunk lazily so the prose-only routes don't ship them.
Closes ADR-0010 D7 #4.

### C1: apps/site MDX components map + BlockRegistry boot

**Files:**
- Modify: `apps/site/src/components.ts` (or NEW; PascalCase → React
  component map: `Callout` → `CalloutRenderView`, ..., for all 8 blocks;
  exposes `componentsMap` for Astro MDX integration)
- Modify: `apps/site/astro.config.mjs` (configure
  `@astrojs/mdx` to use the components map)
- Modify: `apps/site/src/__tests__/components-map.test.ts` (every block's
  PascalCase name resolves to a render-only component, not editor)
- Modify: `apps/site/package.json` (add 8 `@skb/block-*` deps + register
  workspace deps)
- Modify: `pnpm-lock.yaml`
- Modify: `apps/site/CONTRACT.md` (consumer surface += components map)

**test_cases:**
- TC1: `componentsMap.Callout === CalloutRenderView` — RenderView, NOT
  EditorView (apps/site is read-only). location:
  `__tests__/components-map.test.ts:N`.
- TC2: all 8 PascalCase keys present.
- TC3: tree-shaking smoke (built apps/site bundle for a
  prose-only route does NOT contain Pyodide/TF.js/React-Flow names).

**contracts_affected:** apps/site/CONTRACT.md.

**adr_touched:** None (additive consumer wiring).

**executor:** `codex-generic-executor` + `ux-ui-lead` Claude subagent
(apps/site visual layer review).

**D2 trigger:** Row 1 + Row 5 (cross ≥ 3 packages: apps/site + 8
block-* = 9). Row 1 → D1 stage 4 fires; row 5 → heightened codex stage 3.

**Estimated LOC:** ~150.

**Acceptance:**
1. MDX `<Callout variant="note">...</Callout>` renders correctly via
   componentsMap on a sample apps/site route
2. Build-time tree-shaking confirmed (TC3)
3. CONTRACT.md updated

### C2: apps/site dynamic chunking strategy (heavy blocks lazy)

**Files:**
- Modify: `apps/site/src/components.ts` (split heavy blocks behind
  `lazy(() => import(...))` boundaries; expose `lazyBlocks` map)
- Create: `apps/site/src/components/LazyBlock.astro` (Suspense
  wrapper for the React island)
- Modify: `apps/site/astro.config.mjs` (chunk strategy hint)
- Modify: `apps/site/src/__tests__/lazy-chunking.test.ts` (build-time
  bundle analysis: prose-only routes don't pull pyodide.js
  / @tensorflow/tfjs / reactflow into the main chunk)
- Modify: `apps/site/CONTRACT.md`

**test_cases:**
- TC1: build a prose-only route; asserting the resulting chunk does NOT
  contain `pyodide`/`tensorflow`/`reactflow` names (grep build output).
- TC2: build a sample-blocks route; asserting all 3 heavy chunks DO ship
  but as separate non-blocking chunks.

**contracts_affected:** apps/site/CONTRACT.md.

**adr_touched:** None.

**executor:** `codex-generic-executor`.

**D2 trigger:** Row 1 + Row 8 (CI/build/deploy touch — chunking strategy
affects build output). Row 1 → D1 stage 4 fires; row 8 → heightened
codex stage 3 + codex-perf-auditor.

**Estimated LOC:** ~140.

**Acceptance:**
1. Prose route bundle ≤ 200 KB gzip (no heavy block deps)
2. Heavy-block routes ship 3 separate chunks
3. codex-perf-auditor green

### C3: apps/site sample-blocks page goes live

**Files:**
- Modify: `content/notes/sample-blocks/index.mdx` (`draft: true` →
  `draft: false`; keeps the 8 block instances Z0 authored)
- Modify: `apps/site/src/pages/notes/[...slug].astro` (no change if
  `getStaticPaths` already filters by `draft: false`; verify)
- Modify: `apps/site/src/__tests__/sample-blocks-page.test.ts` (route
  resolves; all 8 blocks render; no console errors)

**test_cases:**
- TC1: after `pnpm --filter=@skb/site build`, the route
  `/notes/sample-blocks/` exists.
- TC2: SSR HTML contains 8 block markers (data-callout-variant,
  data-code-language, data-image-loading, etc.).
- TC3: visual-smoke playwright test (CI-only) navigates the page; all
  blocks render without runtime errors.

**contracts_affected:** none directly (sample content; documented in
`content/notes/sample-blocks/index.mdx` frontmatter).

**adr_touched:** None.

**executor:** `codex-generic-executor` + `ux-ui-lead` (visual smoke
review).

**D2 trigger:** Row 8 (CI/deploy/build affecting). NOT Row 1 (no
CONTRACT change). D1 stage 4 NOT fires; codex stage 3 still applies.

**Estimated LOC:** ~80.

**Acceptance:**
1. `/notes/sample-blocks/` builds + serves
2. All 8 blocks render in SSR
3. visual-smoke playwright PASSES on CI

### C4a: apps/site SSR-parity test infra + 2 block parity (block-callout + block-code)

**Files:**
- Create: `apps/site/src/__tests__/ssr-parity.test.ts` (table-driven
  test infra; reads each block's Astro static markup vs `renderToStaticMarkup`
  byte-equivalence, per ADR-0006 #5)
- Modify: `packages/block-callout/src/ui-default/index.ts` (re-export
  `Callout.astro` if not yet exposed)
- Modify: `packages/block-code/src/ui-default/index.ts` (re-export
  `Code.astro`)
- Modify: `packages/block-callout/CONTRACT.md` + `packages/block-code/CONTRACT.md`
  (public-surface += `<Block>.astro`)
- Modify: `apps/site/CONTRACT.md` (SSR-parity invariant)

**test_cases:**
- TC1 callout: `renderToStaticMarkup(<CalloutRenderView ...>)` ≡
  Astro `<Callout ...>` SSR HTML (byte-equiv per ADR-0006 #5);
  location: `__tests__/ssr-parity.test.ts:N`.
- TC2 code: same shape for block-code.
- TC3 (negative): if either block omits the Astro export, the SSR-parity
  test fails loudly with a clear error message naming the block.

**contracts_affected:** 2 block CONTRACTs + apps/site/CONTRACT.md.

**adr_touched:** None.

**executor:** `codex-generic-executor`.

**D2 trigger:** Row 1 + Row 5 (3 packages). D1 stage 4 fires.

**Estimated LOC:** ~150.

**Acceptance:**
1. SSR-parity test infra accepts new blocks via single-line addition
2. block-callout + block-code SSR parity verified
3. test infra documents the contract for future blocks

### C4b: apps/site SSR parity for remaining 3 blocks (block-image + block-math + block-pdf)

**Files:**
- Modify: `packages/block-image/src/ui-default/index.ts` (re-export `Image.astro`)
- Modify: `packages/block-math/src/ui-default/index.ts` (re-export `Math.astro`)
- Modify: `packages/block-pdf/src/ui-default/index.ts` (re-export `Pdf.astro`)
- Modify: 3 block CONTRACT.md (public-surface += `<Block>.astro`)
- Modify: `apps/site/src/__tests__/ssr-parity.test.ts` (add 3 rows;
  the table-driven loop picks them up automatically + jupyter / nn-viz /
  agent-flow already have `.astro` exports — add their assertions too,
  bringing total to 8)

**test_cases:**
- TC1-3: SSR parity for image / math / pdf (analogous to C4a triplet).
- TC4-6: SSR parity for jupyter / nn-viz / agent-flow (already have
  `.astro` exports from Wave 2; verify they still match).

**contracts_affected:** 3 block CONTRACTs.

**adr_touched:** None.

**executor:** `codex-generic-executor`.

**D2 trigger:** Row 1 + Row 5 (4 packages). D1 stage 4 fires.

**Estimated LOC:** ~140.

**Acceptance:**
1. All 8 blocks have `<Block>.astro` exposed in `ui-default/index.ts`
2. SSR-parity test covers all 8 (8 ≡ Wave 2 viz triplet + Wave 3 5 parity additions)
3. ADR-0006 #5 invariant explicit per-block

### C5: apps/site Colab-style chunked deployment + skeleton states

**Files:**
- Modify: `apps/site/src/components/LazyBlock.astro` (skeleton state
  while heavy chunk loads; per-runtime spinner / placeholder)
- Modify: `apps/site/CONTRACT.md` (chunking + skeleton convention)
- Modify: `apps/site/src/__tests__/skeleton-state.test.ts`

**test_cases:**
- TC1: pre-hydration HTML contains `data-block-loading` skeleton
  attribute; post-hydration removed.
- TC2: skeleton dimensions match the eventual block dimensions (no
  layout shift; CLS ≤ 0.1 per Lighthouse).

**contracts_affected:** apps/site/CONTRACT.md.

**adr_touched:** None.

**executor:** `codex-generic-executor` + `ux-ui-lead`.

**D2 trigger:** Row 1. D1 stage 4 fires. codex-perf-auditor MUST run
(Lighthouse CLS budget verification).

**Estimated LOC:** ~120.

**Acceptance:**
1. CLS ≤ 0.1 (Lighthouse CI)
2. Heavy blocks show skeleton during load
3. Stage C complete; apps/site renders all 8 block kinds with proper
   chunking

---

## Stage D — Search index (3 PR)

**Goal:** Static client-side full-text search over `content/notes/**/*.mdx`.
Per spec §4.2; per ADR-0010 D7 #5.

### D1a: Search index research spike (researcher subagent)

**Files:**
- Create: `docs/research/2026-05-search-index-spike.md` (researcher
  Claude subagent dispatched; benchmark PageFind vs lunr.js vs
  flexsearch on apps/site current corpus; cover bundle size / language
  support / build-time vs client-time index / non-ASCII robustness /
  reindex-on-update story)

**test_cases:**
- TC1: research doc cites ≥ 3 candidate libs with version + last-commit
  date (timeliness check); location: `docs/research/2026-05-search-index-spike.md:N`.
- TC2: each candidate has a benchmark row with bundle-size + index-size
  + query-latency on the apps/site corpus.
- TC3: research doc includes a non-English/CJK content test (per
  plan-challenger #5 — non-ASCII edge).

**contracts_affected:** none.

**adr_touched:** None (research only; ADR lands in D1b).

**executor:** `researcher` Claude subagent (sole web access channel per
ADR-0011 D7).

**D2 trigger:** None for D1a (research doc only). D1 stage 4 NOT fires
(no row 1 / row 4 hit yet — ADR is in D1b).

**Estimated LOC:** ~120 (research prose).

**Acceptance:**
1. Research doc summarizes 3 candidates with concrete numbers
2. Recommendation explicit
3. Edge cases (non-ASCII / reindex / update path) covered

### D1b: ADR-0012 search index stack decision

**Files:**
- Create: `docs/decisions/ADR-0012-search-index-stack.md` (decision +
  D-list per ADR template; cite D1a research; specify reindex-on-update
  acceptance criterion explicitly per plan-challenger #13)
- Modify: `docs/decisions/README.md` (index += ADR-0012)
- Modify: `docs/plans/active.md` (Wave 4 backlog notes — ADR-0010 D7 #6
  agent_bridge.py + any unresolved D7 items per plan-challenger #11)

**test_cases:** ADR-driven; quality assertions:
- TC1: ADR-0012 has `accepted` status + D1 (chosen lib) + D2 (build hook)
  + D3 (reindex behavior) D-list rows.
- TC2: README index lists ADR-0012.
- TC3: active.md Wave 4 backlog explicit on agent_bridge.py +
  index-invalidation contract.

**contracts_affected:** docs/decisions/README.md (the ADR index).

**adr_touched:** ADR-0012 NEW.

**executor:** orchestrator-self (ADR drafting; carry-over Claude pattern
from PR #1 bootstrap exception — ADRs don't go through codex executor).

**D2 trigger:** Row 4 (new ADR). D1 stage 4 fires. plan-challenger codex
MUST run on the ADR before lock (per ADR-0007 D5 + ADR-0011 D6).

**Estimated LOC:** ~180 (ADR ~150 + index update + active.md edits).

**Acceptance:**
1. ADR-0012 accepted with stack chosen + D-list complete
2. README index updated
3. active.md Wave 4 backlog explicit (per #11 + #13)

### D2: Search index build-time integration

**Files:**
- Modify: `apps/site/astro.config.mjs` (integrate chosen lib's Astro
  integration if available; PageFind has `pagefind` / lunr has manual
  pipeline)
- Create: `apps/site/scripts/build-search-index.ts` (post-build hook
  that walks `dist/` and emits `dist/pagefind/` or equivalent)
- Modify: `apps/site/package.json` (add `pagefind` or `lunr` dep based
  on D1b choice)
- Modify: `apps/site/CONTRACT.md` (search corpus surface)
- Modify: `pnpm-lock.yaml`
- Create: `apps/site/src/__tests__/search-index.test.ts`

**test_cases (with edge cases per plan-challenger #5):**
- TC1: after `pnpm --filter=@skb/site build`, the index artifact exists
  in `dist/`.
- TC2: index entries cover at least the sample-mdx-note + sample-blocks
  pages (plus any others in content/notes/).
- TC3: index size budget (e.g., ≤ 200 KB compressed for current corpus).
- TC4 (non-ASCII): a CJK fixture page (e.g., 中文笔记) is index-able
  and queryable; verifies tokenization handles non-ASCII per ADR-0012
  D-list.
- TC5 (punctuation-heavy): query with quotes / parens / hyphens
  ('"hello-world" & friends') returns expected match (no panic).
- TC6 (rebuild idempotency): build twice; second build's index artifact
  is byte-equivalent to first (no nondeterminism — required for
  reproducible deploys).

**contracts_affected:** apps/site/CONTRACT.md.

**adr_touched:** ADR-0012 (already accepted; this PR implements).

**executor:** `codex-generic-executor`.

**D2 trigger:** Row 1 + Row 8 (CI/build affecting). D1 stage 4 fires;
codex-perf-auditor + codex-structure-auditor MUST run.

**Estimated LOC:** ~150.

**Acceptance:**
1. Build emits search index artifact
2. Index size within budget
3. apps/site CONTRACT documents the build hook

### D3: Search index UI (search box + result page)

**Files:**
- Create: `apps/site/src/components/SearchBox.astro` (UI wrapping
  pagefind-ui or custom lunr query)
- Create: `apps/site/src/pages/search/index.astro` (full-text search
  page with results)
- Modify: `apps/site/src/layouts/BaseLayout.astro` (insert SearchBox
  in nav)
- Modify: `apps/site/CONTRACT.md`
- Modify: `apps/site/src/__tests__/search-ui.test.ts`

**test_cases:**
- TC1: typing "callout" returns ≥ 1 result (the sample-blocks page)
  in playwright visual-smoke.
- TC2: result page links to the matching note page with a deep anchor.
- TC3: SearchBox keyboard accessible (tab to focus, ESC to clear).

**contracts_affected:** apps/site/CONTRACT.md.

**adr_touched:** None.

**executor:** `codex-generic-executor` + `ux-ui-lead` (visual + a11y).

**D2 trigger:** Row 1. D1 stage 4 fires. visual-smoke playwright MUST run.

**Estimated LOC:** ~150.

**Acceptance:**
1. Search box visible in nav across all pages
2. /search route returns relevant results
3. visual-smoke + a11y check PASSES

---

## D2 trigger summary (Risk Grid; per plan-challenger #3 + #10)

| Stage | PR | Row 1 contract | Row 2 pkg add | Row 4 ADR | Row 5 cross≥3 | Row 8 build/CI | D1 stage 4? | depends_on |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| Pre-A | Pre-A1 | ✓ | — | — | — | — | YES | — |
| A | A1 | ✓ | ✓ | — | — | — | YES | Pre-A1 |
| A | A2 | ✓ | — | — | — | — | YES | A1 |
| A | A3 | ✓ | — | — | ✓ | — | YES | A2 |
| A | A4 | ✓ | — | — | — | — | YES | A3 |
| A | A5 | ✓ | — | — | — | — | YES | A4 |
| B | B1 | ✓ | — | — | ✓ | — | YES | A3 |
| B | B2 | ✓ | — | — | — | — | YES | B1 |
| B | B3 | ✓ | — | — | — | — | YES | B2 |
| B | B4 | ✓ | — | — | — | — | YES | B3 |
| B | B5 | ✓ | — | — | — | — | YES | B4 |
| B | B6 | ✓ | — | — | — | — | YES | B5 |
| B | B7 | ✓ | — | — | — | — | YES | B6 |
| B | B8 | ✓ | — | — | — | — | YES | B7 |
| C | C1 | ✓ | — | — | ✓ | — | YES | B1, A3 |
| C | C2 | ✓ | — | — | — | ✓ | YES | C1 |
| C | C3 | — | — | — | — | ✓ | NO (codex stage 3 only) | C2 |
| C | C4a | ✓ | — | — | ✓ | — | YES | C3 |
| C | C4b | ✓ | — | — | ✓ | — | YES | C4a |
| C | C5 | ✓ | — | — | — | — | YES | C4b |
| D | D1a | — | — | — | — | — | NO (research only) | C2 (corpus stable) |
| D | D1b | — | — | ✓ | — | — | YES (row 4 ADR) | D1a |
| D | D2 | ✓ | — | — | — | ✓ | YES | D1b, C2 |
| D | D3 | ✓ | — | — | — | — | YES | D2 |

**Stage 4 fires on 22/24 PRs** (Pre-A1, all of A/B/C, all of D except
D1a research). C3 (sample-blocks page going live) doesn't hit row 1+4
but hits row 8. D1a is research-only.

**Cross-stage dependency note (per plan-challenger #10):** Stage D
explicitly `depends_on: C2` (apps/site route/build stable), not just
serial-after. If C2-C5 hit issues, D1a research can start in parallel
(read-only on the corpus), but D1b/D2/D3 wait for stable apps/site.

**Forward-fix rate target (ADR-0011 D8):** ≤ 15% (Wave 2 baseline 24%).
Stage 4 high-trigger is acceptable if this is met — the PRE-COMMIT
CLAUDE REVIEW is precisely the check that should reduce forward-fixes
below the row-1+4 set. Track per-PR; if cumulative forward-fix climbs
above 4 (≈ 17% on 24 PRs), pause and re-evaluate D-list interpretation.

---

## Wave 3 close ceremony (post-D3)

After D3 ACCEPT:
- ADR-0013 Wave 3 close (errata + cross-package invariants gathered
  during Wave 3 + WE-* additions; Wave 3 prep PRs #1-3 retrospective
  evidence: 24% forward-fix in Wave 2 → target ≤ 15% in Wave 3 per
  ADR-0011 D8 monitoring)
- structure-auditor monthly audit `docs/audits/structure-2026-06.md`
  (or -07 depending on calendar; F3 should now be closed since Wave 3
  prep PR #2 landed; viz-block test corpora CONTRACT-disclosed since
  Wave 3 prep PR #3)
- `docs/plans/active.md` repointed to Wave 4 plan-draft

**Wave 4 backlog (per plan-challenger #11 + #13):**
- ADR-0010 D7 #1 (J — attr-bearing mark expansion): re-evaluate at
  Wave 4 if any block-* needs inline-mark sub-syntax beyond `link`
- ADR-0010 D7 #6 (agent_bridge.py TS↔Pydantic mirror; carry-forward
  from ADR-0002 #22): Wave 4 main scope. Acceptance criteria:
  (a) 11 toolSchemas mirror in `apps/api/agent_bridge.py`;
  (b) structure-audit shape-parity check between TS Zod schemas and
  Pydantic mirrors;
  (c) editor-loop / live-update behavior — if Stage A+B reveal needs
  beyond the current edit_block / insert_block schema, document in
  Wave 4 spec
- Search index (ADR-0012 D-list per D1b): index-invalidation contract
  + remote-source updates + publish-time reindex path explicitly
  documented as Wave 4 acceptance criteria
- `block-image/CONTRACT.md` line 3-4 stale boilerplate (carried from
  Wave 3 prep PR #2 deferred list): doc-cleanup PR in Wave 4 prep

`docs/superpowers/plans/2026-05-01-phase-1-wave-3-integration.md`
(this file) marked closed with HEAD ref + commit roster.

---

## Self-review against spec

**Spec coverage check (vs ADR-0010 D7 deferred + spec §4.2):**
- ADR-0010 D7 #1 (J — attr-bearing mark expansion): NOT IN WAVE 3 PLAN.
  Per ADR-0010, deferred unless block-* requires inline-mark sub-syntax;
  Wave 3 sample blocks don't add new marks (Z0 confirmed). Defer to
  Wave 4 unless Stage B reveals a need.
- ADR-0010 D7 #2 (mdx-bridge real RTT for 8 component blocks): Stage B
  ✓ (8 PRs B1-B8 cover infra + 8 fixtures).
- ADR-0010 D7 #3 (editor-shell): Stage A ✓ (5 PRs A1-A5).
- ADR-0010 D7 #4 (apps/site BlockRegistry routing): Stage C ✓ (5 PRs).
- ADR-0010 D7 #5 (search index): Stage D ✓ (3 PRs D1-D3).
- ADR-0010 D7 #6 (agent_bridge.py): NOT IN WAVE 3 PLAN. Carry-forward
  from ADR-0002 #22; defer to Wave 4 (apps/api scope; Wave 3 keeps
  scope tight to client-side integration layer).

**No spec gaps in Wave 3 stage 4 scope.**

**Placeholder scan:** None. All test_cases include input/expected/location
shape per ADR-0011 D2; per-PR acceptance bullets are concrete.

**Type consistency:**
- `BlockRegistry` API used uniformly across A3, A5, B1, C1
- `mdxToTiptap` / `tiptapToMdx` (from mdx-bridge) used uniformly in A5,
  B1, C1
- `<Block>UIDefault` naming uniformly applied (A3 + C1 + C4)
- `proseExtensions` from block-foundation used in A2 + A3
- Astro component naming (`<Block>.astro`) uniformly applied (C4)

---

## Related

- [active.md](../../plans/active.md) — Wave 3 起手 + plan-draft 起草 trigger
- [ADR-0010 D7](../../decisions/ADR-0010-wave-2-close.md) — Wave 2
  deferred items this plan addresses
- [ADR-0011 D1-D8](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — execution model
- [structure-2026-05.md §7](../../audits/structure-2026-05.md) — Wave 3
  prep concerns + top 3 (resolved by Wave 3 prep PRs #1-3)
- [block-foundation/RFC.md](../../../packages/block-foundation/RFC.md)
  — registration walkthrough (consumed by A3 + B1)
- [mdx-bridge/CONTRACT.md](../../../packages/mdx-bridge/CONTRACT.md) —
  RTT invariants (extended in B1)
- [Spec §4.2](../specs/2026-04-29-self-knowledge-base-design.md) —
  search index requirement
- Wave 1 plan: [phase-1-wave-1-foundation.md](2026-04-29-phase-1-wave-1-foundation.md)
- Wave 2 plan: [phase-1-wave-2-implementation.md](2026-04-30-phase-1-wave-2-implementation.md)
