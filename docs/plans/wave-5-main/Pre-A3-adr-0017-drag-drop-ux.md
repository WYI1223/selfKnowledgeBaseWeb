# Pre-A3 — ADR-0017 drag/drop UX design lock + plan-challenger 4-round

> **Wave 5 Pre-A ADR design-lock PR.** Authors `docs/decisions/ADR-0017-drag-drop-ux.md`
> (status: proposed) per Wave 5 plan v0.2 Pre-A3 scope + granularity doc v0.3.4 § "4 种
> Drop 语义" + § "Drop 视觉" + § "命中检测算法" + § "源块 drag 时 lift" body (旧编号
> 0013 → 新编号 0017 per plan v0.2 D5 ADR 编号映射表). Locks 4 边缘对称 drop modes
> (split-left/right 切 host + split-top/bottom 插行 + empty + none) + EDGE_W = 28px
> (= 2 * GAP=14 数学对应) + tiebreak 距离公式 (overlapping edge rects in gap region) +
> 静态底层 + per-affected-block outline overlay 方案 A (3 类 outline) + 命中算法选项 1
> (预计算 edge rects + 距离 tiebreak; 选项 2/3 留 Phase 2+) + 源块 lift 模式 +
> useAutoRowSpan integration (consume ADR-0016 D3) + 全局 Esc 取消 + col-ruler +
> drag-ghost + drop-pulse 720ms. Updates `docs/decisions/README.md` ADR roster
> (add ADR-0017). Plan-challenger codex 4-round per ADR-0007 D5 + R13 + Wave 5 Pre-A2
> ADR-0016 12/12 absorbed precedent. Bundles Pre-A2 codex pr-reviewer-55 R1 (FAIL)
> + R2 (PASS) audit log archives per Pre-A archive-bundle pattern. D2 row 4 HIT →
> stage 4 PRE-COMMIT CLAUDE REVIEW fires.

## title

Wave 5 — author ADR-0017 drag/drop UX (4 边缘对称 + EDGE_W=28 + tiebreak + outline
overlay 方案 A + 命中选项 1 + lift mode + useAutoRowSpan integration + Esc cancel +
col-ruler + drag-ghost + drop-pulse) status proposed + update `docs/decisions/README.md`
ADR roster (add ADR-0017) + dispatch plan-challenger codex 4-round (Pre-A3 ADR
design-lock per Wave 5 Pre-A2 ADR-0016 12/12 precedent) + absorb verdicts → ADR-0017
status proposed lock + bundle Pre-A2 codex pr-reviewer-55 R1+R2 audit log archives
per Pre-A archive-bundle pattern. Closes Wave 5 plan v0.2 Pre-A3 acceptance.

## files

Modified (6 files):

- `docs/decisions/ADR-0017-drag-drop-ux.md` — NEW; ~450 LOC ADR with D1-D12 (4 edge
  modes + EDGE_W=28 + tiebreak 距离公式 + outline overlay 方案 A 3 类 + 命中选项 1
  with 选项 2/3 备案 + 源块 lift mode + useAutoRowSpan ADR-0016 D3 integration + Esc
  cancel + col-ruler + size-tooltip + drag-ghost per-kind + drop-pulse 720ms +
  layoutEpoch ADR-0016 D12 integration) + AC#1-#12 + Plan-challenger absorbtion table
  (post-dispatch fill)
- `docs/decisions/README.md` — ADR roster updated: NEW row for ADR-0017 (status:
  proposed)
- `docs/audits/codex-runs/2026-05-04-Pre-A3-plan-challenge.txt` — truncated archive of
  plan-challenger codex dispatch (per R7 /tmp piping + R21 grep-for-verdict if log >
  500 KB; full raw at `/tmp/codex-runs/2026-05-04-Pre-A3-plan-challenge.txt`)
