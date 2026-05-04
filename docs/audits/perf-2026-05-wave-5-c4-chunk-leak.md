# Wave 5 C.1-2 C-4 Chunk-Leak Perf Audit

---
date: 2026-05-04
owner: orchestrator
target: Wave 5 C.1-2
scope: C-4 chunk-leak measure
decision: NO-OP
authority: ADR-0015 D3
base_head: 44a2e53
---

## Context

Wave 5 C.1-2 carries two tracks:

1. C-3 removes the redundant PDF iframe background declaration.
2. C-4 measures whether a chunk-leak source-code fix is still needed.

The source-code verdict is **NO-OP**.

No application source file changes are required for chunk-leak.

## Investigation Timeline

- Wave 4 B7 introduced heavy block islands through a dynamic import boundary.
- That boundary made C-4 worth tracking because prose-only routes could
  accidentally retain a path to heavy package modules.
- The risk class was concrete: dynamic imports rooted in apps/site could pull
  package symbols such as `pyodide`, `tensorflow`, or `reactflow` toward prose
  route chunks.
- Wave 5 reframe v2 changed the heavy block tier for v0.4.
- C.1-1 replaced the real heavy runtime path with plugin placeholder shells.
- Those placeholders removed the app-rooted dynamic import chain for the three
  heavy packages.
- C.1-2 re-ran the lazy-chunking regression spec against that structure.
- The measurement confirms the C.1-1 placeholder tier made the original C-4
  leak condition structurally absent at v0.4.

## Verdict: NO-OP — `lazy-chunking` spec PASS at HEAD `44a2e53`

No source-code change is made for C-4 in this PR.

ADR-0015 D3 authorizes a no-op when the plugin placeholder tier makes the
chunk-leak issue moot.

That condition is met at this HEAD.

The plugin placeholders eliminate the dynamic-import chain that previously
could have leaked `pyodide`, `tensorflow`, or `reactflow` into prose-only route
chunks.

Because the prose route no longer has a JavaScript graph edge to the heavy
package UI runtimes, Rollup and Vite have no reachable heavy module to route
into the prose bundle.

The remaining manual chunk pins are forward-compatible infrastructure.

They are not the active enforcement mechanism for v0.4 because the heavy
packages are not imported from the live prose route graph.

## Execute-Time Evidence

Command run after the C.1-2 CSS edit:

```bash
pnpm --filter @skb/site exec vitest run src/__tests__/lazy-chunking.test.ts
```

Observed result:

```text
Test Files  1 passed (1)
Tests       2 passed | 1 skipped (3)
Duration    296ms
```

The command exited with status 0, and these are the execute-time numbers rather
than copied plan-time baseline values.

## Spec Coverage Summary

Canonical regression gate: `apps/site/src/__tests__/lazy-chunking.test.ts`

TC1: `keeps heavy dependency strings out of the prose-only route chunks`

- Builds or reuses a fresh apps/site dist.
- Reads JavaScript assets attached to the prose-only sample note route.
- Lowercases the route bundle.
- Asserts that `pyodide`, `tensorflow`, and `reactflow` are absent.
- This is the direct leak-prevention assertion for C-4.

TC2: `emits one named chunk for each heavy block package`

- Still skipped in v0.4.
- The skip is intentional because no live route consumes the real heavy
  package components while the plugin placeholder tier is active.
- Positive chunk-existence coverage belongs to the future real-runtime tier.

TC3: `keeps the prose-only route JavaScript within the gzip budget`

- Reads the same prose route JavaScript bundle.
- Gzips the combined route JavaScript.
- Asserts it stays at or below the current 200 KB budget.
- This catches broad prose-route inflation even if the exact heavy-string
  markers are absent.

## Decision Rationale

TC1 proves the user-visible C-4 leak symptom is absent in the prose-only route.

TC3 proves the prose route remains under the budget that would catch large
runtime leakage.

TC2 remains deferred because forcing named heavy chunks at v0.4 would contradict
the placeholder tier: there is no live route edge that should emit those chunks.

Therefore the correct C.1-2 action is documentation and measurement, not a
chunk-graph source-code patch.

## Phase 2+ Note

When the `plugin-real-runtime` tier reactivates, this audit becomes historical
evidence rather than current proof.

At that point a future PR should re-run the lazy-chunking spec against the real
runtime graph and revisit the skipped TC2 chunk-existence assertion.

Recommended Phase 2+ checks:

- Assert each heavy package emits into its intended named manual chunk.
- Keep TC1 as the prose-only negative leak gate.
- Keep TC3 as the gzip budget gate.
- Consider a negative-case fixture that deliberately adds a prose-to-heavy edge
  and verifies TC1 fails.

## Cross-References

- ADR-0015 D3: C-4 no-op authority when plugin placeholder makes the leak moot.
- ADR-0014 v0.4 D11: plugin tier split and Phase 2+ real-runtime pointer.
- Wave 5 plan v1.0 §455-463: Stage C.1 PR breakdown row C.1-2 (locked at Pre-A5).
- Wave 5 C.1-2 PR.md: `docs/plans/wave-5-main/C.1-2-pdf-chunk-leak.md`.
- Lazy-chunking spec: `apps/site/src/__tests__/lazy-chunking.test.ts`.
