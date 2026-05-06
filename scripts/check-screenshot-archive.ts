/**
 * scripts/check-screenshot-archive.ts
 *
 * Validates ADR-0011 D9.5 screenshot archive enforcement: every e2e_smoke
 * entry's screenshot_archive path must point to a file that exists with size
 * ≥ 5KB (catches placeholder / blank PNG / truncated screenshots).
 *
 * Runs at the same CI gate as check-e2e-coverage.ts; intended for stage 6
 * ACCEPT phase verification (after pr-writer subagent generates the
 * screenshots) AND in PR CI to enforce on merge.
 *
 * Usage:
 *   tsx scripts/check-screenshot-archive.ts
 *   tsx scripts/check-screenshot-archive.ts --base <ref>
 *   tsx scripts/check-screenshot-archive.ts --pr-md <path>
 *
 * Exit codes:
 *   0 — PASS (all referenced screenshots exist + size ≥ 5KB) OR no e2e_smoke entries
 *   1 — FAIL (any screenshot missing or < 5KB)
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const PR_MD_PATTERN = /^docs\/plans\/wave-\d+(?:\.\d+)?-(?:main|prep)\/.*\.md$/;
const MIN_SCREENSHOT_BYTES = 5 * 1024;

interface CliArgs {
  base: string;
  prMd: string | null;
}

function parseArgs(argv: ReadonlyArray<string>): CliArgs {
  let base = 'origin/main';
  let prMd: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base') {
      const next = argv[i + 1];
      if (next !== undefined) {
        base = next;
        i++;
      }
    } else if (argv[i] === '--pr-md') {
      const next = argv[i + 1];
      if (next !== undefined) {
        prMd = next;
        i++;
      }
    }
  }
  return { base, prMd };
}

function findPrMd(base: string): string | null {
  const out = execSync(`git diff --name-only ${base}...HEAD`, { encoding: 'utf8' });
  const files = out
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => PR_MD_PATTERN.test(l));
  const main = files.find((f) => f.includes('-main/'));
  return main ?? files[0] ?? null;
}

function extractScreenshotPaths(prMdContent: string): ReadonlyArray<string> {
  // Lazy-grep approach: any `screenshot_archive: <path>` key/value in the file.
  const paths: string[] = [];
  const re = /screenshot_archive:\s*(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(prMdContent)) !== null) {
    if (m[1] !== undefined) paths.push(m[1].trim());
  }
  return paths;
}

function main(): void {
  const { base, prMd } = parseArgs(process.argv.slice(2));
  const prMdPath = prMd ?? findPrMd(base);

  if (prMdPath === null) {
    // No PR.md → assume non-PR context or non-UI-touch; PASS by default.
    process.stderr.write(`[check-screenshot-archive] no PR.md in diff; skip (PASS).\n`);
    process.exit(0);
  }

  let content: string;
  try {
    content = readFileSync(prMdPath, 'utf8');
  } catch (err) {
    process.stderr.write(
      `[check-screenshot-archive] FAIL: cannot read ${prMdPath}: ${(err as Error).message}\n`,
    );
    process.exit(1);
  }

  const screenshots = extractScreenshotPaths(content);
  process.stderr.write(`[check-screenshot-archive] PR.md=${prMdPath}\n`);
  process.stderr.write(`[check-screenshot-archive] screenshot_archive entries: ${screenshots.length}\n`);

  if (screenshots.length === 0) {
    process.stderr.write(
      `[check-screenshot-archive] no screenshot_archive entries; assuming non-UI-touch PR (PASS).\n`,
    );
    process.exit(0);
  }

  let failedAny = false;
  for (const rel of screenshots) {
    const full = path.resolve(process.cwd(), rel);
    if (!existsSync(full)) {
      process.stderr.write(`  FAIL: ${rel} — file does not exist\n`);
      failedAny = true;
      continue;
    }
    const stats = statSync(full);
    if (stats.size < MIN_SCREENSHOT_BYTES) {
      process.stderr.write(
        `  FAIL: ${rel} — size ${stats.size} bytes < ${MIN_SCREENSHOT_BYTES} (placeholder / blank / truncated screenshot)\n`,
      );
      failedAny = true;
    } else {
      process.stderr.write(`  OK: ${rel} (${stats.size} bytes)\n`);
    }
  }

  if (failedAny) {
    process.stderr.write(`[check-screenshot-archive] FAIL\n`);
    process.exit(1);
  }

  process.stderr.write(
    `[check-screenshot-archive] PASS (${screenshots.length} screenshots verified ≥ ${MIN_SCREENSHOT_BYTES} bytes)\n`,
  );
  process.exit(0);
}

main();
