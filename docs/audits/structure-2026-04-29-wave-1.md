# Structure Audit — 2026-04-29 Wave 1 close baseline

> First structure-audit run. No prior baseline exists — this document
> establishes the Wave 1 close snapshot against which subsequent audits compare.
> Triggered by `orchestrator` per Task Z Step 2; not a regular monthly run
> (the next monthly run lands as `structure-2026-05.md`).

- **HEAD**: `b5e7217c6456f9eb7b864f9d147e0d84381e01a2` (2026-04-30, Track A close)
- **Spec lock**: 2026-04-29 — 10 commits since lock
- **Wave**: Phase 1 Wave 1, closing
- **Auditor**: `structure-auditor` (Tier 3, manual / Wave-close trigger)
- **Source rules**: `CLAUDE.md` Hard rule #1 (200 target / 300 ESLint warn / 500 hard fail), spec §3.6
- **Auxiliary tool**: `pnpm size-check` (`scripts/check-size-limits.mjs`) — currently reports `All 85 source files under 500 lines`

## §1. Snapshot

### Workspace topology

10 publishable units:

- 2 apps: `apps/site` (Astro static), `apps/api` (FastAPI Python — outside pnpm workspace; managed via `apps/api/pyproject.toml`)
- 8 packages: `agent-tools`, `block-foundation`, `content-types`, `design-tokens`, `editor-commands`, `kernel-adapter`, `kernel-registry`, `mdx-bridge`

Workspace declaration: `pnpm-workspace.yaml` → `apps/*` + `packages/*`. `apps/api` has no `package.json`, so pnpm skips it; size-check & lychee scan it via `git ls-files`.

### Per-package summary

| Package | Files | Total lines | Largest file (lines) | CONTRACT.md | Workspace deps |
|---|---:|---:|---|:---:|---|
| `apps/site` | 9 | 350 | `src/__tests__/fouc-script.test.ts` (185) | yes | content-types, design-tokens |
| `apps/api` | 17 | 977 | `tests/test_http_errors.py` (169) | yes (3: app, llm, ws) | — (Python) |
| `packages/agent-tools` | 4 | 160 | `src/__tests__/tools.test.ts` (78) | yes | editor-commands |
| `packages/block-foundation` | 5 | 230 | `src/__tests__/registry.test.ts` (101) | yes | content-types |
| `packages/content-types` | 5 | 57 | `src/__tests__/frontmatter.test.ts` (23) | yes | — |
| `packages/design-tokens` | 10 | 418 | `src/__tests__/use-theme.test.tsx` (111) | yes | — |
| `packages/editor-commands` | 4 | 238 | `src/commands.ts` (120) | yes | content-types |
| `packages/kernel-adapter` | 6 | 181 | `src/__tests__/errors.test.ts` (57) | yes | — |
| `packages/kernel-registry` | 4 | 106 | `src/__tests__/registry.test.ts` (71) | yes | kernel-adapter |
| `packages/mdx-bridge` | 5 | 586 | `src/serialize.ts` (243) | yes | block-foundation, content-types (declared but unused — see §6) |

Repo-wide totals: **69 source files**, **3,503 source lines** across `apps/` + `packages/`.
(`pnpm size-check` reports 85 because it scans the broader pattern including config / scripts files; the table above narrows to package source under each unit.)

### CONTRACT.md inventory (12 total)

- `apps/site/CONTRACT.md`
- `apps/api/app/CONTRACT.md`, `apps/api/app/llm/CONTRACT.md`, `apps/api/app/ws/CONTRACT.md`
- `packages/{agent-tools, block-foundation, content-types, design-tokens, editor-commands, kernel-adapter, kernel-registry, mdx-bridge}/CONTRACT.md`

Every package and app has at least one CONTRACT.md. No package is missing the
contract surface declaration.

## §2. God-file scan (300-line warn / 500-line hard-fail)

Hard 500-line rule: **0 violations**. `pnpm size-check` exit 0.

Soft 300-line rule (ESLint `max-lines: warn`): **0 violations**. Largest file in repo is
`packages/mdx-bridge/src/serialize.ts` at **243 lines** — comfortably under the warn
threshold. Notable longer files, all expected:

