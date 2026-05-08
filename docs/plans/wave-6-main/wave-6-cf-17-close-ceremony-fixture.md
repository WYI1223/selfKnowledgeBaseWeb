# Wave 6 carry-forward #17 — Stage close-ceremony fixture-representativeness rule (ADR-0011 v0.2.2 D9.8)

> Wave 6 Stage B post-close carry-forward (handoff pack §"Post-close
> carry-forwards"). Codifies the failure class that surfaced the
> Wave 6 hotfix chain (PRs #103 + #104): Stage B.5 close-ceremony
> Playwright spec PASS-ed against a synthetic prose-only fixture,
> production corpus exercise was missed, user reported the editor
> still empty against the real `sample-blocks` note. ADR-0011
> amendment + handoff pack note + active.md repoint.

## title

Add D9.8 sub-section to ADR-0011 (`docs/decisions/ADR-0011-linear-pipeline-execution-model.md`) titled "Stage close-ceremony fixture representativeness (v0.2.2 amendment 2026-05-08)" — codifies the rule that stage close-ceremony Playwright specs MUST exercise either the actual production fixtures the user will encounter OR a dedicated `__test_smoke__` fixture that enumerates the same MDX feature surface as the production corpus by construction. Synthetic prose-only fixtures are explicitly insufficient for stage close. Mid-stage PRs unaffected — minimal targeted fixtures still allowed for narrow surfaces. Update the Stage B handoff pack §"Post-close carry-forwards" with the closure entry and the remaining #15b/#16 carry-forwards. Repoint `docs/plans/active.md` to mention the 3 post-close follow-up PRs.

## files

9 source files (~150 LOC; +4 at R1 — ADR amendment-ledger entry
+ agent-contract / generated-doc sister-doc-sync per ADR-0006 #8;
+1 at R2 — `docs/runbooks/team-operations.md` v0.2 → v0.2 + v0.2.1
+ v0.2.2 reference update + `codex-pr-reviewer-55` row D9.8 cite,
closing the propagation gap codex R2 surfaced):

1. `docs/decisions/ADR-0011-linear-pipeline-execution-model.md` —
   **MODIFY** (~25 LOC). Insert NEW D9.8 sub-section between
   D9.7 and D10. Documents the Wave 6 Stage B.5 evidence (synthetic
   `__test_smoke__/b5-roundtrip` fixture missed `mdxFlowExpression`
   + JSX-attr coercion + Tiptap mark schema-collision triple-bug),
   states the rule (production fixture OR feature-equivalent
   synthetic), records the enforcement (close-ceremony reviewer
   audits PR.md `e2e_smoke[].playwright_spec` against the fixture's
   feature surface vs the relevant CONTRACT.md / ADR), carves out
   mid-stage PRs (representativeness fires only at stage close).
2. `docs/plans/wave-6-main/stage-b-handoff-pack.md` — **MODIFY**
   (~30 LOC). Append a new §"Post-close carry-forwards" section
   listing: ✅ hotfix PR #103, ✅ cf-15a PR #104, ✅ cf-17 (this
   PR), ⏳ cf-15b (block-Code rename pending), ⏳ cf-16 (per-block
   attr coercion pending).
3. `docs/plans/active.md` — **MODIFY** (~5 LOC). Append the 3
   post-close follow-up PRs to the current-wave description. The
   wave date stays at 2026-05-07 for Stage B closure; this is
   documenting follow-ups that landed 2026-05-08.
4. `docs/plans/wave-6-main/wave-6-cf-17-close-ceremony-fixture.md` —
   **NEW** (PR.md self).

5. `docs/decisions/ADR-0011-linear-pipeline-execution-model.md`
   **(continued; second hunk; R1 fold-in)** — added v0.2.1 +
   v0.2.2 entries to the `## Amendments` ledger before `## Related`
   (R1.1 surfaced that the v0.2.2 D9.8 sub-section existed but the
   ledger still ended at v0.2). v0.2.1 documents the previously-
   missing-from-ledger Wave 6 Stage B.2 cross-ref-only fold-in;
   v0.2.2 documents this PR's amendment with full provenance.

6. `agent-contract.md` — **MODIFY** (~12 LOC; R1 fold-in).
   `codex-pr-reviewer-55` profile description item #9 extended
   with a "Stage close-ceremony 加强 (v0.2.2 amendment, ADR-0011
   D9.8)" sub-bullet so the canonical reviewer prompt-prelude
   carries the new audit step into every codex run. Per ADR-0006
   item #8 authority-document propagation invariant.

