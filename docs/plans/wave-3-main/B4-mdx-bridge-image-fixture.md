# B4 — mdx-bridge image fixture #24 (Stage B per-block round-trip)

> **Wave 3 Stage B 4th PR.** Mechanical clone of B2/B3 pattern for
> block-image. Per locked plan B4 entry (line 450): "image — src + alt
> + optional width/height."

## title

Add image fixture #24 to mdx-bridge round-trip suite. Register `Image`
mdxComponent dispatch via `@skb/block-image/core` devDep import.
CONTRACT fixture-table grows 11 → 12.

## files

Created (NEW — 1 fixture + 1 self-listed):

- `packages/mdx-bridge/src/__tests__/fixtures/24-image.mdx` *(canonical
  Image MDX, self-closing JSX. See fixture file for exact attrs;
  parseImage requires src + alt as strings, optionally width/height
  as Number-coercible strings.)*
- `docs/plans/wave-3-main/B4-mdx-bridge-image-fixture.md` *(this PR.md;
  ADR-0006 D8 strict whitelist.)*

Modified (4 source/config files + 1 lockfile):

- `packages/mdx-bridge/src/__tests__/round-trip.test.ts` — mirror B3
  pattern: imports imageCore + parseImage + serializeImage; new
  ensureImageDispatch helper; buildComponentBlockOptions registers
  callout + code + image; optionsForFixture detects `<Image` source;
  beforeAll calls all three ensureXDispatch helpers; fixture-count
  assertion 11 → 12.
- `packages/mdx-bridge/CONTRACT.md` — fixture-count prose 11 → 12.
- `packages/mdx-bridge/package.json` — add `@skb/block-image` devDep.
- `packages/mdx-bridge/tsconfig.json` — add block-image reference.
- `pnpm-lock.yaml` — workspace devDep edge.

= **7 files in canonical `## files` block** (counts canonical here,
cross-referenced as "per `## files`" elsewhere).

**Explicitly NOT in `files:`** (verification-only):

- `packages/block-image/` unchanged (consumer-only).
- `packages/block-foundation/`, `packages/block-callout/`, `packages/block-code/` unchanged.
- `agent-contract.md`, root `tsconfig.json`, `pnpm-workspace.yaml` unchanged.

## test_cases

Per-block template:

- **TC1** idempotent: `tiptapToMdx(mdxToTiptap(fixture, opts), opts).trim() === fixture.trim()` for fixture 24.
- **TC2** lossless: stripping `_mdast` then serializing produces same MDX.
- **TC3** per-package vitest: exit 0 (test count canonical here; was 37 post-B3).
- **TC4** typecheck: exit 0.
- **TC5** pnpm check: exit 0.
- **TC6** CONTRACT fixture-count grew exactly 1.
- **TC7** devDep architecture preserved (block-image only in devDeps).
- **TC8** lockfile idempotency.

## contracts_affected

- `packages/mdx-bridge/CONTRACT.md` — fixture-count prose bump.

## adr_touched

None. B-stage pattern locked at B2.

## acceptance

1. `pnpm --filter=@skb/mdx-bridge test` exits 0 — TC3 evidence.
2. `pnpm --filter=@skb/mdx-bridge typecheck` exits 0 — TC4.
3. `pnpm check` exits 0 — TC5.
4. CONTRACT.md fixture-count prose bumped — TC6.
5. `@skb/block-image` in devDependencies, NOT dependencies — TC7.
6. Lockfile clean delta + idempotent — TC8.
7. PR.md self-listed.
8. Protected files unchanged: `git diff main -- packages/block-image/ packages/block-foundation/ packages/block-callout/ packages/block-code/` returns empty.
9. ADR-0008 D1 three-way: 1 runtime + 3 devDeps + 4 tsconfig refs (foundation + callout + code + image).

## executor

Path B (orchestrator-self EXECUTE; mechanical clone of B3 pattern). REVIEW: codex-pr-reviewer-55. PRE-COMMIT CLAUDE: orchestrator-self (Row 1). COMMIT: orchestrator-self.

## D2 trigger judgment

- Row 1 (CONTRACT.md change): **HIT**.
- Rows 2/4/5/8: NO.

→ D1 stage 4 fires.

## Out-of-scope

- B5-B8 fixtures (math/pdf/jupyter/nn-viz+agent-flow).
- Production registerJsxDispatch.
- block-image source modifications.

## Related

- [Wave 3 plan, B4 entry](../../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md) (line 450).
- [B3 PR.md](./B3-mdx-bridge-code-fixture.md) — predecessor.
- [B2 PR.md](./B2-mdx-bridge-callout-fixture.md) — pattern source.
- [ADR-0011 D2](../../decisions/ADR-0011-linear-pipeline-execution-model.md) v0.1.1.
