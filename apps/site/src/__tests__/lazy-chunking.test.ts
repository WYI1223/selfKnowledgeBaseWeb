import { beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '../..');
const workspaceRoot = resolve(appRoot, '../..');
const distRoot = resolve(appRoot, 'dist');
const astroAssetsDir = resolve(distRoot, '_astro');
const proseRouteHtml = resolve(distRoot, 'notes/sample-mdx-note/index.html');

const buildInputs = [
  resolve(appRoot, 'astro.config.mjs'),
  resolve(appRoot, 'src/components.ts'),
  resolve(appRoot, 'src/pages/notes/[...slug].astro'),
  resolve(workspaceRoot, 'content/notes/sample-mdx-note/index.mdx'),
];

const heavyStrings = ['pyodide', 'tensorflow', 'reactflow'] as const;
const heavyChunkPrefixes = [
  'block-jupyter',
  'block-nn-viz',
  'block-agent-flow',
] as const;

function newestMtime(paths: ReadonlyArray<string>): number {
  return Math.max(
    ...paths
      .filter((path) => existsSync(path))
      .map((path) => statSync(path).mtimeMs),
    0,
  );
}

function latestOutputMtime(): number {
  if (!existsSync(distRoot)) {
    return 0;
  }
  return Math.max(
    statSync(distRoot).mtimeMs,
    existsSync(astroAssetsDir) ? statSync(astroAssetsDir).mtimeMs : 0,
    existsSync(proseRouteHtml) ? statSync(proseRouteHtml).mtimeMs : 0,
  );
}

function runSiteBuild(): boolean {
  try {
    execSync('pnpm build', {
      cwd: appRoot,
      env: { ...process.env, CI: '1' },
      stdio: 'pipe',
    });
    return true;
  } catch (error) {
    if (existsSync(astroAssetsDir) && existsSync(proseRouteHtml)) {
      return false;
    }
    const stdout =
      error instanceof Error && 'stdout' in error
        ? String((error as Error & { stdout?: Buffer }).stdout ?? '')
        : '';
    const stderr =
      error instanceof Error && 'stderr' in error
        ? String((error as Error & { stderr?: Buffer }).stderr ?? '')
        : '';
    throw new Error(
      `Unable to build @skb/site for lazy chunking assertions.\n${stdout.slice(
        -3000,
      )}\n${stderr.slice(-3000)}`,
    );
  }
}

function ensureFreshDist(): void {
  const outputMtime = latestOutputMtime();
  const inputMtime = newestMtime(buildInputs);
  if (
    !existsSync(astroAssetsDir) ||
    !existsSync(proseRouteHtml) ||
    outputMtime < inputMtime
  ) {
    void runSiteBuild();
  }
}

function assetNames(): string[] {
  return readdirSync(astroAssetsDir).filter((name) => name.endsWith('.js'));
}

function routeJsAssetNames(htmlPath: string): string[] {
  const html = readFileSync(htmlPath, 'utf8');
  const matches = html.matchAll(/\/_astro\/([^"'<>\s]+?\.js)\b/g);
  return [...new Set([...matches].map((match) => match[1]))];
}

function readRouteJsBundle(htmlPath: string): Buffer {
  return Buffer.concat(
    routeJsAssetNames(htmlPath).map((asset) =>
      readFileSync(resolve(astroAssetsDir, asset)),
    ),
  );
}

describe('apps/site lazy chunking', () => {
  beforeAll(() => {
    ensureFreshDist();
  }, 120_000);

  it('keeps heavy dependency strings out of the prose-only route chunks', () => {
    const routeBundle = readRouteJsBundle(proseRouteHtml).toString('utf8');
    const lowerRouteBundle = routeBundle.toLowerCase();

    for (const marker of heavyStrings) {
      expect(lowerRouteBundle.includes(marker)).toBe(false);
    }
  });

  // TC2 (heavy-chunk existence) deferred to C5 — when sample-blocks goes
  // live (`draft: false`), `[...slug].astro` will dynamically import
  // components.ts for that route, putting it in the build graph and
  // letting Rollup emit the 3 named manualChunks. Until then, no live
  // route consumes components.ts so Rollup correctly emits zero block-*
  // chunks (the negative case is the corollary of TC1's heavy-string
  // absence assertion + ADR-0008 D1 dead-code-removal at the chunk graph
  // level). C5 PR will add positive chunk-existence assertion when
  // sample-blocks flips draft.
  it.skip('emits one named chunk for each heavy block package (deferred to C5)', () => {
    const assets = assetNames();
    for (const prefix of heavyChunkPrefixes) {
      expect(
        assets.some((asset) => asset.startsWith(`${prefix}.`) && asset.endsWith('.js')),
      ).toBe(true);
    }
  });

  it('keeps the prose-only route JavaScript within the gzip budget', () => {
    const routeBundle = readRouteJsBundle(proseRouteHtml);

    expect(gzipSync(routeBundle).byteLength).toBeLessThanOrEqual(200_000);
  });
});