- `docs/audits/codex-runs/2026-05-04-Pre-A2-pr-reviewer-55-r1.txt` — bundled Pre-A2 R1
  codex review audit log (FAIL with 4 findings: TC2 regex / line 542 broken markdown
  link / PR.md ~450 LOC drift / sister-doc summary 缺 2; per Pre-A archive-bundle
  pattern)
- `docs/audits/codex-runs/2026-05-04-Pre-A2-pr-reviewer-55-r2.txt` — bundled Pre-A2 R2
  codex review audit log (PASS post R-fix; ADR-0006 8-point clean; commit a5bae3f
  + push; per Pre-A archive-bundle pattern)
- `docs/plans/wave-5-main/Pre-A3-adr-0017-drag-drop-ux.md` — this PR.md (self-listed
  per ADR-0006 D8 strict whitelist)

= **6 files total** (canonical: this `## files` section). +1 vs Pre-A1+Pre-A2 cadence
because Pre-A2 had 2 R-rounds (R1 FAIL + R2 PASS); both audit logs bundled per
archive-bundle pattern (matches Wave 4 Stage A1 multi-R-round bundling).

**Explicitly NOT in `files:`** (verification-only, no edit):

- `docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md` — locked v0.2 at
  Pre-A1 (HEAD `365173e`); Pre-A2 + Pre-A3 不修订 plan; Pre-A5 v1.0 final lock 修订
- `docs/plans/active.md` — Pre-A2 + Pre-A3 squash HEADs will be appended to Wave 5 PR
  roster table by NEXT Pre-A PR (Pre-A4 OR Pre-A5) per archive-bundle pattern
- `packages/block-foundation/CONTRACT.md` — Pre-A2 W5-1 invariant locked; Pre-A3 ADR
  consumes W5-1 但 NOT touch CONTRACT (drag/drop UX 是 editor-shell internal; sister
  CONTRACT W5-2-class invariant 留 Stage C.2 实施 PR scope-fence per Wave 5 plan v0.2
  D12)
- `packages/editor-shell/CONTRACT.md` (assumed not yet exist) — Stage C.2 实施 PR
  create + W5-2 invariant 加; OUT OF SCOPE here
- `packages/editor-shell/src/**/*` — drag/drop hit-test + layoutReducer + useAutoRowSpan
  hook + col-ruler + drag-ghost + drop-pulse implementation 是 Stage C.2 实施 scope;
  ADR lock 仅 schema
- `apps/site/**/*` — Stage C.2 实施 scope (drag-handle source + grid container wrap)
- `pnpm-lock.yaml` / `package.json` — no dep changes
- `apps/site/test-results/` — Stage C.1 housekeeping; out of scope

## test_cases

Pre-A3 is ADR doc design-lock + ADR roster update + audit log archives. Tests are
doc-acceptance assertions, structural shell asserts, repo-hygiene gates.

- **TC1** (ADR-0017 file exists at expected path) Input:
  `test -f docs/decisions/ADR-0017-drag-drop-ux.md && echo OK`. Expected: `OK`.
  Location: shell.
- **TC2** (ADR-0017 status proposed in header table; allow v0.X.X suffix) Input:
  `grep -cE '^\| 状态 \| proposed' docs/decisions/ADR-0017-drag-drop-ux.md`.
  Expected: `1`. Location: shell.
- **TC3** (ADR-0017 contains D1-D12 sections + AC#1-#12 + Plan-challenger
  absorbtion + Compliance + Related) Input:
  `grep -cE '^### D[0-9]+ —|^[0-9]+\. \*\*AC#[0-9]+|^## Plan-challenger codex absorbtion|^## Compliance|^## Related' docs/decisions/ADR-0017-drag-drop-ux.md`.
  Expected: ≥ 27 (12 D + 12 AC + 1 Plan-challenger + 1 Compliance + 1 Related).
  Location: shell.
- **TC4** (ADR-0017 D1 4 modes explicit) Input:
  `grep -cE '^\| `?split-(left|right|top|bottom)`?' docs/decisions/ADR-0017-drag-drop-ux.md`.
  Expected: ≥ 4. Location: shell.
