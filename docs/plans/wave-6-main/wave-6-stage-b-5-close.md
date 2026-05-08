# Wave 6 Stage B.5 — Stage B close ceremony (full edit→save→reload roundtrip + handoff pack)

> **Wave 6 Stage B 5th and final PR** per ADR-0018 v0.6 D14 sequence.
> B.1 ADR amendment merged at `fc7689f`; B.2 endpoint `100f1dc`;
> B.3 ApiAdapter `6e88cb4`; B.4 mount wire `376a559`; this is B.5.
> Closes Stage B with: (1) the full edit → ApiAdapter POST →
> filesystem mutated → reload preserves content Playwright spec
> running against the real Astro preview server (proves the editor
> persistence cycle end-to-end without a stub); (2) Stage B handoff
> pack documenting what closed, what is NOT closed (static-build
> read-route caveat), test surface, and Phase 2+ deferred items;
> (3) `docs/plans/active.md` repointed to reflect Stage B closure.

## title

Add `apps/site/playwright/stage-b-close-roundtrip.spec.ts` — Stage B
close-ceremony Playwright spec that drives the
`/notes/__test_smoke__/b5-roundtrip/edit` route end-to-end against the
Astro preview server (no stubs): types a fixed marker, waits for the
800ms debounce save (ApiAdapter POST), then verifies the
`content/notes/__test_smoke__/b5-roundtrip/index.mdx` mutation, the
sibling `state.json` sidecar creation, and that reloading the edit
route loads the marker back via ApiAdapter GET. Add the test fixture
`content/notes/__test_smoke__/b5-roundtrip/index.mdx` together with a
`beforeAll` snapshot + `afterAll` restore of both files. Author the
Stage B handoff pack at
`docs/plans/wave-6-main/stage-b-handoff-pack.md` and repoint
`docs/plans/active.md` to reflect the Stage B closure.

## files

10 files (~340-440 LOC; +5 at R5 for the read-route-freshness
authority sister-doc-sync per ADR-0006 #6 + #8 — ADR-0018 D14 row
B.5 amendment + B.3/B.4 PR.md forward-ref updates + 2 spec
file-level JSDoc forward-ref updates that all encoded the
pre-static-build-caveat "B.5 verifies full cross-route sync"
expectation):

1. `apps/site/playwright/stage-b-close-roundtrip.spec.ts` —
   **NEW** (~120 LOC). Single Playwright test:
   - `beforeAll`: snapshot `index.mdx` (and `state.json` if present)
     into in-memory `FixtureSnapshot`; assert the snapshot does
     **not** already contain the fixed marker (catches stale state
     from a previously-killed run); unlink any leftover sidecar so
     the post-save sidecar assertion is probative
   - `afterAll`: restore both files unconditionally so the working
     tree stays clean even on test failure
   - test body: page.goto edit route → wait for `.ProseMirror` →
     type the fixed marker `B5-CLOSE-MARKER` → wait for `Saved`
     indicator → `readFileSync(FIXTURE_MDX)` asserts marker present
     AND **YAML frontmatter block byte-equal to the snapshot**
     (regex-extracted; catches reorderings/whitespace tweaks/field
     additions that violate `@skb/content-types` authority) →
     `existsSync(FIXTURE_SIDECAR)` + sidecar
     `{lastModified, version >= 2}` → `page.reload()` → editor
     still shows marker (proves ApiAdapter GET load chain)
   - **No D9.5 screenshot** — B.5 is `ui_touch=false` (no D9
     obligation) and the editor's surrounding chrome (save indicator
     timing, palette/toolbar layout) is not byte-deterministic
     across runs; B.4's screenshot already documents the wired
     editor surface
   - documents the static-build read-route caveat in the file-level
     JSDoc + handoff pack cross-reference

2. `content/notes/__test_smoke__/b5-roundtrip/index.mdx` — **NEW**
   (~10 LOC). Fixture note with stable `@skb/content-types` frontmatter
   (title / slug / tags / date / draft) + a body line that says
   "do not edit by hand — the smoke test reverts modifications".

