// @vitest-environment node
// Per-file env override: pagefind CLI invocation + filesystem reads of
// emitted fragment files under a temp dir; happy-dom (apps/site default)
// is unnecessary and slower for pure Node integration testing.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const appRoot = resolve(import.meta.dirname, '../..');
const isCi = process.env.CI === '1' || process.env.CI === 'true';

type CliCommand = {
  argsPrefix: string[];
  cmd: string;
};

function commandWorks(command: CliCommand): boolean {
  try {
    execFileSync(command.cmd, [...command.argsPrefix, '--version'], {
      cwd: appRoot,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function findPagefindCli(): CliCommand | null {
  const override = process.env.PAGEFIND_BIN;
  if (override) {
    return { cmd: override, argsPrefix: [] };
  }

  const candidates = [
    { cmd: 'pagefind', argsPrefix: [] },
    { cmd: 'pnpm', argsPrefix: ['exec', 'pagefind'] },
  ];
  return candidates.find(commandWorks) ?? null;
}

const pagefindCli = findPagefindCli();
const runIfPagefind = pagefindCli || isCi ? describe : describe.skip;

function requirePagefindCli(): CliCommand {
  if (!pagefindCli) {
    throw new Error('PageFind binary is required on CI; set PAGEFIND_BIN or install pagefind.');
  }
  return pagefindCli;
}

function writeRenderedFixture(siteRoot: string, body: string): void {
  const pageDir = join(siteRoot, 'notes/reindex-fixture');
  mkdirSync(pageDir, { recursive: true });
  writeFileSync(
    join(siteRoot, 'reindex-fixture.mdx'),
    `---
title: Search Reindex Fixture
---

${body}
`,
  );
  writeFileSync(
    join(pageDir, 'index.html'),
    `<!doctype html>
<html lang="en">
  <head><title>Search Reindex Fixture</title></head>
  <body>
    <main data-pagefind-body>
      <h1>Search Reindex Fixture</h1>
      <p>${body}</p>
    </main>
  </body>
</html>`,
  );
}

function runPagefind(siteRoot: string): void {
  const command = requirePagefindCli();
  rmSync(join(siteRoot, 'pagefind'), { recursive: true, force: true });
  execFileSync(command.cmd, [...command.argsPrefix, '--site', siteRoot], {
    cwd: appRoot,
    env: { ...process.env, CI: '1' },
    stdio: 'pipe',
  });
}

function fragmentDigest(siteRoot: string): string {
  // pagefind 1.5.2 emits to `<site>/pagefind/` (no underscore prefix).
  const fragmentDir = join(siteRoot, 'pagefind/fragment');
  expect(existsSync(fragmentDir)).toBe(true);

  const fragmentFiles = readdirSync(fragmentDir)
    .filter((name) => name.endsWith('.pf_fragment'))
    .sort();
  expect(fragmentFiles.length).toBeGreaterThan(0);

  const hash = createHash('sha256');
  for (const file of fragmentFiles) {
    hash.update(file);
    hash.update(readFileSync(join(fragmentDir, file)));
  }
  return hash.digest('hex');
}

runIfPagefind('PageFind reindex contract', () => {
  let siteRoot: string;

  beforeAll(() => {
    siteRoot = mkdtempSync(join(tmpdir(), 'skb-pagefind-reindex-'));
  });

  afterAll(() => {
    rmSync(siteRoot, { recursive: true, force: true });
  });

  it('changes fragment bytes when content changes and restores them after revert', () => {
    const originalBody = 'Original searchable build-time content.';
    const mutatedBody = 'Mutated searchable build-time content.';

    writeRenderedFixture(siteRoot, originalBody);
    runPagefind(siteRoot);
    const originalDigest = fragmentDigest(siteRoot);

    writeRenderedFixture(siteRoot, mutatedBody);
    runPagefind(siteRoot);
    const mutatedDigest = fragmentDigest(siteRoot);

    writeRenderedFixture(siteRoot, originalBody);
    runPagefind(siteRoot);
    const restoredDigest = fragmentDigest(siteRoot);

    expect(mutatedDigest).not.toBe(originalDigest);
    expect(restoredDigest).toBe(originalDigest);
  }, 120_000);
});
