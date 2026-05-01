import { describe, it, expect } from 'vitest';
import { KernelRegistry } from '@skb/kernel-registry';
import { PyodideAdapter } from '@skb/kernel-pyodide';
import type { KernelAdapter, KernelSession } from '@skb/kernel-adapter';
import { registerKernels } from '../registerKernels';

describe('@skb/editor-shell registerKernels', () => {
  it('registers PyodideAdapter by default with id "pyodide"', () => {
    const registry = new KernelRegistry();
    registerKernels(registry);
    const list = registry.list();
    expect(list).toHaveLength(1);
    expect(list[0]!.id).toBe('pyodide');
  });

  it('returns a PyodideAdapter instance via registry.get("pyodide")', () => {
    const registry = new KernelRegistry();
    registerKernels(registry);
    const adapter = registry.get('pyodide');
    expect(adapter).toBeInstanceOf(PyodideAdapter);
  });

  it('lets consumers override the default adapter', () => {
    const registry = new KernelRegistry();
    const mockAdapter: KernelAdapter = {
      id: 'mock-kernel',
      capabilities: { libraries: [], gpu: false, persistentState: false },
      startSession: (): Promise<KernelSession> =>
        Promise.reject(new Error('mock not implemented')),
    };
    registerKernels(registry, mockAdapter);
    expect(registry.list()).toEqual([mockAdapter]);
    expect(registry.get('mock-kernel')).toBe(mockAdapter);
    expect(registry.get('pyodide')).toBeUndefined();
  });
});
