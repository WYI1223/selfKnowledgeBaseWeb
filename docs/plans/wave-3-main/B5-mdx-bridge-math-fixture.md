# B5 — mdx-bridge math fixture #25 (Stage B per-block round-trip)

> **Wave 3 Stage B 5th PR.** Mechanical clone of B4 pattern for
> block-math. Per locked plan B5 entry (line 451): "math — inline display +
> complex KaTeX expression."

## title

Add math fixture #25 to mdx-bridge round-trip suite. Register `Math`
mdxComponent dispatch via `@skb/block-math/core` devDep. CONTRACT
fixture-table grows 12 → 13.

## files

Created (NEW — 1 fixture + 1 self-listed):

- `packages/mdx-bridge/src/__tests__/fixtures/25-math.mdx` *(canonical
  Math MDX, self-closing JSX with `expression` required + `display`
  emitted explicitly. See fixture file for exact attrs; serializeMath
  always emits both attrs — no canonicalization-omit pattern.)*
- `docs/plans/wave-3-main/B5-mdx-bridge-math-fixture.md` *(this PR.md.)*

Modified (4 source/config files + 1 lockfile):

- `packages/mdx-bridge/src/__tests__/round-trip.test.ts` — mirror B4
  pattern: imports mathCore + parseMath + serializeMath; new
  ensureMathDispatch helper; buildComponentBlockOptions registers
  callout + code + image + math; optionsForFixture detects `<Math`
  source; beforeAll calls all four ensureXDispatch; fixture-count
  assertion 12 → 13.
- `packages/mdx-bridge/CONTRACT.md` — fixture-count prose 12 → 13.
- `packages/mdx-bridge/package.json` — add `@skb/block-math` devDep.
- `packages/mdx-bridge/tsconfig.json` — add block-math reference.
- `pnpm-lock.yaml` — workspace devDep edge.

= **7 files in canonical `## files` block** (counts canonical here).

**Explicitly NOT in `files:`** — `packages/block-math/` and other block-*
unchanged; root configs unchanged.

## test_cases

- **TC1** idempotent: `tiptapToMdx(mdxToTiptap(fixture, opts), opts).trim() === fixture.trim()`.
- **TC2** lossless: `_mdast`-stripped serialize equals original.
- **TC3** vitest: exit 0 (test count canonical here).
- **TC4** typecheck: exit 0.
- **TC5** pnpm check: exit 0.
- **TC6** CONTRACT fixture-count grew exactly 1.
- **TC7** devDep architecture preserved (block-math only in devDeps).
- **TC8** lockfile idempotency.

## contracts_affected

- `packages/mdx-bridge/CONTRACT.md` — fixture-count prose bump.

## adr_touched

None.

## acceptance

1. `pnpm --filter=@skb/mdx-bridge test` exits 0 — TC3.
2. `pnpm --filter=@skb/mdx-bridge typecheck` exits 0 — TC4.
3. `pnpm check` exits 0 — TC5.
4. CONTRACT.md fixture-count bumped — TC6.
5. block-math in devDependencies only — TC7.
6. Lockfile clean delta + idempotent — TC8.
7. PR.md self-listed.
8. Protected files unchanged.
9. ADR-0008 D1 three-way: 1 runtime + 4 devDeps + 5 tsconfig refs.

## executor

Path B (orchestrator-self EXECUTE; B-stage mechanical clone). REVIEW: codex-pr-reviewer-55. PRE-COMMIT CLAUDE: orchestrator-self. COMMIT: orchestrator-self.

## D2 trigger judgment

- Row 1 (CONTRACT.md change): **HIT**.
- Rows 2/4/5/8: NO.

→ D1 stage 4 fires.

## Out-of-scope

- B6-B8 fixtures (pdf/jupyter/nn-viz+agent-flow).
- Production registerJsxDispatch.
- block-math source modifications.

## Related

- [Wave 3 plan, B5 entry](../../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md) (line 451).
- [B4 PR.md](./B4-mdx-bridge-image-fixture.md) — predecessor.
- [ADR-0011 D2 v0.1.1](../../decisions/ADR-0011-linear-pipeline-execution-model.md).