| Rank | File | Lines | Disposition |
|---:|---|---:|---|
| 1 | `packages/mdx-bridge/src/serialize.ts` | 243 | Expected (Track C R3 erratum: 5-throw-site fail-loud rule + greedy mark grouper). Pre-allowlisted in CONTRACT. |
| 2 | `apps/site/src/__tests__/fouc-script.test.ts` | 185 | Expected (Track A R3 erratum: 16-row × system-pref corpus + 2 storage-throw rows + truthy-coerce regression = 20 tests). Pre-allowlisted in design-tokens CONTRACT. |
| 3 | `packages/mdx-bridge/src/parse.ts` | 176 | Expected (mdast → Tiptap walker for 6 block + 4 inline + 5 mark types). |
| 4 | `apps/api/tests/test_http_errors.py` | 169 | Expected (Track D: Problem Details lite invariants × 11 test cases covering 4 routes — auth/login + pages GET/PUT + ws). |
| 5 | `packages/mdx-bridge/src/__tests__/round-trip.test.ts` | 156 | Expected (9 fixtures × 2 invariants + adjacent-shape regressions). |
| 6 | `packages/editor-commands/src/commands.ts` | 120 | Expected (7 strict() schemas + parseCommand). |

No god-file candidates. No refactor pressure on file size for Wave 1 close.

## §3. Contract drift detection

Methodology: for each CONTRACT.md "Public surface" claim, grep the source tree for
the exported identifier and confirm it exists at the documented location. Cross-package
canaries (frontmatterSchema, editBlockInputSchema, getInitialTheme) verified against
all consumers.

### Per-package verification

| Package | Surface claim | Status |
|---|---|:---:|
| `agent-tools` | `toolSchemas` (4 read-only + 7 mutating), `ToolName`, `ToolInput<N>` | OK — `tools.ts` exports all three; `toolSchemas` has exactly 11 entries |
| `block-foundation` | `BlockRegistry`, `defineCore`, `defineUI`, `BlockCoreDefinition`, `BlockUIDefinition`, `BlockViewProps`, `BlockKind`, `proseExtensions` | OK — all 8 exports resolved |
| `content-types` | `frontmatterSchema`, `Frontmatter`, `calloutPropsSchema`, `CalloutProps` | OK — all 4 resolved (note: `Frontmatter` & `CalloutProps` re-exported via `export *` from each file; not named in `index.ts` but reachable) |
| `design-tokens` | `tokens`, `colorVars`, `spaceVars`, `useTheme`, `getInitialTheme`, `applyThemeDOM`, `STORAGE_KEY`, `ThemeToggle`, `themeNames`, `ThemeName`, `UseThemeResult`; `tokens.css`, `tokens-dark.css`, `tailwind-preset` | OK — `package.json#exports` matches, `.d.cts` ships alongside `.cjs` for tailwind preset (Track G D6 erratum compliant) |
| `editor-commands` | `commandSchemas` (7), `parseCommand`, `slugSchema`, `editBlockInputSchema`, `editBlockHasChange`, `Command`, `CommandType`, `ParseCommandResult` | OK — 7 commands × `.strict()` confirmed; `editBlockInputSchema` consumes shared predicate |
| `kernel-adapter` | `KernelAdapter`, `KernelSession`, `KernelEvent` (6 variants), `KernelCapabilities`, `KernelError` (1 abstract + 4 concrete = 5) | OK — `KernelEvent` discriminated union has exactly 6 variants (`stdout` / `stderr` / `display_data` / `execute_result` / `error` / `status`) |
| `kernel-registry` | `KernelRegistry` class | OK |
| `mdx-bridge` | `mdxToTiptap`, `tiptapToMdx`, `TiptapDoc`/`Node`/`Mark`; 5 fail-loud throw sites; 9 prose fixtures × 2 invariants | OK — exactly 5 throw sites verified (parse.ts × 2; serialize.ts × 3), exactly 9 fixtures in `__tests__/fixtures/` |
| `apps/site` | Routes `/` + `/notes/<slug>`; FOUC literal sync `'skb-theme'`; ThemeToggle island; tailwind preset import | OK — BaseLayout.astro:42 reads `'skb-theme'` literally; STORAGE_KEY in design-tokens line 11 has same literal |
| `apps/api/app` | 4 endpoints (POST /v1/auth/login, GET/PUT /v1/pages/{slug}, WS /v1/ws/) | OK — all 4 routes registered (auth.py:32, pages.py:42 / 54, ws/protocol.py:19) |
| `apps/api/app/llm` | `LLMProvider` ABC, `ChatMessage` Protocol | OK |
| `apps/api/app/ws` | `WS /v1/ws/` ping/pong + echo | OK |

### Cross-package canary results

