# B6 — mdx-bridge pdf fixture #26 (Stage B per-block round-trip)

> **Wave 3 Stage B 6th PR.** Mechanical clone of B5 pattern for
> block-pdf. Per locked plan B6 entry (line 452): "pdf — iframe URL only
> (no extracted text in fixture)."

## title

Add pdf fixture #26 to mdx-bridge round-trip suite. Register `Pdf`
mdxComponent dispatch via `@skb/block-pdf/core` devDep. CONTRACT
fixture-table grows 13 → 14.

## files

Created (NEW — 1 fixture + 1 self-listed):

- `packages/mdx-bridge/src/__tests__/fixtures/26-pdf.mdx` *(canonical
  Pdf MDX, self-closing JSX. serializePdf always emits all 3 attrs
  (src, page, searchable) — no canonicalization-omit pattern. See
  fixture file for exact attrs.)*
- `docs/plans/wave-3-main/B6-mdx-bridge-pdf-fixture.md` *(this PR.md.)*

Modified (4 source/config files + 1 lockfile):

- `packages/mdx-bridge/src/__tests__/round-trip.test.ts` — mirror B5
  pattern: imports pdfCore + parsePdf + serializePdf; new
  ensurePdfDispatch helper; buildComponentBlockOptions registers
  callout + code + image + math + pdf; optionsForFixture detects
  `<Pdf` source; beforeAll calls all five ensureXDispatch;
  fixture-count assertion 13 → 14.
- `packages/mdx-bridge/CONTRACT.md` — fixture-count prose 13 → 14.
- `packages/mdx-bridge/package.json` — add `@skb/block-pdf` devDep.
- `packages/mdx-bridge/tsconfig.json` — add block-pdf reference.
- `pnpm-lock.yaml` — workspace devDep edge.

= **7 files in canonical `## files` block** (counts canonical here).

**Explicitly NOT in `files:`** — block-pdf and other block-* unchanged;
root configs unchanged.

## test_cases

- **TC1** idempotent: `tiptapToMdx(mdxToTiptap(fixture, opts), opts).trim() === fixture.trim()`.
- **TC2** lossless: `_mdast`-stripped serialize equals original.
- **TC3** vitest: exit 0 (test count canonical here).
- **TC4** typecheck: exit 0.
- **TC5** pnpm check: exit 0.
- **TC6** CONTRACT fixture-count grew exactly 1.
- **TC7** devDep architecture preserved.
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
5. block-pdf in devDependencies only — TC7.
6. Lockfile clean delta + idempotent — TC8.
7. PR.md self-listed.
8. Protected files unchanged.
9. ADR-0008 D1 three-way: 1 runtime + 5 devDeps + 6 tsconfig refs.

## executor

Path B (orchestrator-self EXECUTE). REVIEW: codex-pr-reviewer-55. PRE-COMMIT: orchestrator-self. COMMIT: orchestrator-self.

## D2 trigger judgment

- Row 1: **HIT**.
- Rows 2/4/5/8: NO.

→ D1 stage 4 fires.

## Out-of-scope

- B7-B8 fixtures (jupyter/nn-viz+agent-flow).
- Production registerJsxDispatch.
- block-pdf source modifications.

## Related

- [Wave 3 plan, B6 entry](../../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md) (line 452).
- [B5 PR.md](./B5-mdx-bridge-math-fixture.md) — predecessor.
- [ADR-0011 D2 v0.1.1](../../decisions/ADR-0011-linear-pipeline-execution-model.md).
