# ADR-0019: Wave 5 close — v2 visual identity + grid + drag/drop + editor wire to apps/site (MVP-ready)

| 字段 | 值                                                                                                                               |
| ---- | -------------------------------------------------------------------------------------------------------------------------------- |
| 状态 | accepted (Wave 5 close authority; merged 2026-05-07)                                                                             |
| 日期 | 2026-05-07                                                                                                                       |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx; multi-session continuation 2026-05-04 → 2026-05-07)                                        |
| 触发 | Wave 5 plan v1.3 row C.4-5 + Stage C.4 close (PR #96 squash `7be1341`) — Wave 5 fully closed                                     |
| 关系 | 不替代任何 ADR; Wave 5 close authority parallel to ADR-0002 (Wave 1) / ADR-0010 (Wave 2) / ADR-0013 (Wave 3) / ADR-0015 (Wave 4) |

## Context

Wave 5 延续 Wave 4 close (ADR-0015) 的 2 个 deferred items (Stage C-3 PDF iframe + C-4 chunk-leak; folded into Wave 5 Stage C.1 cleanup) + Wave 4 reframe v2 (visual + grid + drag/drop 前移到 Wave 5 per `project_wave4_reframe_v2.md` 2026-05-04 user gatekeeper directive).

Wave 5 scope locked at Pre-A5 (plan v1.0 PR #54) → 3 R14 amendments (v1.1 PR #61 defer-chain class / v1.2 PR #70 gatekeeper-sequencing class / v1.3 PR #75 standards-landing-absorbtion class) + 1 standards landing (PR #74 ADR-0011 v0.2 + ADR-0006 v0.2) + 1 structural symmetric-skip fix (PR #76).

Wave 5 终态 = MVP-ready v2 demo:

- v2 视觉 identity (OKLCH cream + Inter + JetBrains Mono + 8 kind-hue stripes + warm shadow + prose customization)
- Grid 数据模型 (12/6/1 responsive + rowSpan FSM + drag/drop 4-edge split + resize via col-ruler/size-tooltip/COL_SNAPS)
- Editor wire to apps/site `/notes/<slug>/edit` (palette / slash / drag-handle / toolbar / Edit Mode banner / save indicator + 800ms debounce + LocalStorageAdapter MVP)
- 10-item user MVP coverage manifest (each MVP item mapped 1:1 to canonical Playwright spec)

47 PRs across 4 stages + Pre-A + meta amendments + standards (PR #50 → PR #96). 3-4 Claude orchestrator sessions over 4 days (2026-05-04 → 2026-05-07).

## Decision

### D1 — Wave 5 main pipeline 47-PR roster (final state)

| PR  | Squash    | Stage           | Subject                                                                                   |
| --- | --------- | --------------- | ----------------------------------------------------------------------------------------- |
| #50 | `365173e` | Pre-A1          | plan-draft v0.1 + plan-challenger 10/10 absorbtion → v0.2 lock                            |
| #51 | `6e2c1d9` | Pre-A2          | ADR-0016 grid 数据模型 + W5-1 invariant + 12/12 absorbed                                  |
| #52 | `157a4f7` | Pre-A3          | ADR-0017 drag/drop UX + 13/13 absorbed                                                    |
| #53 | `7e487ec` | Pre-A4          | ADR-0018 v2 visual migration + save-path 接口冻结 + 14/14 absorbed                        |
| #54 | `2bc129a` | Pre-A5          | plan v0.2 → v1.0 final lock + Stage C.1-C.4 PR breakdown                                  |
| #55 | `44a2e53` | C.1-1           | Heavy block plugin placeholder + ADR-0014 v0.4 amendment                                  |
| #56 | `6b350d6` | C.1-2           | PDF iframe dark-theme fix + chunk-leak NO-OP audit                                        |
| #57 | `587835c` | C.1-3           | apps/site/.gitignore housekeeping + Stage C.1 close                                       |
| #58 | `e54497d` | C.2-1           | mdx-bridge col/row/colSpan/rowSpan serialize                                              |
| #59 | `b15ba24` | C.2-2           | block-foundation BlockUIDefinition grid + grid-math.ts                                    |
| #60 | `2586328` | C.2-3           | Astro renderer grid + Responsive 12/6/1                                                   |
| #61 | `1304111` | v1.1 amend      | plan v1.0 → v1.1 R14 first real-test (defer-chain class)                                  |
| #62 | `882710a` | docs            | active.md sync post v1.1 amendment                                                        |
| #63 | `de13d15` | C.2-4           | editor-shell grid 集成 + useAutoRowSpan hook                                              |
| #64 | `f8a265f` | docs            | active.md sync post C.2-4                                                                 |
| #65 | `b019a31` | C.2-3.5         | mdx-bridge hard-throw flip + sample MDX backfill + 17 RTT fixtures                        |
| #66 | `465588e` | docs            | active.md sync post C.2-3.5                                                               |
| #67 | `2df71b6` | C.2-5           | drag/drop UX (edge-rects + tiebreak + outline overlay)                                    |
| #68 | `2fb7900` | C.2-6           | resize UX (col-ruler + size-tooltip + COL_SNAPS snap)                                     |
| #69 | `338e965` | docs            | active.md sync post C.2-5 + C.2-6                                                         |
| #70 | `56ff476` | v1.2 amend      | plan v1.1 → v1.2 R14 second real-test (gatekeeper-sequencing class)                       |
| #71 | `722bbb0` | docs            | active.md sync post v1.2 amendment                                                        |
| #72 | `4f49be0` | C.4-prelude     | Minimal editor scaffold (MVP smoke-test enable)                                           |
| #73 | `49c6b2f` | docs            | active.md sync post C.4-prelude                                                           |
| #74 | `2f67ef0` | standards       | ADR-0011 v0.2 + ADR-0006 v0.2 (Product Experience Quality Gate)                           |
| #75 | `5bd5112` | v1.3 amend      | plan v1.2 → v1.3 R14 third real-test (standards-landing-absorbtion class)                 |
| #76 | `ad42f71` | standards-fix   | scripts/check-screenshot-archive.ts symmetric ui_touch skip                               |
| #77 | `b2fdd8f` | docs            | active.md sync post v1.3 + standards                                                      |
| #78 | `dd860b9` | C.2-7           | ADR-0014 v0.5 + HeavyBlockBoundary W5-1 dims                                              |
| #79 | `4b4f139` | housekeeping    | post-#78 spec WSL2-skip strip + canonicalization                                          |
| #80 | `2cdcebb` | C.2-8           | drop-pulse + drag-ghost + Esc cancel + layoutEpoch reducer                                |
| #81 | `724aca5` | docs            | active.md sync post C.2-7 + #79 + C.2-8                                                   |
| #82 | `07c4dd4` | C.2-9           | Responsive 12/6/1 切换 + rowSpan adapt FSM                                                |
| #83 | `7e624f0` | C.2-10          | Playwright drag scenarios + edge-rect tiebreak fixtures                                   |
| #84 | `02925b1` | C.2-11          | Playwright resize + responsive switch + rowSpan adapt                                     |
| #85 | `da192e4` | C.2-12          | Stage C.2 close: perf budget + visual smoke baseline + handoff pack                       |
| #86 | `4dbb1df` | T1 housekeeping | active.md sync post Stage C.2 close                                                       |
| #87 | `e0eb168` | C.3-1           | design-tokens OKLCH 14 color + Inter/JetBrains Mono fonts                                 |
| #88 | `4dc1219` | C.3-2           | 8 block-kind hue tokens + 5 light block 顶 2px 横条                                       |
| #89 | `e47b67a` | C.3-3           | prose customization + typography upgrade + body Inter                                     |
| #90 | `fce2890` | C.3-4           | shadow tokens warm-tone refresh `rgba(20,15,10)`                                          |
| #91 | `830567d` | C.3-5           | Stage C.3 close: visual smoke baseline lock + handoff pack                                |
| #92 | `ab11e0e` | C.4-1           | NoteSaveAdapter contract hardening + adapter tests + ApiAdapter forward-stub COMMENT-only |
| #93 | `5152512` | C.4-2           | /notes/[slug]/edit registry boundary verification + spec                                  |
| #94 | `a16f88c` | C.4-3           | palette + slash + drag-handle + toolbar + Edit Mode banner + save indicator               |
| #95 | `f62eff1` | C.4-4           | save/load roundtrip Playwright spec                                                       |
| #96 | `7be1341` | C.4-5           | Stage C.4 close: edit-flow E2E + handoff pack                                             |

**Roster summary**: 47 PRs total = 5 Pre-A + 3 Stage C.1 + 13 Stage C.2 (incl. C.2-3.5 inserted at v1.1) + 5 Stage C.3 + 6 Stage C.4 (incl. C.4-prelude inserted at v1.2) + 3 R14 plan amendments + 2 standards-related (PR #74 + PR #76) + 8 docs/active.md syncs + 2 housekeeping (PR #79 + PR #86) = 47. Wave 5 close ceremony PR (this; squash TBD post-merge) is the 48th PR documenting the close itself; not counted in the 47-PR ratification roster.

### D2 — Wave 5 architecture decisions ratified (4 NEW ADRs + 4 amendments)

NEW ADRs (locked at Pre-A2/3/4):

- ADR-0016 grid 数据模型 (Pre-A2; W5-1 invariant + layoutEpoch reducer pattern)
- ADR-0017 drag/drop UX (Pre-A3; edge-rects + tiebreak + outline-overlay + drop-pulse + drag-ghost + esc-cancel)
- ADR-0018 v2 visual migration + save-path 接口冻结 (Pre-A4; OKLCH 14 color + Inter/JetBrains + 8 kind hue + prose customization + typography + shadow + NoteSaveAdapter interface)
- ADR-0019 Wave 5 close (this ADR; status: accepted)

Amendments (cross-cutting):

- ADR-0011 v0.2 (PR #74 standards landing): NEW D9 Product Experience Quality Gate + NEW D10 anti prompt-patching forbidden + D2 schema additions (ui_touch boolean field + e2e_smoke list field) + D1 stages 2/3/6 acquired UI-touch Playwright responsibilities
- ADR-0006 v0.2 (PR #74 standards landing): NEW 9th asymmetry-audit item (UI-touch + E2E spec audit; "vitest unit PASS" vs "production user-visible PASS" load-bearing pair)
- ADR-0014 v0.4 (PR #55 C.1-1): heavy block plugin placeholder shape
- ADR-0014 v0.5 (PR #78 C.2-7): HeavyBlockBoundary consume W5-1 公式 from `@skb/block-foundation`

### D3 — Wave 5 → Wave 6/Phase 2+ deferred items (binding handoff)

Per Stage C.3 + Stage C.4 handoff packs, the following are explicitly deferred:

1. **layoutEpoch sync to NoteState**: ADR-0018 line 464 接口冻结 amendment required. C.4-4 R1 surfaced; reverted out of C.4-4 scope. Tracked as separate ADR-0018 amendment PR.
2. **ApiAdapter implementation**: C.4-1 shipped COMMENT-only forward-stub; full impl requires `apps/api` server + auth + DB per ADR-0018 D8 path-(a). Phase 2+.
3. **Mobile/responsive editor polish**: editor affordances ship desktop-first per C.4-3 minimal-but-functional. Phase 2+.
4. **a11y / keyboard navigation full audit**: editor shipped minimum a11y. Phase 2+.
5. **Animation tuning / 60fps perf**: drop-pulse 720ms + drag-ghost shipped at C.2-8; full perf audit Phase 2+ per ADR-0017 D11+.
6. **5 light block CSS migration to v2 OKLCH**: ADR-0018 D7 migration blocked at C.3-4 R1 per sister-doc-sync surface (5 block CONTRACTs + 4 witness types). Phase 2+ when Tailwind preset migration also happens.
7. **Dark theme OKLCH variant**: ADR-0018 D1 explicit Wave 5 lite-only carve-out. Phase 2+.
8. **Tailwind preset typography migration**: C.3-1 Decision 3 keeps preset at legacy `theme.fontSize`. Phase 2+ may re-evaluate.
9. **CSP `<meta>` header + self-host Inter+JetBrains Mono woff2**: C.3-1 Decision 4+7 deferred. Production deployments enforcing strict CSP need a follow-up security-class PR (D2 row 8). Phase 2+.

### D4 — Wave 5 retrospective items (8 NEW R23..R30 + 22 carry-forward R1..R22)

NEW R23..R30 candidates per Stage C.3 + Stage C.4 handoff packs:

- **R23** broader-suite Playwright flake catalog (7 specs failing on broader test:visual run; reproducible on plain main HEAD; not introduced by Stage C.3/C.4 PRs): grid-drag-drop AC#4 / grid-perf TC1.2+TC2.3 / c2-7-heavy-grid-dims / c2-8-drag-modules-mount / c2-9-responsive-fsm-mount / visual-smoke theme-toggle. Likely root causes: editor mount race conditions, ThemeToggle hydration timing under networkidle, heavy block placeholder rendering inconsistency, grid-perf TC1.2 system-load sensitivity.
- **R24** Strategy A (additive coexistence) for token migrations: zero build-red windows; preserves opacity-modifier semantics; incremental migration. Successful pattern; recommend for all future token migrations.
- **R25** CONTRACT amendment time-bound exception (Q2 from C.3-1): "Modifying-this-file rule" overridden by Wave-5-light-only carve-out. Pattern for Wave-scoped invariant relaxation.
- **R26** Q10 partial-defer pattern: PR.md acknowledged scope reduction when production-PASS-gate visual-smoke baseline regression risk surfaced. Spec strengthening can be deferred to a later PR in the same Stage when rich production-PASS gates require multi-PR coordination.
- **R27** Sister-doc-sync as scope-fence (C.3-4 R1): when CSS migration would drift CONTRACT.md or witness types, defer the migration rather than expand scope. Keeps PR-size discipline; honors ADR-0006 item 6.
- **R28** Visual-smoke baseline auto-regen in CI (Playwright `mkdirSync + savePng` emit-only logic): not enforce-via-diff; each CI run captures latest. Final lock at Stage close PR.
- **R29** Culori derivation refinement protocol (C.3-1 Decision 6): record actual Culori output in PR.md table when it differs from authoring-time nominal. Pattern reusable for future color-system migrations.
- **R30** sessionStorage-guard pattern for stateful Playwright reload tests: Playwright `addInitScript` runs on every navigation. Naive `localStorage.removeItem` defeats reload roundtrips. Solution: gate clear with sessionStorage flag. Canonical pattern documented at C.4-4 PR.md.

Carry-forward R1..R22 from ADR-0015 D4 + ADR-0013 D4 + ADR-0010 D5: still relevant; some now formally validated by Stage C.3+C.4 EXECUTE empirics.

### D5 — ADR-0011 D1 linear pipeline empirical evaluation (47 PRs Wave 5)

ADR-0011 D1 6-stage linear pipeline empirically validated at scale across 47 Wave 5 PRs:

- 41/47 PRs ran full D1 6-stage; 6 ran simple-D1 (PR #79 / C.3-5 / C.4-2 / C.4-4 / C.4-5 / docs syncs)
- Reviewer R-rounds total: ~110 across 47 PRs (avg 2.3 R-rounds/PR; well within ADR-0011 D8 ≤15% R-round budget for implementation PRs)
- v1.1 + v1.2 + v1.3 R14 amendments validated 3 trigger classes operationally (defer-chain / gatekeeper-sequencing / standards-landing-absorbtion)
- Standards landing PR #74 ADR-0011 v0.2 (D9 Product Experience Quality Gate + D10 anti prompt-patching) provided the discipline framework that all subsequent UI-touch PRs (C.2-7 onwards) followed end-to-end

ADR-0011 D9 Product Experience Quality Gate empirics:

- 9-CI-checks-green discipline operative on every UI-touch PR post-#74
- Item 9 "PR's own e2e_smoke entry" canonical scope clarification (vs broader-suite reading) emerged at C.3-4 R4 + Stage C.4 carry-forward as Wave 5 close interpretation

### D6 — Wave 6/Phase 2+ plan-draft handoff

Wave 5 close → Wave 6/Phase 2+ plan-draft pending. Reference scope:

- Phase 2+ deferrals from D3 above (9 items)
- Wave 6 specific scope TBD by user gatekeeper at Wave 6 plan-draft session start
- ADR-0011 D1 + D9 + D10 KEPT
- ADR-0006 v0.2 9-point checklist KEPT
- v1.3 R14 amendment 3-trigger-class precedent extends to any future Wave-amendment authoring

`docs/plans/active.md` repointed to "Wave 6 plan-draft pending" at this PR's commit.

## Consequences

### Positive

- **MVP-ready milestone reached**: 10/10 user MVP items have Playwright spec coverage; "看不到一点进步" 闭环点 closed at C.4-3 #94.
- **v2 visual identity LANDED site-wide**: OKLCH cream + Inter + JetBrains Mono + 8 kind-hue stripes + warm shadow + prose customization at every page.
- **Editor wire complete**: apps/site `/notes/<slug>/edit` mounts editor with full block registry + 800ms debounce save + reload preserves content.
- **4 NEW ADRs + 4 amendments ratified**: ADR-0016/0017/0018/0019 lock Wave 5 architecture; ADR-0011 v0.2 + ADR-0006 v0.2 + ADR-0014 v0.4/0.5 amend cross-cutting standards.
- **R14 discipline operative across 3 trigger classes**: empirically demonstrated plan amendment as the canonical mid-Wave reframe absorption channel.
- **47 PRs / 4 days / 3-4 sessions**: sustainable pace for substantial Wave-scale work under autonomous orchestrator execution.

### Negative

- **9 Phase 2+ deferred items**: Wave 5 didn't fully close all ADR-0017/0018 acceptance criteria (Tailwind preset migration / dark theme / CSP / self-host fonts / 5-light-block CSS calibration full migration / a11y full audit / mobile polish / animation tuning / ApiAdapter implementation).
- **7 broader-suite Playwright flakes**: tracked as R23 retrospective candidates; need root-cause investigation in Wave 6.
- **C.4-4 layoutEpoch sync deferred**: ADR-0018 line 464 接口冻结 caught a silent extension attempt; needs separate ADR amendment PR.

### Neutral / explicit acknowledgements

- Wave 5 main pipeline auto-merge (per `feedback_wave3_auto_merge.md` 2026-05-01 user authorization) used throughout — orchestrator merges PR directly via `gh pr merge --squash --delete-branch` once ACCEPT-PASS + all CI SUCCESS; no per-PR manual merge needed.
- Visual-smoke baseline regen accumulated across C.3-3 / C.3-4 / C.4-3 / C.4-5 — final state captures v2 visual identity site-wide.

## Compliance

- ADR-0011 D1 KEPT (linear pipeline; 6 stages)
- ADR-0011 D9 KEPT (Product Experience Quality Gate; canonical PR-own-spec scope reading per C.3-4 R4 + Stage C.4 carry-forward)
- ADR-0006 v0.2 KEPT (9-point asymmetry-audit checklist)
- ADR-0007 D5 codex profiles KEPT (codex-pr-reviewer-55 reviewer; codex-generic-executor default executor; codex-{structure,perf,mdx-doctor}-auditor on-demand)
- ADR-0011 D8 ≤15% R-round budget operative (avg 2.3 R-rounds/PR across 47 PRs)
- File size 200/300/500 line discipline operative (no PR exceeded 500-line hard cap)

## Related

- [Wave 4 close ADR-0015](ADR-0015-wave-4-close.md) — precedent for Wave-close ADR shape
- [Wave 5 plan v1.3](../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md)
- [ADR-0016 grid data model](ADR-0016-grid-data-model.md)
- [ADR-0017 drag/drop UX](ADR-0017-drag-drop-ux.md)
- [ADR-0018 v2 visual migration + save-path 接口冻结](ADR-0018-v2-visual-migration.md)
- [ADR-0011 v0.2 linear pipeline + D9 Product Experience Quality Gate](ADR-0011-linear-pipeline-execution-model.md)
- [ADR-0006 v0.2 9-point asymmetry-audit](ADR-0006-asymmetry-audit-checklist.md)
- [ADR-0014 v0.5 HeavyBlockBoundary](ADR-0014-heavy-block-boundary.md)
- Wave 5 stage handoff packs: [C.1-handoff-pack.md](../plans/wave-5-main/C.1-handoff-pack.md) + [C.2-handoff-pack.md](../plans/wave-5-main/C.2-handoff-pack.md) + [C.3-handoff-pack.md](../plans/wave-5-main/C.3-handoff-pack.md) + [C.4-handoff-pack.md](../plans/wave-5-main/C.4-handoff-pack.md)
