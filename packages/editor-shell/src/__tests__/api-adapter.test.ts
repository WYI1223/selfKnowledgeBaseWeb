// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiAdapter, type NoteState } from '../save-adapter';

type FetchSignature = (input: string, init?: RequestInit) => Promise<Response>;
type FetchMock = ReturnType<typeof vi.fn<FetchSignature>>;

let fetchMock: FetchMock;

const sampleState: NoteState = {
  lastModified: 1_780_000_123_000,
  mdxSource: '# Hello\n\nBody.\n',
  tiptapState: { content: [{ type: 'paragraph' }], type: 'doc' },
  version: 4,
};

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status: 200,
    ...init,
  });
}

beforeEach(() => {
  fetchMock = vi.fn<FetchSignature>();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ApiAdapter', () => {
  it('exposes the slug + default apiBase', () => {
    const adapter = new ApiAdapter('sample-note');
    expect(adapter.slug).toBe('sample-note');
    expect(adapter.apiBase).toBe('/api/notes');
  });

  it('honors a custom apiBase', () => {
    const adapter = new ApiAdapter('sample-note', '/v1/api/notes');
    expect(adapter.apiBase).toBe('/v1/api/notes');
  });

  it('load() GETs /api/notes/<slug> and returns NoteState on 200', async () => {
    fetchMock.mockResolvedValue(jsonResponse(sampleState));
    const adapter = new ApiAdapter('sample-note');

    const result = await adapter.load();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/notes/sample-note', { method: 'GET' });
    expect(result).toEqual(sampleState);
  });

  it('load() returns null on 404 (no saved state)', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: 'note not found', ok: false }, { status: 404 }),
    );
    const adapter = new ApiAdapter('missing-note');

    await expect(adapter.load()).resolves.toBeNull();
  });

  it('load() throws on non-2xx non-404 (5xx surfaces to caller)', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: 'fs error', ok: false }, { status: 500 }),
    );
    const adapter = new ApiAdapter('sample-note');

    await expect(adapter.load()).rejects.toThrow(/load failed: 500/);
  });

  it('save() POSTs JSON body and returns { ok: true } on 200', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    const adapter = new ApiAdapter('sample-note');

    const result = await adapter.save(sampleState);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/notes/sample-note');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(init.body).toBe(JSON.stringify(sampleState));
    expect(result).toEqual({ ok: true });
  });

  it('save() returns { ok: false, error } on non-2xx (no throw)', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: 'invalid note state', ok: false }, { status: 400 }),
    );
    const adapter = new ApiAdapter('sample-note');

    const result = await adapter.save(sampleState);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/save failed: 400/);
  });

  it('save() returns { ok: false, error } on network failure (fetch rejects)', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    const adapter = new ApiAdapter('sample-note');

    const result = await adapter.save(sampleState);

    expect(result.ok).toBe(false);
    expect(result.error).toBe('network down');
  });

  it('save() does not throw if fetch rejects with a non-Error value', async () => {
    fetchMock.mockRejectedValue('boom');
    const adapter = new ApiAdapter('sample-note');

    const result = await adapter.save(sampleState);

    expect(result.ok).toBe(false);
    expect(result.error).toBe('network error');
  });

  it('roundtrip: save() then load() returns the same NoteState (in-memory fake)', async () => {
    const storage = new Map<string, NoteState>();
    const fakeFetch = (url: string, init?: RequestInit): Promise<Response> => {
      const slug = url.replace(/^\/api\/notes\//, '');
      if (init?.method === 'POST') {
        if (typeof init.body !== 'string') {
          return Promise.reject(new TypeError('expected string body'));
        }
        storage.set(slug, JSON.parse(init.body) as NoteState);
        return Promise.resolve(jsonResponse({ ok: true }));
      }
      const state = storage.get(slug);
      if (!state) {
        return Promise.resolve(
          jsonResponse({ error: 'note not found', ok: false }, { status: 404 }),
        );
      }
      return Promise.resolve(jsonResponse(state));
    };
    fetchMock.mockImplementation(fakeFetch);

    const adapter = new ApiAdapter('roundtrip-note');
    expect(await adapter.save(sampleState)).toEqual({ ok: true });
    await expect(adapter.load()).resolves.toEqual(sampleState);
  });
});