- **TC5** (ADR-0017 D2 EDGE_W = 28 + GAP = 14 数学对应) Input:
  `grep -cE 'EDGE_W = 28|2 \* GAP|EDGE_W = 2|GAP = 14' docs/decisions/ADR-0017-drag-drop-ux.md`.
  Expected: ≥ 4. Location: shell.
- **TC6** (ADR-0017 D5 选项 1 + 选项 2 + 选项 3 备案) Input:
  `grep -cE '选项 1.*预计算|选项 2.*grid 单元索引|选项 3.*DOM 原生事件' docs/decisions/ADR-0017-drag-drop-ux.md`.
  Expected: ≥ 3. Location: shell.
- **TC7** (ADR-0017 D6 源块 lift 模式 explicit) Input:
  `grep -cE '源块.*lift|drag-start.*视觉消失|无源块 grid|无源块 snapshot' docs/decisions/ADR-0017-drag-drop-ux.md`.
  Expected: ≥ 3. Location: shell.
- **TC8** (ADR-0017 D8 全局 Esc explicit) Input:
  `grep -cE '全局 Esc|Esc 取消|drag-cancel' docs/decisions/ADR-0017-drag-drop-ux.md`.
  Expected: ≥ 3. Location: shell.
- **TC9** (ADR-0017 consumes ADR-0016 W5-1 + D3 + D6 + D12) Input:
  `grep -cE 'ADR-0016 (D3|D6|D12)|W5-1|consume.*ADR-0016' docs/decisions/ADR-0017-drag-drop-ux.md`.
  Expected: ≥ 6. Location: shell.
- **TC10** (README ADR roster includes ADR-0017) Input:
  `grep -cE '^\| \[0017\]\(ADR-0017-drag-drop-ux\.md\)' docs/decisions/README.md`.
  Expected: `1`. Location: shell.
- **TC11** (Plan-challenger absorbtion table populated post-dispatch) Input:
  `awk '/^## Plan-challenger codex absorbtion/,0' docs/decisions/ADR-0017-drag-drop-ux.md | grep -cE '^\| (Q[0-9]+|C[0-9]+) \|'`.
  Expected: ≥ 1 (post-dispatch fill; row NOT marked TBD). Location: shell.
- **TC12** (`pnpm check` exit 0) Input: `pnpm check`. Expected: exit 0 (no source/test
  changes; turbo cache clean). Location: shell.
- **TC13** (link-check via CI) Input: `.github/workflows/link-check.yml` on push (lychee
  CI-only). Expected: workflow `success`. Per memory `feedback_lychee_user_local_paths`
  + `feedback_lychee_autolink_in_backticks`: pre-empt scan run before push. Location:
  GitHub Actions.
- **TC14** (`pnpm-lock.yaml` unchanged) Input: `git diff main -- pnpm-lock.yaml`.
  Expected: empty. Location: shell.
- **TC15** (Plan-challenger audit log archived ≤ 2000 lines) Input:
  `wc -l docs/audits/codex-runs/2026-05-04-Pre-A3-plan-challenge.txt`. Expected:
  `≤ 2000`. Location: shell.
- **TC16** (Pre-A2 R1 + R2 audit log archives bundled at ≤ 2000 lines each) Input:
  `wc -l docs/audits/codex-runs/2026-05-04-Pre-A2-pr-reviewer-55-r1.txt docs/audits/codex-runs/2026-05-04-Pre-A2-pr-reviewer-55-r2.txt | grep -cE ' [0-9]+ docs/audits'`.
  Expected: `2`. Both files exist + line count visible. Location: shell.

## contracts_affected

None at Pre-A3. ADR-0017 is editor-shell internal drag/drop UX 算法 + 视觉 schema lock;
NOT cross-package CONTRACT. ADR-0006 D8 + ADR-0011 D2 row 1 NOT fired here.

ADR-0006 8-point asymmetry audit applicable items:

