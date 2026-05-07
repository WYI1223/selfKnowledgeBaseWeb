# ADR-0006: Cross-location asymmetry-audit checklist (process rule)

| 字段 | 值                                    |
| ---- | ------------------------------------- |
| 状态 | accepted                              |
| 日期 | 2026-04-30                            |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx) |
| 触发 | Wave 1 codex 5.5 reviews caught 12 instances of the same meta-class across 6 tracks + 5 close-ceremony fix iterations (8 distinct items + 4 close-ceremony reinforcements of items #6 and #8) |
| 替代 | 不替代任何 ADR；扩展 [ADR-0001](ADR-0001-stack-selection.md) §3.2 review chain |

## Context

Wave 1 implementation produced strong empirical evidence that **a single bug class** dominates the failure mode at line-level review:

> **Cross-location asymmetry**: a value, schema, algorithm, or invariant exists in two or more places, and an edit to one location is not symmetrically applied to all peers, so behavior diverges silently.

Across 6 tracks + 5 close-ceremony fix iterations, codex 5.5 (`pr-gate`) caught **12 instances** of this meta-class (8 distinct failure-mode items + 4 close-ceremony reinforcements of items #6 and #8). Every PR that lasted ≥ 2 review rounds hit at least one instance. The pattern is so consistent that linear "fix the cited blocker, ship v_n+1" iteration would not have caught the second-order asymmetry; codex specifically catches the symmetric counterpart that the worker missed.

### Wave 1 empirical record (12 instances)

| # | Track | Round | Asymmetry pair | Bug behavior |
|---|---|---|---|---|
| 1 | Track B (block-foundation + content-types) | R1 → fixed v3 | `listUIs` mutability vs `listCores` defensive copy | Caller mutation of return value polluted registry singleton |
| 2 | Track D (apps/api) | R2 → fixed v4 | RFC 7235 `WWW-Authenticate` on framework-raised 401 vs custom `SkbError` 401 | 4 of 5 401 paths emitted spec-mandated header; the custom-error path silently dropped it |
| 3 | Track F (editor-commands) | R3 → fixed v4 | `.strict()` on top-level Zod object vs nested `frontmatterSchema` | Top-level rejected unknown keys; nested still silently stripped them |
| 4 | Track C (mdx-bridge) | R2 → fixed v4 | `marksEqual` link comparator: `href` only vs `href + title` | Same href, different titles silently merged into one link with the first title preserved |
| 5 | Track F v5 | R3 → fixed v6 | One CONTRACT.md updated to reflect code; sister CONTRACT.md (`agent-tools`) had stale wording | Documentation-vs-code drift in the file the worker did not edit |
| 6 | Track A | R1 → fixed v2 | FOUC inline IIFE saved-value algorithm + content schema | Truthy-coerce diverges from strict-whitelist for invalid / case-mismatched values; inline `z.object` redefinition diverges from `frontmatterSchema` authority |
| 7 | Track A v2 | R2 → fixed v3 | FOUC inline IIFE try/catch scope | Wide try/catch in IIFE swallowed `matchMedia` exceptions while authority's narrow try/catch propagated; storage-throws scenarios produced light→dark hydration flash |
| 8 | Wave 1 close bundle v1 | R1 → fixed v2 | ADR-0006 mandated reviewer-prompt updates vs actual `agent-contract.md` / generated `.claude/agents/*.md` / `docs/review-checklist.md` / `team-operations.md` content | The close-ceremony commit codified a process rule that mandates downstream behavior; consumer-side artifacts (reviewer prompts + runbook) had not been updated to embed the rule, so Wave 2 reviewers would not have seen it |
| 9 | Wave 1 close bundle v2 | R2 → fixed v3 | ADR-0006:81 within-document drift "7 distinct instances" | Single bullet missed during the v1→v2 count sweep — sister-bullet variant of item #6 within a single document |
| 10 | Wave 1 close bundle v3 | R3 → fixed v4 | ADR-0006:117 within-document drift "7 empirical instances + 18+ erratum candidates" (both numbers stale) | Second sister-bullet drift in the same file, a different bullet — proved per-citation fixes are themselves item #6 traps; comprehensive sweep at fix time is the robust pattern |
| 11 | Wave 1 close bundle v4 (informational) | R4 (informational) → fixed v5 | structure baseline:66 "× 7 endpoints" while apps/api has 4 routes / 11 tests | Pre-existing content-accuracy drift in the structure baseline document (authored at v1) — content number mismatched real code; surfaced during the broader 11th-class hunt |
| 12 | Wave 1 close bundle v5 | R2 (pr-gate) → fixed v6 | Regenerated `.claude/agents/code-reviewer.md` + `.claude/agents/pr-gate.md` + `docs/review-checklist.md` were not staged in the bundle commit — authority + generator code updated, but generator outputs remained at pre-update HEAD content | Sub-form of item #8: regenerating an artifact and `git add`'ing it are separate steps; a bundle that updates authority + generator without staging the regenerated outputs is silently stale. Motivated the "verify by clean second-run" step now part of item #8. |

Codex's structured review consistently caught these with three patterns:

1. After fixing one location, **codex audits all peer locations** (not just the cited site)
2. After a value/schema acquires an attribute, **codex audits every comparator/serialization function** for that attribute
3. After a "happy path" fix, **codex audits the exception path** for the same equivalence

These three habits collectively define the process rule below.

## Decision

Adopt an **9-point asymmetry-audit checklist** (8 from v0.1 + 1 new at v0.2 amendment 2026-05-XX) as a mandatory part of `codex-pr-reviewer-55` (Wave 3+ default reviewer per ADR-0011 D6) review prompts. Reviewers MUST work through every applicable item before declaring PASS. (Pre-Wave-3 `code-reviewer` / `pr-gate` profile prompts are deprecated per ADR-0011 D6.)

### The 9 items

1. **Field/attribute audit**: After adding a field to a data shape (Zod schema, Pydantic model, TS interface, mdast attrs, etc.), audit every comparator / equality / serialization / canonicalization function that handles this shape. (Wave 1 evidence: instance #4 — `marksEqual` link branch missed `title` when serialize emitted it.)

2. **Status code audit**: After adding a status code to one HTTP handler (or, generally, an exit/error code to one branch), audit every other handler emitting the same code. RFC-mandated headers (RFC 7235 `WWW-Authenticate` on 401, RFC 7231 `Allow` on 405) attach to **the status code itself**, not the framework code path that emitted it. (Wave 1 evidence: instance #2 — custom `SkbError` 401 path missed `WWW-Authenticate`.)

3. **Strictness audit**: After adding `.strict()` (Zod) / `extra='forbid'` (Pydantic) at one level of an object schema, audit every nested object/sub-schema. The strictness setting **does not propagate**; nested objects must opt in independently. (Wave 1 evidence: instance #3 — top-level `.strict()` shipped while nested `frontmatterSchema` still silently stripped unknown keys.)

4. **Consumer schema audit**: After defining a schema in a single-authority package (e.g. `@skb/content-types/frontmatterSchema`), audit every consumer for inline duplicates or inline redefinitions that should `import` instead. The "deferred swap" pattern — "I'll inline now and import later" — is a contract break that compounds over time. (Wave 1 evidence: instance #6 part 2 — apps/site/content.config.ts inlined `z.object(...)` rather than importing `frontmatterSchema`.)

5. **Algorithm + runtime constant replication audit**: When an algorithm or runtime constant is replicated outside its authority (e.g. inline FOUC scripts, login challenge derivation, pre-hydration boot logic that cannot import from packages), audit every consumer-side replica for byte-equivalent reproduction. The replica must register a **regression test** that asserts equivalence against the authority across a representative input corpus. (Wave 1 evidence: instance #6 part 1 — FOUC IIFE truthy-coerce vs `getInitialTheme()` strict-whitelist; remediated with `apps/site/src/__tests__/fouc-script.test.ts` 16-row corpus.)

6. **Sister-file documentation audit**: After updating one CONTRACT.md (or any document that describes a code surface), audit ALL related CONTRACT.md files in the package family for sister-file drift. Two CONTRACT.md files that describe two halves of the same contract must use **identical terminology** for the shared identifiers (function names, schema names, refine predicate names). (Wave 1 evidence: instance #5 — `editor-commands/CONTRACT.md` updated to cite `editBlockInputSchema` while `agent-tools/CONTRACT.md` still referred to the old shape.)

7. **Exception-scope equivalence audit**: When replicating an algorithm + its exception handling across files, audit BOTH the happy-path semantics AND the `try/catch` scope between authority and replica. Narrow vs wide `try/catch` can produce divergent fall-through behavior even with identical happy-path logic. Specifically: when `localStorage` / `sessionStorage` / `IndexedDB` / `matchMedia` / any browser API in the algorithm path can throw, the `try/catch` MUST wrap ONLY the throwing call, with the fall-through branch (matchMedia / system default / DOM apply) running AFTER the catch handler — not inside it. (Wave 1 evidence: instance #7 — FOUC IIFE wide-scope try/catch swallowed matchMedia exceptions; remediated with narrow try/catch + 2 storage-throws regression tests.)

8. **Authority-document → generated/consumed surface audit**: When updating an authority document (ADR, spec, `agent-contract.md`, runbook, CONVENTIONS) **OR a dependency authority (`package.json`)** that mandates behavior in downstream consumers, audit every consumer-side replica/generated artifact for synchronized update **AND staged-in-the-git-index in the same bundle**. Specifically: an ADR section that says "X file MUST be updated to do Y" requires the same commit to update X and provide a way to verify the synchronization. Generated artifacts (e.g. `docs/review-checklist.md` and `.claude/agents/*.md` derived from `agent-contract.md`; **`pnpm-lock.yaml` derived from `package.json`** — see sub-form C below) MUST be regenerated via the documented codegen step (`pnpm generate:configs` / `pnpm install`) AND **explicitly `git add`'d** so the git **index** (not just the working tree) contains the new content; runbooks (`docs/runbooks/team-operations.md`) MUST be cross-linked; Codex/Claude subagent prompt files MUST embed or reference the new rule.

   **Operational sequence** (do not skip steps):
   ```bash
   # 1. Edit authority + generator code
   # 2. Run codegen
   pnpm generate:configs
   # 3. Stage regenerated outputs (CRITICAL — see Pitfall below)
   git add <regenerated/path/foo.md> <regenerated/path/bar.md>
   # 4. Verify index reflects content (NOT just working tree):
   git diff --cached --stat -- <regenerated paths>
   #    → expects non-empty diff with the expected line counts
   # 5. Verify idempotence: re-run codegen + confirm working tree matches index:
   pnpm generate:configs
   git status --short -- <regenerated paths>
   #    → expects column-1 'M' (staged) + column-2 blank (working tree clean)
   ```

   **Pitfall (this is the load-bearing step)**: `git status --short` shows two columns: column 1 is index-vs-HEAD; column 2 is working-tree-vs-index. After running the generator without `git add`, you see `' M'` (space + M) — **working tree differs from index, but index still matches HEAD**. `git commit` only commits the index. Skipping `git add` means the regenerated content is in your working tree but NOT in the next commit. The bundle would land authority + generator-code changes WITHOUT the regenerated outputs, leaving consumers (Wave 2 reviewers reading `.claude/agents/*.md`) at pre-update content. Use `git diff --cached` (not `git status`) as the canonical staging-verification command — `--cached` shows index-vs-HEAD only, which is what `git commit` will produce.

   **Pitfall extension — `pnpm-lock.yaml` is a generated artifact too (sub-form C below)**: when the authority is `package.json` (any dependency add / remove / version bump / `@types/*` shift), `pnpm install` regenerates `pnpm-lock.yaml` as a deterministic derived artifact. Skipping `git add pnpm-lock.yaml` produces the same class of failure as skipping `git add .claude/agents/*.md`: working tree has the synced lockfile but the **index** still holds HEAD's stale lockfile, so the bundle ships `package.json` ahead of its lockfile. CI runs `pnpm install --frozen-lockfile` from the bundled state, sees the stale lockfile disagreeing with the new `package.json`, and fails install. The same `git diff --cached --stat -- pnpm-lock.yaml` canonical verification applies. (Wave 1 erratum commit `e15ec36`; codified as sub-form C below.)

   Generated-from-authority files carry their own header comment ("GENERATED FROM agent-contract.md — DO NOT EDIT BY HAND") OR YAML frontmatter declaring authority source — both forms are acceptable. `pnpm-lock.yaml` lacks an explicit header (the format is fixed by pnpm) but is implicitly declared by `pnpm install`'s contract — its authority is `package.json` + the workspace `pnpm-workspace.yaml`.

   **Wave 1 evidence**: **instance #8** — ADR-0006 v1 commit codified reviewer-prompt mandates but did not update `agent-contract.md` / regenerate `.claude/agents/code-reviewer.md` / regenerate `.claude/agents/pr-gate.md` / cross-link `team-operations.md` / regenerate `docs/review-checklist.md`; pr-gate caught the dogfood failure during R1 review of the close-ceremony bundle, forcing a v2 fix. **instance #12 (sub-form A — pre-regeneration omission)** — v5 bundle updated authority files (`agent-contract.md`, generator code, `team-operations.md` cross-link) but had not run the generator at all post-edit; the 3 regenerated outputs were stale at HEAD content; pr-gate caught this during R2 review, forcing a v6 fix. **instance #12 (sub-form B — staging-vs-working-tree confusion)** — v6 bundle ran the generator (so working tree had new content) but did NOT `git add` the regenerated outputs; the git **index** still held HEAD blob hashes for the 3 generated files; orchestrator confused `git status --short` "M" prefix (working-tree-vs-index) with index-vs-HEAD; pr-gate caught this via `git ls-files --stage` blob-hash comparison during R3 review, forcing the v7 fix that explicitly stages with `git add` + verifies via `git diff --cached`. **instance #12 (sub-form C — lockfile is a generated-from-authority artifact)** — Wave 1 close ceremony commit `e15ec36` ("fix(deps): commit pnpm-lock.yaml for @tailwindcss/typography (lockfile drift)"): the design-tokens erratum (commit `fdc86a8`) added the `@tailwindcss/typography` dependency to `package.json` but did not stage the regenerated `pnpm-lock.yaml`; CI install used the pre-update lockfile, drifted against the new `package.json`, and failed `pnpm install --frozen-lockfile`. Resolution: commit `e15ec36` staged the lockfile separately. Lesson codified: when the authority is `package.json` (any dependency add / remove / version bump), `pnpm-lock.yaml` is the consumer-side generated artifact and must ride the same bundle — the class equivalence to `.claude/agents/*.md` regeneration is exact (deterministic derive + git-index staging required). The four sub-forms of the same item #8 class — pre-regeneration omission, post-regeneration commit-staging confusion, conceptually-correct-but-operationally-incomplete fix, AND lockfile-as-generated-artifact — together motivate the explicit operational sequence and `git diff --cached` canonical verification command codified above.

9. **UI-touch + E2E spec audit (v0.2 amendment 2026-05-XX, ADR-0011 D9)**: When PR diff touches user-facing UI surfaces, reviewer MUST verify: (a) PR.md `ui_touch: true` + `e2e_smoke` field non-empty, (b) each `e2e_smoke` entry has corresponding Playwright spec file existing + test name resolvable, (c) `pnpm --filter @skb/site test:visual` PASSES locally during review, (d) referenced `screenshot_archive` path exists with file size ≥ 5KB. (Wave 5 evidence: C.4-prelude PR #72 — vitest unit + jsdom all PASS + pr-writer ACCEPT 23/23 PASS, but editor page had no toolbar/slash/palette/save-indicator/Edit-Mode visual; user smoke test discovered "看不到任何一点进步"; root cause = no E2E spec validating user-visible affordances; codified ADR-0011 D9 + this 9th asymmetry class.) **Path-pattern + exclusion authority (v0.2.1 cross-ref-only amendment 2026-05-07, Wave 6 Stage B.2)**: [ADR-0011 D9.1](ADR-0011-linear-pipeline-execution-model.md) is the canonical source of UI-touch path patterns AND their exclusions (Wave 6 Stage B.2 amendment excludes `apps/site/src/pages/api/**` server-only API routes — `prerender = false` JSON endpoints with no rendered HTML, no Playwright-meaningful flow). This item #9 references D9.1 by reference rather than inlining the pattern list — the inline shorthand was removed at the same B.2 amendment to prevent the authority-vs-consumer drift that ADR-0006 item #8 itself warns against. `scripts/check-ui-touch.ts` + `scripts/check-e2e-coverage.ts` + `scripts/check-screenshot-archive.ts` mirror D9.1 (patterns + exclusions) byte-equally per item #5.

   The asymmetry: **"vitest unit PASS" vs "production user-visible behavior PASS"** is the load-bearing pair. Wave 5 R22 forward-fix two-class classification (impl-defect vs PR.md drift) was insufficient; D9.7 evidence demonstrates a third class — **product-experience-defect** — that vitest cannot catch. CI gate `scripts/check-e2e-coverage.ts` mechanically enforces (a)+(b); reviewer manual verifies (c)+(d).

### Wave 2 prep notes (forward-compatibility application)

The 8 items have specific Wave 2 trip-hazards already identified by Wave 1's review record:

- **Item #1 + Wave 2 attr-bearing marks**: when the first attr-bearing mark beyond `link` is added to mdx-bridge (e.g. `highlight: {color}`, `kbd: {style}`), the worker MUST simultaneously update `wrapMark` AND `marksEqual` AND add a fixture exercising attr-equality + attr-distinction. Default `return true` in `marksEqual` is a silent-drop trap for any attr-bearing mark. (See pr-gate Track C v4 R3 caveat.)

- **Item #2 + Wave 2 new error categories**: when Wave 2+ adds new HTTP error categories (e.g. `auth-rate-limit`, `kernel-timeout`), each new `SkbError` subclass MUST emit the same RFC-mandated headers as framework-raised peers. Add a unit test asserting header presence per error type. (See `apps/api/CONVENTIONS.md` §5 Pitfall + Pitfall continued.)

- **Item #5 + Wave 2 client-side replications**: when apps/site adds new client-side algorithm replications (theme variants beyond light/dark, locale negotiation pre-hydration, etc.), the worker MUST audit both saved-value semantics AND try/catch scope against authority. (See `packages/design-tokens/CONTRACT.md` Inverse-direction obligation invariant.)

- **Item #7 + future inline scripts**: ANY future `<script is:inline>` block in the project that needs pre-hydration replication of a package algorithm MUST follow the FOUC template (narrow try/catch + corpus regression test).

## Consequences

### Positive

- **Catch the failure mode proactively**: Wave 1 evidence shows reviewer-applied checklist would have caught all 12 instances on the first review round (including the close-ceremony dogfood instance #8 + the 4 fix-loop reinforcements), eliminating 12 round-trip cycles
- **Reviewer prompt clarity**: code-reviewer + pr-gate codex profile prompts gain a concrete, enumerable checklist rather than the implicit "look for symmetric counterparts" expectation
- **Worker self-audit**: workers gain a pre-PR checklist they can run before reporting `ready-for-review`, catching their own asymmetries (memory: `feedback_verification_fresh_state.md` showed the verification-rigor lesson; this checklist is the analogous rigor at code-design level)
- **Empirical grounding**: 12 distinct instances spread across 6 tracks + 5 close-ceremony fix iterations make this rule data-driven, not a "best practice" speculation; instances #9-12 reinforce items #6 + #8 specifically through close-ceremony fix-loop evidence

### Costs

- **Review-round time**: applying the 9-point audit at every review adds ~5-10 minutes per round of code-reviewer + pr-gate runtime. Acceptable trade-off given Wave 1 round-counts (Track F: 5 rounds; Track A: 3 rounds; Track C: 4 rounds; Track D: 4 rounds) — front-loading review thoroughness reduces total cycles
- **Worker prompt overhead**: each spawn prompt now needs a reference to this ADR + the 9-point checklist. Marginal cost.
- **False-positive risk**: items that don't apply (e.g. #2 "status code" doesn't apply to TS-only packages) need to be triaged and skipped. Reviewer profile prompts must explicitly say "skip items not applicable to this PR's scope" to avoid bloat.

### Risks (mitigated)

- **Risk**: workers might mechanically check items without thinking, producing false confidence. **Mitigation**: each item enumerates concrete failure modes from Wave 1, not abstract heuristics — easier to apply
- **Risk**: this list might grow unbounded as Wave 2+ surfaces new asymmetry classes. **Mitigation**: ADR amendments are cheap; each new instance produces an ADR-0006 erratum capturing item #N+1. Wave 2 close ceremony reviews instances and adds items as needed.

## Implementation

### Reviewer prompt updates

`codex-pr-reviewer-55` (Wave 3+ default reviewer per ADR-0011 D6) profile prompt MUST be updated to:

1. State the 9-point checklist verbatim (or by reference to this ADR)
2. Require the reviewer's verdict structure to include "asymmetry-audit applied: items {1..9} verdicts: ..."
3. Explicitly mark FAIL if any applicable item is left un-audited
4. For item #9 (v0.2): if PR.md `ui_touch: true`, MUST run `pnpm --filter @skb/site test:visual` and verify PASS before declaring overall PASS verdict

`docs/runbooks/team-operations.md` §"角色与触发器" Tier 2 reviewer rows should cross-link to this ADR.

### Worker pre-flight (template addition)

Worker `ready-for-review` reports SHOULD include a brief asymmetry-audit summary: which of the 9 items applied, and the worker's self-audit verdict. Reviewers cross-check.

### Wave 1 retroactive

This ADR is **forward-applicable**. Wave 1 PRs that already shipped under earlier review without this checklist remain valid; the empirical instances they revealed are exactly what grounded this ADR. No retroactive re-review required.

## Amendments

### v0.2 (2026-05-XX; Wave 5 C.4-prelude product-experience-defect 失职)

新增第 9 项 **UI-touch + E2E spec audit**（与 ADR-0011 D9 配套）。codify 第三类 forward-fix：**product-experience-defect**（之外原 R22 两类：impl-defect + PR.md drift）。CI gate `scripts/check-e2e-coverage.ts` + `scripts/check-screenshot-archive.ts` 机械 enforce。

强制起点：本 amend PR 合 main 起，所有后续 UI-touch PR（per ADR-0011 D9.1 path patterns）适用。Wave 5 v1.3+ 全套 UI-touch PR 必跑。

非破坏性 / 向后兼容：items 1-8 不变；新加 item 9 仅 enforce 在 UI-touch PR；非 UI-touch PR 自动 skip item 9（CI gate via `ui_touch: false`）。

实证依据：详见 ADR-0011 D9.7。Wave 5 PR #72 vitest unit / jsdom / pr-writer ACCEPT 全 PASS 但 user 烟测无 toolbar/slash/palette/save-indicator/Edit-Mode 任一 affordance = "看不到任何一点进步"。事后 codify。

## Related

- [ADR-0001](ADR-0001-stack-selection.md) §3.2 review chain — this ADR specifies what reviewers MUST do; ADR-0001 specifies who reviews
- [ADR-0002](ADR-0002-wave-1-close.md) Wave 1 close — collects the 12 empirical instances + 22 erratum candidates
- [ADR-0004](ADR-0004-agent-team-dispatch-model.md) team dispatch — orchestrator dispatches review chain per this checklist
- [docs/runbooks/team-operations.md](../runbooks/team-operations.md) — operational reference for reviewers and workers
- [packages/design-tokens/CONTRACT.md](../../packages/design-tokens/CONTRACT.md) Inverse-direction obligation — concrete application of items #5 + #7
- [apps/api/CONVENTIONS.md](../../apps/api/CONVENTIONS.md) §5 Pitfalls — concrete application of item #2
