import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageAdapter, type NoteState } from '../save-adapter';

function makeStorage(seed: Record<string, string> = {}): Storage {
  const entries = new Map(Object.entries(seed));

  return {
    get length() {
      return entries.size;
    },
    clear: vi.fn(() => entries.clear()),
    getItem: vi.fn((key: string) => entries.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(entries.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      entries.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      entries.set(key, value);
    }),
  };
}

const smallState: NoteState = {
  mdxSource: '# hello',
  lastModified: 1_700_000_000,
  version: 1,
};

describe('@skb/editor-shell LocalStorageAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('load() returns null for missing localStorage key', async () => {
    vi.stubGlobal('localStorage', makeStorage());
    const adapter = new LocalStorageAdapter('test-slug');

    await expect(adapter.load()).resolves.toBe(null);
  });

  it('save() then load() round-trips a NoteState', async () => {
    vi.stubGlobal('localStorage', makeStorage());
    const adapter = new LocalStorageAdapter('test-slug');

    await expect(adapter.save(smallState)).resolves.toEqual({ ok: true });
    await expect(adapter.load()).resolves.toEqual(smallState);
  });

  it('save() rejects oversized state with a 2MB error', async () => {
    vi.stubGlobal('localStorage', makeStorage());
    const adapter = new LocalStorageAdapter('test-slug');
    const oversizedState: NoteState = {
      mdxSource: 'a'.repeat(2 * 1024 * 1024 + 1),
      lastModified: 1_700_000_001,
      version: 2,
    };

    const result = await adapter.save(oversizedState);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/2MB|exceeds/i);
  });

  it('load() returns null and warns for corrupted JSON', async () => {
    vi.stubGlobal('localStorage', makeStorage({ 'skb-note:test-slug': 'not-json{{{' }));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const adapter = new LocalStorageAdapter('test-slug');

    await expect(adapter.load()).resolves.toBe(null);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toMatch(/corrupted/i);
  });

  it('load() returns null on SecurityError from getItem', async () => {
    const storage = makeStorage();
    vi.stubGlobal('localStorage', storage);
    vi.spyOn(storage, 'getItem').mockImplementation(() => {
      throw new DOMException('access denied', 'SecurityError');
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const adapter = new LocalStorageAdapter('test-slug');

    await expect(adapter.load()).resolves.toBe(null);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('save() returns a quota error when setItem throws QuotaExceededError', async () => {
    const storage = makeStorage();
    vi.stubGlobal('localStorage', storage);
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded', 'QuotaExceededError');
    });
    const adapter = new LocalStorageAdapter('test-slug');

    const result = await adapter.save(smallState);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/quota/i);
  });

  it('save() returns a disabled-storage error when setItem throws SecurityError', async () => {
    const storage = makeStorage();
    vi.stubGlobal('localStorage', storage);
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new DOMException('private mode', 'SecurityError');
    });
    const adapter = new LocalStorageAdapter('test-slug');

    const result = await adapter.save(smallState);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/private mode|sandbox|disabled/i);
  });
});
