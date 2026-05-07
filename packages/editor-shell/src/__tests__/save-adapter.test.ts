import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  LocalStorageAdapter,
  type NoteSaveAdapter,
  type NoteState,
} from '../save-adapter';

const here = dirname(fileURLToPath(import.meta.url));
const saveAdapterSourcePath = resolve(here, '../save-adapter.ts');
const executableApiAdapterPattern =
  /class\s+ApiAdapter|interface\s+ApiAdapter|export\s+(const|function|class|interface)\s+ApiAdapter|import.*ApiAdapter\s+from/;

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

function countExecutableApiAdapterForms(source: string): number {
  return source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('//'))
    .filter((line) => executableApiAdapterPattern.test(line)).length;
}

const smallState: NoteState = {
  mdxSource: '# hello',
  tiptapState: { type: 'doc', content: [{ type: 'paragraph' }] },
  lastModified: 1_700_000_000,
  version: 1,
};

describe('@skb/editor-shell NoteSaveAdapter contract', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('NoteSaveAdapter interface allows LocalStorageAdapter MVP', () => {
    const adapter: NoteSaveAdapter = new LocalStorageAdapter('test-slug');

    expect(adapter.slug).toBe('test-slug');
    expect(typeof adapter.load).toBe('function');
    expect(typeof adapter.save).toBe('function');
  });

  it('LocalStorageAdapter.load returns null for new slug', async () => {
    vi.stubGlobal('localStorage', makeStorage());
    const adapter = new LocalStorageAdapter('test-slug');

    await expect(adapter.load()).resolves.toBe(null);
  });

  it('LocalStorageAdapter.save + load round-trip preserves NoteState', async () => {
    vi.stubGlobal('localStorage', makeStorage());
    const adapter = new LocalStorageAdapter('test-slug');

    await expect(adapter.save(smallState)).resolves.toEqual({ ok: true });
    await expect(adapter.load()).resolves.toEqual(smallState);
  });

  it('LocalStorageAdapter.save handles SecurityError gracefully', async () => {
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

  it('LocalStorageAdapter.save rejects oversized state (> 2MB)', async () => {
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

  it('ApiAdapter forward-stub is COMMENT-only (no executable class/import/interface)', () => {
    const source = readFileSync(saveAdapterSourcePath, 'utf8');

    expect(source).toContain(
      '// TODO Phase 2+ ApiAdapter implementing NoteSaveAdapter for /api/notes endpoint',
    );
    expect(countExecutableApiAdapterForms(source)).toBe(0);
  });
});
