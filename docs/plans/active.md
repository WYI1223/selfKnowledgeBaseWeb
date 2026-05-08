# Active Plan Pointer

> SessionStart hook 读取此文件，把当前 wave 印在 session 起手位置。

**当前 phase**: 1
**当前 wave**: **Wave 6 Stage B ✅ CLOSED 2026-05-07 + 3 follow-up PRs landed 2026-05-08** — 5-PR Stage B sequence (B.1 ADR-0018 v0.6 amendment `fc7689f` + B.2 endpoint `100f1dc` + B.3 ApiAdapter `6e88cb4` + B.4 mount wire `376a559` + B.5 close `941c273`) + 3 post-close PRs: hotfix `6eaf676` (mdxFlowExpression softParse + per-block fault tolerance + Tiptap mark sanitizer + visible load-error banner — closed the user-reported "/notes/sample-blocks/edit empty" gap that B.5's synthetic close-ceremony fixture missed) + cf-15a `dbf48e1` (`@tiptap/extension-link` registered with title attr; markdown links now render as anchors in the edit surface) + cf-17 (this PR; ADR-0011 v0.2.2 D9.8 amendment codifying the close-ceremony fixture-representativeness rule that prevents this failure class from recurring). Editor persistence is now server-backed via the path-(b) Astro mixed-mode endpoint at `apps/site/src/pages/api/notes/[...slug].ts` with sidecar `state.json` for `{lastModified, version}` (preserves `@skb/content-types` frontmatter authority, zero schema drift). Cross-session + cross-device edit continuity via ApiAdapter primary + LocalStorageAdapter fallback per ADR-0018 v0.6 D13. **Static-build read-route caveat** (the `/notes/<slug>` HTML is prerendered at build time and does NOT auto-rebuild after a save in `astro build && preview` mode; works in `astro dev` HMR which is the workflow that motivated the user's original report; production read-route freshness is a Phase 3+ path-(a) `apps/api` SSR concern). Stage B handoff pack: [docs/plans/wave-6-main/stage-b-handoff-pack.md](wave-6-main/stage-b-handoff-pack.md). 14 codex R-rounds total (9 in B.2: R2-R10; 2 in B.3: R1-R2; 3 in B.4: R1-R3) plus B.5's own R-rounds; folded ADR-0011 v0.3 D9.1 API-route ui_touch exclusion + ADR-0006 v0.2.1 cross-ref-only + 9-point sweep across all consumer surfaces (root authority `agent-contract.md` + 3 generator templates + 3 regenerated docs + active runbook `team-operations.md`).

**Wave 5 prior context (kept for reference)**: ✅ FULLY CLOSED 2026-05-07 by [ADR-0019](../decisions/ADR-0019-wave-5-close.md) — 47 main pipeline PRs across Pre-A + 4 stages. MVP-ready milestone reached (10/10 user MVP items with Playwright coverage). v2 visual identity LANDED. Editor wired to `/notes/<slug>/edit`. 4 NEW ADRs (0016/0017/0018/0019) + 4 amendments ratified. 8 NEW retrospective items R23-R30.

