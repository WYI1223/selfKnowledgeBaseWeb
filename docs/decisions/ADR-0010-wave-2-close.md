# ADR-0010: Wave 2 close — Wave 2 errata + cross-package invariants + WE-* process learnings

| 字段 | 值                                                                                                                              |
| ---- | ------------------------------------------------------------------------------------------------------------------------------- |
| 状态 | accepted                                                                                                                        |
| 日期 | 2026-05-01                                                                                                                      |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx)                                                                                           |
| 触发 | Wave 2 worker layer closed at HEAD `51789a1` (Track E3 — final main track); ceremonial close per `docs/plans/active.md` Z phase |
| 替代 | 不替代任何 ADR；扩展 [ADR-0002](ADR-0002-wave-1-close.md) errata 模式 + [ADR-0006](ADR-0006-asymmetry-audit-checklist.md) WE-* 经验 + [ADR-0008](ADR-0008-wave-2-entry-policies.md) D1 dead-dep policy 实战检验 |

## Context

Wave 2 (Phase 1 Wave 2, 2026-04-30 → 2026-05-01) shipped 17 main implementation tracks plus Wave 1 erratum cleanup, scaffolding scripts, and Pre-Task 0 (ADR-0007 implementation). Total 33 commits since Wave 1 close (`7828f6d`) and HEAD `51789a1`.

This wave is structurally larger than Wave 1: it added 9 new packages (8 component-block packages + kernel-pyodide) + 3 editor sub-modules + 3 scaffolding CLIs + Playwright visual smoke test + first ADR-authorized BlockKind union expansion.

The ceremony closing Wave 2 must:

1. Capture process learnings (WE-001 through WE-011) accumulated during Wave 2 multi-worker concurrency
2. Collect errata + deferred follow-ups discovered during execution that don't yet warrant their own ADR
3. Roster the 33 Wave 2 commits and record review-chain outcomes
4. Snapshot the cross-package single-authority invariants added in Wave 2
5. Hand off to Wave 3 with `docs/plans/active.md` repointed
6. Tear down team `phase-1-wave-2` (49 spawned teammates)

This ADR is the close ceremony's permanent record.

## Decision

Wave 2 closes with the following ratifications:

### D1 — Wave 2 process learnings (WE-001 ~ WE-011)

Wave 2's multi-worker concurrency surface (up to 4 workers + git-operators in flight simultaneously) produced 11 distinct empirical lessons labeled WE-001 through WE-011. Each lesson is either codified in an existing memory entry, a Wave 1-era memory entry retrospectively re-labeled, or warrants a new memory entry recorded in this ADR's implementation step.

