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
 * **Symmetry with check-e2e-coverage.ts (Wave 5 v1.3 fix-forward 2026-05-XX)**:
 * UI-touch detection runs first via the same path-pattern set as
 * check-ui-touch.ts / check-e2e-coverage.ts. If `ui_touch=false` (e.g. plan-
 * amendment PRs that forward-declare future screenshot paths in catalog form,
 * or non-UI scope PRs), enforcement is **skipped** (exit 0). This matches
 * D9.5 semantic intent: screenshot archives are an ACCEPT-phase obligation
 * for UI-touch IMPLEMENTATION PRs, not for plan-doc forward declarations.
 *
 * Pre-fix bug (PR #75 v1.3 case): script greedy-grepped `screenshot_archive:`
 * regex against any PR.md and validated each path. Plan PRs declaring 9
 * future-implementation paths (none yet exist) tripped FAIL despite
 * ui_touch=false. orchestrator workaround was field rename, flagged as D10
 * anti-pattern. Correct fix = mirror check-e2e-coverage.ts ui_touch skip.
 *
 * Usage:
 *   tsx scripts/check-screenshot-archive.ts
 *   tsx scripts/check-screenshot-archive.ts --base <ref>
 *   tsx scripts/check-screenshot-archive.ts --pr-md <path>
 *
 * Exit codes:
 *   0 — PASS (ui_touch=false; OR all referenced screenshots exist + size ≥ 5KB)
 *   1 — FAIL (ui_touch=true AND any screenshot missing or < 5KB)
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const PR_MD_PATTERN = /^docs\/plans\/wave-\d+(?:\.\d+)?-(?:main|prep)\/.*\.md$/;
const MIN_SCREENSHOT_BYTES = 5 * 1024;

// UI-touch path patterns (must stay in sync with check-ui-touch.ts and
// check-e2e-coverage.ts; per ADR-0011 D9.1).
const UI_TOUCH_PATTERNS: ReadonlyArray<RegExp> = [
  /^apps\/site\/src\/pages\//,
  /^apps\/site\/src\/components\//,
  /^apps\/site\/src\/styles\//,
  /^packages\/[^/]+\/src\/ui-default\//,
  /^packages\/heavy-block-boundary\/src\//,
  /^packages\/editor-shell\/src\//,
  /^packages\/design-tokens\//,
];

// Server-only API routes (prerender=false JSON endpoints) are NOT UI-touch
// per ADR-0011 D9.1 exclusion (Wave 6 Stage B.2 amendment 2026-05-07).
// Mirrors scripts/check-ui-touch.ts + scripts/check-e2e-coverage.ts
// (ADR-0006 #5 algorithm replication invariant).
const UI_TOUCH_EXCLUDE_PATTERNS: ReadonlyArray<RegExp> = [/^apps\/site\/src\/pages\/api\//];

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

function changedFiles(base: string): ReadonlyArray<string> {
  const out = execSync(`git diff --name-only ${base}...HEAD`, { encoding: 'utf8' });
  return out
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

function isUiTouch(files: ReadonlyArray<string>): boolean {
  return files.some((file) => {
    if (UI_TOUCH_EXCLUDE_PATTERNS.some((p) => p.test(file))) return false;
    return UI_TOUCH_PATTERNS.some((p) => p.test(file));
  });
}

function findPrMd(files: ReadonlyArray<string>): string | null {
  const candidates = files.filter((f) => PR_MD_PATTERN.test(f));
  const main = candidates.find((c) => c.includes('-main/'));
  return main ?? candidates[0] ?? null;
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

  // UI-touch detection FIRST — symmetric with check-e2e-coverage.ts. Plan PRs
  // (e.g. v1.x amendments) forward-declare future screenshot paths in catalog
  // form; those screenshots don't exist at plan-merge time. Per ADR-0011 D9.5
  // semantic intent, screenshot enforcement fires only at ui_touch=true PR
  // ACCEPT phase, not at plan-amendment merge.
  const files = changedFiles(base);
  const uiTouch = isUiTouch(files);

  process.stderr.write(`[check-screenshot-archive] base=${base}\n`);
  process.stderr.write(`[check-screenshot-archive] files scanned: ${files.length}\n`);
  process.stderr.write(`[check-screenshot-archive] ui_touch=${uiTouch}\n`);

  if (!uiTouch) {
    process.stderr.write(
      `[check-screenshot-archive] ui_touch=false → screenshot enforcement skipped (D9.5 plan-PR forward-declaration carve-out).\n`,
    );
    process.stderr.write(`[check-screenshot-archive] PASS\n`);
    process.exit(0);
  }

  const prMdPath = prMd ?? findPrMd(files);

  if (prMdPath === null) {
    process.stderr.write(`[check-screenshot-archive] ui_touch=true but no PR.md in diff; skip (PASS).\n`);
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
      `[check-screenshot-archive] ui_touch=true but no screenshot_archive entries — likely PR.md schema gap; let check-e2e-coverage.ts FAIL on missing e2e_smoke instead. PASS here.\n`,
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
