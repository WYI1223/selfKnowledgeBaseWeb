import type { KernelAdapter, KernelSession } from '@skb/kernel-adapter';

export class KernelRegistry {
  readonly #adapters = new Map<string, KernelAdapter>();

  register(adapter: KernelAdapter): void {
    if (this.#adapters.has(adapter.id)) {
      throw new Error(`Duplicate kernel adapter id: ${adapter.id}`);
    }
    this.#adapters.set(adapter.id, adapter);
  }

  get(id: string): KernelAdapter | undefined {
    return this.#adapters.get(id);
  }

  list(): readonly KernelAdapter[] {
    return [...this.#adapters.values()];
  }

  async startSession(adapterId: string, sessionId: string): Promise<KernelSession> {
    const adapter = this.#adapters.get(adapterId);
    if (!adapter) throw new Error(`Unknown kernel adapter: ${adapterId}`);
    return adapter.startSession(sessionId);
  }
}
