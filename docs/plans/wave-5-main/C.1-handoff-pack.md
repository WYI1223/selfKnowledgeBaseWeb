# Wave 5 Stage C.1 close — handoff pack

| 字段 | 值 |
|---|---|
| Stage | Phase 1 Wave 5 Stage C.1 (3/3 PRs done) |
| Stage HEAD | (set by C.1-3 squash on merge; will be the 3rd Stage C.1 squash) |
| Wave | Phase 1 Wave 5 |
| 触发 | Wave 5 plan v1.0 D15 (handoff pack mandatory at every Stage close) + D3 (user MVP-judgment escape valve mandatory after C.1) |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx) |
| 替代 | — |

> **下一 session 第一动作 = 复读本 handoff pack 并在 opening message 显式确认**（per Wave 5 plan v1.0 D15）。

## 决策摘要

Stage C.1 ships 3 PRs. C.1-1 and C.1-2 already merged 2026-05-04; C.1-3 is the close PR currently in flight (this handoff pack ships alongside it; the C.1-3 row's PR # and squash HEAD are filled in post-merge by the next Wave 5 plan/active.md update):

| PR | Squash HEAD | Subject | Scope |
|---|---|---|---|
| #55 | `44a2e53` | Wave 5 C.1-1 — heavy block plugin placeholder + ADR-0014 v0.4 amendment | 3 islands rewritten (drop `HeavyBlockBoundary`; render static plugin placeholder); ADR-0014 v0.4 NEW D11 + AC#16 carve-out; apps/site/CONTRACT.md prose sync; new vitest |
| #56 | `6b350d6` | Wave 5 C.1-2 — PDF iframe dark-theme fix + C-4 chunk-leak NO-OP audit | `packages/block-pdf/src/ui-default/pdf.css` dropped iframe `background` (dark-theme bleed fix); audit MD codifies C-4 NO-OP per ADR-0015 D3 |
| #TBD (in flight) | TBD (set on merge) | Wave 5 C.1-3 — apps/site/.gitignore housekeeping + Stage C.1 close handoff pack | NEW `apps/site/.gitignore` (`test-results/`); this handoff pack (Wave 5 plan v1.0 D15 mandatory) |

ADR amendments landed: ADR-0014 v0.4 (Plugin tier split — placeholder Wave 5 MVP vs real-runtime Phase 2+).

R-rounds during Stage C.1: 4 lychee/typecheck/test-race fix-ups during C.1-1 (typo username, vitest globalSetup race, tsconfig include for global-setup, async→sync); 2 audit-MD doc-marker fixes during C.1-2. All in-PR fix-ups; no plan amendment needed (per R14 D4 thresholds).

Wave 5 plan v1.0 §455-463 row C.1-1/C.1-2/C.1-3 honored exactly; no scope drift.

## 未决风险

1. **Plugin-real-runtime tier reactivation (Phase 2+)**: ADR-0014 v0.4 D11 codifies the placeholder vs real-runtime split. When Phase 2+ reactivates the real tier, AC#16 carve-out reverts (full `aria-busy='true' → 'false'` transition required again). Future PR will re-validate. NOT blocking Stage C.2.

2. **Downstream prose drift accept-defer**: `content/notes/sample-blocks/index.mdx` + `packages/block-foundation/CONTRACT.md` still describe real `HeavyBlockBoundary` hydration prose. ADR-0014 v0.4 carve-out is the authoritative forward-pointer; downstream prose update deferred to Stage C.2 / C.3 follow-up PR. Surfaced in Stage 3 reviewer R1 advisory #3 (C.1-1); accepted-defer documented in C.1-1 PR.md `## Out of scope`.

3. **`sample-blocks-astro` route alternate consumer**: `apps/site/src/pages/sample-blocks-astro.astro` directly consumes the package-level `Jupyter.astro` / `NnViz.astro` / `AgentFlow.astro` variants under `@skb/block-{jupyter,nn-viz,agent-flow}/ui-default`, bypassing the islands path. C.1-1 left this path unchanged; that route still loads real heavy components. Phase 2+ may align this surface with the plugin-tier model. Not in C.1-3 scope; not blocking C.2.

4. **Pyodide CDN paragraph in apps/site/CONTRACT.md**: preserved as Phase 2+ forward-pointer per reframe v2 memory. Wave 4 PR #48 (jsdelivr CDN for Pyodide indexURL) infrastructure NOT deleted; forms the basis of plugin-real-runtime tier reactivation.

5. **Vitest globalSetup precedent**: C.1-1 introduced `apps/site/vitest.global-setup.ts` to fix a pre-existing concurrent-build race surfaced by the new placeholder test. The pattern (build once via globalSetup, all workers read shared dist/) is now canonical for `@skb/site` testing. Future @skb/site test additions should NOT call `execSync('pnpm build')` from `beforeAll` — assume dist/ is fresh.

6. **GitHub Actions billing**: repo flipped public 2026-05-04 to unblock CI billing. Visibility flip side-effect: ruleset `main` (id 15729525) bypass-actors now includes Admin role with `bypass_mode: always`; `gh pr merge --admin` works for orchestrator. Future Wave 5 PRs use this path; auto-merge per memory `feedback_wave3_auto_merge` still canon (CI green precondition).

## 测试状态

Snapshot at Stage C.1 close (post-C.1-3 expected):

| Suite | Status | Notes |
|---|---|---|
| `pnpm lint` | PASS | C.1-1 added vitest.global-setup.ts to apps/site/tsconfig.json include list |
| `pnpm typecheck` | PASS | All workspace packages typecheck clean |
| `pnpm test` (root) | PASS | 45+ root tests |
| `pnpm test:packages` | PASS (40/40 turbo tasks) | Race fixed by globalSetup pattern; ~18s with clean cache |
| `pnpm --filter @skb/site test` | PASS | 11 files; 62 passed + 1 skipped (visual-smoke skipped on WSL2 per memory `feedback_wsl2_chromium_launch`) |
| `pnpm --filter @skb/site exec vitest run src/__tests__/lazy-chunking.test.ts` | PASS | 2 passed + 1 skipped (chunk-leak NO-OP per audit) |
| `pnpm --filter @skb/block-pdf test` | PASS | 5 files / 33 tests; markup unchanged from C.1-2 CSS edit |
| `pnpm build` | PASS | apps/site build PASS; 7 pages emitted; pagefind index emits |
| `pnpm size-check` | PASS | All source files ≤ 500 LOC hard cap |
| Playwright (CI canonical) | PASS | `heavy-block-layout-shift.spec.ts` AC#5+AC#16 (plugin placeholder satisfies trivially); WSL2 chromium skip pattern preserved |

Known skipped / flaky:
- `apps/site/playwright/visual-smoke.spec.ts`: WSL2 chromium skip (per memory `feedback_wsl2_chromium_launch`). CI canonical.
- AC#16 production hydration polling: placeholder tier satisfies via initial `aria-busy='false'` + `data-loaded='true'` SSR; full transition coverage deferred to plugin-real-runtime tier (Phase 2+).

## 开放 ADR / PR 依赖

- **ADR-0014 v0.5 amendment** (Stage C.2-7 per Wave 5 plan v1.0 §475): HeavyBlockBoundary grid-context dimensions consume W5-1 invariant + 顶 2px 横条 token (post Stage C.3 OKLCH switchover). Pre-condition: ADR-0016 grid + ADR-0018 OKLCH tokens locked (already done at Pre-A2 + Pre-A4).
- **Stage C.2 entry**: Begins after user explicit "继续下一 stage" decision at this Stage C.1 close (per Wave 5 plan v1.0 D3 escape valve). Stage C.2 = 12 PRs (mdx-bridge col/row serialize → editor-shell grid → drag/drop UX → resize → ADR-0014 v0.5 amendment → playwright). Risk matrix per Wave 5 plan v1.0 §368-385 row C.2.
- **Wave 5 close ceremony (ADR-0019)**: happens at Stage C.4 close OR mid-Wave escape valve OR ctx > 600K. NOT a Stage C.1 dependency.

## Stage close — user MVP-judgment escape valve

Per Wave 5 plan v1.0 D3, this is a **mandatory stop point**. User decides:

1. **"继续下一 stage"** → orchestrator opens Stage C.2 (12 PRs). First PR = C.2-1 mdx-bridge col/row/colSpan/rowSpan serialize.
2. **"差不多了 ship"** → Wave 5 close ceremony (ADR-0019) on current state = MVP. Phase 1 paused or shipped.
3. **"调整 X"** → R14 plan amendment PR via D1 pipeline → plan-challenger → lock → resume. Threshold per D4: `reframe` (改变成功标准 / PR 总量变化 >15% / 新增高风险模块 ≥1 / 跨-package 边界 / 改 ADR 目标) OR `scope refinement` (任务顺序 / 命名 / 测试补充 / 单 package 内细节调整 → absorb without amendment PR).

MVP fallback timing (D14): user 静默 > 5 工作日 → orchestrator triggers R14 pre-scan + 缺失项清单 PR; > 7 工作日 → close-prep mode; orchestrator + reviewer joint owner; user override 始终优先.

orchestrator pause point: STOP after C.1-3 merge until user provides explicit one of (1) / (2) / (3) above.