- **#5 (algorithm + runtime constants 复刻)**: `EDGE_W = 28` + `GAP = 14` + `effectiveEdgeWidth(gap)` helper + tiebreak distance formula + edge rects 公式 必 single-source export from `@skb/editor-shell` (Stage C.2 实施); 此 Pre-A3 lock 仅 schema; consumer-side replication 拒绝
- **#8 (authority 文档改动 → generated/consumed surface 同 commit sync)**: ADR-0017 NEW = authority; generated surface = `docs/decisions/README.md` ADR roster row; sync 在 same commit (per file list)

ADR-0006 8-point items #1-#4 + #6-#7 N/A (Pre-A3 is doc-only; no schema field add /
status code / Zod / try-catch / cross-package CONTRACT touch).

## adr_touched

- **ADR-0017** (NEW; status proposed): Pre-A3 design-lock; this PR creates ADR-0017
- ADR-0016 (existing): forward-pointer in ADR-0017 D3+D6+D7+D9+D12 (consume W5-1 +
  D12 layoutEpoch + COL_SNAPS + effectiveColSnaps + useAutoRowSpan); ADR-0016 content
  unchanged
- ADR-0014 (existing): forward-pointer in ADR-0017 prose (HeavyBlockBoundary skeleton
  during drag transit; v0.5 amendment 留 Stage C.2 实施); ADR-0014 content unchanged

## acceptance

1. **ADR-0017 committed** at `docs/decisions/ADR-0017-drag-drop-ux.md` with status
   `proposed` (per Wave 5 plan v0.2 Pre-A3 scope + Wave 4 Pre-A2 ADR-0014 +
   Wave 5 Pre-A2 ADR-0016 status precedent — proposed at design lock; accepted at
   Stage close ratification) — TC1+TC2 evidence.
2. **D-list D1-D12 + AC#1-#12 + Plan-challenger absorbtion + Compliance + Related**
   sections all present — TC3 evidence.
3. **D1 4 mode explicit** (split-left/right/top/bottom + empty + none) — TC4 evidence.
4. **D2 EDGE_W = 28 (= 2 * GAP=14) 数学对应锁** explicit — TC5 evidence.
5. **D5 命中选项 1 + 选项 2 + 选项 3 备案 explicit** (Phase 2+ 性能优化路径
   well-defined) — TC6 evidence.
6. **D6 源块 lift 模式 explicit** (drag-start 视觉消失 + 落点判定基于无源块 snapshot;
   v0.3 user 共识 vs v2 demo 占位灰块) — TC7 evidence.
7. **D8 全局 Esc 取消 explicit** (drag-cancel rollback to drag-start snapshot;
   layoutEpoch unchanged) — TC8 evidence.
8. **ADR-0017 consumes ADR-0016 W5-1 + D3 + D12 cross-references explicit** (drag/drop
   UX 与 grid 数据模型边界清晰) — TC9 evidence.
9. **ADR roster updated**: ADR-0017 added to `docs/decisions/README.md` index — TC10
   evidence.
10. **Plan-challenger codex round dispatched** + absorbtion table populated per
    ADR-0007 D5 + R13 + Wave 5 Pre-A2 ADR-0016 12/12 absorbed precedent — TC11
    evidence.
11. **`pnpm check` exit 0** (turbo cache clean; no source change in Pre-A3) — TC12
    evidence.
12. **Link-check passes via CI** (lychee pre-empt scan run before push;
    `<X>` backticked placeholders Wave 4 precedent) — TC13 evidence.
13. **`pnpm-lock.yaml` unchanged** — TC14 evidence.
14. **Plan-challenger audit log archived ≤ 2000 lines** (R7 piping + R21
    grep-for-verdict if > 500 KB) — TC15 evidence.
15. **Pre-A2 R1 + R2 audit log archives bundled** (per Pre-A archive-bundle pattern;
    R1 FAIL with 4 findings 历史记录; R2 PASS commit a5bae3f + push) — TC16 evidence.
16. **PR.md self-listed** per ADR-0006 D8 strict whitelist — files list contains this
    PR.md.
