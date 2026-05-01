# Structure Audit — 2026-05 Wave 2 close

> Second structure-audit run; first regular monthly cadence run.
> Wave 1 close baseline (2026-04-29) is the prior reference point.

- **HEAD**: `51789a1` (2026-05-01, Wave 2 Track E3 close — 17/17 main tracks landed)
- **Wave 2 commit span**: 34 commits (b5e7217..51789a1)
- **Auditor**: `structure-auditor` (Tier 3, monthly + Wave-close trigger)
- **Source rules**: `CLAUDE.md` Hard rule #1 (200 target / 300 ESLint warn / 500 hard fail), spec §3.6
- **Auxiliary tool**: `pnpm size-check` (`scripts/check-size-limits.mjs`) — currently reports `All 272 source files under 500 lines`
- **Authoritative deltas since Wave 1**: ADR-0008 (dead-dep policy + interface freeze), ADR-0009 (BlockKind 4-way), ADR-0007 D5 erratum (`932a919`, `07c5be4`), block-foundation/RFC.md (`6ae05c0`)

## §1. Snapshot

### Workspace topology

22 publishable units (Wave 1: 10 → Wave 2: 22, Δ +12):

- 2 apps (unchanged): `apps/site` (Astro static), `apps/api` (FastAPI Python — outside pnpm workspace)
- 20 packages (Wave 1: 8 → Wave 2: 20, Δ +12):
  - 8 Wave 1 packages (carry-over): `agent-tools`, `block-foundation`, `content-types`, `design-tokens`, `editor-commands`, `kernel-adapter`, `kernel-registry`, `mdx-bridge`
  - 8 new block packages (Wave 2 Tracks C/D/E): `block-callout`, `block-code`, `block-image`, `block-math`, `block-pdf`, `block-jupyter`, `block-nn-viz`, `block-agent-flow`
  - 1 new kernel implementation (Wave 2 Track F): `kernel-pyodide`
  - 3 new editor sub-modules (Wave 2 Track G): `editor-toolbar`, `editor-slash-menu`, `editor-drag-handle`

Workspace declaration unchanged — `pnpm-workspace.yaml` → `apps/*` + `packages/*`.

### Per-package summary

| Package | Files | Total lines | Largest file (lines) | CONTRACT.md | Workspace deps |
|---|---:|---:|---|:---:|---|
| `apps/site` | 11 | 656 | `src/__tests__/fouc-script.test.ts` (185) | yes | content-types, design-tokens |
| `apps/api` | 17 | 977 | `tests/test_http_errors.py` (169) | yes (3) | — (Python) |
| `packages/agent-tools` | 4 | 160 | `src/__tests__/tools.test.ts` (78) | yes | editor-commands |
| `packages/block-agent-flow` | 19 | 1926 | `src/__tests__/flow-bridge.test.ts` (326) | yes | block-foundation, design-tokens |
| `packages/block-callout` | 16 | 581 | `src/ui-default/callout.css` (128) | yes | block-foundation, design-tokens |
| `packages/block-code` | 14 | 472 | `src/__tests__/ui-default.test.tsx` (131) | yes | block-foundation, design-tokens (F3) |
| `packages/block-foundation` | 5 | 230 | `src/__tests__/registry.test.ts` (101) | yes + RFC.md | — |
| `packages/block-image` | 14 | 403 | `src/__tests__/ui-default.test.tsx` (115) | yes | block-foundation, design-tokens (F3) |
| `packages/block-jupyter` | 17 | 1728 | `src/__tests__/kernel-bridge.test.ts` (414) | yes | block-foundation, design-tokens, kernel-adapter, kernel-pyodide |
| `packages/block-math` | 17 | 486 | `src/__tests__/ssr-render.test.ts` (65) | yes | block-foundation, design-tokens |
| `packages/block-nn-viz` | 20 | 2106 | `src/__tests__/tfjs-bridge.test.ts` (327) | yes | block-foundation, design-tokens |
| `packages/block-pdf` | 18 | 818 | `src/__tests__/core.test.ts` (153) | yes | block-foundation, design-tokens |
| `packages/content-types` | 5 | 57 | `src/__tests__/frontmatter.test.ts` (23) | yes | — |
| `packages/design-tokens` | 10 | 436 | `src/__tests__/use-theme.test.tsx` (111) | yes | — |
| `packages/editor-commands` | 4 | 238 | `src/commands.ts` (120) | yes | content-types |
| `packages/editor-drag-handle` | 12 | 591 | `src/ui-default/DragHandle.tsx` (120) | yes | editor-commands |
| `packages/editor-slash-menu` | 12 | 749 | `src/ui-default/SlashMenu.tsx` (174) | yes | editor-commands |
| `packages/editor-toolbar` | 12 | 546 | `src/__tests__/toolbar-dispatch.test.ts` (118) | yes | editor-commands |
| `packages/kernel-adapter` | 6 | 181 | `src/__tests__/errors.test.ts` (57) | yes | — |
| `packages/kernel-pyodide` | 10 | 671 | `src/__tests__/session.test.ts` (171) | yes | kernel-adapter |
| `packages/kernel-registry` | 4 | 106 | `src/__tests__/registry.test.ts` (71) | yes | kernel-adapter |
| `packages/mdx-bridge` | 5 | 586 | `src/serialize.ts` (243) | yes | — (cleaned per ADR-0008 D1) |

