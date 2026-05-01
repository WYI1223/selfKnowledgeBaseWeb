import { execSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '../..');
const workspaceRoot = resolve(appRoot, '../..');
const distRoot = resolve(appRoot, 'dist');
const sampleRouteHtml = resolve(distRoot, 'notes/sample-blocks/index.html');

const buildInputs = [
  resolve(appRoot, 'astro.config.mjs'),
  resolve(appRoot, 'src/components.ts'),
  resolve(appRoot, 'src/pages/notes/[...slug].astro'),
  resolve(workspaceRoot, 'content/notes/sample-blocks/index.mdx'),
];

const blockMarkers = [
  ['Callout', 'data-callout-variant="note"'],
  ['Code', 'data-code-language="python"'],
  ['Image', 'src="/sample-assets/diagram-small.png"'],
  ['Math', 'data-block="math"'],
  ['Pdf', 'data-block="pdf"'],
  ['Jupyter', 'data-block="jupyter"'],
  ['NnViz', 'data-block="nn-viz"'],
  ['AgentFlow', 'data-block="agent-flow"'],
] as const;

function newestMtime(paths: ReadonlyArray<string>): number {
  return Math.max(...paths.map((path) => statSync(path).mtimeMs));
}

function runSiteBuild(): void {
  execSync('pnpm build', {
    cwd: appRoot,
    env: { ...process.env, CI: '1' },
    stdio: 'pipe',
  });
}

function ensureFreshSampleRouteDist(): void {
  const routeMissing = !existsSync(sampleRouteHtml);
  const outputMtime = existsSync(sampleRouteHtml)
    ? statSync(sampleRouteHtml).mtimeMs
    : 0;
  if (routeMissing || outputMtime < newestMtime(buildInputs)) {
    try {
      runSiteBuild();
    } catch (error) {
      if (
        routeMissing &&
        error instanceof Error &&
        error.message.includes('EPERM')
      ) {
        return;
      }
      throw error;
    }
  }
}

describe('sample-blocks route SSR output', () => {
  beforeAll(() => {
    ensureFreshSampleRouteDist();
  }, 120_000);

  it('builds the sample-blocks route HTML with non-zero size', () => {
    expect(existsSync(sampleRouteHtml)).toBe(true);
    expect(statSync(sampleRouteHtml).size).toBeGreaterThan(0);
  });

  it('contains SSR markers for all 8 component blocks', () => {
    expect(existsSync(sampleRouteHtml)).toBe(true);
    const html = readFileSync(sampleRouteHtml, 'utf8');

    for (const [blockName, marker] of blockMarkers) {
      expect(html, `${blockName} marker: ${marker}`).toContain(marker);
    }
  });
});
