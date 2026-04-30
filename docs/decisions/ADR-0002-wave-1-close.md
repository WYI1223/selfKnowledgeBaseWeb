# ADR-0002: Wave 1 close — empirical lessons + errata roll-up

| 字段 | 值                                    |
| ---- | ------------------------------------- |
| 状态 | accepted                              |
| 日期 | 2026-04-30                            |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx) |
| 触发 | Wave 1 worker layer closed at HEAD `b5e7217` (Track A v3); ceremonial close per `docs/plans/active.md` step 7 |
| 替代 | 不替代任何 ADR；扩展 [ADR-0001](ADR-0001-stack-selection.md) errata + [ADR-0003](ADR-0003-headless-presentational-split.md) D-list |

## Context

Wave 1 (Phase 1 Wave 1, 2026-04-29 → 2026-04-30) shipped 7 high-risk PRs covering the foundational packages and the `apps/site` Astro skeleton. The ceremony closing Wave 1 must:

1. Capture empirical lessons that should bind Wave 2+ (recorded as ADR-0006 process rule and inline notes in CONTRACT.md / CONVENTIONS.md)
2. Collect errata + deferred follow-ups discovered during execution that don't yet warrant their own ADR but must not be forgotten
3. Snapshot the final state of Wave 1 (commit hashes, task closure, structural baseline)
4. Hand off to Wave 2 with `docs/plans/active.md` repointed

This ADR is the close ceremony's permanent record.

## Decision

Wave 1 closes with the following ratifications:

### D1 — Process rule codified as ADR-0006

The 8-point cross-location asymmetry-audit checklist becomes mandatory reviewer practice (see [ADR-0006](ADR-0006-asymmetry-audit-checklist.md)). Wave 1's empirical evidence (12 instances across 6 tracks + 5 close-ceremony fix iterations — 8 distinct failure-mode items + 4 close-ceremony reinforcements of items #6 and #8) is the data behind this rule.

### D2 — Wave 1 commit roster (final state)

| Track | Subject | Commit |
|---|---|---|
| Task 0 | Phase 0 deferred follow-ups (lychee config + concurrency + fail) | `6a791e6` |
| Task 12 | eslint ignore apps/api/.venv | `38c6a53` |
| Track G | design-tokens package (CSS vars + Tailwind preset + useTheme + ThemeToggle) | `093f77f` |
| Task 13 | eslint Astro virtual modules + tailwind config compat | `7e75eb5` |
| Track E | kernel-adapter interface + kernel-registry routing | `f93a861` |
| Track B | block-foundation Core+UI dual layer + content-types schemas | `ac78623` |
| Track D | apps/api FastAPI skeleton (auth + pages CRUD + ws stub + llm interface) | `d79b1ec` |
| Track F | editor-commands + agent-tools schemas | `b7596d6` |
| Track C | mdx-bridge bidirectional bridge + 9 prose RTT fixtures | `60cdd6c` |
| Track A | apps/site Astro skeleton + FOUC byte-equivalence regression gate | `b5e7217` |

10 commits since Wave 1 start.

### D3 — Erratum collection (forward-applicable to Wave 2+)

The following errata accumulated during Wave 1 review cycles. None warrants its own ADR; all are recorded for Wave 2+ reference:

#### Spec drift

1. **Spec §2.6 §472-474 "5-7 个 Custom Tools" wording** — implementation has 11 tools (4 read-only + 7 mutating, 1:1 with `commandSchemas`). Plan literal supersedes spec illustrative count. Wave 2+ spec edits should sync this language.

2. **mdx-bridge "5 prose RTT fixtures" wording** — Wave 1 plan §"Track C" line 1065 uses "至少 5"; implementation shipped 9 (4 extras forced by R1/R2 fix loops on adversarial inline-mark shapes). The "at least 5" phrasing is preserved; future block PRs should anticipate similar fixture growth during fix loops.

3. **mdx-bridge CONTRACT.md throw-site count claim** — Wave 1 close included a follow-up commit to add the missing 5th throw-site test (or amend the wording).