Repo-wide totals: **272 source files under size limits**, **13,536 source lines** across `packages/` + ~1,600 across `apps/` (excluding `.venv`). Source-line growth Wave 1→2: ~3,500 → ~15,000 (≈ 4×, with 12 new packages absorbing).

### CONTRACT.md / RFC.md inventory (25 total)

- 21 package CONTRACT.md (every package — 8 Wave 1 + 12 Wave 2 + foundation = 20; plus 1 RFC for block-foundation)
- 4 app CONTRACT.md (`apps/site`, `apps/api/app`, `apps/api/app/llm`, `apps/api/app/ws`)

**Every package and app has a CONTRACT.md.** No package missing a public-surface declaration. No package introduces sub-CONTRACTs at `core/` or `ui-default/` granularity (single CONTRACT.md per package is the established pattern; the audit confirms this is observed by all 12 new packages — see §3 finding F4 evaluation).

**`packages/block-foundation/RFC.md` landed** (commit `6ae05c0`). Cross-linked from `block-foundation/CONTRACT.md` line 60 and from every Wave 2 block CONTRACT (callout, code, image, math, pdf, jupyter, nn-viz, agent-flow). RFC §1 documents the full 4-way `BlockKind` union with cross-link to ADR-0009. Wave 1 §7 recommendation #2 (block-foundation interface freeze before block-callout PR) **delivered as committed**.

## §2. God-file scan (300-line warn / 500-line hard-fail)

Hard 500-line rule: **0 violations**. `pnpm size-check` exit 0 on all 272 source files.

Soft 300-line rule (ESLint `max-lines: warn`): **3 files cross the warn threshold**, all in Wave 2 viz-block test corpora. None require refactor.

| Rank | File | Lines | Disposition |
|---:|---|---:|---|
| 1 | `packages/block-jupyter/src/__tests__/kernel-bridge.test.ts` | 414 | **Wave 2 NEW**. Kernel-bridge state-machine test corpus: phase transitions × execution lifecycle × error propagation × disposal cleanup. Per `block-jupyter/CONTRACT.md` "kernel-bridge invariants" segment, this test owns the cross-runtime authority for Pyodide message-event mapping. Pre-allowlist via CONTRACT recommended (item carried in §7). |
| 2 | `packages/block-nn-viz/src/__tests__/tfjs-bridge.test.ts` | 327 | **Wave 2 NEW**. TensorFlow.js bridge: tensor lifecycle / model build / training loop / disposal. Same pattern as #1. |
| 3 | `packages/block-agent-flow/src/__tests__/flow-bridge.test.ts` | 326 | **Wave 2 NEW**. React-Flow bridge: cycle detection / unknown-id handling / phase transitions. Same pattern. |

Other notable longer files (≥ 200 lines), all expected:

| Rank | File | Lines | Disposition |
|---:|---|---:|---|
| 4 | `packages/block-jupyter/src/__tests__/ui-default.test.tsx` | 292 | viz UI corpus |
| 5 | `packages/block-agent-flow/src/__tests__/core.test.ts` | 250 | core schema corpus |
| 6 | `packages/mdx-bridge/src/serialize.ts` | 243 | Wave 1 carry-over (5 throw sites + greedy mark grouper) |
| 7 | `packages/block-nn-viz/src/__tests__/core.test.ts` | 224 | core schema corpus |
| 8 | `packages/block-agent-flow/src/ui-default/flow-layout.ts` | 220 | layout authority (single source of truth shared across NodeView + Astro SSR) |
| 9 | `packages/block-jupyter/src/ui-default/Jupyter.tsx` | 215 | Tiptap NodeView for `kind='viz'` |
| 10 | `packages/block-nn-viz/src/__tests__/ui-default.test.tsx` | 214 | UI corpus |

No god-file candidates. **No refactor pressure on file size for Wave 2 close.** All viz-block test corpora cluster in 200-414 line range, matching their per-block invariant complexity (multi-runtime state machines warrant denser corpora than Wave 1 prose blocks — consistent with the new-runtime authority the test files own).

## §3. Contract drift detection

Methodology: per CONTRACT.md "Public surface" claim, verify every documented export resolves to an actual source export. Cross-package canaries (frontmatterSchema, editBlockInputSchema, getInitialTheme, BlockKind 4-way) traced to all consumers.

### Per-package verification (Wave 2 new packages)

