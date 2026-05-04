import { execSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = here;
const workspaceRoot = resolve(appRoot, '../..');
const sampleRouteHtml = resolve(appRoot, 'dist/notes/sample-blocks/index.html');

const buildInputs = [
  resolve(appRoot, 'astro.config.mjs'),
  resolve(appRoot, 'src/components.ts'),
  resolve(appRoot, 'src/pages/notes/[...slug].astro'),
  resolve(workspaceRoot, 'content/notes/sample-blocks/index.mdx'),
];

function newestMtime(paths: ReadonlyArray<string>): number {
  return Math.max(...paths.map((p) => statSync(p).mtimeMs));
}

export async function setup(): Promise<void> {
  const routeMissing = !existsSync(sampleRouteHtml);
  const outputMtime = existsSync(sampleRouteHtml)
    ? statSync(sampleRouteHtml).mtimeMs
    : 0;
  if (routeMissing || outputMtime < newestMtime(buildInputs)) {
    execSync('pnpm build', {
      cwd: appRoot,
      env: { ...process.env, CI: '1' },
      stdio: 'pipe',
    });
  }
}
