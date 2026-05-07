# Wave 6 Stage B.1 — ADR-0018 v0.6 amendment (ApiAdapter promoted to default)

> **Wave 6 Stage B 1st PR**. Pure ADR amendment + Wave 6 Stage B 5-PR
> sequence lock. Per user direction post Wave 5 close 2026-05-07
> ("phase 2 做完, 直接 B"); Wave 5 Stage A 客户端 hydration bridge
> 因 Astro `client:only="react"` hydration timing flake 放弃，Stage B
> 服务端写回方案为正解。**D2 row 4 (NEW ADR amendment) FIRES** →
> PRE-COMMIT CLAUDE REVIEW required.

## title

Append `## v0.6 Amendment (Wave 6 Stage B — ApiAdapter promoted to
default; path-(b) Astro hybrid lock)` section to
`docs/decisions/ADR-0018-v2-visual-migration.md` locking 8 new decisions
(D9-D16): ApiAdapter promoted from Phase 2+ forward-stub to Wave 6
first-class default consuming D8 **path-(b) Astro hybrid endpoint** at
`apps/site/src/pages/api/notes/[...slug].ts` (path-(a) separate apps/api
package stays Phase 3+); D8 path-(b) "Astro static incompat" rejection
retract (Astro 5.x `output:'hybrid'` 原生支持 mixed static + server);
Astro hybrid output config flip in apps/site; ApiAdapter implementation
contract; server endpoint contract; EditorShellMount adapter selection
(ApiAdapter primary + LocalStorageAdapter fallback); 5-PR Stage B
sequence (B.1 this + B.2 apps/site hybrid + endpoint + B.3 ApiAdapter
impl + B.4 mount wire + B.5 close); NoteState shape change (layoutEpoch)
stays deferred; Stage A retroactively superseded. Bump status from
`proposed (v0.1.1)` to `accepted (v0.6)`.

## files

4 files (~250-300 LOC total; expanded post-R2 review for cross-doc supersede consistency):

1. `docs/decisions/ADR-0018-v2-visual-migration.md` — **MODIFY**
   (~150 LOC additive). Append `## v0.6 Amendment` section after
   line 464 (before `## Acceptance criteria`); bump status line.

2. `docs/decisions/ADR-0019-wave-5-close.md` — **MODIFY** (~1 LOC).
   D3 deferred item #2 ApiAdapter implementation updated to reflect
   ✅ promoted to Wave 6 Stage B per v0.6 amendment cite (path-(b)
   Astro hybrid; separate apps/api stays Phase 3+).

3. `docs/plans/active.md` — **MODIFY** (~1 LOC). Same update to
   "Wave 5 → Wave 6/Phase 2+ deferred items" item #2 cross-ref.

4. `docs/plans/wave-6-main/wave-6-stage-b-1-adr-0018-amendment.md` —
   **NEW** (PR.md self).

## D2 trigger judgment

Row 4 (NEW ADR amendment) FIRES per ADR-0007 D2 trigger judgment.
Stage 4 PRE-COMMIT CLAUDE REVIEW MUST FIRE per ADR-0011 D2 trigger
judgment Row 4. Pattern same as Wave 5 v0.5 amendment PR (orchestrator-self
PRE-COMMIT review post codex-pr-reviewer-55 PASS).

## ui_touch

`false` — pure docs / ADR file only; no source code change. CI gates
auto-skip per ADR-0011 D9.6.

## e2e_smoke

N/A (ui_touch=false; auto-skip).

## decision-log

### Decision 1 — Append amendment in-doc (NOT separate ADR file)

ADR-0018 v0.5 was a previous in-doc amendment. Continuing the
pattern. Alternative (NEW ADR-0020 file) considered + rejected:
amendments to interface 冻结 belong in the same doc to keep the
冻结 visible-with-evolution trail.

### Decision 2 — Stage B 5-PR sequence locked at v0.6 D14

5 PRs: B.1 (this) ADR amendment / B.2 apps/site hybrid + endpoint /
B.3 ApiAdapter impl / B.4 mount wire / B.5 close. Sequence locked
in ADR so each subsequent PR has clear scope per D14 row.

### Decision 3 — Stage A retroactive supersede recorded as R32

Stage A 在 Wave 5 close 后 2026-05-07 短暂 attempted; abandoned
due to flake. Recorded in v0.6 D16 as Wave 6 R32 retrospective
candidate. Working tree reverts cleanly.

