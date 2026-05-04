# B5 — codex profile prefix R3 consistency + lychee autolink-in-backticks memory codify

> **Wave 4 Stage B 6th PR** (re-locked roster: B1a → B1b → B2 → B3 → B4 → **B5** → B7 → B6).
> Closes Wave 3 retrospective item R3 (codex profile prefix consistency
> per ADR-0013 D4 R3) by adding the `codex-` prefix to 4 profile fields
> in `agent-contract.md` `tool_patterns:` (the 4 NEW Wave 3 D6 profiles
> that already use the prefix in `~/.codex/config.toml` user-side TOML).
> Codifies a NEW orchestrator-local memory entry
> `feedback_lychee_autolink_in_backticks.md` capturing the systemic
> 5-R-round lychee autolink-inside-backticks pattern (Wave 3 + Wave 4)
> that previously cost forward-fix rounds. Standard-pipeline PR with
> Row 1 + Row 8 trigger judgment per `## D2 trigger judgment`.

## title

Apply `codex-` prefix to 4 `agent-contract.md` `tool_patterns:` profile
fields (`generic-executor → codex-generic-executor`,
`structure-auditor → codex-structure-auditor`,
`perf-auditor → codex-perf-auditor`,
`mdx-doctor → codex-mdx-doctor`) matching the canonical names
already in user-side `~/.codex/config.toml`. Update
`scripts/render/types.ts` Zod `ToolPatternSchema.profile` enum + the
test fixture in `scripts/__tests__/generate-configs.test.ts` to
expect the new canonical name. Regenerate downstream surfaces via
`pnpm generate:configs`: `CLAUDE.md` (root entrypoint),
`AGENTS.md` (tool-pattern roster), `docs/runbooks/codex-tool-invocations.md`
(per-pattern bash invocations + R7 truncation paths). Bookkeep
`docs/plans/active.md` B4 row backfill (`#43 / dc216ab`) + B5 TBD
row addition. Memory entry
`~/.claude/projects/-home-weiyi-selfKnowledgeBaseWeb/memory/feedback_lychee_autolink_in_backticks.md`
authored at orchestrator-local memory store
(NOT git-tracked) + index entry added to
`~/.claude/projects/.../memory/MEMORY.md`. PR.md self-listed per
ADR-0006 D8 strict-whitelist + Pre-A1+...+B4 precedent.

## files

10 canonical files + COMMIT-time +1-2 reviewer audit archives;
**11-12 files total at commit**. orchestrator-self EXECUTE for the
agent-contract.md substitution + Zod schema + test fixture
+ regen + active.md + memory codify (orchestrator-local). NO
`package.json` / `pnpm-lock.yaml` change. NO new ADR (R3 is a
retrospective-item closure, not an architectural change). PR.md
self-listed per Pre-A2+...+B4 precedent.

- `agent-contract.md` — **MODIFIED** (~8 LOC delta). 4 substitutions
  in `tool_patterns:` block: `profile: generic-executor` →
  `profile: codex-generic-executor` (+ same for `structure-auditor`,
  `perf-auditor`, `mdx-doctor`); the `invocation:` field for each
  also updates the `--profile NAME` literal flag to match. The 3 remaining profile
  names already use the canonical form: `scaffolder` (5 scaffolders
  share this no-prefix name; intentional — the local TOML also uses
  `scaffolder`); `plan-challenger` (no-prefix; matches local TOML);
  `codex-pr-reviewer-55` (already has codex- prefix; matches local
  TOML).
- `scripts/render/types.ts` — **MODIFIED** (~4 LOC delta). The
  Zod `ToolPatternSchema.profile` enum literal list extends to accept
  the 4 new canonical names alongside the 3 unchanged ones. NO source
  semantic change beyond the enum.
- `scripts/__tests__/generate-configs.test.ts` — **MODIFIED**
  (~1 LOC delta). The fixture assertion at line 41-43 expecting
  `'generic-executor'` updates to `'codex-generic-executor'`.
