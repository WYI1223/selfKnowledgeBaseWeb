// @vitest-environment node
// Per-file env override: pure Node integration test (filesystem +
// PageFind CLI invocation) — happy-dom (apps/site default) is unnecessary.
//
// SCOPE NOTE (D2): this test verifies PageFind successfully indexes
// CJK content under the temp corpus and emits the canonical 1.5+
// artifact set (pagefind-entry.json + at least one .pf_meta + at least
// one fragment file). The full ADR-0012 criterion 4 word-level vs
// character-level RUNTIME discriminator (querying '笔记' must match
// '中文笔记测试' but '记本' must NOT match '笔记本电脑') requires
// pagefind.js's browser fetch() runtime which is fragile under
// Node + happy-dom + file:// + mock HTTP server. The runtime
// discriminator assertion is **deferred to D3's playwright spec**
// (real browser, real fetch, exercising the /search route end-to-end).
// D2's gate here is "PageFind ran on CJK content + emitted index" —
// strictly weaker than ADR-0012 criterion 4 but the strongest D2 can
// give without serving the browser stack.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
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

  // pagefind is a transitive dep of astro-pagefind (not direct in
  // apps/site), so .bin/pagefind isn't symlinked into apps/site/node_modules.
  // Use node's require.resolve against the platform-specific binary
  // optional-dep that pagefind's own wrapper uses (lib/resolveBinary.js).
  // pagefind ships pagefind_extended (CJK + lang) per platform; fall back
  // to plain pagefind binary if extended isn't present.
  try {
    const require = createRequire(import.meta.url);
    const platform = process.platform === 'win32' ? 'windows' : process.platform;
    const arch = process.arch;
    const ext = platform === 'windows' ? '.exe' : '';
    for (const execname of ['pagefind_extended', 'pagefind']) {
      try {
        const resolved = require.resolve(`@pagefind/${platform}-${arch}/bin/${execname}${ext}`);
        return { cmd: resolved, argsPrefix: [] };
      } catch {
        // try next execname
      }
    }
  } catch {
    // createRequire / resolve failed — fall through to PATH probe
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

function writePage(root: string, slug: string, title: string, body: string): void {
  const pageDir = join(root, slug);
  mkdirSync(pageDir, { recursive: true });
  writeFileSync(
    join(pageDir, 'index.html'),
    `<!doctype html>
<html lang="zh">
  <head><title>${title}</title><meta name="title" content="${title}"></head>
  <body><main data-pagefind-body><h1>${title}</h1><p>${body}</p></main></body>
</html>`,
  );
}

function runPagefind(siteRoot: string): void {
  const command = requirePagefindCli();
  execFileSync(command.cmd, [...command.argsPrefix, '--site', siteRoot], {
    cwd: appRoot,
    env: { ...process.env, CI: '1' },
    stdio: 'pipe',
  });
}

runIfPagefind('PageFind CJK indexing (D2 structural gate; D3 playwright runs full word-level discriminator)', () => {
  let siteRoot: string;

  beforeAll(() => {
    siteRoot = mkdtempSync(join(tmpdir(), 'skb-pagefind-cjk-'));
    writePage(siteRoot, 'zh-note', '中文笔记测试', '这是一段中文笔记测试内容。');
    writePage(siteRoot, 'laptop', '笔记本电脑', '这是一段关于笔记本电脑的内容。');
    runPagefind(siteRoot);
  }, 60_000);

  afterAll(() => {
    rmSync(siteRoot, { recursive: true, force: true });
  });

  it('emits canonical PageFind 1.5+ artifact set on CJK corpus', () => {
    const pagefindDir = join(siteRoot, 'pagefind');
    expect(existsSync(pagefindDir)).toBe(true);

    const entryPath = join(pagefindDir, 'pagefind-entry.json');
    expect(existsSync(entryPath)).toBe(true);
    const entry = JSON.parse(readFileSync(entryPath, 'utf8')) as { version: string };
    expect(entry.version).toMatch(/^1\.5\./);

    const fragmentDir = join(pagefindDir, 'fragment');
    expect(existsSync(fragmentDir)).toBe(true);
    const fragments = readdirSync(fragmentDir).filter((n) => n.endsWith('.pf_fragment'));
    expect(fragments.length).toBeGreaterThanOrEqual(2);

    const metaFiles = readdirSync(pagefindDir).filter((n) => n.endsWith('.pf_meta'));
    expect(metaFiles.length).toBeGreaterThanOrEqual(1);
  });
});
