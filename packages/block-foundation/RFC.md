# RFC: How a `block-*` package registers with `@skb/block-foundation`

> **Audience**: `simple-block-eng` / `render-block-eng` / `viz-block-eng` writing
> `block-callout` / `block-code` / `block-image` / `block-math` / `block-pdf` /
> `block-jupyter` / `block-nn-viz` / `block-agent-flow` cores; `ux-ui-lead`
> writing the matching `ui-default/` halves.
>
> **Authority**: [ADR-0008](../../docs/decisions/ADR-0008-wave-2-entry-policies.md)
> D2 freezes the registration interface as of 2026-04-30 (commit `b3581bc`).
> This RFC is the consumer-facing walkthrough; the public API surface itself
> lives in [`CONTRACT.md`](./CONTRACT.md).

This RFC is **not** a spec — `CONTRACT.md` is. It is a step-by-step recipe
showing how the first real consumer (`block-callout`, Task C1/C2) wires its
core + UI into a `BlockRegistry`. Subsequent `block-*` PRs follow the same
shape; cloned `block-code` / `block-image` cores (Tasks C3-C5b) inherit
this structure verbatim.

## 1. core/ side

`core/` is the headless half (ADR-0003). No React, no Tiptap; just a Zod
schema + identifying metadata. Place it at `packages/<block>/src/core/`
and export through the package's `core` subpath.

```typescript
// packages/block-callout/src/core/core-definition.ts
import { defineCore, type BlockCoreDefinition } from '@skb/block-foundation';
import { z } from 'zod';

const propsSchema = z
  .object({
    variant: z.enum(['note', 'tip', 'warning', 'danger']),
    title: z.string().optional(),
  })
  .strict();

export const calloutCore: BlockCoreDefinition<typeof propsSchema> = defineCore({
  name: 'callout',
  kind: 'component',
  propsSchema,
  mdxComponent: 'Callout',
});
```

Notes that map directly to `BlockCoreDefinition` fields in
[`src/registry.ts`](./src/registry.ts):

- `name`: kebab-case, globally unique. Used as the registry key — duplicate
  registration throws `Duplicate core name: <name>` at runtime.
- `kind`: `'prose' | 'component' | 'render' | 'viz'` (4-way Wave 2 union; Wave 1
  was binary `'prose' | 'component'` — additive expansion in Wave 2 authorized by
  [ADR-0009](../../docs/decisions/ADR-0009-block-kind-union-expansion.md)). Track C
  simple-block-eng owns `'component'` (block-callout / block-code / block-image —
  composable JSX with rich children); Track D render-block-eng owns `'render'`
  (block-math / block-pdf — visual rendering of a pure declarative input via
  external runtime authority like KaTeX or react-pdf); Track E viz-block-eng /
  kernel consumer owns `'viz'` (block-jupyter / block-nn-viz / block-agent-flow —
  interactive visualization with heavy runtime libs). `'prose'` is reserved for
  behaviors covered by `proseExtensions` and is closed to new entries (CONTRACT
  invariant: "Prose blocks 零自写代码").