4. **mdx-bridge fixture 09 description** — "adjacent same-href links with distinct titles" wording vs actual " then "-separated content. Cleanup commit during Wave 1 close.

#### Process / tooling

5. **vitest strict mode now enforced**: root `vitest.config.ts:6 passWithNoTests: false` + removed `--passWithNoTests` from root `package.json:test`. Wave 2 packages MUST keep this discipline (no `--passWithNoTests` flag in any test script).

6. **CI test gate fixed (Task 11)**: `.github/workflows/ci.yml` now runs `pnpm lint:packages` / `pnpm typecheck:packages` / `pnpm test:packages` in addition to root variants. Pre-fix Wave 1 systemic bug: 88 package tests silently skipped on CI; only 18 root tests gated merge.

7. **Lychee config flag fix (Task 10)**: root `package.json:link-check` now passes `--config .lychee.toml`. Pre-fix the script ignored repository-level config (include_verbatim / exclude / max_concurrency / timeout / require_https) and used lychee defaults.

8. **Verification-fresh-state lesson** (memory: `feedback_verification_fresh_state.md`): clear `.turbo` + `.astro` + `apps/*/.turbo` + `packages/*/.turbo` and run `pnpm check --force` before declaring `ready-for-review`. Gitignored generated `.d.ts` files mask CI failures otherwise. Wave 1 caught 2 instances of cache-hit-induced false-PASS at git-operator pre-commit.

#### Cross-package contracts

9. **`packages/content-types/frontmatterSchema` is the single authority** for note frontmatter. Consumers (`apps/site`, future block-foundation block plugins) MUST `import { frontmatterSchema } from '@skb/content-types'` rather than redefine inline. Documented in `apps/site/CONTRACT.md` + `content-types/CONTRACT.md`.

10. **`packages/editor-commands/editBlockInputSchema` is the single authority** for the `edit_block` agent-tool input shape. Composed via `editBlockBase.omit({type: true}).refine(editBlockHasChange)`. Consumers (`@skb/agent-tools`) MUST import; cannot duplicate the `.refine()` predicate. Documented in both packages' CONTRACT.md.

11. **`packages/design-tokens/getInitialTheme()` is the single authority** for FOUC initial-theme algorithm. Consumer-side replicas (currently `apps/site/BaseLayout.astro` IIFE) MUST be byte-equivalent in BOTH happy-path AND exception scope; replica MUST register a regression test (template: `apps/site/src/__tests__/fouc-script.test.ts`). Documented in `design-tokens/CONTRACT.md` Inverse-direction obligation invariant.

#### API conventions

12. **`apps/api/CONVENTIONS.md` Erratum 12 + Pitfall + Pitfall (continued)** — register HTTPException handler against `starlette.exceptions.HTTPException` (not `fastapi.HTTPException`); forward `exc.headers` so 401 keeps `WWW-Authenticate: Bearer`; emit RFC 7235 / 7231 mandated headers from CUSTOM error handlers (not just framework-raised paths). Test EVERY 401 path (auth-failed / auth-token-invalid / auth-token-expired / auth-token-missing) emits `WWW-Authenticate`. Test EVERY 405 path emits `Allow:`.

13. **Pydantic v2 `alias_generator=to_camel + populate_by_name=True`** standard for all request/response shapes. JSON over the wire is camelCase; Python internals stay snake_case (PEP 8). Future schema additions MUST follow this pattern.

#### Test infrastructure

14. **Negative-control verification pattern** (Wave 1 reviewer practice — informal but recommended for Wave 2+): when a regression test claims to catch a bug class, the reviewer (or worker) temporarily reverts the fix and confirms the test fails on the precise expected row. Track A v2 R3 + Track A v3 R3 demonstrated; both reviewers + worker independently verified. Worth elevating to expected practice for high-risk PRs.

#### Open questions deferred to Wave 2+

15. **STORAGE_KEY duplication** ('skb-theme' literal in BaseLayout.astro IIFE vs `STORAGE_KEY` const in design-tokens). Acceptable Wave 1 KISS; Phase 3 open-source could explore Astro plugin pattern for compile-time constant injection. Not gating Wave 2.