- **`frontmatterSchema`**: defined in `packages/content-types/src/frontmatter.ts`. Consumers: `apps/site/src/content.config.ts` (uses raw schema in `defineCollection`), `packages/editor-commands/src/commands.ts` (uses `.strict()` for `create_page.frontmatter` and `.strict().partial()` for `update_frontmatter.patch`). Both consumer call shapes are documented in editor-commands CONTRACT (R3 erratum). No drift.
- **`editBlockInputSchema`**: defined in `packages/editor-commands/src/commands.ts`. Consumer: `packages/agent-tools/src/tools.ts:52` uses it directly as `edit_block.input` (NOT `commandSchemas.edit_block.omit({type:true})`). Matches Track F R1 erratum baked into both CONTRACTs. No drift.
- **`getInitialTheme`**: defined in `packages/design-tokens/src/use-theme.ts:13`. Consumers: `apps/site/src/__tests__/fouc-script.test.ts` (compared against IIFE in BaseLayout for byte-equivalence), `packages/design-tokens/src/__tests__/use-theme.test.tsx` (unit tests). The inline IIFE in `apps/site/src/layouts/BaseLayout.astro` is documented to be byte-equivalent (algorithm + try/catch scope + literal). The 20-test corpus enforces. No drift.
- **`STORAGE_KEY` literal sync**: design-tokens defines `'skb-theme'` (use-theme.ts:11); BaseLayout.astro:42 hardcodes `'skb-theme'`; both CONTRACTs document the literal-sync constraint. No drift.

### Drift findings

**No CONTRACT.md drift detected.** Every claimed export resolves to actual source.
Counts (5 throw sites, 9 fixtures, 7 commands, 11 tools, 6 KernelEvent variants,
4 KernelError concrete subclasses) match documented numbers verbatim. Wave 1 R-round
errata (Track F R5 sister-file, Track C R3 throw-count, Track G R5 type alias / D6
.d.cts) appear to have been fully absorbed into CONTRACTs.

## §4. Orphan package scan

Methodology: `grep -rn "from '@skb/<pkg>'"` over `apps/` + `packages/` excluding
`node_modules` / `dist`. Anything with zero importers is orphan.

| Package | Direct importers | Orphan? | Notes |
|---|---|:---:|---|
| `agent-tools` | (none) | yes (expected) | Wave 2 will be consumed by `apps/api/agent_bridge.py` (Phase 2b) and editor-shell. CONTRACT documents Phase 1 vs 2b split. |
| `block-foundation` | (none) | yes (expected) | Wave 2 will be consumed by every `block-*/ui-default/` and by editor-shell registry boot. |
| `content-types` | `apps/site/src/content.config.ts`, `packages/editor-commands/src/commands.ts` | no | |
| `design-tokens` | `apps/site/src/__tests__/fouc-script.test.ts`, `apps/site/src/components/ThemeToggle.astro`, `apps/site/tailwind.config.ts` | no | |
| `editor-commands` | `packages/agent-tools/src/tools.ts` | no | |
| `kernel-adapter` | `packages/kernel-registry/{src/registry.ts, src/__tests__/registry.test.ts}` | no | |
| `kernel-registry` | (none) | yes (expected) | Wave 2 will be consumed by editor-shell (kernel boot path) once Pyodide adapter lands. |
| `mdx-bridge` | (none) | yes (expected) | Wave 2 will be consumed by editor-shell (load → Tiptap → save) and by `apps/api` server-side serialize check (Phase 2b). |

**4 expected orphans** (`agent-tools`, `block-foundation`, `kernel-registry`, `mdx-bridge`)
— all have explicit Wave 2+ consumer paths declared in their CONTRACTs and in the spec.
**0 unexpected orphans.**

## §5. tsconfig references graph

Methodology: each package `tsconfig.json#references` should list every workspace
dep that the package imports from. Root `tsconfig.json` aggregates all composite
packages.

```
                        ┌──────────────────────────────────────┐
                        │ root tsconfig.json (composite=false) │
                        └──────────────────────────────────────┘
                                          │ references
        ┌──────────┬──────────┬──────────┼──────────┬──────────┬──────────┬──────────┐
        ▼          ▼          ▼          ▼          ▼          ▼          ▼          ▼
   content-    block-     editor-    agent-      design-    kernel-    kernel-    mdx-
   types       founda-    commands   tools       tokens     adapter    registry   bridge
   (leaf)      tion                                         (leaf)
                  │            │           │                                │           │
                  └─►content-  └─►content- └─►editor-                       └─►kernel-  │ (no refs)
                    types         types      commands                         adapter   │
                                                                                        │
   apps/site (extends astro/strict; not composite — no refs into root)
   apps/api  (Python — outside TypeScript graph)
```