7. `scripts/render/review-checklist.ts` — **MODIFY** (~3 LOC; R1
   fold-in). The render template's #9 bullet text mirrors the
   agent-contract item #9 extension. Required for `pnpm
   generate:configs` to produce the matching downstream surface.

8. `docs/review-checklist.md` — **MODIFY** (regenerated). DO NOT
   EDIT BY HAND — derived from `scripts/render/review-checklist.ts`
   via `pnpm generate:configs`. Lockstep update per ADR-0006 item
   #8 sub-form C (lockfile-class regenerated artifacts must ride
   the same commit).

9. `docs/runbooks/codex-tool-invocations.md` — **MODIFY**
   (regenerated). DO NOT EDIT BY HAND — derived from
   `agent-contract.md` (`codex-pr-reviewer-55` profile description)
   via `pnpm generate:configs`. Same lockstep invariant as #8.

10. `docs/runbooks/team-operations.md` — **MODIFY** (~3 LOC; R2
    fold-in). The active-runbook line that names the ADR-0006
    9-point checklist version chain extended from "v0.2 amendment"
    only to "v0.2 + v0.2.1 + v0.2.2 (D9.8 stage close-ceremony
    fixture-representativeness)". The `codex-pr-reviewer-55` row
    in the Tier-2 reviewer table also gains a D9.8 cite that
    defers to `codex-tool-invocations.md` as the canonical
    expanded reviewer prompt-prelude. Closes ADR-0006 #8
    propagation drift codex R2 surfaced.

## D2 trigger judgment

Row 4 (NEW ADR-0011 v0.2.2 D9.8 amendment) per CLAUDE.md
`## Review workflow` + ADR-0011 D1 stage 4. PRE-COMMIT CLAUDE
REVIEW fires per Row 4 — stage 4 triggered. (Pure documentation
PR; no code change, no CONTRACT.md change.) Other D2 rows: Row 1
N/A (no CONTRACT change), Row 2 N/A (no dep change), Row 5 N/A
(no cross-package code change), Row 8 N/A (no CI/auth/security
touch).

## ui_touch

`false` — none of the 9 source files (post-R1 + R2 fold-ins;
includes `agent-contract.md` + 3 generated/regenerated runbook
surfaces + `scripts/render/review-checklist.ts` template) match
ADR-0011 D9.1 path patterns. `agent-contract.md` is at the repo
root and `scripts/render/**` is below the D9.1 surface set;
verified via `pnpm exec tsx scripts/check-ui-touch.ts --files <9-file-set>`.

## e2e_smoke

(omitted — `ui_touch: false`)

## decision-log

### Decision 1 — ADR-0011 amendment over a separate process doc

The fixture-representativeness rule is a stage-close gate in the
existing D9 (Product Experience Quality Gate) architecture. Adding
it as D9.8 (between D9.7 implementation evidence and D10 prompt-
patching anti-pattern) keeps the rule co-located with the gate it
extends, and reuses the existing D9 enforcement chain
(reviewer-audit at PR.md `e2e_smoke[]` validation). A separate
process doc would fragment the authority surface and require
cross-references that the consumer (codex `codex-pr-reviewer-55`
profile description) would have to learn separately.

### Decision 2 — Carve-out for mid-stage PRs