16. **Wave 2 attr-bearing mark expansion** — first attr-bearing mark beyond `link` (e.g. `highlight: {color}`, `kbd: {style}`) MUST simultaneously update `wrapMark` + `marksEqual` + add fixture. Default `return true` in `marksEqual` is silent-drop trap. Documented in mdx-bridge CONTRACT.md as Wave 2 prep.

17. **Wave 2 component block ui-default packages** per ADR-0003 D-list. ADR-0003 D7 (npm publishing) deferred to Phase 3; Wave 2 ships `core` + `ui-default` together but neither is npm-published.

18. **Phase 0 deferred follow-up #5 (tsconfig references)** — Wave 1 close baseline (`docs/audits/structure-2026-04-29-wave-1.md` §5) confirms every TS package that imports `@skb/*` has a matching `references` entry; only mdx-bridge has F1 asymmetry (declared but not imported, see §"Open questions").

19. **F1 — mdx-bridge forward-compat dead deps** (audit §5/§6): `mdx-bridge/package.json` declares `@skb/block-foundation` and `@skb/content-types` workspace deps; source contains no imports yet. Documented at mdx-bridge CONTRACT §"Wave 1 declared peers (forward-compat)". Wave 2 entry ADR should resolve dead-dep policy globally (audit §7 recommendation #1: tighten "every package.json `@skb/*` must have a corresponding source import" OR relax "tsconfig refs MUST match package.json + CONTRACT MUST explain").

20. **F2 — block-foundation forward-compat dead dep** (audit §6): `block-foundation/package.json` declares `@skb/content-types` dep + matching tsconfig ref; no source import yet. Planned Wave 2 use: block-foundation will validate registered block props against content-types schemas. Resolution bundled with F1 in Wave 2 entry ADR.

21. **Wave 2 prereq — block-foundation MDX renderer interface freeze** (audit §7 recommendation #2): the first `block-callout` package (per agent-contract `simple-block-eng`) will be the first real consumer of `block-foundation`'s dual-layer API. Add a `block-foundation/RFC.md` walkthrough of "how block-callout will register" to block-foundation CONTRACT before block-callout PR opens.

22. **Wave 2 prereq — TS↔Python schema mirror enforcement** (audit §7 recommendation #3): `apps/api/agent_bridge.py` will dispatch to `agent-tools` schema shapes (TS); maintain a simple "TS schema → Pydantic mirror" enforcement (likely Pydantic mirrors of the 11 toolSchemas) and add a structure-audit check in 2026-05 to verify shape parity.

### D4 — Wave 1 structure baseline snapshot

Saved to `docs/audits/structure-2026-04-29-wave-1.md` (created by structure-auditor at Wave 1 close). First monthly baseline; Wave 2+ structure-audits compare delta.

### D5 — Active plan repointed

`docs/plans/active.md` Wave pointer moves from "Wave 1 — 待执行" to "Wave 1 — closed by ADR-0002 / Wave 2 — pending plan draft". Wave 2 plan to be drafted by orchestrator + plan-challenger before Wave 2 spawn.

### D6 — Team shutdown ceremony

Per `docs/runbooks/team-operations.md` shutdown protocol, all 11 active teammates receive `shutdown_request` with reason "Wave 1 complete". After all approve, `TeamDelete phase-1-wave-1`. Wave 2 spawns a fresh team.

## Consequences

### Positive

- **Empirical lessons preserved**: 22 errata + ADR-0006 8-point checklist + 3 cross-package single-authority invariants now codified at the right scope (CONTRACT.md / CONVENTIONS.md / ADR). Wave 2+ workers won't re-litigate.
- **CI now actually gates**: 88 package tests + lint:packages + typecheck:packages run on every PR. Pre-fix systemic bug eliminated.
- **Verification-rigor culture**: fresh-state + negative-control verification patterns documented as expected practice.
- **Single-authority discipline**: 3 cross-package authority pairs (frontmatter schema / edit-block input schema / FOUC algorithm) all have consumer-side test gates + bidirectional CONTRACT.md documentation.
- **Wave 1 worker layer commits cleanly**: 7 high-risk PRs through pr-gate (Codex 5.5) without forced merges or hot-fixes after the fact.

### Costs

- **Review-round count was high** for some tracks (Track F: 5 + 4 = 9 review rounds total; Track A: 3 + 3 = 6). ADR-0006 should reduce this in Wave 2 by front-loading the asymmetry-audit at code-reviewer level.
- **Wave 1 plan estimate underestimated fixture growth** in mdx-bridge (5 → 9 fixtures). Wave 2 plan should budget +50% on edge-case fixture coverage.
- **CONTRACT.md pages getting heavier**: each package's CONTRACT.md now carries ~5-15 invariants. Acceptable trade-off vs implicit conventions, but Wave 2+ should keep watch — if any package CONTRACT.md exceeds ~300 lines, refactor invariants into a separate document and link.

### Risks (mitigated)

- **Risk**: Wave 2 workers may not read ADR-0006 carefully and hit the same 8-point class. **Mitigation**: ADR-0006 v2 also updates `agent-contract.md` (code-reviewer + pr-gate descriptions embed the 8-item summary), regenerates `.claude/agents/{code-reviewer,pr-gate}.md` + `docs/review-checklist.md` via `pnpm generate:configs`, and adds an ADR-0006 cross-link to `docs/runbooks/team-operations.md` Tier 2 reviewer rows. Every spawn prompt prefix-injects `team-operations.md`, so reviewers see the rule on entry; the regenerated subagent prompts also embed the 8-item summary directly.
- **Risk**: ADR-0002 errata roll-up grows unbounded across Waves. **Mitigation**: each Wave's close ceremony has its own ADR (ADR-0002 = Wave 1; future ADR-N for Wave N close); errata don't accumulate in a single file.

## Implementation

This ADR is the close ceremony itself. Implementation steps run in this order:

1. ✅ Worker layer closed (Track A v3 → `b5e7217`)
2. ✅ ADR-0006 written (`docs/decisions/ADR-0006-asymmetry-audit-checklist.md`)
3. ✅ ADR-0002 written (this file)
4. ⏳ Task 10 + Task 11 + vitest strict — committed via review chain (high-risk: CI workflow change → pr-gate)
5. ⏳ mdx-bridge CONTRACT.md cleanup (mdx-bridge-eng) — committed via review chain
6. ⏳ design-tokens CONTRACT.md inverse invariant (editor-integrator) — committed via review chain
7. ⏳ structure-auditor first monthly baseline → `docs/audits/structure-2026-04-29-wave-1.md`
8. ⏳ `docs/plans/active.md` repointed to Wave 2-pending
9. ⏳ Wave 1 close commit (orchestrator-direct via git-operator) — bundles ADR-0002 + ADR-0006 + structure baseline + active.md update + decisions/README.md index
10. ⏳ Team shutdown ceremony — `shutdown_request` to all 11 teammates → `TeamDelete phase-1-wave-1`

## Related

- [ADR-0001](ADR-0001-stack-selection.md) — technical baseline + Phase 0 errata
- [ADR-0003](ADR-0003-headless-presentational-split.md) — D-list (D7 deferred to Phase 3 confirmed)
- [ADR-0004](ADR-0004-agent-team-dispatch-model.md) — team dispatch model proven across Wave 1
- [ADR-0005](ADR-0005-api-conventions.md) — API conventions enforced in Track D
- [ADR-0006](ADR-0006-asymmetry-audit-checklist.md) — 8-point asymmetry-audit checklist (process rule)
- [Phase 1 Wave 1 plan](../superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md) — implementation plan (now complete)
- [设计规格](../superpowers/specs/2026-04-29-self-knowledge-base-design.md) — spec authority
- [docs/plans/active.md](../plans/active.md) — Wave pointer (repointed at this commit)
- [docs/runbooks/team-operations.md](../runbooks/team-operations.md) — operational runbook
- [docs/audits/structure-2026-04-29-wave-1.md](../audits/structure-2026-04-29-wave-1.md) — Wave 1 close baseline (created at this commit)