| Label | Lesson | Codification |
|---|---|---|
| **WE-001** | Multi-worker concurrent staging race — git-operator MUST use 4-step explicit-file-list staging protocol (`git reset HEAD` → `git add <explicit list>` → `git diff --cached --stat` verify → `git commit`); never `git add -A/.`; restore lockfile from clean historical blob if contaminated | `feedback_git_operator_explicit_stage.md` |
| **WE-002** | Lockfile-as-derivative — `pnpm-lock.yaml` is a generated-from-authority artifact (authority = `package.json`); deps add/remove must `pnpm install` + explicit `git add pnpm-lock.yaml` in same bundle | ADR-0006 D8 sub-form C (already codified) |
| **WE-003** | Verification fresh-state — clear `.turbo` + `.astro` + `apps/*/.turbo` + `packages/*/.turbo` and run `pnpm check --force` before declaring `ready-for-review`; gitignored generated `.d.ts` files mask CI failures otherwise | `feedback_verification_fresh_state.md` |
| **WE-004** | gh CI verification — never trust `gh run watch --exit-status` alone (use `gh run view --json conclusion`); pre-push must run uncached `pnpm typecheck` because turbo cache + vitest miss tsc errors | `feedback_git_operator_ci_verification.md` |
| **WE-005** | WSL2 chromium launch limitation — Playwright visual smoke tests fail to launch chromium on WSL2 due to missing system libraries; manage via Playwright's `serve` workflow + skipping local launch in CI when WSL2 detected | **NEW memory entry** `feedback_wsl2_chromium_launch.md` (added by this ADR) |
| **WE-006** | Reserved (no salient instance during Wave 2; placeholder maintained for future codification) | n/a |
| **WE-007** | Codex spark PASS != lint clean — codex 5.3-spark code review does NOT run `pnpm lint`; orchestrator must run lint independently after spark PASS before declaring ready-for-commit | **NEW memory entry** `feedback_codex_spark_lint_gap.md` (added by this ADR) |
| **WE-008** | Reserved (no salient instance during Wave 2; placeholder maintained for future codification) | n/a |
| **WE-009** | Multi-worker lint contamination via move-aside — when worker A's lockfile isolation reverts a dependency that worker B's untracked code consumes, repo-global `pnpm lint` fails for B's reasons during A's commit; mitigation = move-aside `mv ... /tmp/<task>-<file>.hold` then restore | `feedback_multi_worker_lint_contamination.md` |
| **WE-009 (worker-side)** | Empty tree = move-aside, not destruction — if mid-iteration files vanish, default to "concurrent worker's WE-009 move-aside in progress"; STOP and ask orchestrator before rewriting from scratch | `feedback_we009_worker_perspective.md` |
| **WE-010** | Read authority types at HEAD before overruling — when overruling a codex contract/union/schema cite, open the live defining file at HEAD; don't trust quotes inside earlier review reports | `feedback_pr_reviewer_authority_at_head.md` |
| **WE-011** | Active-writer breaks WE-009 move-aside — WE-009 assumes siblings are quiescent; mid-write workers cause snapshot churn (E1 rewriting block-jupyter every 60-90s while git-operator-c3 attempted commit). Resolution: only dispatch git-operator with isolation when sibling reports `ready-for-review`; or use `git worktree add` for fully-isolated commit path | `feedback_active_writer_break_we009.md` |

**Key compound observation**: WE-001 (concurrent staging race) + WE-009 (lockfile contamination) + WE-011 (active-writer churn) compose into a single concurrency-class hazard. Wave 3 should serialize git-operator commits when ≥2 workers are mid-write, OR adopt `git worktree`-based fully-isolated commit path as the default for any commit landing during a multi-worker phase.

### D2 — Wave 2 commit roster (final state)

33 commits since Wave 1 close (`7828f6d`); HEAD = `51789a1`.

#### Pre-Task 0 (ADR-0007 implementation, 5 commits)

| Subject | Commit | Review chain |
|---|---|---|
| design-tokens Tailwind plugin (Wave 1 erratum) | `fdc86a8` | code-reviewer + pr-gate (high-risk: contract change) |
| ADR-0007 job-function specialization | `bb4e1cb` | code-reviewer + pr-gate + pr-reviewer (D2 row 4: new ADR) |
| pnpm-lock.yaml drift fix | `e15ec36` | code-reviewer (lockfile staging fix) |
| ADR-0007 implementation — agent-contract restructure | `691bc30` | code-reviewer + pr-gate + pr-reviewer (D2 row 1: contract change) |
| follow-up spec §3.1+§3.2 sync + ADR-0006 sub-form C | `07c5be4` | code-reviewer + pr-gate (spec sync) |
| follow-up² spec §3.2 ADR-0007 D2 canonical alignment | `932a919` | code-reviewer (final canonical pass) |

#### Wave 2 plan lock (1 commit)

| Subject | Commit | Review chain |
|---|---|---|
| Wave 2 plan locked + 3 plan-challenger rounds + active.md repoint | `f533609` | plan-challenger × 3 rounds (Codex tool) |

#### Wave 1 erratum cleanup + scaffolding (5 commits)

| Subject | Commit | Review chain |
|---|---|---|
| sample-mdx-note duplicate H1 cleanup | `18b9c6a` | code-reviewer (small content fix) |
| ADR-0008 dead-dep policy + apply (mdx-bridge / block-foundation) | `b3581bc` | code-reviewer + pr-gate + pr-reviewer (D2 row 4: new ADR) |
| refactor-move CLI | `2ad9ece` | code-reviewer (codex-script-builder output) |
| refactor-move TS2379 forward fix | `168baf5` | code-reviewer hot-fix |
| B3 deferred items cleanup | `f812b93` | code-reviewer |

#### Tooling + scripts (3 commits)