If the rule fired on every UI-touch PR, mid-stage prose-only
refactor PRs would be forced to invent stage-end-style synthetic
test fixtures with the full block-kind feature surface — wasted
effort, since the close-ceremony spec catches whatever the mid-stage
PR misses. The rule fires ONLY at stage close (the last PR in a
stage's sequence that the handoff pack ratifies). Mid-stage PRs
keep their narrow targeted fixtures; the close-ceremony catches
representativeness.

### Decision 3 — Production-corpus exercise as the preferred path

Wave 6 Stage B.5 specifically used `__test_smoke__/b5-roundtrip`
to avoid mutating `content/notes/sample-blocks/` via the real
filesystem-write Playwright spec. The fixture was minimal so the
fixture-restore in `afterAll` would reset cleanly. After the
hotfix, the right pattern would be to use `sample-blocks` (with
fixture-snapshot/restore the same way `__test_smoke__/b5-roundtrip`
worked) so the close-ceremony exercises the production corpus.
The D9.8 rule allows EITHER production-corpus exercise OR a
synthetic fixture that lists the same MDX feature surface by
construction (component blocks, comments, marks). The choice is
the close-ceremony PR author's; the reviewer audits the surface
against the relevant CONTRACT.md / ADR.

### Decision 4 — No CI gate; reviewer-audit only

Mechanically enforcing fixture representativeness via CI would
require the CI gate to know the relevant CONTRACT.md / ADR feature
list and parse the Playwright spec to derive what it exercises —
brittle and over-engineered for the failure rate (one Stage close
per stage). Reviewer audit at the close-ceremony PR is the
right level of enforcement: the close-ceremony reviewer
(orchestrator at stage 4 OR codex-pr-reviewer-55 at stage 3) is
already inspecting the PR.md `e2e_smoke[]` block; adding "verify
the fixture exercises the relevant production corpus" is a small
incremental ask.

## acceptance

```bash
# AC-1: ui_touch=false across the full 9-file post-R2 set (pure
# documentation + generator-template + agent-contract authority +
# regenerated runbook surfaces; team-operations.md added at R2 to
# close the v0.2.2 propagation gap).
pnpm exec tsx scripts/check-ui-touch.ts \
  --files agent-contract.md \
          docs/decisions/ADR-0011-linear-pipeline-execution-model.md \
          docs/plans/active.md \
          docs/plans/wave-6-main/stage-b-handoff-pack.md \
          docs/plans/wave-6-main/wave-6-cf-17-close-ceremony-fixture.md \
          docs/review-checklist.md \
          docs/runbooks/codex-tool-invocations.md \
          docs/runbooks/team-operations.md \
          scripts/render/review-checklist.ts 2>&1 | tail -1
# Expected: ui_touch=false
```

```bash
# AC-2: ADR-0011 D9.8 sub-section exists with the canonical title
grep -cE '^#### D9\.8 — Stage close-ceremony fixture representativeness' docs/decisions/ADR-0011-linear-pipeline-execution-model.md
# Expected: 1
```

```bash
# AC-3: D9.8 prose names the Wave 6 Stage B.5 evidence
grep -cE 'mdxFlowExpression|sample-blocks|stage-b-close-roundtrip' docs/decisions/ADR-0011-linear-pipeline-execution-model.md
# Expected: ≥ 1
```

```bash
# AC-4: handoff pack §"Post-close carry-forwards" lists the 3 closed + 2 pending items
grep -cE 'Stage B post-close hotfix|Carry-forward #15a|Carry-forward #15b|Carry-forward #16|Carry-forward #17' docs/plans/wave-6-main/stage-b-handoff-pack.md
# Expected: ≥ 5
```

```bash
# AC-5: active.md mentions the 3 post-close follow-up PRs by squash hash.
# Use grep -oE | wc -l to count matches (not matching lines) since both
# hashes appear on the same active.md line.
grep -oE '6eaf676|dbf48e1' docs/plans/active.md | wc -l
# Expected: ≥ 2
```

```bash
# AC-6: pnpm check exit 0
pnpm check
```

```bash
# AC-7: scope-fence — exactly 9 source files (no audit logs / no
# screenshots in this PR). Trajectory: pre-R1 = 4 (planned); R1 +4
# (ADR amendment-ledger + agent-contract item #9 + 2 regenerated
# downstream surfaces); R2 +1 (team-operations.md propagation gap
# closure).
git diff --name-only main..HEAD -- ':!docs/audits/codex-runs/' ':!docs/audits/screenshots/' | sort | wc -l
# Expected: 9
```

```bash
# AC-8: agent-contract item #9 + downstream regenerated surfaces
# carry D9.8 wording (R1 fold-in per ADR-0006 #8).
grep -cE 'D9\.8|Stage close-ceremony 加强' agent-contract.md
# Expected: ≥ 1
grep -cE 'D9\.8|Stage close-ceremony 加强' docs/runbooks/codex-tool-invocations.md
# Expected: ≥ 1
grep -cE 'Stage close-ceremony 加强' docs/review-checklist.md
# Expected: ≥ 1
```

```bash
# AC-9: ADR-0011 ## Amendments ledger has v0.2.2 entry (R1.1)
grep -cE '^### v0\.2\.2 ' docs/decisions/ADR-0011-linear-pipeline-execution-model.md
# Expected: 1
```

## Out-of-scope (continued)

- **#15b** — block-Code Tiptap node rename out of `code` namespace
  (~15 files cross-package); pending.
- **#16** — per-block-attr coercion fixes for Jupyter / Pdf /
  NnViz / AgentFlow (4 sub-PRs, one per block-package); pending.

## Related

- [Wave 6 hotfix PR.md](wave-6-hotfix-mdx-bridge-flowexpression.md) — origin of the failure class this rule prevents
- [Wave 6 cf-15a PR.md](wave-6-cf-15a-link-extension.md) — sibling carry-forward
- [Stage B handoff pack](stage-b-handoff-pack.md)
- [ADR-0011 D9](../../decisions/ADR-0011-linear-pipeline-execution-model.md) — D9.7 implementation evidence; D9.8 inserts after
- ADR-0011 D10 anti-prompt-patching — bookend that follows D9.8
