// @vitest-environment node
import type { APIContext } from 'astro';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, POST } from '../[...slug]';

vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(),
  readFile: vi.fn(),
  stat: vi.fn(),
  writeFile: vi.fn(),
}));

const readFileMock = vi.mocked(readFile);
const statMock = vi.mocked(stat);
const writeFileMock = vi.mocked(writeFile);
const mkdirMock = vi.mocked(mkdir);

const existingMdx = `---
title: Existing Note
slug: existing-note
date: 2026-05-07
draft: false
---

# Existing

Original body.
`;

function context(slug: string, body?: unknown): APIContext {
  return {
    params: { slug },
    request: new Request(`http://localhost/api/notes/${slug}`, {
      body: body === undefined ? undefined : JSON.stringify(body),
      method: body === undefined ? 'GET' : 'POST',
    }),
  } as unknown as APIContext;
}

describe('/api/notes/[...slug]', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    statMock.mockResolvedValue({ mtimeMs: 1_780_000_000_000 } as Awaited<ReturnType<typeof stat>>);
    mkdirMock.mockResolvedValue(undefined);
  });

  it('GET returns NoteState JSON for an existing slug (no sidecar)', async () => {
    readFileMock.mockImplementation((path) => {
      if (typeof path === 'string' && path.endsWith('state.json')) {
        return Promise.reject(Object.assign(new Error('no sidecar'), { code: 'ENOENT' }));
      }
      return Promise.resolve(existingMdx);
    });

    const response = await GET(context('existing-note'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      mdxSource: '# Existing\n\nOriginal body.\n',
      lastModified: 1_780_000_000_000,
      version: 1,
    });
  });

  it('GET returns a JSON 404 for a missing slug', async () => {
    readFileMock.mockRejectedValue(Object.assign(new Error('missing'), { code: 'ENOENT' }));

    const response = await GET(context('missing-note'));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: 'note not found',
    });
  });

  it('POST writes the MDX body while preserving existing frontmatter (no schema drift)', async () => {
    readFileMock.mockResolvedValue(existingMdx);
    writeFileMock.mockResolvedValue();

    const response = await POST(
      context('existing-note', {
        mdxSource: '# Edited\n',
        lastModified: 1_780_000_123_000,
        version: 4,
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    // Two writeFile calls: 1 mdx + 1 sidecar state.json
    expect(writeFileMock).toHaveBeenCalledTimes(2);
    const mdxWrite = writeFileMock.mock.calls.find((call) =>
      typeof call[0] === 'string' ? call[0].endsWith('index.mdx') : false,
    );
    const sidecarWrite = writeFileMock.mock.calls.find((call) =>
      typeof call[0] === 'string' ? call[0].endsWith('state.json') : false,
    );
    expect(mdxWrite).toBeDefined();
    expect(sidecarWrite).toBeDefined();

    const mdxContent = mdxWrite?.[1];
    if (typeof mdxContent !== 'string') throw new TypeError('expected string mdx content');
    // Frontmatter preserved verbatim — no lastModified/version added
    expect(mdxContent).toContain('title: Existing Note');
    expect(mdxContent).toContain('slug: existing-note');
    expect(mdxContent).not.toContain('lastModified:');
    expect(mdxContent).not.toContain('version:');
    expect(mdxContent.endsWith('\n# Edited\n')).toBe(true);

    // Sidecar carries lastModified + version
    const sidecarContent = sidecarWrite?.[1];
    if (typeof sidecarContent !== 'string') throw new TypeError('expected string sidecar content');
    const parsedSidecar = JSON.parse(sidecarContent);
    expect(parsedSidecar).toEqual({ lastModified: 1_780_000_123_000, version: 4 });
  });

  it('POST returns a JSON 404 when the MDX file does not exist (refuses new-note creation)', async () => {
    readFileMock.mockRejectedValue(Object.assign(new Error('missing'), { code: 'ENOENT' }));

    const response = await POST(
      context('missing-note', {
        mdxSource: '# New body\n',
        lastModified: 1_780_000_123_000,
        version: 1,
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: 'note not found',
    });
    expect(writeFileMock).not.toHaveBeenCalled();
  });

  it('POST returns a JSON 400 when mdxSource is missing', async () => {
    const response = await POST(
      context('existing-note', {
        lastModified: 1_780_000_123_000,
        version: 4,
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: 'invalid note state',
    });
    expect(writeFileMock).not.toHaveBeenCalled();
  });

  it('POST returns a JSON 500 when the filesystem write fails', async () => {
    readFileMock.mockResolvedValue(existingMdx);
    writeFileMock.mockRejectedValue(new Error('permission denied'));

    const response = await POST(
      context('existing-note', {
        mdxSource: '# Edited\n',
        lastModified: 1_780_000_123_000,
        version: 4,
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: 'permission denied',
    });
  });

  it('POST then GET returns the same NoteState from the in-memory filesystem (sidecar roundtrip)', async () => {
    const storage: Map<string, string> = new Map([['index.mdx', existingMdx]]);
    readFileMock.mockImplementation((path) => {
      if (typeof path !== 'string') return Promise.reject(new TypeError('expected string path'));
      if (path.endsWith('state.json')) {
        const sidecar = storage.get('state.json');
        return sidecar
          ? Promise.resolve(sidecar)
          : Promise.reject(Object.assign(new Error('no sidecar'), { code: 'ENOENT' }));
      }
      const mdx = storage.get('index.mdx');
      return mdx
        ? Promise.resolve(mdx)
        : Promise.reject(Object.assign(new Error('not found'), { code: 'ENOENT' }));
    });
    writeFileMock.mockImplementation((path, content) => {
      if (typeof path !== 'string' || typeof content !== 'string') {
        throw new TypeError('expected string path + content');
      }
      const key = path.endsWith('state.json') ? 'state.json' : 'index.mdx';
      storage.set(key, content);
      return Promise.resolve();
    });

    const state = {
      mdxSource: '# Roundtrip\n\nSaved body.\n',
      lastModified: 1_780_000_456_000,
      version: 7,
    };

    expect((await POST(context('existing-note', state))).status).toBe(200);
    const response = await GET(context('existing-note'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(state);
  });
});