**当前 wave next**: **Wave 6 Stage B done; Stage C TBD** — Stage B closes the editor-persistence half of the original "MVP-ready" milestone. Stage C scope (next plan-draft) is gatekeeper TBD: candidates include the static-build read-route freshness gap, new-note creation, layoutEpoch sync (ADR-0019 D3 #1), mobile/a11y polish, or one of the other Wave 5 carry-forwards.

**Wave 5 stage handoff packs** (4-stage close evidence):

- [Stage C.1 handoff pack](wave-5-main/C.1-handoff-pack.md) — Wave 4 carry-over cleanup
- [Stage C.2 handoff pack](wave-5-main/C.2-handoff-pack.md) — grid + drag/drop + resize (13 PRs)
- [Stage C.3 handoff pack](wave-5-main/C.3-handoff-pack.md) — v2 visual identity (5 PRs)
- [Stage C.4 handoff pack](wave-5-main/C.4-handoff-pack.md) — editor wire to apps/site (6 PRs)

**Wave 5 → Wave 6/Phase 2+ deferred items** (per ADR-0019 D3):

1. **layoutEpoch sync to NoteState**: ADR-0018 line 464 接口冻结 amendment required (C.4-4 R1 surfaced; reverted out of C.4-4 scope)
2. **ApiAdapter implementation**: ✅ promoted to Wave 6 Stage B default per ADR-0018 v0.6 amendment 2026-05-07 (path-(b) Astro hybrid endpoint at `apps/site/src/pages/api/notes/[...slug].ts`); separate `apps/api` package path-(a) stays Phase 3+ for multi-user collab
3. **Mobile/responsive editor polish** (Phase 2+)
4. **a11y / keyboard navigation full audit** (Phase 2+)
5. **Animation tuning / 60fps perf** (Phase 2+)
6. **5 light block CSS migration to v2 OKLCH**: blocked at C.3-4 R1 sister-doc-sync surface (Phase 2+ when Tailwind preset migration also happens)
7. **Dark theme OKLCH variant**: ADR-0018 D1 explicit Wave 5 lite-only carve-out (Phase 2+)
8. **Tailwind preset typography migration**: C.3-1 Decision 3 (Phase 2+)
9. **CSP `<meta>` header + self-host Inter+JetBrains Mono woff2**: C.3-1 Decision 4+7 (Phase 2+)

**Wave 5 R23..R30 retrospective candidates** (per ADR-0019 D4):

- R23 broader-suite Playwright flake catalog (7 specs failing on broader test:visual run)
- R24 Strategy A (additive coexistence) for token migrations (recommend for future)
- R25 CONTRACT amendment time-bound exception (Wave-scoped invariant relaxation pattern)
- R26 Q10 partial-defer pattern (PR.md scope reduction when production-PASS-gate visual-smoke baseline regression risk surfaces)
- R27 Sister-doc-sync as scope-fence (defer migration when CSS would drift CONTRACT/witness)
- R28 Visual-smoke baseline auto-regen in CI (emit-only logic; final lock at Stage close)
- R29 Culori derivation refinement protocol (record actual output when differs from authoring-time nominal)
- R30 sessionStorage-guard pattern for stateful Playwright reload tests (canonical pattern documented at C.4-4)

**ADR-0011 D9 Product Experience Quality Gate** standards landed at PR #74 (squash `2f67ef0` 2026-05-05). Item 9 canonical scope = **PR's own e2e_smoke entry** (vs broader-suite reading). Established at C.3-4 R4 + carried through Stage C.4. Forward implementation PRs follow this scope.

---

Wave 1 ✅ closed (2026-04-30, HEAD `b5e7217`) by [ADR-0002](../decisions/ADR-0002-wave-1-close.md);
Wave 2 ✅ closed (2026-05-01, HEAD `51789a1`) by [ADR-0010](../decisions/ADR-0010-wave-2-close.md) — 17 main tracks + 33 commits + 9 new packages + 6 cross-package single-authority invariants + 11 WE-\* process learnings codified;
Wave 3 ✅ closed (2026-05-02, HEAD `4deb5cb`) by [ADR-0013](../decisions/ADR-0013-wave-3-close.md) — 24 main PRs across Pre-A + 4 stages, single long-term Claude orchestrator session validating ADR-0011 D1 linear pipeline at scale;
Wave 4 ✅ closed (2026-05-04, HEAD `de39e07`) by [ADR-0015](../decisions/ADR-0015-wave-4-close.md) — 21 main PRs across Pre-A + 3 stages (A=8, B=8, C=2 truncated), 3 Claude orchestrator sessions over 2 days, ADR-0014 ratified through proposed → accepted + 2 substantive amendments + ADR-0012 v0.1.1 amendment, 9 NEW retrospective items R14-R22 + 13 carry-forward R1-R13;
Wave 5 ✅ closed (2026-05-07, HEAD post-PR-97 squash) by [ADR-0019](../decisions/ADR-0019-wave-5-close.md) — 47 main PRs across Pre-A + 4 stages (C.1=3, C.2=13, C.3=5, C.4=6), 3-4 Claude orchestrator sessions over 4 days, 4 NEW ADRs (ADR-0016/0017/0018/0019) + 4 amendments (ADR-0011 v0.2 + ADR-0006 v0.2 + ADR-0014 v0.4/0.5), 8 NEW retrospective items R23-R30 + 22 carry-forward R1-R22, MVP-ready milestone reached, R14 discipline operative across 3 trigger classes.

**Wave 1+2+3+4+5 architecture ADR roster:**

- [ADR-0001](../decisions/ADR-0001-stack-selection.md) Stack selection
- [ADR-0002](../decisions/ADR-0002-wave-1-close.md) Wave 1 close
- [ADR-0003](../decisions/ADR-0003-headless-presentational-split.md) Headless / presentational split
- [ADR-0004](../decisions/ADR-0004-agent-team-dispatch-model.md) Agent team dispatch (Wave 1+2 era; ADR-0011 supersedes for Wave 3+)
- [ADR-0005](../decisions/ADR-0005-api-conventions.md) API conventions
- [ADR-0006](../decisions/ADR-0006-asymmetry-audit-checklist.md) Asymmetry audit checklist + D8 explicit-file-list staging (v0.2 amended at PR #74: 9th item UI-touch + E2E spec audit)
- [ADR-0007](../decisions/ADR-0007-job-function-codex-heavy-execution.md) Job-function codex-heavy execution
- [ADR-0008](../decisions/ADR-0008-wave-2-entry-policies.md) Wave 2 entry policies
- [ADR-0009](../decisions/ADR-0009-block-kind-union-expansion.md) BlockKind 4-way union
- [ADR-0010](../decisions/ADR-0010-wave-2-close.md) Wave 2 close
- [ADR-0011](../decisions/ADR-0011-linear-pipeline-execution-model.md) Linear-pipeline execution model (v0.2 amended at PR #74: NEW D9 Product Experience Quality Gate + NEW D10 anti prompt-patching + D2 schema additions ui_touch/e2e_smoke)
- [ADR-0012](../decisions/ADR-0012-search-index-stack.md) Search index stack
- [ADR-0013](../decisions/ADR-0013-wave-3-close.md) Wave 3 close
- [ADR-0014](../decisions/ADR-0014-heavy-block-boundary.md) HeavyBlockBoundary wrapper (proposed → accepted at Wave 4 Stage A; v0.3 at B7; v0.4 at C.1-1; v0.5 at C.2-7)
- [ADR-0015](../decisions/ADR-0015-wave-4-close.md) Wave 4 close
- [ADR-0016](../decisions/ADR-0016-grid-data-model.md) Grid 数据模型 (Wave 5 Pre-A2; W5-1 invariant + layoutEpoch reducer)
- [ADR-0017](../decisions/ADR-0017-drag-drop-ux.md) Drag/drop UX (Wave 5 Pre-A3; edge-rects + tiebreak + outline-overlay + drop-pulse + drag-ghost + esc-cancel)
- [ADR-0018](../decisions/ADR-0018-v2-visual-migration.md) v2 visual migration + save-path 接口冻结 (Wave 5 Pre-A4; OKLCH + Inter + 8 kind hue + prose + typography + shadow + NoteSaveAdapter)
- [ADR-0019](../decisions/ADR-0019-wave-5-close.md) Wave 5 close

**结构 baseline**: [docs/audits/structure-2026-05.md](../audits/structure-2026-05.md). Wave 6 next sweep target: re-baseline against 47-PR Wave 5 work (apps/site editor mount + 6 affordance components + design-tokens v2 OKLCH + 8 block-\* kind hue stripes + grid drag/resize coverage).
**Wave 索引**: [docs/plans/phase-1/plan.md](phase-1/plan.md)
**团队操作手册**: [docs/runbooks/team-operations.md](../runbooks/team-operations.md) (Wave 1+2 era; Wave 3 D-list reorganization codified in [docs/runbooks/codex-tool-invocations.md](../runbooks/codex-tool-invocations.md))