3. `docs/plans/wave-6-main/stage-b-handoff-pack.md` — **NEW**
   (~110 LOC). PR-table (B.1-B.5 + squash hashes), what closed
   (server-backed editor persistence; cross-session + cross-device
   edit continuity; authority sister-doc consistency), what is NOT
   closed (static-build read-route caveat with `astro dev` HMR vs
   `astro build` preview vs Phase 3+ apps/api SSR comparison), full
   test surface table (vitest + Playwright counts per stage), D9
   obligations + carve-outs section (B.1+B.2+B.5 ui_touch=false carve-outs documented; B.3+B.4 e2e_smoke obligations + screenshot archives listed), Wave 6 →
   Phase 2+ deferred items (carry-forward 8 items from ADR-0019 D3
   minus #2 which closed at B.3+B.4; plus 4 NEW deferred items
   surfaced during Stage B — read-route freshness, apps/api
   path-(a) Phase 3+, POST-as-create policy, NoteSaveAdapter v2
   extensions).

4. `docs/plans/active.md` — **MODIFY** (~20 LOC). Repoint 当前 wave
   to "Wave 6 Stage B ✅ CLOSED" with the 5-PR squash chain + the
   static-build caveat + handoff-pack reference. Wave 5 prior
   context kept for reference. 当前 wave next becomes "Stage C TBD"
   pending gatekeeper scope decision.

5. `docs/plans/wave-6-main/wave-6-stage-b-5-close.md` — **NEW**
   (PR.md self).

(No screenshot archive — see file 1's "No D9.5 screenshot" bullet.
Earlier B.5 drafts archived a full-page editor screenshot but the
non-deterministic chrome rendering made the bytes a churn surface
rather than a stable audit record.)

6. `docs/decisions/ADR-0018-v2-visual-migration.md` — **MODIFY**
   (~5 LOC; R5 fold-in). v0.6 D14 sequence row B.5 amended: the
   pre-amendment text said "verify full cross-route sync; reload
   `/notes/<slug>` → content reflects edit" — that authority claim
   was disproved by the static-build caveat surfaced at B.5 R5.
   Row updated to describe the actually-shippable proof
   (edit-route persistence cycle: edit → POST → fs → reload edit
   route → ApiAdapter GET) plus the explicit static-build caveat
   pointer. No other D-sections modified.

7. `docs/plans/wave-6-main/wave-6-stage-b-3-api-adapter.md` —
   **MODIFY** (~5 LOC; R5 fold-in). Decision 3 prose mentioned
   "the full edit→save→reload-read-route flow is B.5 scope" —
   updated to "edit-route persistence cycle (edit → POST →
   filesystem → edit-route reload via ApiAdapter GET)" + adds the
   read-route freshness deferral pointer.

8. `docs/plans/wave-6-main/wave-6-stage-b-4-mount-wire.md` —
   **MODIFY** (~5 LOC; R5 fold-in). Header note + Decision 4
   prose updated for the same reason (the pre-amendment text said
   "the read route picks up the updated MDX body on next visit" /
   "the read-route reflects the save"; both are inaccurate under
   `astro build`/preview mode).

9. `apps/site/playwright/api-adapter-roundtrip.spec.ts` —
   **MODIFY** (~3 LOC; R5 fold-in). File-level JSDoc forward-ref
   "Full edit→save→reload-read-route Playwright coverage lands at
   B.5 close" updated for the same reason.

10. `apps/site/playwright/edit-mount-api-wire.spec.ts` —
    **MODIFY** (~3 LOC; R5 fold-in). Same JSDoc forward-ref
    update.

## D2 trigger judgment

