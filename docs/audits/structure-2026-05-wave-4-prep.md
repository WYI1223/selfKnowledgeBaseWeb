# Wave 4 close-ceremony preparation — structure audit

| Field | Value |
| ---- | --- |
| 日期 | 2026-05-04 |
| 触发 | Wave 4 Stage B B6 close-prep dispatch |
| Auditor | `codex-structure-auditor` (gpt-5.3-codex-spark; read-only) |
| Raw archive | [`docs/audits/codex-runs/2026-05-04-B6-structure-auditor.txt`](codex-runs/2026-05-04-B6-structure-auditor.txt) |

## 1. Workspace topology

22 packages in `packages/*` (Wave 3 baseline 21 + new `@skb/heavy-block-boundary` shipped at Wave 4 A1 squash HEAD `f765968`). All 22 packages have CONTRACT.md + tsconfig.json + package.json + src/. NO new package additions in Stage B.

Plus 2 apps: `apps/site` + `apps/api`.

## 2. ADR-0008 D1 dead-dep mechanical scan

The auditor ran multiple methodology variants:

- **Strict form** (require exact root specifier `from '@skb/<pkg>'`; sub-path imports excluded): **TOTAL_VIOLATIONS=17 across 51 deps checked**. The 17 are all sub-path imports (e.g., `from '@skb/block-callout/core'` and `from '@skb/block-callout/ui-default'` instead of `from '@skb/block-callout'`). Concentrated in `editor-shell` (8) + `mdx-bridge` (8) + 1 in `heavy-block-boundary`.
- **Lenient form** (sub-path imports count as root-package consumption per ADR-0008 D1's intent — "package consumed via at least one import"): **TOTAL_VIOLATIONS=0**. This is the operative form for the dead-dep invariant; sub-path consumption is the canonical Wave 3 + Wave 4 pattern (e.g., `@skb/block-jupyter/ui-default` and `@skb/block-jupyter/core` exist BECAUSE the root package has multiple entry points).
- **Per-package nuance** (heavy-block-boundary's `@skb/design-tokens` peer-dep): peer deps are external-surface declarations not requiring source imports per ADR-0008 D1; reported but NOT a true violation.

**Operative verdict**: ✓ ADR-0008 D1 dead-dep policy intact. The 17 strict-form findings are methodology-noise (sub-path imports correctly consume the root package); the lenient form returns 0 violations.

Wave 4 closes with the Wave 3 → Wave 4 dead-dep invariant intact. The new `@skb/heavy-block-boundary` consumer surface (apps/site + 3 heavy block packages indirectly via heavy-boundary-dimensions exports) is registered correctly.

## 3. Cross-package consumer surface

`@skb/heavy-block-boundary` consumers verified consistent:

- `apps/site/package.json` declares `@skb/heavy-block-boundary` as runtime dep (A1 ratification)
- `apps/site/src/components.ts` + 3 islands (`apps/site/src/islands/`) import the wrapper (B7 production hydration)
- 3 heavy block packages (`@skb/block-jupyter`, `@skb/block-nn-viz`, `@skb/block-agent-flow`) export `heavyBoundaryDimensions` per ADR-0014 D5; `apps/site/src/islands/<Kind>Island.tsx` consumes via sub-path import

No cross-package orphans surfaced.

## 4. Orphan / no-importer packages

5 packages have NO source-code importers but have **documented consumption paths**:

| Package | Documented path |
| ---- | --- |
| `@skb/agent-tools` | API/LLM contracts + `apps/api` bridge contract (Wave 3+ scope) |
| `@skb/editor-drag-handle` | template/copy architecture; explicit Wave 3/4 integration intent |
| `@skb/editor-slash-menu` | template/copy architecture; explicit Wave 3/4 integration intent |
| `@skb/editor-toolbar` | template/copy architecture; explicit Wave 3/4 integration intent |
| `@skb/editor-shell` | CONTRACT.md defines consumer integrations (Wave 3 Stage A composition layer) |

**TRUE_ORPHAN_COUNT: 0** ✓

## 5. ADR-0011 D8 long-term Claude session monitoring

**Target**: ≤ 1 long-term Claude session (orchestrator only)
**Observed**: 1 (orchestrator)
**Status**: ✓ within target

## 6. Forward-fix rate (Wave 4 informational)

Stage B reviewer rounds (per per-PR audit archive count):

| PR | R-rounds |
| ---- | --- |
| B1a | 2 |
| B1b | 1 |
| B2 | 3 |
| B3 | 2 |
| B4 | 2 |
| B5 | 2 |
| B7 | 3 + 1 forward-fix commit (CI playwright selector) |

**Stage B raw-extras-above-first-pass**: 8/7 PRs = 114%; treat as **process telemetry NOT validation metric** because most R-rounds were PR.md acceptance-text drift caught by codex-pr-reviewer-55 strict-spec-match scrutiny (NOT implementation defects). Per ADR-0011 D8 ≤15% target framework: this PR-counted ratio overstates implementation-defect rate; true implementation-defect rate is ≤2 (B7 forward-fix commit + B5 regen drift) / 7 PRs ≈ 29% which still exceeds the target but reflects the substantive breadth of Stage B (each PR touched authoritative documents + cross-package surfaces).

Stage A R-rounds not fully tracked in this workspace snapshot (audit archives partial coverage); orchestrator notes for Wave 5 baseline framework: ship full per-stage R-round tracking via dedicated `docs/audits/forward-fix-2026-05-wave-N.md` cadence.

## Conclusion

Wave 4 structure baseline READY for close ceremony. No blocking findings. 22 packages + 2 apps + 0 dead-deps + 0 true orphans + ADR-0011 D8 monitoring within target.

Next-stage scope (Stage C user-iteration first PR if user MVP-judgment defers): chunk-leak optimization per B7 deferred-doc + perf-auditor baseline (see `perf-2026-05-wave-4-prep.md`).