- `propsSchema`: must be a `z.object(...).strict()`; every nested
  `ZodObject` must independently call `.strict()`. See
  [`CONTRACT.md` § Invariants — Schema strictness](./CONTRACT.md#invariants)
  + [ADR-0006](../../docs/decisions/ADR-0006-asymmetry-audit-checklist.md) item #3
  (`.strict()` does not propagate into nested objects). The current type
  signature `BlockCoreDefinition<TSchema extends ZodTypeAny>` is wider than
  `ZodObject`; type-narrowing is deferred to Wave 3, so for Wave 2 this is
  a behavior contract enforced by RFC + reviewer + integration tests, not
  by TypeScript. Skipping `.strict()` does not throw — `propsSchema.parse`
  silently strips unknown keys, which is exactly the contract-drift class
  this rule prevents.
- `mdxComponent`: PascalCase, must match the JSX tag used in `.mdx` files
  exactly (the MDX bridge uses this string when serializing back). For
  `block-callout`, MDX content reads `<Callout variant="note">…</Callout>`
  so this field is `'Callout'`.

`defineCore` is a no-op identity helper that exists purely to give TypeScript
inference a hand — the returned object satisfies `BlockCoreDefinition<T>`
with `T` inferred from `propsSchema`. Equivalent to writing the type
annotation manually. `defineUI` (used in §2) is the symmetric helper for
`BlockUIDefinition<T>`; both helpers exist for inference convenience only,
so consumers can write `defineUI({ ... })` without manually spelling
`<typeof calloutCore.propsSchema>`.

## 2. ui-default/ side

`ui-default/` is the presentational half. It imports the core (never inline-
redefines its schema — see ADR-0006 item #4: "single-authority schema → audit
every consumer for inline duplicates"), then attaches React components for
the editor and renderer.

```typescript
// packages/block-callout/src/ui-default/index.ts
import { defineUI, type BlockUIDefinition } from '@skb/block-foundation';
import { calloutCore } from '../core/core-definition';
import { CalloutEditorView } from './editor-view';
import { CalloutRenderView } from './render-view';

export const calloutUIDefault: BlockUIDefinition<
  typeof calloutCore.propsSchema
> = defineUI({
  coreName: calloutCore.name, // must reference an already-registered core
  uiId: 'default', // convention: first-registered UI is 'default'
  EditorView: CalloutEditorView,
  RenderView: CalloutRenderView,
});
```

The two view components share the `BlockViewProps<TSchema>` shape from
[`src/registry.ts`](./src/registry.ts):

```typescript
// packages/block-callout/src/ui-default/editor-view.tsx
import type { ComponentType } from 'react';
import type { BlockViewProps } from '@skb/block-foundation';
import { calloutCore } from '../core/core-definition';

export const CalloutEditorView: ComponentType<
  BlockViewProps<typeof calloutCore.propsSchema>
> = ({ props, content }) => {
  // props.variant is z-inferred to 'note' | 'tip' | 'warning' | 'danger'
  // props.title is z-inferred to string | undefined
  // content is the optional Tiptap inner content as a string
  return (
    <aside data-variant={props.variant}>
      {props.title ? <strong>{props.title}</strong> : null}
      <div>{content}</div>
    </aside>
  );
};
```

`RenderView` follows the same shape but renders for static output (Astro
build / SSR path) rather than the editor. UX/visual conventions for the
component itself (tokens, spacing, accessibility) are owned by `ux-ui-lead`
via `packages/design-tokens/CONTRACT.md`; this RFC fixes only the
registration plumbing.

### Wiring at boot

`registerCore` must precede `registerUI` for the same `coreName`; otherwise
`registerUI` throws `Unknown core for UI registration: <coreName>`. The
boot path (Wave 3 `editor-shell` / `apps/site` integration) does:

```typescript
import { BlockRegistry } from '@skb/block-foundation';
import { calloutCore } from '@skb/block-callout/core';
import { calloutUIDefault } from '@skb/block-callout/ui-default';

const registry = new BlockRegistry();
registry.registerCore(calloutCore);
registry.registerUI(calloutUIDefault);

// later, render-time lookup:
const ui = registry.getUI('callout'); // returns calloutUIDefault (uiId='default')
const ui2 = registry.getUI('callout', 'minimal'); // exact match by uiId
```

When multiple UIs are registered for one core, `getUI(name)` without a
`uiId` returns the **first registered** (CONTRACT invariant — convention:
register `'default'` first). `getUI(name, uiId)` does exact match.

## 3. Consumer-side test template

Each `block-*` package ships an integration test that wires its own core +
UI into a fresh registry and verifies the round-trip. This is the minimum
surface; package-specific tests (props validation, schema edge cases, view
rendering) live alongside.

```typescript
// packages/block-callout/src/__tests__/registry-integration.test.ts
import { describe, it, expect } from 'vitest';
import { BlockRegistry } from '@skb/block-foundation';
import { calloutCore } from '../core/core-definition';
import { calloutUIDefault } from '../ui-default';

describe('block-callout registry integration', () => {
  it('registers core + UI and resolves both', () => {
    const reg = new BlockRegistry();
    reg.registerCore(calloutCore);
    reg.registerUI(calloutUIDefault);

    expect(reg.getCore('callout')).toBe(calloutCore);
    expect(reg.getUI('callout')).toBe(calloutUIDefault);
    expect(reg.getUI('callout', 'default')).toBe(calloutUIDefault);
  });

  it('propsSchema accepts every declared variant', () => {
    for (const variant of ['note', 'tip', 'warning', 'danger'] as const) {
      const parsed = calloutCore.propsSchema.parse({ variant });
      expect(parsed.variant).toBe(variant);
    }
  });

  it('propsSchema rejects unknown variants and unknown keys', () => {
    expect(() => calloutCore.propsSchema.parse({ variant: 'bogus' })).toThrow();
    expect(() =>
      calloutCore.propsSchema.parse({ variant: 'note', extra: 1 }),
    ).toThrow(); // .strict() — extra key rejected
  });
});
```

The patterns mirror
[`src/__tests__/registry.test.ts`](./src/__tests__/registry.test.ts) in this
package — the foundation owns registry-mechanics tests; each `block-*` owns
the integration test for its own core+UI pair.

## 4. Error scenarios

### 4.1 Runtime errors thrown by `BlockRegistry`

These come from the methods in [`src/registry.ts`](./src/registry.ts). Workers
should write tests asserting each one fires for their block where applicable.

| Scenario                                        | Method        | Error message                                              |
| ----------------------------------------------- | ------------- | ---------------------------------------------------------- |
| Register two cores with the same `name`         | `registerCore` | `Duplicate core name: <name>`                              |
| `registerUI` before `registerCore` (same name)  | `registerUI`   | `Unknown core for UI registration: <coreName>`             |
| Two UIs with same `(coreName, uiId)`            | `registerUI`   | `Duplicate UI registration: core=<coreName> uiId=<uiId>`   |
| `getCore(name)` for an unregistered name        | `getCore`      | returns `undefined` (no throw)                             |
| `getUI(coreName)` with no UIs registered        | `getUI`        | returns `undefined` (no throw)                             |
| `getUI(coreName, uiId)` with non-matching uiId  | `getUI`        | returns `undefined` (no throw)                             |

### 4.2 Compile-time errors (caught by `pnpm typecheck`)

`BlockCoreDefinition` field errors:

| Scenario                              | TypeScript error (representative)                                  |
| ------------------------------------- | ------------------------------------------------------------------ |
| `name` missing                        | `Property 'name' is missing in type ...`                           |
| `name` not a `string`                 | `Type '<X>' is not assignable to type 'string'`                    |
| `kind` missing                        | `Property 'kind' is missing in type ...`                           |
| `kind` not `'prose' \| 'component' \| 'render' \| 'viz'` | `Type '"<X>"' is not assignable to type 'BlockKind'`    |
| `propsSchema` missing                 | `Property 'propsSchema' is missing in type ...`                    |
| `propsSchema` not a Zod schema        | `Type '<X>' is not assignable to type 'ZodTypeAny'`                |
| `mdxComponent` missing                | `Property 'mdxComponent' is missing in type ...`                   |
| `mdxComponent` not a `string`         | `Type '<X>' is not assignable to type 'string'`                    |

`BlockUIDefinition` field errors (symmetric to `BlockCoreDefinition`: 4 fields × {missing, wrong-type} = 8 rows + props-shape divergence):

| Scenario                                                | TypeScript error (representative)                                                            |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `coreName` missing                                      | `Property 'coreName' is missing in type ...`                                                 |
| `coreName` not a `string`                               | `Type '<X>' is not assignable to type 'string'`                                              |
| `uiId` missing                                          | `Property 'uiId' is missing in type ...`                                                     |
| `uiId` not a `string`                                   | `Type '<X>' is not assignable to type 'string'`                                              |
| `EditorView` missing                                    | `Property 'EditorView' is missing in type ...`                                               |
| `EditorView` not a `ComponentType<BlockViewProps<T>>`   | `Type '<X>' is not assignable to type 'ComponentType<BlockViewProps<TSchema>>'`              |
| `RenderView` missing                                    | `Property 'RenderView' is missing in type ...`                                               |
| `RenderView` not a `ComponentType<BlockViewProps<T>>`   | `Type '<X>' is not assignable to type 'ComponentType<BlockViewProps<TSchema>>'`              |
| `props` shape passed to view diverges from `TSchema`    | `Type '<inferred>' does not satisfy ...`（出现在 view 实现内 destructure / use point）       |

What TypeScript does NOT catch (covered by runtime throws above + integration test + reviewer):

- `coreName` typo (it's a `string`; runtime `Unknown core for UI registration: ...` catches at boot)
- `name` collision across packages (runtime `Duplicate core name: ...` catches at register time)
- `mdxComponent` PascalCase casing (string-level; reviewer + integration test catches)
- `propsSchema` is a Zod schema but **not** `z.object(...).strict()` (e.g. `z.string()`, `z.array(...)`, or `z.object(...)` without `.strict()`): the type signature only requires `ZodTypeAny`, so TypeScript accepts it; `propsSchema.parse(input)` does not throw but silently strips unknown keys, which is the contract-drift risk [`CONTRACT.md` § Invariants — Schema strictness](./CONTRACT.md#invariants) closes via reviewer + integration test (type-narrow to `ZodObject` deferred to Wave 3)

### 4.3 Defensive-copy guarantee

`listCores()` and `listUIs(coreName)` return fresh arrays per call (CONTRACT
[Invariants](./CONTRACT.md#invariants) — "Defensive copy"). Consumers can
freely mutate the returned arrays without leaking into the registry. Don't
write tests that assume identity (`reg.listCores() === reg.listCores()`) —
they're new arrays each time. Implementation: `src/registry.ts:84` + `:96`.

## 5. Serialize / parse hook ownership (scope clarification)

`block-foundation` does **not** own MDX serialize/parse. Each `block-*`
package owns its own `core/serialize.ts` + `core/parse.ts`; `mdx-bridge`
routes between them via the `mdxComponent` string when it encounters an
`mdxJsxFlowElement` in a parsed MDX document. This split mirrors
[ADR-0003 D1+D2](../../docs/decisions/ADR-0003-headless-presentational-split.md):
"Headless 层 (block core) — props schema (Zod) + MDX serialize/parse + 业务逻辑（无 React 依赖）"
lives in `core/`, not in the foundation.

```
@skb/block-foundation             owns: BlockCoreDefinition shape (incl. mdxComponent: string)
                                  owns: BlockRegistry routing table
                                  does NOT own: serialize / parse functions

@skb/block-callout/core           owns: calloutCore (registers via mdxComponent='Callout')
                                  owns: serializeCallout(node) → mdast (Wave 2 add)
                                  owns: parseCallout(mdast) → TiptapNode (Wave 2 add)

@skb/mdx-bridge                   does the routing:
                                  - parse: mdast.mdxJsxFlowElement{name:'Callout'} → call parseCallout
                                  - serialize: TiptapNode{type:'callout'} → call serializeCallout
```

**Naming convention for Wave 2 block-* packages**:

```typescript
// packages/block-callout/src/core/index.ts
export { calloutCore } from './core-definition';
export { serializeCallout } from './serialize'; // (TiptapNode input → mdast output)
export { parseCallout } from './parse';         // (mdast input → TiptapNode output)
```

mdx-bridge will add a routing table (Wave 2 mdx-bridge change, not in this
RFC) keyed by `mdxComponent` name → resolved by `coreName` → calls the
block's exported `serialize<BlockName>` / `parse<BlockName>`. Until then,
mdx-bridge throws on unknown `mdxJsxFlowElement` per its existing
[Fail-loud rule](../mdx-bridge/CONTRACT.md#fail-loud-rule)
(`mdx-bridge: unsupported {block,inline,mark} type "<type>". Add a
fixture and a parse + serialize case before introducing this <kind>.`).

This RFC fixes the **`block-foundation` registration shape**; the
serialize/parse routing on the `mdx-bridge` side is a separate Wave 2
mdx-bridge PR (not this Track A2 PR). Block authors implementing C1+
should expose `serialize<Block>` / `parse<Block>` from `core/index.ts`
following the convention above so mdx-bridge can wire them when the
routing table lands.

## Related

- [`CONTRACT.md`](./CONTRACT.md) — public API surface (the spec; this RFC is the recipe)
- [`src/registry.ts`](./src/registry.ts) — implementation
- [`src/__tests__/registry.test.ts`](./src/__tests__/registry.test.ts) — registry-mechanics tests
- [ADR-0003](../../docs/decisions/ADR-0003-headless-presentational-split.md) — core / UI 双层
- [ADR-0006](../../docs/decisions/ADR-0006-asymmetry-audit-checklist.md) items #3 / #4 — `.strict()` propagation + single-authority schema
- [ADR-0008](../../docs/decisions/ADR-0008-wave-2-entry-policies.md) D2 — interface freeze authority
- [ADR-0009](../../docs/decisions/ADR-0009-block-kind-union-expansion.md) — `BlockKind` 2→4 expansion (Wave 2 D1 bundle)
- [Wave 2 plan Task C1/C2](../../docs/superpowers/plans/2026-04-30-phase-1-wave-2-implementation.md) — first consumer
