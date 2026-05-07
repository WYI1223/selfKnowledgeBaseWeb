# C.4-5 — Stage C.4 close: 真验收 10-item E2E coverage + handoff pack

> **Wave 5 Stage C.4 5th and final implementation PR** (per Wave 5
> plan v1.3 row C.4-5, line 718; v1.3 R14 retrofit catalog § C.4-5
> lines 645+, 10 e2e_smoke entries mapped 1:1 to user MVP items).
> Lands the **Stage C.4 close**: 真验收 10-item E2E coverage
> manifest + Stage C.4 handoff pack + Wave 5 close 候选 evidence.
> 9 of 10 user MVP items already covered by existing specs (Stage
> C.2 + Stage C.3 + C.4-1..C.4-4 sequence); 1 NEW edit-flow-e2e
> spec ties the load→edit→save→reload ceremony together. **No D2
> row fires** post-revert (no source code change; no CONTRACT
> change; spec + handoff pack + PR.md only).

## title

Land Stage C.4 close ceremony: NEW edit-flow-e2e Playwright spec
covering load → edit → save → reload sequence; Stage C.4
handoff pack at `docs/plans/wave-5-main/C.4-handoff-pack.md`
documenting 10-item MVP E2E coverage manifest (each MVP item
mapped to existing spec) + 6-PR sequence summary (C.4-prelude +
C.4-1..C.4-5) + Wave 5 close 候选 readiness evidence.

## files

3-5 files (~150 LOC):

1. `apps/site/src/__tests__/e2e/c4-5-edit-flow-e2e.spec.ts` —
   **NEW** (~80 LOC). Stage C.4 close ceremony spec verifying
   the canonical load → edit → save → reload sequence:
   - light-theme guard + sessionStorage-guard pattern
   - navigate /notes/sample-mdx-note/edit
   - .ProseMirror visible + .skb-grid visible + ✏️ Edit Mode
     banner visible
   - type known content + wait debounce
   - save indicator shows "Saved"
   - localStorage state version >= 2 + mdxSource includes content
   - reload → state preserved
   - screenshot to
     `docs/audits/screenshots/wave-5-c4-5-edit-flow-e2e.png`

2. `docs/plans/wave-5-main/C.4-handoff-pack.md` — **NEW** (~150
   LOC). Stage C.4 handoff pack:
   - 6-PR sequence summary (C.4-prelude #72 / C.4-1 #92 / C.4-2 #93
     / C.4-3 #94 / C.4-4 #95 / C.4-5 this-PR squash TBD)
   - 10-item MVP E2E coverage manifest (each MVP item mapped to
     existing spec; mvp-1..10)
   - Phase 2+ deferrals (layoutEpoch sync ADR-0018 amendment;
     ApiAdapter implementation; conflict detection; mobile/responsive
     polish; a11y; animation tuning)
   - Pre-existing broader-suite flake catalog continued from Stage
     C.3 handoff pack (Wave 5 close R-retrospective candidates)
   - Wave 5 close (ADR-0019) preparation pointer: this handoff +
     C.3-handoff + C.2-handoff + C.1-handoff = 4-stage close
     evidence

3. `docs/plans/wave-5-main/C.4-5-stage-close.md` — **NEW** (PR.md
   self).

4. `docs/audits/screenshots/wave-5-c4-5-edit-flow-e2e.png` —
   **NEW** (≥5KB; D9.5).

## D2 trigger judgment

NO D2 rows fire. Spec + handoff pack + PR.md only. PRE-COMMIT
CLAUDE REVIEW does NOT fire.

## ui_touch

`true` if mechanical detection counts spec under
`apps/site/src/__tests__/e2e/**`. Per ADR-0011 D9.6 CI gates
auto-skip on `ui_touch=false`.

## e2e_smoke

Per v1.3 catalog § C.4-5 (lines 645+) — 10 entries each mapped to
user MVP item per Q3 plan-challenger absorbtion. The 10-item
coverage manifest is documented in handoff pack; the canonical
Stage C.4 close spec at file 1 ties the load→edit→save→reload
sequence together.

- flow: Stage C.4 close ceremony — load /notes/sample-mdx-note/edit + edit + save (800ms debounce) + reload + verify content+grid+banner+save-indicator intact (10-item MVP coverage manifest documented at C.4-handoff-pack.md; each MVP item mapped 1:1 to existing spec from Stage C.2/C.3 + C.4-1..C.4-4 sequence)
  target_url: /notes/<slug>/edit
  playwright_spec: `apps/site/src/__tests__/e2e/c4-5-edit-flow-e2e.spec.ts:"Stage C.4 close — load → edit → save → reload sequence + 10-item MVP coverage manifest"`
  screenshot_archive: docs/audits/screenshots/wave-5-c4-5-edit-flow-e2e.png

## decision-log

### Decision 1 — 10-item MVP coverage via existing-spec manifest

10 user MVP items (mvp-1..10 per v1.3 retrofit catalog § C.4-5):

- mvp-1 Edit Mode banner → existing `c4-3-banner.spec.ts`
- mvp-2 Tiptap WYSIWYG → existing `c4-3-toolbar.spec.ts`
- mvp-3 slash menu OR palette → existing `c4-3-palette.spec.ts` + `c4-3-slash-menu.spec.ts`
- mvp-4 块拖拽 4 边缘 split → existing `playwright/grid-drag-drop.spec.ts`
- mvp-5 块 resize → existing `playwright/grid-resize-responsive.spec.ts`
- mvp-6 save state indicator → existing `c4-3-save-indicator.spec.ts`
- mvp-7 localStorage 跨刷新持久化 → existing `c4-4-save-roundtrip.spec.ts`
- mvp-8 v2 视觉 identity → existing `c3-1-tokens-fonts.spec.ts`
- mvp-9 8 block kinds render correct → existing `c4-2-block-registry.spec.ts` + `c2-7-heavy-grid-dims.spec.ts`
- mvp-10 heavy block plugin affordance → existing `c2-7-heavy-grid-dims.spec.ts`

C.4-5 ships ONE NEW edit-flow-e2e ceremony spec (load → edit →
save → reload) + handoff pack documenting the manifest. No
duplicate specs; existing coverage is the canonical source.

### Decision 2 — Stage close discipline

C.4-5 follows PR #79 / C.3-5 simple-D1 pattern (PLAN
orchestrator-self → REVIEW codex-pr-reviewer-55 single round →
COMMIT same invocation). No source code change; no CONTRACT
change; minimal scope.

