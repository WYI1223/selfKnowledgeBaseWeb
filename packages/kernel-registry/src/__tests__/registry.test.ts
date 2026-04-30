import { describe, it, expect, vi } from 'vitest';
import type { KernelAdapter, KernelSession } from '@skb/kernel-adapter';
import { KernelRegistry } from '../registry';

const emptyExecute: KernelSession['execute'] = () => ({
  [Symbol.asyncIterator]() {
    return {
      next: () => Promise.resolve({ value: undefined, done: true as const }),
    };
  },
});

function fakeAdapter(
  id: string,
): KernelAdapter & { startSession: ReturnType<typeof vi.fn> } {
  const session: KernelSession = {
    execute: emptyExecute,
    interrupt: () => Promise.resolve(),
    shutdown: () => Promise.resolve(),
  };
  return {
    id,
    capabilities: { libraries: [], gpu: false, persistentState: false },
    startSession: vi.fn(() => Promise.resolve(session)),
  };
}

describe('KernelRegistry', () => {
  it('registers and looks up adapters by id', () => {
    const reg = new KernelRegistry();
    const a = fakeAdapter('pyodide');
    reg.register(a);
    expect(reg.get('pyodide')).toBe(a);
  });

  it('returns undefined for unknown ids in get()', () => {
    const reg = new KernelRegistry();
    expect(reg.get('nope')).toBeUndefined();
  });

  it('lists registered adapters in registration order', () => {
    const reg = new KernelRegistry();
    const a = fakeAdapter('pyodide');
    const b = fakeAdapter('remote');
    reg.register(a);
    reg.register(b);
    expect(reg.list()).toEqual([a, b]);
  });

  it('throws on duplicate id', () => {
    const reg = new KernelRegistry();
    reg.register(fakeAdapter('x'));
    expect(() => reg.register(fakeAdapter('x'))).toThrow(/duplicate/i);
  });

  it('routes startSession via id', async () => {
    const reg = new KernelRegistry();
    const a = fakeAdapter('pyodide');
    reg.register(a);
    await reg.startSession('pyodide', 'sid-1');
    const startSession = a.startSession;
    expect(startSession).toHaveBeenCalledWith('sid-1');
  });

  it('throws on unknown id', async () => {
    const reg = new KernelRegistry();
    await expect(reg.startSession('nope', 'sid')).rejects.toThrow(
      /unknown kernel/i,
    );
  });
});
