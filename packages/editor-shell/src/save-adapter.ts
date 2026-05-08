/**
 * Note persistence adapter for the Wave 5 editor scaffold.
 *
 * ADR-0018 D8 lines 339-451 are the canonical interface authority.
 * C.4-1 hardens the public contract while preserving the C.4-prelude
 * LocalStorageAdapter implementation.
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
  /** Canonical MDX source persisted for mdx-bridge round trips. */
  readonly mdxSource: string;
  /** Optional same-session Tiptap JSON cache. Not a stable cross-client schema. */
  readonly tiptapState?: ReadonlyJSONValue;
  /** Consumer-supplied last-modified Unix timestamp in milliseconds. */
  readonly lastModified: number;
  /** Consumer-incremented monotonic version; adapters persist but do not increment. */
  readonly version: number;
}

/**
 * Stable save/load boundary for note edit routes.
 *
 * Implementations are selected by consumers. `load()` resolves to the latest
 * persisted NoteState or null when no state is present. `save()` never throws
 * for expected storage failures; it resolves `{ ok: false, error }` with an
 * operator-readable error instead.
 */
export interface NoteSaveAdapter {
  /** Route slug for /notes/<slug> used as the persistence key suffix. */
  readonly slug: string;

  /** Load persisted NoteState; null means the slug has no saved state. */
  load(): Promise<NoteState | null>;

  /** Persist NoteState; expected storage failures return ok false plus error. */
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

/**
 * Network-backed adapter consuming the Wave 6 Stage B path-(b) endpoint
 * shipped in PR #99 at `apps/site/src/pages/api/notes/[...slug].ts`.
 *
 * Contract authority: ADR-0018 v0.6 D11 (load returns NoteState | null;
 * save returns { ok, error? }; no auth at Wave 6 Stage B). The endpoint
 * persists `{lastModified, version}` to a sibling `state.json` sidecar
 * so the `@skb/content-types` frontmatter authority is preserved.
 *
 * Single-user dev/preview only at Wave 6 Stage B. Phase 3+ multi-user
 * collab path-(a) (separate `apps/api` server) lives outside this class.
 */
export class ApiAdapter implements NoteSaveAdapter {
  constructor(
    public readonly slug: string,
    public readonly apiBase: string = '/api/notes',
  ) {}

  private endpointUrl(): string {
    return `${this.apiBase}/${this.slug}`;
  }

  async load(): Promise<NoteState | null> {
    const res = await fetch(this.endpointUrl(), { method: 'GET' });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`load failed: ${res.status}`);
    }
    return (await res.json()) as NoteState;
  }

  async save(state: NoteState): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch(this.endpointUrl(), {
        body: JSON.stringify(state),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      if (!res.ok) {
        return { error: `save failed: ${res.status}`, ok: false };
      }
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'network error', ok: false };
    }
  }
}
