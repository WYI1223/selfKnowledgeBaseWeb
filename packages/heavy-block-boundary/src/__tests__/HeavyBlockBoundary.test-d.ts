// Type-only fixture for AC#2. Consumed by `tsc -b` via
// `pnpm --filter @skb/heavy-block-boundary typecheck`. NOT a runtime test.
import { HeavyBlockBoundary } from '../index';

// Positive: known-kind narrowing + generic <P> inference on childProps.
const _ok1 = HeavyBlockBoundary<{ name: string }>({
  kind: 'jupyter',
  dims: { width: 1, height: 1 },
  load: () =>
    Promise.resolve({
      default: (({ name }: { name: string }) => {
        void name;
        return null;
      }),
    }),
  childProps: { name: 'ok' },
});

// Positive: branded-widening per C6 absorbtion - unregistered string kinds are valid.
const _ok2 = HeavyBlockBoundary<{ count: number }>({
  kind: 'unregistered-plugin-kind',
  dims: { width: 1, height: 1 },
  load: () =>
    Promise.resolve({
      default: (({ count }: { count: number }) => {
        void count;
        return null;
      }),
    }),
  childProps: { count: 0 },
});

// Negative: childProps shape mismatch - generic <P> inference catches.
const _err1 = HeavyBlockBoundary<{ count: number }>({
  kind: 'jupyter',
  dims: { width: 1, height: 1 },
  load: () =>
    Promise.resolve({
      default: (({ count }: { count: number }) => {
        void count;
        return null;
      }),
    }),
  // @ts-expect-error mismatched childProps shape - childProps must be { count: number }.
  childProps: { wrong: 'type' },
});

// Negative: kind must be string-typed (branded widening); number is rejected.
const _err2 = HeavyBlockBoundary<Record<string, never>>({
  // @ts-expect-error kind must be string.
  kind: 123,
  dims: { width: 1, height: 1 },
  load: () => Promise.resolve({ default: () => null }),
  childProps: {},
});

// Suppress unused-binding warnings; the file's purpose is type-side assertion only.
void _ok1;
void _ok2;
void _err1;
void _err2;