| Subject | Commit | Review chain |
|---|---|---|
| block-foundation/RFC.md interface freeze (A2) | `6ae05c0` | code-reviewer + pr-gate (block-foundation interface freeze) |
| apps/site Playwright visual smoke (B2) | `b614b72` | code-reviewer + pr-gate (CI/test workflow change) |
| visual-smoke webServer reliability fix | `3988648` | code-reviewer hot-fix |
| visual-smoke tsconfig fix | `66979ea` | code-reviewer hot-fix |
| new-block CLI (I2) | `7953b77` | code-reviewer (codex-script-builder output) |
| extract-pdf-text CLI for D2 prereq (I3) | `1dde228` | code-reviewer (codex-script-builder output) |

#### Wave 2 main tracks (17 main + 4 forward-fixes = 21 commits)

| Track | Subject | Commit | Owner | Review chain |
|---|---|---|---|---|
| F | kernel-pyodide PyodideAdapter | `156e00d` | kernel-pyodide-eng | code-reviewer + pr-gate + pr-reviewer (kernel layer + heavy runtime) |
| C1 | block-callout core template | `7496404` | simple-block-eng | code-reviewer + pr-gate + pr-reviewer (first BlockRegistry consumer) |
| C2 | block-callout ui-default first template | `6125a36` | ux-ui-lead | code-reviewer + pr-gate + pr-reviewer (first ui-default template; design system entry) |
| D1 | block-math KaTeX render block + ADR-0009 BlockKind 4-way | `a30aaad` | render-block-eng | code-reviewer + pr-gate × 3 rounds + pr-reviewer (BlockKind union extension; D2 row 1+4) |
| D1-fix | ADR-0009 + Math.astro export forward fix | `139d2af` | render-block-eng | code-reviewer hot-fix |
| D1-fix² | ADR-0009 lychee :line-anchor strip | `f4efc66` | git-operator | direct (link-check repair) |
| G1 | editor-toolbar first sub-module template | `138cc16` | editor-eng | code-reviewer + pr-gate + pr-reviewer (first editor sub-module) |
| C3 | block-code core (codex-clone of C1) | `3fff1eb` | codex-block-generator (tool) | code-reviewer (clone validation) |
| C4 | block-image core (codex-clone of C1) | `d041d47` | codex-block-generator (tool) | code-reviewer (clone validation) |
| D2 | block-pdf iframe-based render block | `678d49f` | render-block-eng | code-reviewer + pr-gate + pr-reviewer (cross-doc react-pdf→iframe pivot) |
| E1 | block-jupyter (first kind='viz' + first kernel-pyodide consumer) | `a09273c` | viz-block-eng | code-reviewer + pr-gate + pr-reviewer (first viz block + kernel consumer) |
| C5a+C5b | block-code/ui-default + block-image/ui-default (codex-clones of C2) | `2601e3a` | codex-block-generator (tool) | code-reviewer + ux-ui-lead visual review |
| G2+G3 | editor-slash-menu + editor-drag-handle (codex-clones of G1) | `80c5ff8` | codex-block-generator (tool) | code-reviewer (clone validation) |
| E2 | block-nn-viz TensorFlow.js viz block | `c71b8c5` | viz-block-eng | code-reviewer + pr-gate + pr-reviewer (heavy runtime) |
| E3 | block-agent-flow React Flow viz block | `51789a1` | viz-block-eng | code-reviewer + pr-gate + pr-reviewer (final main track) |

**Aggregate**: 33 commits; 17 main tracks; 4 forward-fix commits (D1×2, B2×2, I1×1); 1 lockfile drift fix; 4 review-chain outcomes triggering full +pr-gate +pr-reviewer (per ADR-0007 D2 selective rule).

### D3 — Erratum collection (forward-applicable to Wave 3+)

The following errata accumulated during Wave 2 implementation. None warrants its own ADR; all are recorded for Wave 3+ reference:

#### Spec drift

1. **spec §196 BlockKind binary wording** — spec still documents `('prose'|'component')` while ADR-0009 expanded to 4-way `('prose'|'component'|'render'|'viz')`. Wave 3 should sync spec §196 in a follow-up commit (per ADR-0009 D3 衡量标准 line 95).