- `CLAUDE.md` — **MODIFIED** (~6 LOC delta). Generated from
  agent-contract.md by `pnpm generate:configs`; the 11-pattern
  table at "Codex tool patterns (11)" updates 4 rows' Profile
  column to the prefixed name + table column-width re-flow.
- `AGENTS.md` — **MODIFIED** (regen-driven; ~4-8 LOC delta).
- `docs/runbooks/codex-tool-invocations.md` — **MODIFIED** (regen-driven;
  ~12-20 LOC delta; 4 sections (`codex-generic-executor`,
  `codex-structure-auditor`, `codex-perf-auditor`, `codex-mdx-doctor`)
  update both their `**Profile**:` field + `**Canonical bash**:`
  block to use the prefixed name).
- `docs/plans/active.md` — **MODIFIED** (~3 LOC delta). B4 row
  backfilled (`#43 | dc216ab | B4 | ...`); B5 TBD row added.
- `docs/plans/wave-4-main/B5-codex-prefix-lychee-memory.md` — **NEW**
  (this PR.md, self-listed). ~500 LOC.
- `docs/audits/codex-runs/2026-05-03-B4-commit.txt` — **NEW**
  (B4-orphan-leftover commit log; back-fill per B1b/B2/B3/B4
  precedent of orphan audit-archive consolidation in next PR).
- COMMIT-time additions: B5 reviewer R1 audit archive at
  `docs/audits/codex-runs/2026-05-04-B5-pr-reviewer-55.txt`
  (R2 if needed at +1 archive).

**Memory entry (NOT in this PR; orchestrator-local memory store)**:
`/home/weiyi/.claude/projects/-home-weiyi-selfKnowledgeBaseWeb/memory/feedback_lychee_autolink_in_backticks.md`
authored at EXECUTE-time + indexed in
`/home/weiyi/.claude/projects/.../memory/MEMORY.md`. The memory
file is intentionally NOT committed to the repo per the memory
protocol (orchestrator-local persistence; cross-session reference
without VCS coupling).

## test_cases

10 test cases (TC1-TC10). orchestrator-self EXECUTE pattern is
substitute → regen → run check; no new vitest tests authored
(downstream regen is functionally validated by existing
`scripts/__tests__/generate-configs.test.ts` which already
exercises the post-amendment Zod schema + parser).

- **TC1** (agent-contract.md profile renames, 4-way verification):
  Input: `grep -cE 'profile: codex-(generic-executor|structure-auditor|perf-auditor|mdx-doctor)' agent-contract.md`.
  Expected: `4`. Location: shell at repo root.
- **TC2** (agent-contract.md no-prefix-residue check): Input:
  `grep -cE 'profile: (generic-executor|structure-auditor|perf-auditor|mdx-doctor)$' agent-contract.md`.
  Expected: `0`. Location: same.
- **TC3** (`scripts/render/types.ts` Zod enum updated): Input:
  `grep -cE "'codex-(generic-executor|structure-auditor|perf-auditor|mdx-doctor)'" scripts/render/types.ts`.
  Expected: `4`. Location: same.
- **TC4** (`generate-configs.test.ts` fixture updated): Input:
  `grep -c "'codex-generic-executor'" scripts/__tests__/generate-configs.test.ts`.
  Expected: `≥ 2` (one for `tp.name` lookup + one for `.profile`
  assertion). Location: same.
- **TC5** (workspace test pass): Input: `pnpm test`. Expected:
  exit 0; `scripts/__tests__/generate-configs.test.ts` PASS;
  no other regression.
- **TC6** (workspace check pass): Input: `pnpm check`. Expected:
  exit 0; 40/40 tasks PASS.
- **TC7** (CLAUDE.md regen valid): Input:
  `grep -cE 'codex-(generic-executor|structure-auditor|perf-auditor|mdx-doctor)' CLAUDE.md`.
  Expected: `≥ 4`. Location: same.
- **TC8** (runbook regen valid): Input:
  `grep -cE 'codex-(generic-executor|structure-auditor|perf-auditor|mdx-doctor)' docs/runbooks/codex-tool-invocations.md`.
  Expected: `≥ 4`. Location: same.