17. **D2 trigger Row 4 (NEW ADR-0017) HIT; Row 1 NO** correctly identified +
    stage 4 PRE-COMMIT CLAUDE REVIEW fires (drag/drop UX 是 editor-shell internal,
    sister-doc-sync 留 Stage C.2 实施 PR per scope-fence) — `## D2 trigger judgment`
    section evidence.
18. **ADR-0006 8-point asymmetry audit** applicable items #5 + #8 walked at
    `## contracts_affected`; items #1-#4 + #6 + #7 N/A (doc-only).
19. **Orchestrator-self acceptance** confirms Wave 5 plan v0.2 Pre-A3 scope honored:
    granularity doc v0.3.4 § 0013 body + § 0014 modal canvas (NOT 实施) + § "命中检测
    算法" 翻译到 ADR-0017 (ADR 编号映射表 D5 enforced; body 旧 0013 → ADR file 新 0017)
    + plan-challenger 4-round mandatory + ADR consumes ADR-0016 W5-1 + D12 layoutEpoch
    + COL_SNAPS + effectiveColSnaps + D3 useAutoRowSpan 全 cross-reference.

## D2 trigger judgment (orchestrator-locked at PLAN)

- **Row 1** (CONTRACT change): NO — ADR-0017 是 editor-shell internal drag/drop UX
  schema; NOT cross-package CONTRACT. block-foundation/CONTRACT.md 不动 (Pre-A2 W5-1
  足够; W5-2 invariant 在 Stage C.2 实施 PR 创建 editor-shell CONTRACT.md 时加).
- **Row 2** (package add): NO. No new `package.json`; no `pnpm-lock.yaml` change.
- **Row 4** (NEW ADR): **HIT** — `docs/decisions/ADR-0017-drag-drop-ux.md` is NEW
  status proposed per Wave 5 plan v0.2 Pre-A3 scope.
- **Row 5** (cross ≥3 packages): NO — root + docs only.
- **Row 8** (CI/build/deploy/auth/security): NO.

→ **D1 stage 4 PRE-COMMIT CLAUDE REVIEW fires** (Row 4 HIT; NEW ADR triggers
mandatory orchestrator-self review). Walk acceptance bullets 1-19 + verify ADR-0006
8-point checklist items #5 + #8 + verify plan-challenger absorbed + verify Pre-A2
audit log archives bundled.

## executor

ADR design-lock PR (matches Wave 5 Pre-A2 ADR-0016 precedent).

- **PLAN**: orchestrator-self (this PR.md). pr-writer subagent NOT dispatched.
- **Plan-challenger codex round (PRE-LOCK)**: dispatched 2026-05-04 via `codex exec
  --yolo --profile plan-challenger ...`; 4-round style. Wave 5 Pre-A2 precedent: 12
  challenges. Audit log archived per R7+R21.
- **EXECUTE**: orchestrator-self. ~450 LOC ADR + ~2 LOC README rows + 3 audit log
  archives (Pre-A3 plan-challenger + Pre-A2 R1 + Pre-A2 R2).
- **REVIEW**: codex `codex-pr-reviewer-55`. Audit log: `/tmp/codex-runs/2026-05-04-Pre-A3-pr-reviewer-55.txt`
  raw + curated archive in NEXT Pre-A PR per archive-bundle pattern.
- **PRE-COMMIT CLAUDE REVIEW**: orchestrator-self. D2 row 4 HIT → mandatory. Walk
  acceptance bullets 1-19 + ADR-0006 8-point checklist items #5+#8 + verify
  plan-challenger absorbtion table + verify Pre-A2 R1+R2 archives bundled.
- **COMMIT**: codex `codex-pr-reviewer-55` per ADR-0011 D1 stage 5 (PASS verdict 后
  commit + push; per ADR-0006 D8 explicit-file-list staging).
- **ACCEPT**: pr-writer Claude subagent (second invocation; verifies the diff matches
  locked acceptance + scope creep / drop check + plan-challenger absorbtion +
  Pre-A2 R1+R2 archives bundled).

