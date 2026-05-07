import type { APIContext } from 'astro';
import type { NoteState } from '@skb/editor-shell';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';

export const prerender = false;

type FrontmatterParts = {
  body: string;
  frontmatter: string;
};

const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?/;

function workspaceRoot(): string {
  const cwd = process.cwd();
  return cwd.endsWith(`${sep}apps${sep}site`) ? resolve(cwd, '../..') : cwd;
}

const notesRoot = resolve(workspaceRoot(), 'content/notes');

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status,
  });
}

function errorResponse(status: number, error: string): Response {
  return jsonResponse({ ok: false, error }, status);
}

function isNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

function getSlug(params: APIContext['params']): string | null {
  const slug = params.slug;
  if (typeof slug !== 'string' || slug.trim() === '') return null;

  const parts = slug.split('/').filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.some((part) => part === '.' || part === '..' || part.includes('\\'))) return null;

  return parts.join('/');
}

function noteFilePath(slug: string): string {
  const notePath = resolve(notesRoot, ...slug.split('/'), 'index.mdx');
  if (notePath !== notesRoot && !notePath.startsWith(`${notesRoot}${sep}`)) {
    throw new Error('invalid slug');
  }
  return notePath;
}

function stateSidecarPath(slug: string): string {
  const sidecarPath = resolve(notesRoot, ...slug.split('/'), 'state.json');
  if (sidecarPath !== notesRoot && !sidecarPath.startsWith(`${notesRoot}${sep}`)) {
    throw new Error('invalid slug');
  }
  return sidecarPath;
}

function splitMdx(source: string): FrontmatterParts {
  const match = frontmatterPattern.exec(source);
  if (!match) {
    return { body: source, frontmatter: '' };
  }
  return {
    body: source.slice(match[0].length).replace(/^\r?\n/, ''),
    frontmatter: match[0],
  };
}

function serializeMdx(frontmatter: string, mdxSource: string): string {
  const body = mdxSource.replace(/^\r?\n/, '');
  return frontmatter ? `${frontmatter}\n${body}` : body;
}

function isNoteState(value: unknown): value is NoteState {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<NoteState>;
  return (
    typeof candidate.mdxSource === 'string' &&
    typeof candidate.lastModified === 'number' &&
    Number.isFinite(candidate.lastModified) &&
    typeof candidate.version === 'number' &&
    Number.isFinite(candidate.version)
  );
}

type SidecarState = { lastModified: number; version: number };

function isSidecarState(value: unknown): value is SidecarState {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<SidecarState>;
  return (
    typeof candidate.lastModified === 'number' &&
    Number.isFinite(candidate.lastModified) &&
    typeof candidate.version === 'number' &&
    Number.isFinite(candidate.version)
  );
}

async function readSidecar(slug: string): Promise<SidecarState | null> {
  try {
    const raw = await readFile(stateSidecarPath(slug), 'utf8');
    const parsed = JSON.parse(raw);
    return isSidecarState(parsed) ? parsed : null;
  } catch (error) {
    if (isNotFound(error)) return null;
    return null;
  }
}

async function writeSidecar(slug: string, sidecar: SidecarState): Promise<void> {
  const sidecarPath = stateSidecarPath(slug);
  await mkdir(dirname(sidecarPath), { recursive: true });
  await writeFile(sidecarPath, JSON.stringify(sidecar, null, 2) + '\n', 'utf8');
}

async function readExistingMdx(notePath: string): Promise<string | null> {
  try {
    return await readFile(notePath, 'utf8');
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export async function GET({ params }: APIContext): Promise<Response> {
  const slug = getSlug(params);
  if (!slug) return errorResponse(400, 'invalid slug');

  try {
    const notePath = noteFilePath(slug);
    const [source, fileStat, sidecar] = await Promise.all([
      readFile(notePath, 'utf8'),
      stat(notePath),
      readSidecar(slug),
    ]);
    const parts = splitMdx(source);

    return jsonResponse({
      mdxSource: parts.body,
      lastModified: sidecar?.lastModified ?? fileStat.mtimeMs,
      version: sidecar?.version ?? 1,
    });
  } catch (error) {
    if (isNotFound(error)) return errorResponse(404, 'note not found');
    return errorResponse(500, error instanceof Error ? error.message : 'filesystem error');
  }
}

export async function POST({ params, request }: APIContext): Promise<Response> {
  const slug = getSlug(params);
  if (!slug) return errorResponse(400, 'invalid slug');

  let state: unknown;
  try {
    state = await request.json();
  } catch {
    return errorResponse(400, 'invalid note state');
  }
  if (!isNoteState(state)) return errorResponse(400, 'invalid note state');

  try {
    const notePath = noteFilePath(slug);
    const existing = await readExistingMdx(notePath);
    if (existing === null) {
      // Refuse to create new notes through this endpoint. New-note
      // creation requires `@skb/content-types` frontmatter (title,
      // date, tags, draft) which a body-only POST cannot supply,
      // and a created-without-frontmatter file would break the next
      // content sync / Astro build. New-note creation lives outside
      // Wave 6 Stage B scope.
      return errorResponse(404, 'note not found');
    }
    // Preserve existing frontmatter verbatim (do NOT modify
    // @skb/content-types schema; lastModified + version go to
    // sidecar state.json instead).
    const frontmatter = splitMdx(existing).frontmatter;
    await writeFile(notePath, serializeMdx(frontmatter, state.mdxSource), 'utf8');
    await writeSidecar(slug, {
      lastModified: state.lastModified,
      version: state.version,
    });
    return jsonResponse({ ok: true });
  } catch (error) {
    return errorResponse(500, error instanceof Error ? error.message : 'filesystem error');
  }
}
