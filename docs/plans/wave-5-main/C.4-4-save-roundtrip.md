# C.4-4 — save/load roundtrip Playwright spec (verifies edit → 800ms debounce → reload preserves content + version)

> **Wave 5 Stage C.4 4th implementation PR** (per Wave 5 plan v1.3
> row C.4-4, line 717; v1.3 R14 retrofit catalog § C.4-4 lines
> 637-644). **Scope post-R1**: lands save roundtrip Playwright spec
> only — verifies the existing NoteState (mdxSource + version +
> lastModified shipped at C.4-prelude + C.4-1) save+reload
> roundtrip on `/notes/<slug>/edit`. The originally-planned
> `layoutEpoch?: number` NoteState shape change is DEFERRED to a
> separate ADR-0018 amendment PR per ADR-0018 line 464 接口冻结
> (Wave 5 任何 PR 改动 NoteSaveAdapter / NoteState shape 必走
> ADR-0018 Amendment + D2 row 4). **No D2 row fires** at C.4-4
> post-revert (no CONTRACT change, no source code change in
> editor-shell or apps/site).

## title

Land save roundtrip Playwright spec at
`apps/site/src/__tests__/e2e/c4-4-save-roundtrip.spec.ts`. Verifies
edit → 800ms-debounced save → reload preserves content +
version. Uses sessionStorage-guard pattern in addInitScript
(canonical pattern for stateful Playwright reload tests).

## files

3 files (post-R1 honest narrow scope):

1. `apps/site/src/__tests__/e2e/c4-4-save-roundtrip.spec.ts` —
   **NEW** (~85 LOC). Playwright spec verifies:
   - Light-theme guard via addInitScript (one-shot localStorage
     clear gated by sessionStorage flag so reload preserves state)
   - Navigate /notes/sample-mdx-note/edit; .ProseMirror visible
   - Type ' Hello world'; wait 1000ms (>800ms debounce)
   - Save indicator shows /Saved/
   - localStorage skb-note:sample-mdx-note: version >= 2 +
     mdxSource contains 'Hello world'
   - page.reload(); .ProseMirror still visible; contains 'Hello
     world'; reloaded version + mdxSource match saved
   - Screenshot to `docs/audits/screenshots/wave-5-c4-4-save-roundtrip.png`

2. `docs/plans/wave-5-main/C.4-4-save-roundtrip.md` — **NEW**
   (PR.md self).

3. `docs/audits/screenshots/wave-5-c4-4-save-roundtrip.png` —
   **NEW** (≥5KB).

## D2 trigger judgment

NO D2 rows fire post-revert (no CONTRACT.md change; no source code
change in editor-shell or apps/site src). Spec-only addition. PRE-COMMIT
CLAUDE REVIEW does NOT fire.

## ui_touch

`true` if mechanical detection counts spec file under
`apps/site/src/__tests__/e2e/**`. Scripts may classify as `false`
if the path is not in D9.1 set; CI gate auto-skips on `ui_touch=false`
per ADR-0011 D9.6.

## e2e_smoke

Per v1.3 catalog § C.4-4 (lines 637-644). Scope reduced to existing
NoteState fields (mdxSource + version) — layoutEpoch sync deferred
to ADR-0018 amendment PR.

- flow: edit → 800ms-debounced save to LocalStorage → reload preserves content + version (layoutEpoch sync deferred to ADR-0018 amendment per line 464 接口冻结)
  target_url: /notes/<slug>/edit
  playwright_spec: apps/site/src/**tests**/e2e/c4-4-save-roundtrip.spec.ts:"edit → 800ms debounce save to LocalStorage → reload preserves content + version"
  screenshot_archive: docs/audits/screenshots/wave-5-c4-4-save-roundtrip.png

## decision-log

### Decision 1 — layoutEpoch sync deferred to ADR-0018 amendment

ADR-0018 line 464 explicit: "Wave 5 任何 PR 改动 NoteSaveAdapter /
NoteState shape 必走 ADR-0018 Amendment (D2 row 4 fires); Stage
C.4 实施 不允许 silent 接口扩展". Adding `layoutEpoch?: number` to
NoteState IS a shape change. R1 review caught the silent extension
attempt; orchestrator reverted the NoteState change. layoutEpoch
sync needs a dedicated ADR-0018 amendment PR + D2 row 4 +
PRE-COMMIT CLAUDE REVIEW (per Row 4) — out of C.4-4 scope.

### Decision 2 — sessionStorage-guard pattern enables reload-roundtrip

Playwright `addInitScript` runs on EVERY page navigation by design.
Naive `localStorage.removeItem` in addInitScript wipes saved state
on reload, defeating roundtrip assertions. Solution: gate the
clear with a sessionStorage flag (set on first navigation; checked
on subsequent navigations). This is the canonical pattern for
stateful Playwright reload tests.

### Decision 3 — ApiAdapter forward-stub COMMENT-only continued

C.4-1's COMMENT-only ApiAdapter forward-stub remains intact.
C.4-4 does not introduce executable ApiAdapter.

## acceptance

```bash
# AC-1: ui_touch + e2e gates PASS
pnpm exec tsx scripts/check-ui-touch.ts
pnpm exec tsx scripts/check-e2e-coverage.ts
```

```bash
# AC-2: spec file exists + uses sessionStorage-guard pattern
test -f apps/site/src/__tests__/e2e/c4-4-save-roundtrip.spec.ts
grep -cE "sessionStorage\.getItem\('skb-c4-4-cleared'\)" apps/site/src/__tests__/e2e/c4-4-save-roundtrip.spec.ts
# Expected: ≥1 (sessionStorage-guard pattern present)
```

```bash
# AC-3: pnpm check exit 0
pnpm check
```

```bash
# AC-4: scope-fence — exactly 3 files
git diff --name-only main..HEAD | sort
# Expected:
# apps/site/src/__tests__/e2e/c4-4-save-roundtrip.spec.ts
# docs/audits/screenshots/wave-5-c4-4-save-roundtrip.png
# docs/plans/wave-5-main/C.4-4-save-roundtrip.md
```

```bash
# AC-5: anti-leak (char-class [:])
git diff main..HEAD -- ':!docs/plans/wave-5-main/C.4-4-save-roundtrip.md' | grep -cE '^\+.*(playwright_spec[:]|screenshot_archive[:]|e2e_smoke[:])' || true
# Expected: 0
```

## Out-of-scope

- **layoutEpoch field add to NoteState**: deferred to a separate
  ADR-0018 amendment PR per line 464 接口冻结.
- **真验收 10-item E2E coverage**: deferred to C.4-5 Stage close.
- **ApiAdapter implementation**: Phase 2+ scope; COMMENT-only stub
  continues from C.4-1.
- **Conflict detection / optimistic lock**: Phase 2+ ApiAdapter
  scope.

## Related

- [Wave 5 plan v1.3 row C.4-4](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) line 717
- [ADR-0018 D8 NoteSaveAdapter 接口冻结 line 464](../../decisions/ADR-0018-v2-visual-migration.md)
- [ADR-0016 D12 layoutEpoch reducer](../../decisions/ADR-0016-grid-data-model.md) — referenced; consumer wire deferred per Decision 1
- [C.4-1 PR.md](C.4-1-note-save-adapter.md) — NoteSaveAdapter contract hardening + ApiAdapter COMMENT-only forward-stub
- [C.4-3 PR.md](C.4-3-palette-slash-toolbar.md) — save indicator
- Sister PR: C.4-5 (Stage C.4 close + 10-item E2E coverage; mvp-7 'localStorage 跨刷新持久化' is the canonical full reload-roundtrip)