### Decision 4 — NoteState layoutEpoch stays deferred

v0.6 amendment does NOT add layoutEpoch to NoteState. Stays
ADR-0019 D3 deferred item #1. Future amendment v0.7+ can do it
when needed.

### Decision 5 — Wave 6 plan-draft NOT required at B.1 (per simple R14 reading)

ADR-0015 R14 says cross-Wave reframe needs plan-draft amendment.
Wave 6 Stage B is single-stage scope locked entirely in this ADR
v0.6 amendment + 5-PR sequence (D14). User explicitly directed
"直接 B" post Wave 5 close; treating as architectural amendment-
driven 5-PR spike. Wave 6 plan-draft can be retrospective at
Wave 6 close.

## acceptance

```bash
# AC-1: ADR-0018 status bumped to accepted (v0.6)
grep -cE '^\| 状态 \| accepted \(v0\.6' docs/decisions/ADR-0018-v2-visual-migration.md
# Expected: 1
```

```bash
# AC-2: v0.6 amendment section present + 8 D-decisions D9..D16
grep -cE '^## v0\.6 Amendment' docs/decisions/ADR-0018-v2-visual-migration.md
# Expected: 1
grep -cE '^### v0\.6 D(9|10|11|12|13|14|15|16)' docs/decisions/ADR-0018-v2-visual-migration.md
# Expected: 8
```

```bash
# AC-3: ApiAdapter executable class signature documented in D11
grep -cE 'export class ApiAdapter implements NoteSaveAdapter' docs/decisions/ADR-0018-v2-visual-migration.md
# Expected: ≥1
```

```bash
# AC-4: 5-PR Stage B sequence table in D14
grep -cE 'B\.(1|2|3|4|5)' docs/decisions/ADR-0018-v2-visual-migration.md
# Expected: ≥5 (one mention per PR row)
```

```bash
# AC-5: pnpm check exit 0
pnpm check
```

```bash
# AC-6: scope-fence — exactly 4 files (post-R2 cross-doc supersede expansion)
git diff --name-only main..HEAD | sort
# Expected:
# docs/decisions/ADR-0018-v2-visual-migration.md
# docs/decisions/ADR-0019-wave-5-close.md
# docs/plans/active.md
# docs/plans/wave-6-main/wave-6-stage-b-1-adr-0018-amendment.md
```

```bash
# AC-7: anti-leak (char-class [:])
git diff main..HEAD -- ':!docs/plans/wave-6-main/wave-6-stage-b-1-adr-0018-amendment.md' | grep -cE '^\+.*(playwright_spec[:]|screenshot_archive[:]|e2e_smoke[:])' || true
# Expected: 0
```

## Out-of-scope

- **B.2-B.5 implementation**: subsequent PRs per D14 5-PR sequence.
- **Wave 6 plan-draft full ceremony**: per Decision 5; Stage B is
  single-stage architectural amendment-driven spike.
- **NoteState layoutEpoch field add**: stays deferred per Decision 4.
- **Production deployment adapter** (Cloudflare/Vercel/Netlify):
  Phase 3+ scope per v0.6 D10 deployment adapter prose.
- **Multi-user auth boundary**: Phase 3+ scope per v0.6 D12 prose.

## Related

- [ADR-0018 D8 NoteSaveAdapter 接口冻结](../../decisions/ADR-0018-v2-visual-migration.md) — original Pre-A4 lock that v0.6 amends
- [ADR-0019 Wave 5 close D3 deferred items](../../decisions/ADR-0019-wave-5-close.md) — item #2 ApiAdapter is exactly what v0.6 promotes
- [C.4-1 PR.md](../wave-5-main/C.4-1-note-save-adapter.md) — original COMMENT-only forward-stub (v0.6 D11 replaces with executable class)
- [C.4-prelude PR.md](../wave-5-main/C.4-prelude-editor-scaffold.md) — original LocalStorageAdapter MVP wire
- Sister PRs: B.2 (apps/site Astro hybrid + path-(b) server endpoint at `apps/site/src/pages/api/notes/[...slug].ts` + filesystem write-back), B.3 (ApiAdapter impl in @skb/editor-shell consuming path-(b) endpoint), B.4 (EditorShellMount wire to ApiAdapter primary + LocalStorageAdapter fallback), B.5 (Stage B close)