Row 4 (NEW handoff-pack documentation under `docs/plans/`; Stage
close ceremony) + Row 5 (apps/site Playwright spec consumes the
endpoint shipped at B.2). PRE-COMMIT CLAUDE REVIEW required per
Row 4. No CONTRACT.md changes (Row 1 not fired); no NEW deps (Row
2 not fired); no auth/CI surface (Row 8 not fired).

## ui_touch

`false` — none of the 10 source files in this PR match the
ADR-0011 D9.1 path patterns. `apps/site/playwright/**` is not a
D9.1 runtime UI surface (specs themselves are not the surface they
exercise); `content/notes/__test_smoke__/b5-roundtrip/index.mdx` is
content data, not a D9.1 surface; `docs/**` and
`docs/plans/active.md` are not D9.1 surfaces. The 5 R5 fold-in
files (1 ADR + 2 PR.md sister-doc-syncs + 2 spec JSDoc) are also
non-D9.1 surfaces. Verified locally: `check-ui-touch` over the
full 10-file set returns `ui_touch=false`. The Playwright spec
exists as the close-ceremony product proof, not as a D9
obligation.

(Cross-check on the trajectory: B.2 had `ui_touch=false` after the
D9.1 API-route exclusion fold-in; B.3 + B.4 had `ui_touch=true`
because the editor-shell src and components surfaces match D9.1
literally; B.5 is `false` because the diff is Playwright spec +
fixture + docs.)

## e2e_smoke

(omitted — `ui_touch: false`)

## decision-log

### Decision 1 — close-ceremony spec uses a real preview server (no stub)

The B.3 + B.4 specs use route interception to avoid mutating the
real `sample-mdx-note` fixture across runs. B.5's whole point is
to prove the end-to-end persistence chain works against the real
filesystem at `content/notes/<slug>/index.mdx`, so it MUST hit the
real preview server's API endpoint. Mitigation for the fixture-
mutation concern: dedicated test slug `__test_smoke__/b5-roundtrip`
with `beforeAll` snapshot + `afterAll` restore so the working tree
stays clean.

### Decision 2 — read-route reflection NOT asserted by the spec

`apps/site` builds with `output: 'static'`; `/notes/<slug>` HTML
is prerendered at `astro build` and served as a static asset by
`astro preview`. Mutating `content/notes/<slug>/index.mdx` via the
API does NOT invalidate the prerendered HTML. The user's original
report was against `astro dev` (HMR-aware), where the read route
DOES reflect saves. Documented in the spec's file-level JSDoc and
in §"What is NOT closed" of the handoff pack — Phase 3+ path-(a)
`apps/api` SSR is the canonical fix.

### Decision 3 — fixture snapshot/restore over per-test temp files

`writeFileSync` to a fresh temp file would require a corresponding
test note allocation + cleanup; using a committed test fixture +
unconditional `afterAll` restore is simpler and survives test
failure (the restore runs even if assertions fail). The tradeoff
is a small amount of "test infrastructure as content" sitting under
`content/notes/__test_smoke__/`, which is already an established
pattern (see `__test_cjk__/laptop`, `__test_cjk__/zh-note`).

### Decision 4 — handoff pack documents new deferred items + carry-forward

The 8 Wave 5 ADR-0019 D3 items minus #2 (closed at B.3+B.4) plus 4
NEW Stage-B-surfaced items: read-route freshness, apps/api path-(a)
Phase 3+, POST-as-create policy, NoteSaveAdapter v2 extensions.
Better to surface these in the handoff pack than to defer-chain
into a future PR (per memory `feedback_r14_defer_chain_plan_amendment`).

## acceptance