2. **block-foundation 4-way classification physical-vs-formal lag** — Wave 2 plan §66-71 documented the 4 block clusters (component / render / viz) physically before ADR-0009 formalized the union expansion. ADR-0009 D3 process improvement: structural union extensions should land as standalone ADR PRs first, then consuming-block PRs; this convention applies starting Wave 3.

3. **Wave 2 plan §1113 "至少 5 prose RTT fixtures" carried forward unchanged** — mdx-bridge fixture count remains 9 from Wave 1; Wave 2 did not add new fixtures (no new attr-bearing mark introduced — see D7).

#### Process / tooling

4. **WSL2 chromium launch limit (WE-005)** — Playwright visual smoke at `apps/site/playwright.config.ts` cannot launch chromium on WSL2 dev environments. Two forward-fix commits (`66979ea` + `3988648`) addressed config + tsconfig but the runtime gap remains; Wave 3 should add a WSL2-detection skip + CI-only execution mode.

5. **Codex spark PASS != lint clean (WE-007)** — codex 5.3-spark code review does NOT run `pnpm lint` and a PASS verdict from spark does not certify lint cleanliness. Orchestrator must run `pnpm lint` independently after spark PASS before authorizing git-operator commit. This is operational-protocol level; not a tooling defect, but a reviewer-scope clarification.

6. **gh wrapper exit unreliability (WE-004)** — `gh run watch --exit-status` returns success states that do not reflect actual run conclusion in some cases; `gh run view --json conclusion` is the authoritative check. Already memorized; flagged here for Wave 3 git-operator prompt enforcement.

#### Cross-package contracts (Wave 2 single-authority additions — see D4)

7. **ADR-0008 D1 dead-dep policy mechanically enforced from 2026-05** — structure-auditor 月度 audit (per `docs/audits/structure-2026-05.md`) adds the mechanical scan: `packages/*/package.json#dependencies/@skb/*` ↔ `from '@skb/<pkg>'` source import one-to-one. Wave 1 F1+F2 already resolved by commit `b3581bc`.

7a. **F3 — first ADR-0008 D1 mechanical violation (CSS-variable consumption edge case)** — `packages/block-code/package.json` and `packages/block-image/package.json` declare `@skb/design-tokens` workspace dep, but their `src/**/*.{ts,tsx}` contain zero `from '@skb/design-tokens'` import. The packages consume design tokens via Tailwind preset (CSS-variable layer), not via TS import. This is the **first surfaced edge case** to ADR-0008 D1: the policy treats `@skb/*` deps as "must have TS import"; CSS-variable consumption is structurally a real consume-pattern but not visible to grep-based audit. **Resolution deferred to Wave 3 plan-draft**: choose between (a) add type-only `import type {} from '@skb/design-tokens'` stub, (b) migrate `block-code` + `block-image` to import the same `VARIANT_TOKENS`-style typed constants block-callout exposes (apply codex-block-generator clone-symmetry), or (c) amend ADR-0008 D1 to recognize CSS-variable consumption with a CONTRACT.md disclosure clause. Block-callout itself does NOT have F3 because it imports `VARIANT_TOKENS` typed constants from design-tokens.

8. **block-foundation/RFC.md is now the canonical block-* registration walkthrough** — Wave 2 `block-callout/core` (C1) was the first real consumer; subsequent 7 block-* packages all referenced the RFC. Wave 3 editor-shell integration is the next consumer surface.

#### Test infrastructure

9. **Wave 2 fixture growth** — `block-pdf` shipped with `extract-pdf-text` CLI (commit `1dde228`) + `block-jupyter` carries Pyodide adapter integration tests. Wave 3 mdx-bridge round-trip work should anticipate per-block fixture growth (parity with Wave 1 mdx-bridge 9 fixtures × 2 invariants). Each Wave 2 block has its own internal unit tests; mdx round-trip fixtures will be Wave 3.