## Out-of-scope (explicitly deferred)

- **Pre-A4 ADR-0018 v2 视觉 migration + save-path 接口冻结** — sequential per
  ADR-0011 D1; happens AFTER Pre-A3 merges.
- **Pre-A5 Wave 5 plan v1.0 final lock** — sequential PR after Pre-A4.
- **Stage C.2 实施** — happens AFTER Pre-A5 v1.0 lock per R14 discipline:
  - `packages/editor-shell/src/**/*` drag/drop hit-test + layoutReducer + useAutoRowSpan
    + col-ruler + drag-ghost + drop-pulse implementation
  - `packages/editor-shell/CONTRACT.md` (NEW) + W5-2 invariant
  - apps/site `<div class="skb-grid">` wrap + drag-handle source
  - ADR-0014 v0.5 amendment (HeavyBlockBoundary dims grid context 联动)
  - design-tokens GAP token + accent token (Stage C.3 ADR-0018; consumed by drag/drop
    UX visual)
- **Modal canvas drag/drop UX** (granularity 旧 ADR-0014 = Wave 5+ ADR-0019+) — Phase 2+
- **Touch / mobile drag** — OUT OF SCOPE; Wave 5 仅 desktop 鼠标拖
- **协同/多人编辑 CRDT/OT** — OUT OF SCOPE; Wave 5 single-user 单 session 假设
- **`docs/plans/active.md` Wave 5 PR roster Pre-A3 squash HEAD** — picked up by
  Pre-A4 OR Pre-A5 per archive-bundle pattern

## Related

- [ADR-0017 drag/drop UX (this PR)](../../decisions/ADR-0017-drag-drop-ux.md) — the
  ADR being design-locked
- [Wave 5 plan v0.2 Pre-A3 scope](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md)
  — explicit authorization for Pre-A3 work + ADR 编号映射表 D5 source
- [ADR-0016 grid 数据模型](../../decisions/ADR-0016-grid-data-model.md) — Pre-A2
  design-lock; W5-1 + D12 layoutEpoch + COL_SNAPS + effectiveColSnaps + useAutoRowSpan
  consumed by ADR-0017
- [ADR-0015 D6 Wave 5 plan-draft handoff](../../decisions/ADR-0015-wave-4-close.md)
  — Wave 5 deferred items binding (drag/drop forward to Wave 5 Stage C.2)
- [ADR-0014 HeavyBlockBoundary](../../decisions/ADR-0014-heavy-block-boundary.md)
  — drag/drop transit during heavy block 留 Stage C.2 实施
- [ADR-0011 D1 linear pipeline](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — KEPT for Wave 5; D2 row 4 fires stage 4 here
- [ADR-0006 8-point asymmetry audit](../../decisions/ADR-0006-asymmetry-audit-checklist.md)
  — items #5 + #8 walked at `## contracts_affected`
- [ADR-0003 Headless / Presentational](../../decisions/ADR-0003-headless-presentational-split.md)
  — drag-handle is UI 层, layoutReducer is core 层
- [Wave 5 Pre-A2 PR.md](Pre-A2-adr-0016-grid-data-model.md) — most recent ADR
  design-lock precedent (12/12 plan-challenger absorbed; 1 R-round)
- [Wave 5 Pre-A1 PR.md](Pre-A1-plan-lock.md) — Wave 5 plan v0.2 lock
- granularity doc v0.3.4 (`/mnt/d/download/web/v2-design-granularity.md`) —
  gatekeeper-side scratch; § "4 种 Drop 语义" + § "Drop 视觉" + § "命中检测算法" + §
  "源块 drag 时 lift" body 是 ADR-0017 source intent (per Wave 5 plan v0.2 D5 ADR
  编号映射表 0013 → 0017)
- drag-storyboard.css (`/mnt/d/download/web/drag-storyboard.css`) — 16 KB v2 demo
  drag UX storyboard CSS implementation reference