- **TC9** (memory entry authored at orchestrator-local store):
  Input: `test -f /home/weiyi/.claude/projects/-home-weiyi-selfKnowledgeBaseWeb/memory/feedback_lychee_autolink_in_backticks.md`.
  Expected: file exists. Location: same. NOTE: this file is
  orchestrator-local + NOT git-tracked; TC9 is verified at
  EXECUTE-time, not in CI.
- **TC10** (PR.md self-listed): Input:
  `grep -c 'B5-codex-prefix-lychee-memory.md' docs/plans/wave-4-main/B5-codex-prefix-lychee-memory.md`.
  Expected: `≥ 2`. Location: same.

Byte-unchanged guards (TC11-TC15):
- **TC11** lockfile (`git diff main -- pnpm-lock.yaml` 0 lines)
- **TC12** B1a/B1b/B2/B3/B4 shipped files byte-unchanged
- **TC13** B7-scope (apps/site/src/components.ts; heavy block packages)
- **TC14** ADR files byte-unchanged
- **TC15** Wave 4 plan doc byte-unchanged

## contracts_affected

- NONE. agent-contract.md is the contract source for downstream
  generation, but B5 only renames profile field values WITHOUT
  changing the underlying contract semantics or tool definitions.

## adr_touched

- NONE. R3 retrospective-item closure does not require an ADR
  amendment; the original ADR-0011 D6 already mandated codex- prefix
  as canonical (Wave 3 R3 noted runbook still referenced unprefixed
  names in places — this PR completes the cleanup).

## D2 trigger judgment

- **Row 1 (CONTRACT change)**: NO (no `packages/*/CONTRACT.md` or
  `apps/site/CONTRACT.md` change).
- **Row 4 (new ADR)**: NO.
- **Row 8 (CI/build/deploy/auth/security)**: BORDERLINE — CLAUDE.md
  + AGENTS.md are not CI workflow files; runbook update changes
  per-pattern bash invocations but the actual `~/.codex/config.toml`
  user-side already uses canonical names (this PR aligns docs to
  user-side reality, not the other way). Conservative interpretation:
  NOT a CI/auth/security touch. STANDARD PR.
- → STANDARD PR; D1 stage 4 NOT triggered.

## acceptance

1. agent-contract.md `tool_patterns:` block has 4 `profile:` field
   substitutions: `codex-generic-executor`, `codex-structure-auditor`,
   `codex-perf-auditor`, `codex-mdx-doctor`. TC1 + TC2 evidence.
2. agent-contract.md `tool_patterns:` block has 4 corresponding
   `invocation:` field updates: `--profile codex-NAME` literal. TC1 + TC2 evidence.
3. `scripts/render/types.ts` `ToolPatternSchema.profile` z.enum
   accepts the 4 new canonical names (alongside the 3 unchanged:
   `scaffolder`, `plan-challenger`, `codex-pr-reviewer-55`).
   TC3 evidence.
4. `scripts/__tests__/generate-configs.test.ts` fixture assertion
   updated to expect `'codex-generic-executor'`. TC4 evidence.
5. `pnpm generate:configs` exit 0 + downstream regen produces:
   - CLAUDE.md table at "Codex tool patterns (11)" 4 rows updated.
   - AGENTS.md tool-pattern roster updated.
   - `docs/runbooks/codex-tool-invocations.md` 4 sections updated
     in Profile + Canonical bash blocks.
   TC7 + TC8 evidence.
6. `pnpm test` exit 0 (`generate-configs.test.ts` PASS post-fixture
   update; no other regression). TC5 evidence.
7. `pnpm check` (full workspace) exit 0; 40/40 tasks PASS. TC6 evidence.
8. `pnpm link-check` BLOCKED locally (lychee binary not on dev WSL2;
   CI canonical per B1a/B1b/B2/B3/B4 precedent). Pre-commit
   discipline check: no angle-bracket-wrapped placeholder patterns inside backticks per the
   newly-codified memory `feedback_lychee_autolink_in_backticks.md`.