10. **kernel-pyodide tests are heavy** — Pyodide runtime initialization adds ~3-5s per test; vitest already isolates via single-thread. Wave 3 viz-block tests should remain in their own packages (don't centralize in `apps/site`).

10a. **3 viz-block test corpora cross 300-line ESLint warn threshold** — `block-jupyter/src/__tests__/kernel-bridge.test.ts` (414 lines), `block-nn-viz/src/__tests__/tfjs-bridge.test.ts` (327 lines), `block-agent-flow/src/__tests__/flow-bridge.test.ts` (326 lines). All three are bridge-layer multi-runtime state-machine corpora; line count is appropriate for the per-runtime invariant complexity (matching the Wave 1 mdx-bridge serialize.ts 243-line pre-allowlist precedent). Wave 3 should add a CONTRACT.md pre-allowlist per package to suppress the soft warn (parity with `mdx-bridge/CONTRACT.md` pre-allowlist for `serialize.ts`).

#### Scaffolding tools (codex-script-builder outputs)

11. **3 codex-built CLIs (refactor-move / new-block / extract-pdf-text)** — all shipped via codex-script-builder tool (orchestrator-direct Bash invocation per ADR-0007 D5). Two had forward-fix iterations (refactor-move TS2379, extract-pdf-text strict-types) — codex-built scripts ALWAYS need an orchestrator lint+typecheck pass before commit (WE-007 lesson applied retroactively).

12. **block-callout chicken-and-egg bootstrap** — `scripts/new-block.ts` short-circuits when `block-callout/` is missing, so Wave 2 C1 (block-callout core) was hand-crafted by simple-block-eng rather than scaffolded. Subsequent C3 (block-code) + C4 (block-image) used new-block. This is by-design (template needs a non-self bootstrap source); Wave 3+ block-* packages can rely on new-block.

#### Open questions deferred to Wave 3+

13. **Wave 3 attr-bearing mark expansion gate (J task)** — sample-blocks/index.mdx (Z0, fixtures 13-21) introduces 8 block-level MDX components but **zero new attr-bearing inline marks beyond `link`**. mdx-bridge `marksEqual` + `wrapMark` + fail-loud throw-site already gate unknown marks. Wave 3 mdx-bridge integration is the natural moment to expand attr-bearing marks (e.g., `highlight`, `kbd`) IF any block requires inline-mark sub-syntax. **Decision**: defer J implementation; mdx-doctor scan over sample-blocks confirms no attr-bearing mark addition needed for Wave 2 close.

14. **editor-shell + apps/site BlockRegistry routing not yet wired** — sample-blocks page (Z0) authors content but `apps/site` cannot yet render the 8 PascalCase MDX components (Callout / Code / Image / Math / Pdf / Jupyter / NnViz / AgentFlow). Wave 3 main work: wire BlockRegistry → MDX component resolver in apps/site + editor-shell load/save round-trip via mdx-bridge. **Wave 2 close gating mechanism**: `content/notes/sample-blocks/index.mdx` carries `draft: true` so `apps/site/src/pages/notes/[...slug].astro` getStaticPaths filter excludes it from build (verified locally: build now produces only `/notes/sample-mdx-note/index.html`). Wave 3 first integration task flips `draft: false` after BlockRegistry → MDX component resolver wiring lands.

15. **agent_bridge.py TS schema → Pydantic mirror** (carry-forward from ADR-0002 erratum #22) — apps/api/agent_bridge.py still pending; Wave 3 will introduce Pydantic mirrors of the 11 toolSchemas + structure-audit shape-parity check.

16. **3 viz-block heavy-runtime bundle size impact** — block-jupyter (Pyodide ~10MB), block-nn-viz (TensorFlow.js ~3MB), block-agent-flow (React Flow ~500KB) represent significant client bundle weight. Wave 3 should benchmark + decide chunking strategy (lazy-load vs separate route bundles) before MVP deployment (Phase 1 Wave 4).

### D4 — Wave 2 cross-package single-authority invariants (additions)

Wave 1 established 3 cross-package single-authority invariants (frontmatterSchema / editBlockInputSchema / getInitialTheme). Wave 2 added the following:

1. **`packages/block-foundation/registry.ts BlockKind`** is the single authority for block classification. Consumers (8 block-* packages + future editor-shell registry boot) MUST `import { BlockKind } from '@skb/block-foundation'` and use one of the 4 union literals (`'prose'|'component'|'render'|'viz'`). ADR-0009 governs union extension. Documented in block-foundation/CONTRACT.md "Modifying this file" rule.

2. **`packages/block-foundation/RFC.md` is the canonical block-* registration walkthrough**. Every `block-*/core/` MUST reference RFC §1-§5 patterns; the 4 block-foundation invariants (Defensive copy / Schema strictness / Default UI lookup / Serialize-parse hook ownership) MUST hold across consumers. Verified during C1 (template) → C3/C4 (codex-clones) → D1/D2/E1/E2/E3 (hand-craft viz/render) compliance. Documented in block-foundation/CONTRACT.md.

3. **`packages/kernel-adapter/KernelAdapter` interface**'s first real implementation is `packages/kernel-pyodide/PyodideAdapter`. The KernelEvent discriminated union (6 variants) + KernelError taxonomy (1 abstract + 4 concrete) are stable and consumed by `block-jupyter`. Documented in kernel-adapter/CONTRACT.md (Wave 1) + kernel-pyodide/CONTRACT.md (Wave 2 implementation).

4. **`packages/content-types/calloutPropsSchema`** is the single authority for the Callout component's prop shape. Consumer `packages/block-callout/core/` MUST `import { calloutPropsSchema } from '@skb/content-types'` (no inline `z.object` redefinition). Wave 1 documented `calloutPropsSchema`; Wave 2 C1 was its first real consumer. Documented in both packages' CONTRACT.md.

5. **`packages/block-callout/ui-default` is the canonical ui-default template** — codex-block-generator clones for block-code/ui-default + block-image/ui-default (commit `2601e3a`) are byte-equivalent with field substitution. Wave 3 ui-default additions MUST preserve the same 4 invariants (defineUI shape, prose/non-prose div semantics, design-token CSS vars usage, no inline styles).

6. **`packages/editor-toolbar` is the canonical editor sub-module template** — codex-block-generator clones for editor-slash-menu + editor-drag-handle (commit `80c5ff8`) follow same shape. Wave 3 editor-* additions MUST preserve the editor-commands consumer pattern (no direct editor-shell coupling).

### D5 — Wave 2 structure baseline snapshot

Saved to `docs/audits/structure-2026-05.md` (created by structure-auditor at Wave 2 close — first regular monthly audit, contrasting Wave 1 close baseline `docs/audits/structure-2026-04-29-wave-1.md`).

The audit verifies:
- 17 packages × CONTRACT.md inventory (vs Wave 1's 8 packages)
- ADR-0008 D1 dead-dep mechanical scan (no violations)
- BlockKind 4-way usage parity across 8 block-* packages
- 0 god-files (300/500-line limits)
- tsconfig references graph integrity for 17 packages
- Top 3 Wave 3 prep concerns

Wave 2 close handoff to Wave 3 is conditional on the audit reporting structurally clean.

### D6 — Active plan repointed to Wave 3

`docs/plans/active.md` Wave pointer moves from "Wave 2 plan locked / Pre-Task 0 启动" to "Wave 2 closed by ADR-0010 / Wave 3 — pending plan draft". Wave 3 plan to be drafted by orchestrator + plan-challenger before Wave 3 spawn.

### D7 — Wave 2 deferred (carry-forward to Wave 3 plan)

The following are explicitly deferred from Wave 2 to Wave 3 (not gaps; intentional scope cuts):

1. **J — attr-bearing mark expansion** — sample-blocks/index.mdx introduces zero new attr-bearing inline marks; defer to Wave 3 mdx-bridge integration. Re-evaluate at Wave 3 plan-draft.
2. **mdx-bridge real round-trip for 8 component-block kinds** — sample-blocks authors content; apps/site cannot yet render. Wave 3 main work.
3. **editor-shell integration** — Wave 2 shipped editor-toolbar + slash-menu + drag-handle as standalone packages; editor-shell composition is Wave 3.
4. **apps/site BlockRegistry routing** — Wave 2 shipped each block's core+ui-default; apps/site MDX component map (PascalCase → React component) is Wave 3.
5. **Search index** — Phase 1 Wave 3 scope per spec §4.2; not Wave 2 deferred but flagged here for plan continuity.
6. **agent_bridge.py TS↔Python schema mirror** — carry-forward from ADR-0002 erratum #22; structure-audit check tracks parity from 2026-05.

### D8 — Team shutdown ceremony

Per `docs/runbooks/team-operations.md` shutdown protocol, all 48 active teammates (49 total minus team-lead self) receive `shutdown_request` with reason "Wave 2 complete". After all approve, `TeamDelete phase-1-wave-2`. Wave 3 spawns a fresh team.

## Consequences

### Positive

- **Process learnings preserved at scale**: 11 distinct WE-* labels enumerate the multi-worker concurrency lessons; Wave 3 starts with these codified rather than re-discovering them. ADR-0007 codex-heavy execution proved out as expected (cheaper code-reviewer default + selective pr-gate + Claude pr-reviewer for D2 high-risk PRs only).
- **Cross-package authority discipline preserved**: 6 new single-authority invariants (BlockKind / RFC.md / KernelAdapter / calloutPropsSchema / ui-default template / editor sub-module template) all have CONTRACT.md documentation + verified consumer compliance.
- **Structural soundness**: 17 packages × all CONTRACT.md present; ADR-0008 D1 dead-dep policy mechanically enforced from 2026-05; ADR-0009 first ADR-authorized BlockKind extension landed cleanly (with one R3 procedural fix that motivated D3 process improvement).
- **Codex-tool execution validated**: 3 scaffolding CLIs (refactor-move / new-block / extract-pdf-text) + 3 block-clones (block-code/core, block-image/core, block-code+image/ui-default) + 2 editor-clones all shipped via codex-block-generator + codex-script-builder. The orchestrator-direct Bash invocation pattern (per ADR-0007 D5) is validated; Codex spark + selective Codex 5.5 pr-gate + Claude pr-reviewer is the steady-state review chain.
- **Wave 1 erratum tail closed**: design-tokens Tailwind plugin (commit `fdc86a8`), sample-mdx duplicate H1 (`18b9c6a`), Wave 1 F1+F2 dead deps (`b3581bc`) all resolved early in Wave 2.

### Costs

- **Multi-worker concurrency cost was high**: WE-001 / WE-009 / WE-011 each triggered git-operator-side complexity (move-aside, lockfile blob restore, defer-until-quiescent). Wave 3 should consider serializing git-operator commits OR adopting `git worktree`-based fully-isolated commit path as default to amortize the WE-001 / WE-009 / WE-011 protocol cost.
- **Forward-fix rate**: 4 forward-fix commits out of 17 main tracks (D1×2, B2×2) = ~24% rate. Higher than Wave 1's 1 forward-fix on 7 tracks (~14%). The increase is concentrated in: D1 (BlockKind ADR procedural omission + lychee :line-anchor) and B2 (visual-smoke test fragility). Wave 3 should front-load ADR review for any union/contract extension before consuming-block PR opens.
- **49 teammates spawned**: heavy team graph; reflects multiple R-rounds (per-track) and per-task git-operator spawns. Wave 3 plan should consider git-operator pooling (single git-operator instance reused across tracks) to reduce team-graph bloat.
- **CONTRACT.md heaviness**: every block package added 1 CONTRACT.md (~100-200 lines each); aggregate CONTRACT.md count grew from 12 (Wave 1) to ~21 (Wave 2). Acceptable trade-off, but Wave 3 should watch for growth + consider extracting shared invariants (e.g., the 4 block-foundation invariants) to a single canonical reference + cross-link.

### Risks (mitigated)

- **Risk**: Wave 3 workers may not read the WE-* memory entries and re-encounter concurrency hazards. **Mitigation**: each Wave 3 spawn prompt prefix-injects a WE-001/009/011 reference + Wave 3 git-operator runbook pre-flight section.
- **Risk**: BlockKind 4-way is the first ADR-authorized extension; Wave 3 may grow further (e.g., `'embed'` for external-iframe blocks, `'interactive'` for runnable cells beyond Jupyter). **Mitigation**: ADR-0009 D3 codified the process — structural extensions land as standalone ADR PRs first; D2 row 1+4 trigger full review chain.
- **Risk**: codex-tool clones (C3 / C4 / C5 / G2 / G3) drift from template if subsequent template edits don't propagate. **Mitigation**: D4 invariant #5+#6 codify template-as-authority; structure-auditor monthly scan can grep clone-vs-template byte-equivalence (forward concern; not Wave 2 deferred).
- **Risk**: J deferred to Wave 3 means mdx-bridge round-trip lacks block-component fixtures. **Mitigation**: D7 deferred #1+#2 explicitly track this; Wave 3 plan must include "8 block × 2 invariants × 1 fixture-per-block" round-trip suite as part of mdx-bridge integration scope.

## Implementation

This ADR is the close ceremony itself. Implementation steps run in this order:

1. ✅ Worker layer closed (Track E3 → `51789a1`)
2. ✅ ADR-0010 written (this file)
3. ⏳ Z0 — sample-blocks/index.mdx authored by editor-integrator-z0; bundle commit
4. ⏳ Z1 — ADR-0010 (this ADR) bundle commit
5. ⏳ Z2 — structure-auditor monthly audit `docs/audits/structure-2026-05.md` produced; bundle commit
6. ⏳ Z3 — `docs/plans/active.md` repointed to Wave 3; `docs/plans/phase-1/plan.md` Wave 2 row → ✅ closed; bundle commit
7. ⏳ Z3-bonus — `docs/decisions/README.md` index updated to add ADR-0009 + ADR-0010 entries (ADR-0009 was missing from index — Wave 2 erratum)
8. ⏳ J decision — recorded in D7 (this ADR) as deferred to Wave 3; no implementation in Wave 2 close
9. ⏳ NEW memory entries — `feedback_wsl2_chromium_launch.md` (WE-005) + `feedback_codex_spark_lint_gap.md` (WE-007) added to `~/.claude/projects/-home-weiyi-selfKnowledgeBaseWeb/memory/` + indexed in MEMORY.md
10. ⏳ Wave 2 close commit (orchestrator-direct via git-operator) — bundles Z0 + ADR-0010 + structure-2026-05.md + active.md + phase-1/plan.md + decisions/README.md (per ADR-0006 D8 explicit-file-list staging protocol)
11. ⏳ Team shutdown ceremony — `shutdown_request` to all 48 teammates → `TeamDelete phase-1-wave-2`

Review chain for the close-ceremony commit: per ADR-0007 D2 row 4 (new ADR), this triggers **+pr-gate +pr-reviewer** (not the cheap-default code-reviewer alone).

## Related

- [ADR-0001](ADR-0001-stack-selection.md) — technical baseline
- [ADR-0002](ADR-0002-wave-1-close.md) — Wave 1 close ceremony (template for this ADR)
- [ADR-0003](ADR-0003-headless-presentational-split.md) D-list — verified across 8 block packages × {core, ui-default}
- [ADR-0004](ADR-0004-agent-team-dispatch-model.md) — team dispatch model proven across 49 Wave 2 teammates
- [ADR-0005](ADR-0005-api-conventions.md) — API conventions (apps/api still Wave 1; agent_bridge.py = Wave 3)
- [ADR-0006](ADR-0006-asymmetry-audit-checklist.md) — 8-point asymmetry checklist applied across all Wave 2 review rounds
- [ADR-0007](ADR-0007-job-function-codex-heavy-execution.md) — selective review chain validated; codex-tool 8 patterns implemented
- [ADR-0008](ADR-0008-wave-2-entry-policies.md) — D1 dead-dep policy mechanically enforced from 2026-05
- [ADR-0009](ADR-0009-block-kind-union-expansion.md) — first ADR-authorized BlockKind extension
- [Phase 1 Wave 2 plan](../superpowers/plans/2026-04-30-phase-1-wave-2-implementation.md) — implementation plan (now complete)
- [docs/audits/structure-2026-05.md](../audits/structure-2026-05.md) — Wave 2 close baseline (created at this commit)
- [docs/audits/structure-2026-04-29-wave-1.md](../audits/structure-2026-04-29-wave-1.md) — Wave 1 close baseline (delta target)
- [docs/plans/active.md](../plans/active.md) — Wave pointer (repointed at this commit)
- [docs/runbooks/team-operations.md](../runbooks/team-operations.md) — operational reference
- [content/notes/sample-blocks/index.mdx](../../content/notes/sample-blocks/index.mdx) — Wave 2 close acceptance criterion (Z0)