### Decision 3 — Stage C.4 ✅ FULLY CLOSED at C.4-5 merge

Post-merge: Wave 5 Stage C.4 closes with 6-PR sequence (C.4-prelude

- C.4-1..C.4-5). Wave 5 close (ADR-0019 ceremony) is the next
  PR, separate scope.

## acceptance

```bash
# AC-1: ui_touch + e2e gates PASS
pnpm exec tsx scripts/check-ui-touch.ts
pnpm exec tsx scripts/check-e2e-coverage.ts
```

```bash
# AC-2: 10-item MVP manifest in handoff pack
grep -cE 'mvp-(1|2|3|4|5|6|7|8|9|10)\b' docs/plans/wave-5-main/C.4-handoff-pack.md
# Expected: ≥10
```

```bash
# AC-3: pnpm check exit 0
pnpm check
```

```bash
# AC-4: scope-fence — exactly 4 files
git diff --name-only main..HEAD | sort
# Expected:
# apps/site/src/__tests__/e2e/c4-5-edit-flow-e2e.spec.ts
# docs/audits/screenshots/wave-5-c4-5-edit-flow-e2e.png
# docs/plans/wave-5-main/C.4-5-stage-close.md
# docs/plans/wave-5-main/C.4-handoff-pack.md
```

```bash
# AC-5: anti-leak (char-class [:])
git diff main..HEAD -- ':!docs/plans/wave-5-main/C.4-5-stage-close.md' ':!docs/plans/wave-5-main/C.4-handoff-pack.md' | grep -cE '^\+.*(playwright_spec[:]|screenshot_archive[:]|e2e_smoke[:])' || true
# Expected: 0
```

## Out-of-scope

- **layoutEpoch sync ADR-0018 amendment**: deferred to a separate
  ADR-amendment PR per ADR-0018 line 464 接口冻结 (carried from
  C.4-4 R1 surface).
- **ApiAdapter implementation**: Phase 2+ scope.
- **Mobile/responsive editor polish**: Phase 2+ scope.
- **a11y / keyboard navigation full audit**: Phase 2+ scope.
- **Animation tuning / 60fps perf**: Phase 2+ scope (per ADR-0017
  D11+).

## Related

- [Wave 5 plan v1.3 row C.4-5](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) line 718
- [v1.3 retrofit catalog § C.4-5 (10 e2e_smoke entries)](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) lines 645+
- C.4-prelude / C.4-1 / C.4-2 / C.4-3 / C.4-4 PR.md siblings
- [C.3 handoff pack](C.3-handoff-pack.md) — Stage C.3 close precedent
- [C.2 handoff pack](C.2-handoff-pack.md) — Stage C.2 close precedent
- [C.1 handoff pack](C.1-handoff-pack.md) — Stage C.1 close precedent
- Sister: Wave 5 close ADR-0019 (next PR)
