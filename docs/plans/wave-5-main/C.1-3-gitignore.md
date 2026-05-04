# Wave 5 C.1-3 — apps/site/.gitignore housekeeping + Stage C.1 close

| 字段 | 值 |
|---|---|
| 状态 | locked v1.0 |
| Wave | Phase 1 Wave 5 Stage C.1 (3rd of 3 PRs) |
| 起步 HEAD | `6b350d6` (Wave 5 C.1-2 squash; PR #56) |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx) |
| 触发 | Wave 5 plan v1.0 §455-463 row C.1-3 + ADR-0015 D3 (Stage C residue) + D15 handoff pack mandatory |
| 替代 | 不替代任何 ADR; this is housekeeping + Stage close pack |

## title

Subject: "Wave 5 C.1-3 — apps/site/.gitignore housekeeping + Stage C.1 close handoff pack"

## files

Whitelist (3 files):

1. `apps/site/.gitignore` (NEW; 2 lines: 1 comment + `test-results/`)
2. `docs/plans/wave-5-main/C.1-3-gitignore.md` (this PR.md)
3. `docs/plans/wave-5-main/C.1-handoff-pack.md` (NEW; Stage C.1 close handoff pack per Wave 5 plan v1.0 D15; ≤ 200 LOC)

Forbidden (out-of-scope):
- Root `.gitignore` (NOT touched; per-package gitignore preferred per Wave 1+2 convention)
- Any `packages/**` / `apps/site/src/**` / `docs/decisions/**` / ADR files
- `pnpm-lock.yaml`

LOC budget: ~5 LOC for the gitignore file + ~150 LOC for the handoff pack + this PR.md ≈ total impl diff ~5 LOC + 2 NEW docs.

## test_cases

1. `git check-ignore -v apps/site/test-results/.last-run.json` → matches `apps/site/.gitignore:2:test-results/`
2. `git status --short --branch` after the gitignore land MUST not show `?? apps/site/test-results/` line (untracked Playwright artifacts now ignored)

## contracts_affected

None. `apps/site/.gitignore` is a per-package config file, not a contract surface.

## adr_touched

None. ADR-0015 D3 already authorizes this housekeeping; no amendment required.

## acceptance

- **AC#1 — apps/site/.gitignore exists with `test-results/` entry**:
  - `test -f apps/site/.gitignore` → exit 0
  - `grep -E '^test-results/?$' apps/site/.gitignore` → matches

- **AC#2 — gitignore is effective**:
  - `git check-ignore -v apps/site/test-results/.last-run.json` → exits 0 with reference to `apps/site/.gitignore:N:test-results/`

- **AC#3 — git status clean post-land**:
  - `git status --short` (on branch with this PR's commit) MUST NOT contain `?? apps/site/test-results/`

- **AC#4 — Stage C.1 handoff pack landed**:
  - `test -f docs/plans/wave-5-main/C.1-handoff-pack.md` → exit 0
  - `wc -l docs/plans/wave-5-main/C.1-handoff-pack.md` → ≤ 200 LOC (per Wave 5 plan v1.0 D15)
  - `grep -E '^## ' docs/plans/wave-5-main/C.1-handoff-pack.md` → matches the 4 mandatory sections (决策摘要 / 未决风险 / 测试状态 / 开放依赖)

- **AC#5 — pnpm check unaffected**:
  - `pnpm check:affected` PASS (no source change; gitignore is config-only)

- **AC#6 — Lychee link-check pre-empt clean**:
  - Orchestrator-self prose-walk on this PR.md + handoff pack: zero autolinks-in-backticks, zero `:line` suffixes, zero `npmjs.com` URLs, zero markdown-link tilde paths (per the 4 lychee-pitfall memories)
  - CI link-check job is canonical

- **AC#7 — Wave 5 plan v1.0 §455-463 row C.1-3 honored**:
  - PR.md cross-references `Wave 5 plan v1.0 §455-463`
  - Handoff pack cross-references `Wave 5 plan v1.0 D15` + `D3 escape valve`

## verification required

| Stage | Item | Command | Expected |
|---|---|---|---|
| 3 / 4 / 6 | gitignore file | `cat apps/site/.gitignore` | matches "test-results/" line |
| 3 / 4 / 6 | gitignore effective | `git check-ignore -v apps/site/test-results/.last-run.json` | exit 0 |
| 3 / 4 / 6 | git status clean | `git status --short \| grep -F 'test-results' \| wc -l` | `0` |
| 3 / 4 / 6 | handoff pack exists | `test -f docs/plans/wave-5-main/C.1-handoff-pack.md && wc -l docs/plans/wave-5-main/C.1-handoff-pack.md` | LOC ≤ 200 |
| 3 / 4 / 6 | handoff pack 4 sections | `grep -cE '^## (决策摘要\|未决风险\|测试状态\|开放)' docs/plans/wave-5-main/C.1-handoff-pack.md` | `4` |
| 3 / 4 / 6 | check:affected | `pnpm check:affected` | PASS |
| 3 / 4 / 6 | Lychee link-check | `pnpm link-check` (CI) OR orchestrator prose-walk per AC#6 | PASS in CI |

## Plan-challenger absorbtion

NOT applicable (implementation/housekeeping PR; per Wave 5 plan v1.0 D7 plan-challenger applies to Pre-A ADR-class locks only). Stage 3 codex-pr-reviewer-55 + orchestrator-self pre-Stage-5 walk provide review coverage.

## R14 self-check

Per Wave 5 plan v1.0 D4:

1. ✅ In Stage C.1 scope-fence whitelist (D12)
2. ✅ ADR-0015 D3 authorizes; no NEW ADR needed
3. ✅ LOC ~5 + 2 NEW docs (handoff pack + PR.md) ≤ R23 LOC discipline
4. ✅ No new package; no cross-package boundary change
5. ✅ Per-package gitignore (NOT root) matches Wave 1+2 convention
6. ✅ Handoff pack (D15) bundled into close PR — single trip cost; matches Wave 4 close-prep precedent (B6 PR #46)
7. ✅ Stage close = MVP-judgment escape valve (D3); orchestrator MUST stop after C.1-3 merge

R14 self-check 7/7 PASS. No reframe; pure scope refinement.

## D2 trigger judgment

NONE. Standard PR.
- Row 1 (CONTRACT.md sync): no contract touched
- Row 2 (package add/remove): no
- Row 4 (NEW ADR / amendment): no
- Row 5 (cross-package boundary): no
- Row 8 (CI / deploy / auth / security): no

Stage 4 PRE-COMMIT CLAUDE REVIEW NOT required.

## Risk register

1. `.gitignore` precedence: per-package gitignore is additive to root; no conflict with root rules. Verified locally `git check-ignore -v` reports the per-package source as the authority.
2. `test-results/` directory name collision: Playwright canonical output dir is `test-results/`. No other tooling in this repo writes to that name. Low risk.
3. Future tooling adding more apps/site-local artifacts: this gitignore is a starting point; future PRs may extend it (e.g., `playwright-report/` if HTML reporter is enabled). Out of scope for C.1-3.
4. Handoff pack staleness: D15 codifies that the next session's first action is to re-read the handoff pack. Memory `feedback_phase0_orchestration` discipline applies.

## Out of scope (deferred)

- Stage C.2 (mdx-bridge serialize → editor-shell grid → drag/drop UX → resize → ADR-0014 v0.5 → playwright; 12 PRs locked at v1.0 §465-481). Begins after user MVP-judgment ack at Stage C.1 close.
- Stage C.3 (OKLCH + fonts + 8 kind hue + prose customization; 5 PRs at v1.0 §484-494)
- Stage C.4 (NoteSaveAdapter + /notes/[slug]/edit + BlockRegistry wire + save/load + e2e; 5 PRs at v1.0 §496-506)
- Wave 5 close ceremony (ADR-0019; happens at Stage C.4 close OR escape valve)
- Root `.gitignore` cleanup (NOT touched per per-package gitignore convention)

## executor

- Stage 1 PLAN: orchestrator-self (this draft).
- Stage 2 EXECUTE: orchestrator-self (gitignore + handoff pack already drafted alongside PR.md per bootstrap-flavored housekeeping convention; per Wave 5 plan v1.0 row C.1-3 executor field = orchestrator-self).
- Stage 3 REVIEW: codex-pr-reviewer-55. 8-class checklist + acceptance match.
- Stage 4 PRE-COMMIT CLAUDE REVIEW: NOT required (Standard PR).
- Stage 5 COMMIT: orchestrator-self with ADR-0006 D8 explicit-file-list staging (bootstrap-flavored housekeeping; matches Wave 4 B6 close-ceremony-prep precedent).
- Stage 6 ACCEPT: pr-writer second invocation.

## Codex commit (D1 stage 5) staging

Pre-list (3 files; orchestrator self-stages):

```bash
git reset HEAD
git add \
  apps/site/.gitignore \
  docs/plans/wave-5-main/C.1-3-gitignore.md \
  docs/plans/wave-5-main/C.1-handoff-pack.md
git diff --cached --name-only | sort
```

Expected output (sorted):
```
apps/site/.gitignore
docs/plans/wave-5-main/C.1-3-gitignore.md
docs/plans/wave-5-main/C.1-handoff-pack.md
```

NOT to stage:
- `apps/site/test-results/` (the directory itself; now ignored — should not appear in `git status` output post-add anyway)
- `pnpm-lock.yaml` (no dep change)

## Related

- [Wave 5 plan v1.0](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) — §455-463 row C.1-3 + D3 escape valve + D15 handoff pack
- [ADR-0015 D3](../../decisions/ADR-0015-wave-4-close.md) — Stage C residue authority for `apps/site/test-results/` housekeeping
- [Wave 5 C.1-1 PR #55](https://github.com/WYI1223/selfKnowledgeBaseWeb/pull/55) — squash HEAD `44a2e53`; plugin placeholder + ADR-0014 v0.4
- [Wave 5 C.1-2 PR #56](https://github.com/WYI1223/selfKnowledgeBaseWeb/pull/56) — squash HEAD `6b350d6`; PDF dark-theme fix + C-4 NO-OP
- [Stage C.1 handoff pack](C.1-handoff-pack.md) — companion file (this PR)