| Package | Surface claim | Status |
|---|---|:---:|
| `block-callout` | `calloutCore` (kind=`'component'`, mdxComponent=`'Callout'`), `calloutUIDefault`, `CalloutEditorView`/`CalloutRenderView`/`CalloutBody`, `VARIANT_TOKENS`/`VARIANT_ICONS`, `Variant` type, `serializeCallout`/`parseCallout` | OK — all resolved; `coreName='callout'` literal at `core/core-definition.ts`; mdxComponent='Callout' verified |
| `block-code` | `codeCore` (kind=`'component'`, mdxComponent=`'Code'`), `codeUIDefault`, `CodeEditorView`/`CodeRenderView`/`CodeBody`, `serializeCode`/`parseCode` | OK — codex-clone of callout structure; kind/mdxComponent/serialize-parse verb-prefix all match |
| `block-image` | `imageCore` (kind=`'component'`, mdxComponent=`'Image'`), `imageUIDefault`, `ImageEditorView`/`ImageRenderView`/`ImageBody`, `serializeImage`/`parseImage` | OK — codex-clone; same shape |
| `block-math` | `mathCore` (kind=`'render'`), `mathUIDefault`, `MathEditorView`/`MathRenderView`, `renderMath` (single-source KaTeX wrapper) | OK — kind=`'render'` matches ADR-0009 D1 row 3 |
| `block-pdf` | `pdfCore` (kind=`'render'`), `pdfUIDefault`, iframe-based render path | OK — kind=`'render'`; **no pdfjs-dist runtime dep** (iframe + browser native viewer per ADR-0009 D1 prose); build-time `scripts/extract-pdf-text.ts` covered |
| `block-jupyter` | `jupyterCore` (kind=`'viz'`), `jupyterUIDefault`, `JupyterView` (NodeView), `kernelBridge` machinery | OK — kind=`'viz'`; first real consumer of `kernel-pyodide` (verified via `Jupyter.tsx:4`) |
| `block-nn-viz` | `nnVizCore` (kind=`'viz'`), `nnVizUIDefault`, `NnVizView` + `topology` + `tfjs-bridge` | OK — kind=`'viz'`; TF.js consumer |
| `block-agent-flow` | `agentFlowCore` (kind=`'viz'`), `agentFlowUIDefault`, `AgentFlowView` + `flow-layout` + `flow-bridge` | OK — kind=`'viz'`; React-Flow consumer; `flow-layout.ts` is single-source authority for layout (ADR-0006 #5 sister-conscious authoring observed) |
| `kernel-pyodide` | `PyodideAdapter implements KernelAdapter` (id=`'pyodide'`), `PyodideSession`, `PyodideAdapterOptions`, 5 typed errors (`KernelStartupError` / `KernelImportError` / `KernelShutdownError` / `KernelInterruptError` / `KernelTimeoutError`) | OK — adapter resolves; `KernelImportError` is package-extension subclass; `KernelTimeoutError` reserved-not-emitted (CONTRACT acknowledges Wave 3 worker-host lifecycle) |
| `editor-toolbar` | `toolbarConfigSchema`, `defaultToolbarConfig` (9 buttons: 3 marks + 3 headings + 2 lists + 1 inline-code), `EditorToolbar` (BubbleMenu), `TOOLBAR_ICONS`, `runDefaultCommand`/`isDefaultCommandActive`, `buildEditBlockInput` | OK — 9 default buttons verified; `editBlockInputSchema` cross-package consumer pattern observed via `core/command-bindings.ts:1` |
| `editor-slash-menu` | `slashMenuConfigSchema`, `defaultSlashMenuConfig`, `SlashMenu` UI, `buildEditBlockInput` | OK — codex-clone of toolbar; same cross-package consumer pattern |
| `editor-drag-handle` | `dragHandleConfigSchema`, `DragHandle` UI, `buildEditBlockInput` | OK — codex-clone; same pattern |

### Per-package verification (Wave 1 carry-over — re-checked)

| Package | Surface claim | Status |
|---|---|:---:|
| `block-foundation` | `BlockRegistry`, `defineCore`, `defineUI`, `BlockCoreDefinition`, `BlockUIDefinition`, `BlockViewProps`, `BlockKind` (4-way), `proseExtensions` | OK — `BlockKind = 'prose' \| 'component' \| 'render' \| 'viz'` at `src/registry.ts:4`; CONTRACT line 11 documents 4-way + cross-links ADR-0009 |
| `mdx-bridge` | unchanged Wave 1 surface (`mdxToTiptap`/`tiptapToMdx` + types + 5 throw sites + 9 fixtures × 2 invariants) | OK — Wave 2 deferred consumer wiring (per CONTRACT prose §"Wave 2 onward") |
| `agent-tools` / `content-types` / `design-tokens` / `editor-commands` / `kernel-adapter` / `kernel-registry` / `apps/site` / `apps/api/*` | Wave 1 baseline | OK — no contract drift since Wave 1 |

### Cross-package canary results

- **`frontmatterSchema`** (defined `packages/content-types/src/frontmatter.ts:3`): consumers unchanged from Wave 1 (`apps/site/src/content.config.ts`, `packages/editor-commands/src/commands.ts:2`). No drift.
- **`editBlockInputSchema`** (defined `packages/editor-commands/src/commands.ts:29`): **4 consumers** now (Wave 1 had 1):
  - `packages/agent-tools/src/tools.ts:52` (Wave 1 consumer)
  - `packages/editor-toolbar/src/core/command-bindings.ts:1` (Wave 2 NEW)
  - `packages/editor-slash-menu/src/core/command-bindings.ts:1` (Wave 2 NEW)
  - `packages/editor-drag-handle/src/core/command-bindings.ts:1` (Wave 2 NEW)
  All four consumers `import` the schema directly (no inline duplication). ADR-0006 item #4 Cross-package consumer pattern preserved across all 3 new editor sub-modules. Each new consumer adds `buildEditBlockInput(pageSlug, blockId, draft)` which delegates `editBlockInputSchema.parse(...)` — sister-aligned by structural identity, not paraphrase. **No drift.**
- **`getInitialTheme`** (defined `packages/design-tokens/src/use-theme.ts:13`): consumers unchanged from Wave 1. The IIFE byte-equivalence regression (`apps/site/src/__tests__/fouc-script.test.ts`, 185 lines) carried over. No drift.
- **`STORAGE_KEY = 'skb-theme'` literal sync**: `BaseLayout.astro:42` ↔ `use-theme.ts:11`. No drift.
- **`BlockKind` 4-way (Wave 2 canary, NEW)**: 8 block packages × correct kind value:

| Package | core kind | Expected per ADR-0009 D1 | Match? |
|---|---|---|:---:|
| block-callout | `'component'` | `component` (Track C simple-block) | yes |
| block-code | `'component'` | `component` (Track C clone) | yes |
| block-image | `'component'` | `component` (Track C clone) | yes |
| block-math | `'render'` | `render` (Track D KaTeX) | yes |
| block-pdf | `'render'` | `render` (Track D iframe-PDF) | yes |
| block-jupyter | `'viz'` | `viz` (Track E Pyodide) | yes |
| block-nn-viz | `'viz'` | `viz` (Track E TF.js) | yes |
| block-agent-flow | `'viz'` | `viz` (Track E React Flow) | yes |

  All 8 blocks correctly classified per ADR-0009 D1 table. **No drift.**

### Drift findings

**No CONTRACT.md drift detected for Wave 1 or Wave 2 packages.** Every claimed export resolves to actual source. The 4-way BlockKind expansion is structurally consistent across all 8 block packages, all 3 editor sub-modules, the foundation registry, RFC.md §1, and ADR-0009.

**One ADR-index drift detected** (out-of-scope for code-level CONTRACT but noted for completeness): `docs/decisions/README.md` lists ADR-0001 through ADR-0008 but **omits ADR-0009-block-kind-union-expansion.md**. The ADR file exists, is `accepted`, is cross-linked from `block-foundation/CONTRACT.md` line 11+20+60+ and from all 8 block CONTRACTs. Only the index README missed the entry. Treat as a documentation drift within the ADR family (sister-doc per ADR-0006 item #6); fix candidate for next bundle. **Severity**: low (consumers reach ADR-0009 via in-CONTRACT cross-links, not via index browsing).

## §4. Orphan package scan

Methodology: `grep -rn "from '@skb/<pkg>'"` over `apps/` + `packages/` excluding `node_modules` / `dist`. Anything with zero importers is an orphan; flag whether expected vs unexpected.

| Package | Importers | Orphan? | Notes |
|---|---|:---:|---|
| `agent-tools` | 0 | yes (expected) | Phase 2b consumer is `apps/api/agent_bridge.py`; CONTRACT documents. |
| `block-foundation` | 84 (every block-* + tests + RFC) | no | Saturated in Wave 2. |
| `content-types` | 4 | no | Wave 1 baseline. |
| `design-tokens` | 14 (apps/site × 4 + design-tokens itself + block-callout + block-jupyter ssr-render-test + agent-tools test fixtures) | no | block-callout type-only `ColorTokenName` import is the sole TS import outside apps/site; CSS-variable consumption (block-code/block-image/block-math/etc.) is consumer-side, not TS import (see §6 F3). |
| `editor-commands` | 11 (4 Wave 2 consumers + agent-tools + tests) | no | 4× higher consumer count than Wave 1. |
| `kernel-adapter` | 29 (kernel-registry + kernel-pyodide × ~12 + block-jupyter × ~5) | no | Saturated. |
| `kernel-pyodide` | 2 (block-jupyter × 2) | no | First real consumer = block-jupyter. |
| `kernel-registry` | 0 | yes (expected) | Wave 3 consumer is editor-shell kernel boot; Wave 2 did not introduce editor-shell. |
| `mdx-bridge` | 0 | yes (expected) | Wave 3 consumer is editor-shell + apps/api server-side serialize check. CONTRACT prose §"Wave 2 onward" documents. |
| `block-callout` ... `block-agent-flow` (8 block packages) | 0 each | yes (expected) | All 8 await editor-shell registry boot in Wave 3 + sample-blocks MDX consumer (per `content/notes/sample-blocks/index.mdx` placeholder, currently empty body — see Wave 3 prep §7). |
| `editor-toolbar` / `editor-slash-menu` / `editor-drag-handle` | 0 each | yes (expected) | Editor sub-modules await editor-shell wiring in Wave 3. |

**13 expected orphans** (Wave 1: 4 → Wave 2: 13, Δ +9): the 8 new block packages + 3 editor sub-modules + carry-over kernel-registry + mdx-bridge + agent-tools. Each has a documented Wave 3+ consumer path either in CONTRACT or RFC. The Wave 2 new orphans are saturating in **two waves**: (a) editor-shell appears in Wave 3 and instantiates the BlockRegistry + boots editor sub-modules; (b) `content/notes/sample-blocks/index.mdx` is the smoke-corpus consumer (currently a placeholder with no MDX body — Z-track close ceremony work-item).

**0 unexpected orphans.**

## §5. tsconfig references graph

Methodology: each `tsconfig.json#references` should list every workspace dep imported. Root `tsconfig.json` aggregates all 21 composite packages.

```
                            ┌───────────────────────────────────────┐
                            │  root tsconfig.json (composite=false) │
                            └───────────────────────────────────────┘
                                              │ references (21)
        ┌─────────────────┬───────────────────┼────────────────┬──────────────────┐
        ▼                 ▼                   ▼                ▼                  ▼
  content-types     block-foundation    kernel-adapter   design-tokens      mdx-bridge
   (leaf)            (leaf)              (leaf)           (leaf)             (leaf)
        ▲                 ▲                   ▲                ▲
        │                 │                   │                │
   editor-commands   block-callout       kernel-registry   block-callout
        ▲            block-code          kernel-pyodide    block-code
        │            block-image         (kernel-pyodide                        )
        │            block-math           ▲                                     │
        │            block-pdf            │                                     │
        │            block-jupyter        │                                     │
        │            block-nn-viz         │                                     │
        │            block-agent-flow     │                                     │
        │                ▲                │                                     │
   agent-tools           │            block-jupyter (also refs kernel-adapter + kernel-pyodide)
   editor-toolbar        │
   editor-slash-menu     │
   editor-drag-handle    │
                                         (all 8 block-* packages also ref design-tokens — see §6 F3)
```

Per-package check (Wave 2 packages new + carry-over re-verified):

| Package | tsconfig refs | Imports (`@skb/*`) | Aligned? |
|---|---|---|:---:|
| `agent-tools` | `editor-commands` | `editor-commands` | yes |
| `block-agent-flow` | `block-foundation`, `design-tokens` | `block-foundation`, `design-tokens` | yes |
| `block-callout` | `block-foundation`, `design-tokens` | `block-foundation`, `design-tokens` (type-only `ColorTokenName`) | yes |
| `block-code` | `block-foundation`, `design-tokens` | `block-foundation` only | **F3 candidate** — see §6 |
| `block-foundation` | (none) | (none) | yes (leaf, ADR-0008 D1 applied) |
| `block-image` | `block-foundation`, `design-tokens` | `block-foundation` only | **F3 candidate** — see §6 |
| `block-jupyter` | `block-foundation`, `design-tokens`, `kernel-adapter`, `kernel-pyodide` | all 4 | yes |
| `block-math` | `block-foundation`, `design-tokens` | `block-foundation`, `design-tokens` | yes |
| `block-nn-viz` | `block-foundation`, `design-tokens` | `block-foundation`, `design-tokens` | yes |
| `block-pdf` | `block-foundation`, `design-tokens` | `block-foundation`, `design-tokens` | yes |
| `content-types` | (none) | (none) | yes (leaf) |
| `design-tokens` | (none) | (none) | yes (leaf) |
| `editor-commands` | `content-types` | `content-types` | yes |
| `editor-drag-handle` | `editor-commands` | `editor-commands` | yes |
| `editor-slash-menu` | `editor-commands` | `editor-commands` | yes |
| `editor-toolbar` | `editor-commands` | `editor-commands` | yes |
| `kernel-adapter` | (none) | (none) | yes (leaf) |
| `kernel-pyodide` | `kernel-adapter` | `kernel-adapter` | yes |
| `kernel-registry` | `kernel-adapter` | `kernel-adapter` | yes |
| `mdx-bridge` | (none) | (none) | yes (leaf, ADR-0008 D1 applied — Wave 1 F1 closed) |

**Wave 1 F1 (mdx-bridge dead deps)**: closed. ADR-0008 D1 commit `b3581bc` removed both `@skb/block-foundation` and `@skb/content-types` from mdx-bridge `package.json#dependencies`; tsconfig already empty; CONTRACT prose §"Wave 2 onward" preserves intent.

**Wave 1 F2 (block-foundation → content-types dead dep)**: closed. ADR-0008 D1 commit `b3581bc` removed the `@skb/content-types` dep + corresponding tsconfig reference; CONTRACT now has §"Forward-compat consumers (Wave 2+)" prose explaining when the dep will return.

**Root tsconfig.json**: aggregates 21 composite paths (all packages + scripts). Verified explicit.

## §6. Workspace dep graph integrity (D1 mechanical scan — NEW)

Methodology (per ADR-0008 D1 §"structure-auditor 月度审计 mechanical scan" requirement): for each `packages/*/package.json#dependencies` containing `@skb/*` workspace deps, grep `packages/<pkg>/src/**/*.{ts,tsx}` for matching `from '@skb/<dep>'` imports. Any one-sided declaration (declared dep without import OR import without declared dep) is a D1 violation.

### Per-package result

| Package | package.json `@skb/*` deps | Source `from '@skb/*'` imports | Verdict |
|---|---|---|:---:|
| `agent-tools` | `editor-commands` | `editor-commands` | clean |
| `block-agent-flow` | `block-foundation`, `design-tokens` | both | clean |
| `block-callout` | `block-foundation`, `design-tokens` | `block-foundation` (multiple) + `design-tokens` (type-only `ColorTokenName` at `variant-tokens.ts:2`) | clean |
| `block-code` | `block-foundation`, `design-tokens` | `block-foundation` (yes); `design-tokens` (**no — TS-import absent**) | **F3 violation** |
| `block-foundation` | — | — | clean (ADR-0008 D1 applied) |
| `block-image` | `block-foundation`, `design-tokens` | `block-foundation` (yes); `design-tokens` (**no — TS-import absent**) | **F3 violation** |
| `block-jupyter` | `block-foundation`, `design-tokens`, `kernel-adapter`, `kernel-pyodide` | all 4 | clean |
| `block-math` | `block-foundation`, `design-tokens` | both | clean |
| `block-nn-viz` | `block-foundation`, `design-tokens` | both | clean |
| `block-pdf` | `block-foundation`, `design-tokens` | both | clean |
| `content-types` | — | — | clean |
| `design-tokens` | — | — | clean |
| `editor-commands` | `content-types` | `content-types` | clean |
| `editor-drag-handle` | `editor-commands` | `editor-commands` | clean |
| `editor-slash-menu` | `editor-commands` | `editor-commands` | clean |
| `editor-toolbar` | `editor-commands` | `editor-commands` | clean |
| `kernel-adapter` | — | — | clean |
| `kernel-pyodide` | `kernel-adapter` | `kernel-adapter` | clean |
| `kernel-registry` | `kernel-adapter` | `kernel-adapter` | clean |
| `mdx-bridge` | — | — | clean (ADR-0008 D1 applied — Wave 1 F1 closed) |
| `apps/site` | `content-types`, `design-tokens` | both (incl. CSS imports) | clean |

### Findings

**F3 — `block-code` and `block-image` declare `@skb/design-tokens` without TS import** (ADR-0008 D1 violation, novel — not present in Wave 1):
- `packages/block-code/package.json:dependencies."@skb/design-tokens"` declared → `packages/block-code/src/**/*.{ts,tsx}` zero `from '@skb/design-tokens'` imports.
- `packages/block-image/package.json:dependencies."@skb/design-tokens"` declared → `packages/block-image/src/**/*.{ts,tsx}` zero `from '@skb/design-tokens'` imports.
- `packages/<pkg>/tsconfig.json#references` contains `../design-tokens` in both packages (i.e., the asymmetry is present at package.json + tsconfig levels, but absent at TS source-import level).

**Root cause analysis**: both packages are codex-clones of `block-callout` (Tracks C5a / C5b, commit `2601e3a`). The template `block-callout` legitimately imports `@skb/design-tokens` for the type-only `ColorTokenName` in `variant-tokens.ts` (callout uses 4 variant→token mappings: note/tip/warning/danger). `block-code` and `block-image` have **no variant-tokens equivalent**: they consume design-tokens **only as CSS variables** (`var(--color-fg)` / `var(--color-border)` in `code.css` / `image.css`). CSS variable consumption is a runtime dependency, not a TS-source dependency, so it does not produce `from '@skb/design-tokens'` import statements.

Per ADR-0008 D1 strict reading ("每个 `package.json#dependencies` / `peerDependencies` 中的 `@skb/*` 工作区依赖**必须**对应至少一个源码 `from '@skb/<pkg>'` import"), this is a violation: the package.json dep does not have a matching TS import. The "intent" (CSS-variable consumption) is real but not captured by the mechanical check.

**Severity**: medium. The dep is *not* dead (the CSS file legitimately consumes design-tokens runtime variables, the consumer-side bootstrap order matters), but the D1 invariant is mechanical and binary — TS-import or violation. This is the **first concrete case where ADR-0008 D1 tightening collides with a CSS-only consumption pattern**, which Wave 1 baseline did not surface (no Wave 1 package consumed design-tokens via CSS only).

**Resolution paths** (carried to §7 recommendation):
- (a) Add a synthetic type-only TS import (e.g., `import type {} from '@skb/design-tokens';` or import `STORAGE_KEY` unused) — preserves D1 mechanical check, ergonomically poor.
- (b) Add a real type-only `import type { ColorTokenName } from '@skb/design-tokens';` plus a runtime constant referencing one token (mirror callout pattern) — natural, no real cost (~5 LOC).
- (c) Amend ADR-0008 D1 to recognize CSS-variable consumption as a valid form of dependency (audit invariant becomes "TS-import OR `import '@skb/<pkg>/<file>.css'` OR documented CSS-variable consumption"). Larger semantic change; would require ADR-N.

Recommendation: **path (b)** for both block-code and block-image (cheap, structurally aligns with callout template, no rule churn). Option (c) might also be considered if CSS-variable consumption recurs in Wave 3 (e.g., new block packages added without TS-import).

**F3 also surfaces a meta-class candidate**: this is a **clone-time replication asymmetry**. The codex-block-generator produced a structural sister of block-callout, but the TS-import that was load-bearing in callout (anchoring the design-tokens dep claim) was not load-bearing in the clones (which had no `variant-tokens` analog). The asymmetry is not in the generator's mistake but in the source vs. clone runtime-dependency profiles. This is functionally similar to ADR-0006 item #5 (algorithm + runtime constant replication audit) but at the **inter-package package.json grain** rather than the inline-script grain. Wave 3 will see more clones (block-callout-style generator outputs); the rule extension would say: "when codex-block-generator clones a template, it must verify each template-side `@skb/*` dep has a clone-side TS import — if absent, either remove the dep or add a synthetic import".

**No other dead-dep findings.** ADR-0008 D1 mechanical scan reports 18/20 packages clean, 2 violating (block-code, block-image). Wave 1 F1 + F2 both closed.

## §7. Recommendations

Wave 2 close baseline is **largely clean**: zero god-file violations, zero CONTRACT drift on code-level public surface, zero unexpected orphan packages. Two findings carry forward (F3 + the ADR-0009 README index drift). The 13 expected orphans all have documented Wave 3+ consumer paths.

### Top 3 structural concerns for Wave 3 plan-draft

1. **Resolve F3 (block-code + block-image dead-dep mechanical violation) and codify the CSS-variable consumption rule.** Two sub-decisions:
   - (a) Apply path (b) above for the two existing F3 packages: add `import type { ColorTokenName } from '@skb/design-tokens';` plus one runtime token reference per package (cheap; mirrors callout). This closes the immediate violation.
   - (b) Amend ADR-0008 D1 (or land a fresh ADR-N) to specify how CSS-variable consumption interacts with the dead-dep rule. Without amendment, the rule is binary "TS-import or violation" and any future `block-*` clone built on a CSS-only consumption pattern will repeat F3. Recommended language: "TS source `from '@skb/<pkg>'` OR matching `<pkg>/.../style.css` import in the package OR CONTRACT-documented CSS-variable consumption with named tokens listed". Ratify before Wave 3 first PR opens (analogous to ADR-0008 D1 freeze before Wave 2 first PR).

2. **Test corpora ≥ 300 lines (kernel-bridge / tfjs-bridge / flow-bridge) — pre-allowlist via per-package CONTRACTs.** Currently three test files (414 / 327 / 326 lines) cross the 300-line ESLint warn threshold. Wave 1 baseline established a precedent (`fouc-script.test.ts:185` and `mdx-bridge/serialize.ts:243`) where the per-package CONTRACT pre-acknowledges expected longer files. Wave 2 close should retroactively allowlist: `block-jupyter/CONTRACT.md` should add a "test corpus invariant" segment naming `kernel-bridge.test.ts` as the cross-runtime authority test (covering Pyodide message-event mapping); same for `block-nn-viz` (TF.js bridge) and `block-agent-flow` (React Flow phase machine). This makes the size legitimate per documented contract rather than a soft drift. **Severity**: low — does not block Wave 3 plan-draft, but should be folded into Wave 2 close ceremony.

3. **Z-track sample-blocks MDX corpus is empty.** `content/notes/sample-blocks/index.mdx` exists with frontmatter + intro paragraph but **no MDX body** instantiating the 8 Wave 2 blocks. This is the cross-block smoke-corpus consumer (a 9th expected-orphan resolver: it would convert blocks `{callout, code, image, math, pdf, jupyter, nn-viz, agent-flow}` from "expected orphan" to "consumed" via `<Callout>`/`<Code>`/`<Image>`/`<Math>`/`<Pdf>`/`<Jupyter>`/`<NnViz>`/`<AgentFlow>` JSX in MDX). Wave 2 close ceremony Task Z (per active.md) is the natural home for filling this corpus. Without it: (a) the MDX-component-routing path in mdx-bridge has no real round-trip test for component blocks (Wave 1 baseline only had prose round-trip); (b) the 8 block packages remain orphans in the strict §4 sense. **Severity**: medium — Z-track must close before declaring Wave 2 fully done, and Wave 3 plan-draft should not assume sample-blocks is populated.

### Wave 3 plan-draft prerequisites (advisory)

- F3 path (a) applied or ADR-N amends D1 (concern #1).
- editor-shell package authoring is the single largest Wave 3 structural lift: it consumes block-foundation registry + 8 block packages + 3 editor sub-modules + kernel-registry + kernel-pyodide + mdx-bridge — i.e., it is the **terminal consumer** that closes 13 of the 13 expected orphans simultaneously. plan-draft should treat editor-shell as a multi-track decomposition (registry-boot / kernel-boot / sub-module wiring / MDX-bridge integration / SSR vs editor parity) rather than a single track.
- mdx-doctor agent (per agent-contract Tier 3) must be wired into PR check before any block-* PR can update the round-trip fixtures — Wave 1 baseline noted this; Wave 2 closed without exercising mdx-doctor in CI (no fixture additions to mdx-bridge during Wave 2). Wave 3 will add component-block fixtures and mdx-doctor must run.

### Wave 1 baseline comparison (quick deltas)

| Dimension | Wave 1 close | Wave 2 close | Δ |
|---|---|---|---|
| Workspace packages | 8 | 20 | +12 |
| Apps | 2 | 2 | 0 |
| CONTRACT.md (incl. RFC.md) | 12 | 25 | +13 |
| Source files under size-check | 85 | 272 | +187 |
| 300-line warn violations | 0 | 3 (test corpora) | +3 (allowlist candidates) |
| 500-line hard-fail violations | 0 | 0 | 0 |
| Unexpected orphans | 0 | 0 | 0 |
| Expected orphans | 4 | 13 | +9 |
| Dead-dep findings (CONTRACT-documented forward-compat) | 2 (F1 mdx-bridge / F2 block-foundation) | 0 (both closed by ADR-0008 D1) | -2 |
| Dead-dep findings (mechanical D1 scan) | n/a (rule did not yet exist) | 1 class (F3 — block-code + block-image) | +1 (rule debut) |
| ADR-index entry drift | 0 | 1 (ADR-0009 missing from README) | +1 |
| Cross-package canaries verified | 4 | 5 (added BlockKind 4-way) | +1 |
| Wave 1 erratum smoke fixes structurally landed | n/a | 2/2 (`fdc86a8` typography plugin, `18b9c6a` duplicate-H1) | both verified clean |

### Wave 2 process learnings — structural side-effects

The 8 documented Wave 2 process learnings (WE-001 through WE-011) are predominantly process / runbook-layer (lockfile contamination, multi-worker race, codex stdin redirection, etc.) and do **not** introduce structural side-effects in the package graph or file layout. Spot-checks:

- **WE-009 / WE-011 worktree isolation discussion**: produced `.codex-runs/` artifact directory at repo root; this is not a package and not under workspace globs (it lives in `.gitignore` if `.codex-runs/` is the right name; current state shows it exists as untracked). No change to workspace topology.
- **WE-002 lockfile-as-derivative**: codified into ADR-0006 sub-form C and applied at commit-time; no source-tree side-effect.
- **WE-001 multi-worker concurrent staging race / WE-005 WSL2 chromium / WE-007 codex spark != lint clean / WE-010 read authority types at HEAD**: pure process learnings; no structural artifacts.

Conclusion: Wave 2 process learnings do not require structural-audit follow-up beyond the ADR-0006 sub-form C language already absorbed in Wave 1 close ceremony.

### Audit cadence

Next scheduled audit: 2026-06 (monthly, file `structure-2026-06.md`). Manual / event triggers persist (ADR-0006 asymmetry-check failures, contract-touching PR clusters, package add/remove, Wave close). Filename convention reaffirmed: `structure-YYYY-MM.md` for monthly runs (this file); `structure-YYYY-MM-DD-<context>.md` for event-driven runs (e.g., Wave-close baselines).

## Related

- [agent-contract.md](../../agent-contract.md) — `structure-auditor` Tier 3 trigger spec
- [Spec §3.1 / §3.6](../superpowers/specs/2026-04-29-self-knowledge-base-design.md) — agent role + file-size rules
- [docs/audits/structure-2026-04-29-wave-1.md](structure-2026-04-29-wave-1.md) — prior baseline
- [ADR-0006 asymmetry-audit checklist](../decisions/ADR-0006-asymmetry-audit-checklist.md) — 8-point list applied throughout §3 / §6
- [ADR-0008 Wave 2 entry policies](../decisions/ADR-0008-wave-2-entry-policies.md) D1 — dead-dep mechanical scan rule applied in §6
- [ADR-0009 BlockKind union expansion](../decisions/ADR-0009-block-kind-union-expansion.md) — 4-way kind canary in §3
- [packages/block-foundation/RFC.md](../../packages/block-foundation/RFC.md) — Wave 1 §7 #2 deliverable
- [Phase 1 Wave 2 plan](../superpowers/plans/2026-04-30-phase-1-wave-2-implementation.md) — Wave 2 implementation source of truth
