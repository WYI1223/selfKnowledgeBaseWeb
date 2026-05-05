/**
 * Note persistence adapter for the Wave 5 editor scaffold.
 *
 * ADR-0018 D8 lines 339-451 are the canonical interface authority.
 * C.4-prelude ships the MVP LocalStorageAdapter only.
 */

/** Read-only JSON-serializable value for optional same-session Tiptap cache data. */
export type ReadonlyJSONValue =
  | string
  | number
  | boolean
  | null
  | readonly ReadonlyJSONValue[]
  | { readonly [key: string]: ReadonlyJSONValue };

export interface NoteState {
  /** Raw MDX source persisted for mdx-bridge round trips. */
  readonly mdxSource: string;
  /** Optional Tiptap state cache. Not a stable cross-client schema. */
  readonly tiptapState?: ReadonlyJSONValue;
  /** Last-modified timestamp in milliseconds. */
  readonly lastModified: number;
  /** Consumer-incremented monotonic version. LocalStorageAdapter does not increment. */
  readonly version: number;
}

export interface NoteSaveAdapter {
  /** Note slug for /notes/<slug>. */
  readonly slug: string;

  /** Load NoteState from persistence; null means no saved state. */
  load(): Promise<NoteState | null>;

  /** Save NoteState to persistence; returns ok false with a displayable error on failure. */
  save(state: NoteState): Promise<{ ok: boolean; error?: string }>;

  // Phase 2+ extensions (per Q12 absorbtion — Phase 2+ 兼容位预留):
  // (1) save(state, options?: { signal?: AbortSignal; timeout?: number; onProgress?: (p: number) => void })
  //     - AbortSignal: user cancel mid-save (e.g., switch route during ApiAdapter network);
  //     - timeout: ms before abort (default no-timeout for LocalStorage; default 10s for Api);
  //     - onProgress: ApiAdapter upload progress (0-1 fraction)
  // (2) subscribe(callback: (state: NoteState) => void): UnsubscribeFn
  //     - Real-time collaborative; Phase 2+ ApiAdapter via WebSocket; LocalStorageAdapter NOT subscribe (single-session)
  // Wave 5 NOT include either; ADR-0018 D8 接口 v1 不动; v2 接口 ADR-0019+ amendment 引入.
}

export class LocalStorageAdapter implements NoteSaveAdapter {
  /** Per-note serialized JSON cap. */
  private static readonly PER_NOTE_MAX_BYTES = 2 * 1024 * 1024;

  /** Best-effort aggregate warning threshold across all skb-note:* keys. */
  private static readonly AGGREGATE_WARN_BYTES = 5 * 1024 * 1024;

  constructor(public readonly slug: string) {}

  async load(): Promise<NoteState | null> {
    // async boundary placeholder for ESLint require-await; D8 sync semantic preserved.
    await Promise.resolve();
    try {
      const raw = localStorage.getItem(`skb-note:${this.slug}`);
      if (!raw) return null;

      try {
        return JSON.parse(raw) as NoteState;
      } catch {
        console.warn(`[NoteSaveAdapter] corrupted state for ${this.slug}; returning null`);
        return null;
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'SecurityError') {
        console.warn('[NoteSaveAdapter] localStorage SecurityError; load disabled');
        return null;
      }
      throw e;
    }
  }

  async save(state: NoteState): Promise<{ ok: boolean; error?: string }> {
    // async boundary placeholder for ESLint require-await; D8 sync semantic preserved.
    await Promise.resolve();
    const serialized = JSON.stringify(state);
    // non-ASCII content uses UTF-16 char count via .length per ADR-0018 D8 freeze; future amendment may switch to TextEncoder.byteLength.
    if (serialized.length > LocalStorageAdapter.PER_NOTE_MAX_BYTES) {
      return {
        ok: false,
        error: `note exceeds 2MB limit (${serialized.length} bytes); split into smaller notes`,
      };
    }

    try {
      localStorage.setItem(`skb-note:${this.slug}`, serialized);
      const aggregateBytes = Object.keys(localStorage)
        .filter((k) => k.startsWith('skb-note:'))
        .reduce((sum, k) => sum + (localStorage.getItem(k)?.length ?? 0), 0);
      if (aggregateBytes > LocalStorageAdapter.AGGREGATE_WARN_BYTES) {
        console.warn(
          `[NoteSaveAdapter] aggregate notes ${aggregateBytes} bytes > 5MB; consider Phase 2+ apps/api`,
        );
      }
      return { ok: true };
    } catch (e) {
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
        return {
          ok: false,
          error: 'localStorage quota exceeded; delete old notes or upgrade to apps/api',
        };
      }
      if (e instanceof DOMException && e.name === 'SecurityError') {
        return {
          ok: false,
          error: 'localStorage disabled (private mode / sandbox); save disabled',
        };
      }
      return { ok: false, error: e instanceof Error ? e.message : 'unknown' };
    }
  }
}

// Phase 2+ impl (NOT Wave 5 scope; placeholder forward-pointer)
// export class ApiAdapter implements NoteSaveAdapter {
//   constructor(public readonly slug: string, public readonly apiBase: string, public readonly authToken: string) {}
//   async load() { return await fetch(`${apiBase}/v1/notes/${slug}`, ...) ... }
//   async save(state, options?: { signal?, timeout?, onProgress? }) { POST /v1/notes/${slug} with retry }
// }