```bash
# AC-1: ui_touch=false across the full 10-file set (B.5 is
# documentation + test + spec-JSDoc only; no runtime UI surface).
pnpm exec tsx scripts/check-ui-touch.ts \
  --files apps/site/playwright/api-adapter-roundtrip.spec.ts \
          apps/site/playwright/edit-mount-api-wire.spec.ts \
          apps/site/playwright/stage-b-close-roundtrip.spec.ts \
          content/notes/__test_smoke__/b5-roundtrip/index.mdx \
          docs/decisions/ADR-0018-v2-visual-migration.md \
          docs/plans/active.md \
          docs/plans/wave-6-main/stage-b-handoff-pack.md \
          docs/plans/wave-6-main/wave-6-stage-b-3-api-adapter.md \
          docs/plans/wave-6-main/wave-6-stage-b-4-mount-wire.md \
          docs/plans/wave-6-main/wave-6-stage-b-5-close.md 2>&1 | tail -1
# Expected: ui_touch=false
```

```bash
# AC-2: close-ceremony Playwright spec passes against real preview server
pnpm --filter @skb/site exec playwright test playwright/stage-b-close-roundtrip.spec.ts --reporter=line 2>&1 | tail -3
# Expected: 1 passed
```

```bash
# AC-3: working tree clean after the spec runs (snapshot/restore works)
pnpm --filter @skb/site exec playwright test playwright/stage-b-close-roundtrip.spec.ts --reporter=line >/dev/null 2>&1
git status --porcelain content/notes/__test_smoke__/b5-roundtrip/ | wc -l
# Expected: 0
```

```bash
# AC-4: pnpm check exit 0
pnpm check
```

```bash
# AC-5: handoff pack exists with the canonical sections
test -f docs/plans/wave-6-main/stage-b-handoff-pack.md
grep -cE '^## PR sequence$' docs/plans/wave-6-main/stage-b-handoff-pack.md
# Expected: 1
grep -cE '^## What is closed$' docs/plans/wave-6-main/stage-b-handoff-pack.md
# Expected: 1
grep -cE '^## What is NOT closed' docs/plans/wave-6-main/stage-b-handoff-pack.md
# Expected: 1
```

```bash
# AC-6: active.md repointed to Stage B closed
grep -cE 'Wave 6 Stage B ✅ CLOSED' docs/plans/active.md
# Expected: 1
grep -cE 'stage-b-handoff-pack' docs/plans/active.md
# Expected: ≥ 1
```

```bash
# AC-7: scope-fence — exactly 10 source files (excl. audit logs).
# Trajectory: pre-R5 = 5 (planned); R5 +5 (read-route-freshness
# authority sister-doc-sync per ADR-0006 #6+#8 — ADR-0018 D14 row B.5
# amendment + B.3/B.4 PR.md forward-ref updates + 2 spec JSDoc
# forward-ref updates).
git diff --name-only main..HEAD -- ':!docs/audits/codex-runs/' | sort | wc -l
# Expected: 10
```

```bash
# AC-8: full visual suite passes under the CI retry budget (retries=2
# per playwright.config.ts, matches the CI environment). Local-default
# parallel runs may surface flakes when the real-preview-server B.5
# spec runs alongside the route-stubbed C.4 specs — a parallel-load
# characteristic that CI retries mitigate. Flake count + flake name
# are run-dependent and explicitly NOT pinned: the check is "the
# command exits 0", not any specific pass/flake breakdown.
pnpm --filter @skb/site exec playwright test --retries=2
# Expected: exit 0
```

## Out-of-scope

- **Static-build read-route freshness** — Phase 3+ path-(a) apps/api
  SSR concern; documented as a deferred item in the handoff pack.
- **POST-as-create / new-note creation** — endpoint refuses missing-
  MDX with 404; new-note creation needs its own ADR (frontmatter
  generation policy + slug allocation).
- **Stage C scope** — gatekeeper TBD at next session start.

## Related

- [ADR-0018 v0.6 amendment](../../decisions/ADR-0018-v2-visual-migration.md) — Stage B authority
- [Stage B handoff pack](stage-b-handoff-pack.md) — close evidence
- B.1 (`fc7689f`), B.2 (`100f1dc`), B.3 (`6e88cb4`), B.4 (`376a559`) — prior PRs
- [ADR-0019 D3](../../decisions/ADR-0019-wave-5-close.md) — Wave 5 deferred items
