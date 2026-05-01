import type { KernelAdapter } from '@skb/kernel-adapter';
import { KernelRegistry } from '@skb/kernel-registry';
import { PyodideAdapter } from '@skb/kernel-pyodide';

export function registerKernels(
  registry: KernelRegistry,
  adapter: KernelAdapter = new PyodideAdapter(),
): void {
  registry.register(adapter);
}