9. `docs/plans/active.md` B4 row backfilled (`#43 / dc216ab`); B5
   TBD row added.
10. PR.md self-listed (TC10).
11. Memory entry `feedback_lychee_autolink_in_backticks.md` exists at
    orchestrator-local store; MEMORY.md index entry added.
    TC9 evidence.
12-16. Byte-unchanged guards (TC11-TC15).
17. NO scope creep: the 10 canonical + 1 audit-archive + 1 reviewer
    audit archive = 12 files at commit. Lockfile + package.json
    byte-unchanged.

## Plan-challenger absorbtion

NOT dispatched (small standard-PR scope; agent-contract.md
substitution mechanics + Zod schema enum extension are deterministic,
no design ambiguity to challenge). B5's role in Wave 4 plan v0.2.1
Stage B sequence is fixed by Stage B re-plan + ADR-0013 D4 R3
retrospective directive.

## Risk register

1. **Regen drift between agent-contract.md and downstream artifacts**:
   if the substitution misses a field, regen produces inconsistent
   output. Mitigation: TC1 + TC2 grep verify; pnpm generate:configs
   exit 0 verify; post-regen TC7 + TC8 grep verify on the regenerated
   files.
2. **Zod schema enum + parser drift**: if the schema accepts new
   names but the parser logic still expects old names elsewhere,
   schema mismatch surfaces in test failure. Mitigation: TC4 fixture
   update aligns the test expectation; TC5 + TC6 catch any other
   parser site that hard-codes the old name.
3. **User-side TOML mismatch (low)**: user's `~/.codex/config.toml`
   already uses the canonical `codex-` prefix per Step 0 verification
   at session start. If a future user has the old unprefixed names
   in their local TOML, they will need to merge the canonical names
   per the runbook's "Profile TOML merge" section.

## executor

orchestrator-self per Wave 4 plan v0.2.1 Stage B B5 row + small-batch
deterministic substitution + regen. No codex tool dispatch needed
beyond the standard reviewer codex at D1 stage 3 + commit at D1 stage 5.

## Out of scope (deferred)

- ADR amendment: R3 closure is retrospective-item, not architectural.
- block-foundation/RFC.md or registry.test.ts cleanup: archival /
  local-fixture per B4's intentional out-of-scope decision.
- B7-scope (heavy block Astro hydration): separate next PR.
- B6-scope (Wave 4 close ceremony prep): separate next PR.
- Wave 4 plan doc Amendment: NOT needed (B5 fits Stage B re-plan
  exactly as v0.2.1 Driver 1 + Driver 2 already lock).
- Repo-side memory entry: orchestrator-local memory by design.

## Related

- ADR-0011 D6 — codex profile naming canonical (with codex- prefix
  for the 4 new Wave 3 profiles)
- ADR-0013 D4 R3 — codex profile prefix consistency retrospective
- Wave 4 plan v0.2.1 Stage B B5 row (was B5b in original plan; R3
  absorbed into a single PR per user directive 2026-05-04)
- Memory `feedback_lychee_autolink_in_backticks.md` (orchestrator-local;
  authored at this PR's EXECUTE)
- Memory `feedback_codex_profile_prefix.md` (Wave 3 R3 capture
  prior to closure)

## Codex commit (D1 stage 5) staging

Per ADR-0006 D8 explicit-file-list staging: reviewer codex commits
12 files (10 canonical + 1 B4-orphan-leftover + 1 B5 reviewer R1
audit; +1 if R2):

```
git reset HEAD
git add agent-contract.md scripts/render/types.ts \
  scripts/__tests__/generate-configs.test.ts \
  CLAUDE.md AGENTS.md docs/runbooks/codex-tool-invocations.md \
  docs/plans/active.md \
  docs/plans/wave-4-main/B5-codex-prefix-lychee-memory.md \
  docs/audits/codex-runs/2026-05-03-B4-commit.txt \
  docs/audits/codex-runs/2026-05-04-B5-pr-reviewer-55.txt
git diff --cached --stat
git commit -m "..."
```

Lockfile + package.json byte-unchanged.