Per-package check:

| Package | tsconfig refs | Imports (`@skb/*`) | Aligned? |
|---|---|---|:---:|
| `agent-tools` | `editor-commands` | `editor-commands` | yes |
| `block-foundation` | `content-types` | (none — see §6) | over-declared (CONTRACT-documented forward use; will be consumed when block-foundation grows MDX serializer hook) |
| `content-types` | (none) | (none) | yes (leaf) |
| `design-tokens` | (none) | (none) | yes (leaf) |
| `editor-commands` | `content-types` | `content-types` | yes |
| `kernel-adapter` | (none) | (none) | yes (leaf) |
| `kernel-registry` | `kernel-adapter` | `kernel-adapter` | yes |
| `mdx-bridge` | (none) | (none — declared peers per CONTRACT §"Wave 1 declared peers") | finding F1 — see below |
| `apps/site` | (none, non-composite) | `content-types`, `design-tokens` | n/a (Astro tsconfig flow) |
| `apps/api` | n/a (Python) | n/a | n/a |

**Finding F1 — mdx-bridge tsconfig.json declares zero references but package.json
declares two `@skb/*` workspace deps**: `@skb/block-foundation` and `@skb/content-types`.
The dependency declaration is intentional (CONTRACT.md §"Wave 1 declared peers
(forward-compat)" explicitly explains: *"will be wired in once Wave 2 starts emitting
mdxJsxFlowElement for component blocks"*). However this asymmetry — package.json
deps without matching tsconfig refs — is structurally inconsistent and creates a
tracking burden. Two options Wave 2 can choose between:

- **Option A** (clean now): remove the two `@skb/*` deps from `mdx-bridge/package.json`
  until Wave 2 actually imports them; add back when first import lands.
- **Option B** (forward-compat preserved): keep package.json deps as-is, add matching
  `tsconfig.json#references` entries now (cost: ~2 lines), and document the asymmetry
  resolution in mdx-bridge CONTRACT.

Recommendation: **Option A**, because it makes `package.json` deps a strict superset of
actual imports — easier to invariant-check in future audits ("every workspace dep
must have a corresponding import"). See §7.

**Phase 0 deferred follow-up #5** ("tsconfig references continued expansion"):
progress complete for Wave 1 worker layer. Every TS package that imports `@skb/*`
has a matching `references` entry. Only mdx-bridge has the F1 asymmetry above
(declared but not imported). Root `tsconfig.json` aggregates all 8 packages.

## §6. Workspace dep graph integrity

Methodology: cross-check each `package.json#dependencies`/`peerDependencies` against
actual import statements in source. Dead deps are `@skb/*` deps that never appear
as `from '@skb/<pkg>'`. Missing deps are `from '@skb/<pkg>'` imports without a matching
`package.json` declaration.

### Per-package result

| Package | package.json `@skb/*` deps | Actual `@skb/*` imports | Verdict |
|---|---|---|:---:|
| `agent-tools` | `editor-commands` | `editor-commands` (tools.ts) | clean |
| `block-foundation` | `content-types` | (none in src/) | F2 — content-types declared but currently unused; planned Wave 2 use (block-foundation will validate block props via content-types schemas) |
| `content-types` | — | — | clean |
| `design-tokens` | — | — | clean |
| `editor-commands` | `content-types` | `content-types` (commands.ts:2) | clean |
| `kernel-adapter` | — | — | clean |
| `kernel-registry` | `kernel-adapter` | `kernel-adapter` (registry.ts:1, registry.test.ts:2) | clean |
| `mdx-bridge` | `block-foundation`, `content-types` | (none in src/) | F1 — both declared but unused (CONTRACT-documented Wave 1 declared peers) |
| `apps/site` | `content-types`, `design-tokens` | both used (content.config.ts, ThemeToggle.astro, tailwind.config.ts, fouc-script.test.ts) | clean |

### Findings

- **F1 (mdx-bridge dead deps)**: same as §5; CONTRACT-documented but worth re-flagging.
- **F2 (block-foundation → content-types)**: `block-foundation/package.json` declares
  `@skb/content-types` dep; `block-foundation/tsconfig.json` declares matching ref;
  source contains no `from '@skb/content-types'`. Status is asymmetric to mdx-bridge's
  F1: the tsconfig ref agrees with the package.json dep, only source usage is missing.
  This is consistent with the planned Wave 2 use case — `block-foundation` will
  validate registered block props against `content-types` schemas. CONTRACT does
  not currently document this forward-compat. Consider adding parity language to
  block-foundation/CONTRACT.md or removing the dep until needed.

### Wave 1 history note

Track F R1 review (code-reviewer) caught a now-fixed dead dep in early agent-tools
package.json. The remaining F1 / F2 are the only known dead-dep conditions, both
forward-compat in nature and surfaced by intent rather than oversight. No
unintended dead deps detected.

## §7. Recommendations

Wave 1 close baseline is **clean**: zero god-file violations, zero contract drift,
zero unexpected orphan packages, zero unintended dead deps. The four expected
orphans (agent-tools, block-foundation, kernel-registry, mdx-bridge) all have
documented Wave 2 consumers. The two forward-compat dead-dep conditions (F1
mdx-bridge, F2 block-foundation → content-types) are intentional but worth
normalizing.

### Top 3 structural concerns for Wave 2 plan-draft

1. **Resolve the forward-compat dead-dep policy (F1 + F2).** Pick one of:
   - tighten the rule: "every `package.json#dependencies/@skb/*` must have a
     corresponding source import; declare deps only at first import site."
     (Removes F1 and F2; cleaner audit invariant; CONTRACT can still announce
     intent in prose.)
   - relax the rule: "package.json may forward-declare; tsconfig refs MUST
     match package.json; CONTRACT MUST explain." (Forces parity between
     package.json and tsconfig refs.)

   Wave 2 plan-draft should pick one and lock in via ADR (Wave 2 entry ADR
   candidate). `structure-auditor` will use whichever rule is locked.

2. **block-foundation MDX renderer interface freeze before Wave 2 block-* PRs.**
   Wave 2 brings the first `block-callout` package (per agent-contract
   `simple-block-eng`). That package will be the first real consumer of
   `block-foundation` and will probe the dual-layer API (registerCore /
   registerUI) for the first time. Any API gap surfaces as block-callout
   review churn. Recommendation: a one-paragraph `block-foundation/RFC.md`
   walkthrough of "how block-callout will register" should be added to
   block-foundation CONTRACT before block-callout PR opens.

3. **`apps/api` outside TypeScript composite graph.** `apps/api` is Python and has
   its own `pyproject.toml`; it shares CONVENTIONS / CONTRACT discipline with TS
   packages but cannot use tsc project references for graph integrity. Wave 2
   will introduce `agent_bridge.py` which will dispatch to `agent-tools` schema
   shapes — those schemas live in TS. Recommendation: maintain a simple
   "TS schema → Python type mirror" enforcement (likely `pydantic` mirrors of
   the 11 toolSchemas) and add a structure-audit check in 2026-05 to verify
   shape parity.

### Wave 2 plan-draft prerequisites (advisory)

- Wave 2 entry ADR resolves dead-dep policy (concern #1 above).
- block-foundation CONTRACT extended with "how to consume from a block-* package"
  walkthrough before any block-* PR opens.
- mdx-doctor agent (per agent-contract) wired into PR check before any block-*
  PR can merge — the 9-fixture × 2-invariant baseline holds today, but Wave 2
  blocks must add fixtures, and the gate must enforce.

### Audit cadence

Next scheduled audit: 2026-05 (monthly, file `structure-2026-05.md`). Manual /
event triggers: ADR-0006 asymmetry-check failures, contract-touching PR clusters,
package add/remove, Wave close. Filename convention: `structure-YYYY-MM.md` for
regular monthly runs; `structure-YYYY-MM-DD-<context>.md` for event-driven runs
(this file is the latter, tied to Wave 1 close).

## Related

- [agent-contract.md](../../agent-contract.md) — `structure-auditor` Tier 3 trigger spec
- [Spec §3.1 / §3.6](../superpowers/specs/2026-04-29-self-knowledge-base-design.md) — agent role + file-size rules
- [ADR-0002 Wave 1 close](../decisions/ADR-0002-wave-1-close.md)
- [ADR-0003 headless / presentational split](../decisions/ADR-0003-headless-presentational-split.md)
- [ADR-0006 asymmetry-audit checklist](../decisions/ADR-0006-asymmetry-audit-checklist.md)
- [Phase 1 Wave 1 plan](../superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md) — Task Z step 2
