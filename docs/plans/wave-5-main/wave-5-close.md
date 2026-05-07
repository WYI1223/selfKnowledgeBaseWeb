# Wave 5 close ceremony — ADR-0019 + active.md repoint

> Wave 5 ✅ FULLY CLOSED ceremony PR. Lands ADR-0019 (status:
> accepted; Wave 5 close authority) + active.md repoint to Wave 6
> plan-draft pending state. 4-stage close evidence (C.1/C.2/C.3/C.4
> handoff packs) is in place. **Per §STOP S5: orchestrator stops
> after this PR ships and reports user "Wave 5 fully closed, what
> next"**.

## title

Land ADR-0019 Wave 5 close ADR (accepted status; 47-PR ratification
table + 4 NEW ADRs + 4 amendments + 9 Phase 2+ deferred items + 8
NEW R23..R30 retrospective candidates + 22 carry-forward R1..R22 +
ADR-0011 D1 linear pipeline 47-PR empirical evaluation + Wave 6
plan-draft handoff pointer). Repoint `docs/plans/active.md` from
"Wave 5 plan v1.3 / Stage C.4 in progress" to "Wave 5 ✅ FULLY
CLOSED 2026-05-07; Wave 6 plan-draft pending". Add Wave 5 ✅
closed line to historical Wave-close paragraph (parallel to Wave
1/2/3/4 lines).

## files

3 files (per simple-D1 docs-only stage close pattern):

1. `docs/decisions/ADR-0019-wave-5-close.md` — **NEW** (~250 LOC).
   Wave 5 close ADR per ADR-0015 shape:
   - D1: 47-PR roster (Pre-A + 4 stages + meta + standards + docs)
   - D2: Wave 5 architecture decisions ratified (4 NEW ADRs +
     4 amendments)
   - D3: Wave 5 → Wave 6/Phase 2+ deferred items (9 items)
   - D4: Wave 5 retrospective items (8 NEW R23..R30 + 22
     carry-forward R1..R22)
   - D5: ADR-0011 D1 linear pipeline 47-PR empirical evaluation
   - D6: Wave 6/Phase 2+ plan-draft handoff
   - Consequences (positive / negative / neutral)
   - Compliance (ADR-0011 D1 KEPT; D9 KEPT canonical scope; D8 R-round budget operative; ADR-0006 v0.2 KEPT)

2. `docs/plans/active.md` — **REWRITE** (substantially shorter
   post-close). Repoint to Wave 6 plan-draft pending; add Wave 5
   close line to historical Wave-close paragraph; preserve
   Wave 1+2+3+4+5 ADR roster reference list.

3. `docs/plans/wave-5-main/wave-5-close.md` — **NEW** (this PR.md
   self).

## D2 trigger judgment

Row 4 (NEW ADR) FIRES per ADR-0007 D2 trigger judgment table.
Stage 4 PRE-COMMIT CLAUDE REVIEW fires per Row 4. PRE-COMMIT
CLAUDE REVIEW pattern same as Wave 4 close ADR-0015 PR (orchestrator-self
review post codex-pr-reviewer-55 PASS).

## ui_touch

`false` — pure docs / ADR file only; no source code change. CI
gates auto-skip per ADR-0011 D9.6.

## e2e_smoke

N/A (ui_touch=false; auto-skip per ADR-0011 D9.6).

## decision-log

### Decision 1 — Wave 5 close authority via NEW ADR-0019

ADR-0019 status: accepted. Lands in this PR per ADR-0015 (Wave 4
close) shape precedent. Sets the canonical Wave 5 ratification
record + Wave 6 handoff pointer.

### Decision 2 — 4 audit codex dispatches deferred to standalone PR (or Wave 6 retrospective)

User T4 instruction mentioned 4 audit codex dispatches (structure /
perf / mdx-doctor / 一项可选). Given session-clock constraint at
Wave 5 close 时 + the 47-PR roster's 4-stage handoff packs already
provide substantial close evidence + Stage C.3 + C.4 handoff packs
catalog 7 broader-suite Playwright flakes (R23 candidate) + decision
retro items R24..R30, the 4 audit codex dispatches are a "complete
the lap" nice-to-have NOT blocking Wave 5 close. Deferred to either:

- Standalone audit-only PR post Wave 5 close, OR
- Folded into Wave 6 plan-draft as opening retrospective dispatch

This deferral is recorded as Wave 6 retrospective candidate R31.

### Decision 3 — active.md substantial rewrite

Pre-close active.md = 221 lines with Wave 5 specific catalog +
Stage C.2 close commentary + R14 discipline references. Post-close
active.md ~80 lines: Wave 5 ✅ closed summary + Wave 6 next-pointer +
9 Phase 2+ deferred items + R23..R30 retrospective candidate list +
historical Wave 1/2/3/4/5 closed-paragraph + ADR roster (Wave 5
adds ADR-0016/0017/0018/0019).

## acceptance

```bash
# AC-1: ADR-0019 file exists + status: accepted
test -f docs/decisions/ADR-0019-wave-5-close.md
grep -cE '^\| 状态 \| accepted' docs/decisions/ADR-0019-wave-5-close.md
# Expected: 1
```

```bash
# AC-2: 47-PR roster table in ADR-0019
grep -cE '^\| #(50|96)' docs/decisions/ADR-0019-wave-5-close.md
# Expected: ≥2 (entry endpoints)
```

```bash
# AC-3: active.md repointed
grep -cE 'Wave 5 ✅ FULLY CLOSED' docs/plans/active.md
# Expected: ≥1
grep -cE 'Wave 6 plan-draft pending' docs/plans/active.md
# Expected: ≥1
```

```bash
# AC-4: Wave 5 closed line in historical Wave-close paragraph
grep -cE 'Wave 5 ✅ closed' docs/plans/active.md
# Expected: ≥1
```

```bash
# AC-5: ADR-0019 in ADR roster
grep -cE '\[ADR-0019\]\(\.\./decisions/ADR-0019-wave-5-close\.md\)' docs/plans/active.md
# Expected: ≥1
```

```bash
# AC-6: scope-fence — exactly 3 files
git diff --name-only main..HEAD | sort
# Expected:
# docs/decisions/ADR-0019-wave-5-close.md
# docs/plans/active.md
# docs/plans/wave-5-main/wave-5-close.md
```

```bash
# AC-7: pnpm check exit 0
pnpm check
```

```bash
# AC-8: anti-leak (char-class [:])
git diff main..HEAD -- ':!docs/plans/wave-5-main/wave-5-close.md' | grep -cE '^\+.*(playwright_spec[:]|screenshot_archive[:]|e2e_smoke[:])' || true
# Expected: 0
```

## Out-of-scope

- **4 audit codex dispatches** (structure / perf / mdx-doctor +
  one optional): deferred per Decision 2.
- **Wave 6 plan-draft authoring**: separate session per user
  gatekeeper; this PR only handoff-points active.md to "Wave 6
  plan-draft pending".
- **Phase 2+ deferred items implementation**: 9 items per ADR-0019
  D3 are Phase 2+ scope.

## Related

- [ADR-0015 Wave 4 close](../../decisions/ADR-0015-wave-4-close.md) — precedent for Wave-close ADR shape
- [ADR-0019 Wave 5 close (this PR)](../../decisions/ADR-0019-wave-5-close.md)
- [Stage C.1/C.2/C.3/C.4 handoff packs](.) — 4-stage close evidence
- [Wave 5 plan v1.3](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md)

## §STOP S5

Per orchestrator §STOP S5: after this PR ships, **stop and report
user "Wave 5 fully closed, what next"**.
