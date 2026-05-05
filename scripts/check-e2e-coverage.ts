/**
 * scripts/check-e2e-coverage.ts
 *
 * Validates ADR-0011 D9 + ADR-0006 item 9 enforcement at CI: if a PR is
 * UI-touch (per scripts/check-ui-touch.ts), its PR.md MUST declare
 * `ui_touch: true` and a non-empty `e2e_smoke` field referencing existing
 * Playwright spec files.
 *
 * Algorithm:
 *   1. Detect changed files via `git diff --name-only ${base}...HEAD`
 *   2. Determine ui_touch via path patterns (same as check-ui-touch.ts)
 *   3. If ui_touch=true:
 *      a. Find PR.md in diff (`docs/plans/wave-*-{main,prep}/*.md` added or modified)
 *      b. Parse PR.md for `## ui_touch` and `## e2e_smoke` sections
 *      c. Validate ui_touch declared as `true`
 *      d. Validate e2e_smoke entries each reference a `playwright_spec` file that exists
 *   4. Exit 0 PASS / exit 1 FAIL with clear message
 *
 * If ui_touch=false: exit 0 (skip enforcement; non-UI PRs unaffected).
 *
 * Usage:
 *   tsx scripts/check-e2e-coverage.ts
 *   tsx scripts/check-e2e-coverage.ts --base <ref>
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const UI_TOUCH_PATTERNS: ReadonlyArray<RegExp> = [
  /^apps\/site\/src\/pages\//,
  /^apps\/site\/src\/components\//,
  /^apps\/site\/src\/styles\//,
  /^packages\/[^/]+\/src\/ui-default\//,
  /^packages\/heavy-block-boundary\/src\//,
  /^packages\/editor-shell\/src\//,
  /^packages\/design-tokens\//,
];

const PR_MD_PATTERN = /^docs\/plans\/wave-\d+(?:\.\d+)?-(?:main|prep)\/.*\.md$/;

interface E2eEntry {
  flow?: string;
  target_url?: string;
  playwright_spec?: string;
  screenshot_archive?: string;
  raw: string;
}

function parseArgs(argv: ReadonlyArray<string>): { base: string } {
  let base = 'origin/main';
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base' && i + 1 < argv.length) {
      base = argv[++i];
    }
  }
  return { base };
}

function changedFiles(base: string): ReadonlyArray<string> {
  const out = execSync(`git diff --name-only ${base}...HEAD`, { encoding: 'utf8' });
  return out
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

function isUiTouch(files: ReadonlyArray<string>): boolean {
  return files.some((file) => UI_TOUCH_PATTERNS.some((p) => p.test(file)));
}

function findPrMd(files: ReadonlyArray<string>): string | null {
  const candidates = files.filter((f) => PR_MD_PATTERN.test(f));
  // Prefer `*-main/*.md` over `*-prep/*.md` if both present
  const main = candidates.find((c) => c.includes('-main/'));
  if (main !== undefined) return main;
  return candidates[0] ?? null;
}

function parsePrMdSections(content: string): Record<string, string> {
  // Sections are markdown ## headings; extract content between consecutive ## (or end).
  const sections: Record<string, string> = {};
  const lines = content.split('\n');
  let currentName: string | null = null;
  let currentBuf: string[] = [];
  for (const line of lines) {
    const headingMatch = /^##\s+(\S.*?)\s*$/.exec(line);
    if (headingMatch !== null) {
      if (currentName !== null) sections[currentName] = currentBuf.join('\n');
      currentName = headingMatch[1].toLowerCase();
      currentBuf = [];
    } else if (currentName !== null) {
      currentBuf.push(line);
    }
  }
  if (currentName !== null) sections[currentName] = currentBuf.join('\n');
  return sections;
}

function parseE2eSmoke(section: string): ReadonlyArray<E2eEntry> {
  // Loose parse: split by `- flow:` or `- ` bullets at start; extract key:value lines per entry.
  // Tolerant of yaml-like indentation; for production accuracy a real yaml lib could be added.
  const entries: E2eEntry[] = [];
  const blocks = section.split(/^\s*-\s+(?=flow:|playwright_spec:|target_url:)/m);
  for (const block of blocks) {
    const trimmed = block.trim();
    if (trimmed.length === 0) continue;
    const entry: E2eEntry = { raw: trimmed };
    const flowMatch = /flow:\s*(.+)/.exec(trimmed);
    const urlMatch = /target_url:\s*(.+)/.exec(trimmed);
    const specMatch = /playwright_spec:\s*(.+)/.exec(trimmed);
    const shotMatch = /screenshot_archive:\s*(.+)/.exec(trimmed);
    if (flowMatch !== null) entry.flow = flowMatch[1].trim();
    if (urlMatch !== null) entry.target_url = urlMatch[1].trim();
    if (specMatch !== null) entry.playwright_spec = specMatch[1].trim();
    if (shotMatch !== null) entry.screenshot_archive = shotMatch[1].trim();
    if (entry.flow !== undefined || entry.playwright_spec !== undefined) {
      entries.push(entry);
    }
  }
  return entries;
}

function main(): void {
  const { base } = parseArgs(process.argv.slice(2));
  const files = changedFiles(base);
  const uiTouch = isUiTouch(files);

  process.stderr.write(`[check-e2e-coverage] base=${base}\n`);
  process.stderr.write(`[check-e2e-coverage] files scanned: ${files.length}\n`);
  process.stderr.write(`[check-e2e-coverage] ui_touch=${uiTouch}\n`);

  if (!uiTouch) {
    process.stderr.write(`[check-e2e-coverage] non-UI-touch PR; D9 enforcement skipped.\n`);
    process.stderr.write(`[check-e2e-coverage] PASS\n`);
    process.exit(0);
  }

  const prMdPath = findPrMd(files);
  if (prMdPath === null) {
    process.stderr.write(
      `[check-e2e-coverage] FAIL: ui_touch=true but no PR.md found in diff (expected docs/plans/wave-*-{main,prep}/*.md per ADR-0011 D9.1)\n`,
    );
    process.exit(1);
  }
  process.stderr.write(`[check-e2e-coverage] PR.md = ${prMdPath}\n`);

  let content: string;
  try {
    content = readFileSync(prMdPath, 'utf8');
  } catch (err) {
    process.stderr.write(`[check-e2e-coverage] FAIL: cannot read ${prMdPath}: ${(err as Error).message}\n`);
    process.exit(1);
  }

  const sections = parsePrMdSections(content);

  // Check ui_touch declaration
  const uiTouchSection = sections['ui_touch'] ?? '';
  if (!/\btrue\b/i.test(uiTouchSection)) {
    process.stderr.write(
      `[check-e2e-coverage] FAIL: PR.md missing or non-true \`## ui_touch\` section. ADR-0011 D9.1 requires \`ui_touch: true\` for UI-touch PRs.\n`,
    );
    process.exit(1);
  }

  // Check e2e_smoke
  const e2eSection = sections['e2e_smoke'] ?? sections['e2e-smoke'] ?? '';
  if (e2eSection.trim().length === 0) {
    process.stderr.write(
      `[check-e2e-coverage] FAIL: PR.md has \`ui_touch: true\` but missing or empty \`## e2e_smoke\` section. ADR-0011 D9.2 requires non-empty e2e_smoke for UI-touch PRs.\n`,
    );
    process.exit(1);
  }

  const entries = parseE2eSmoke(e2eSection);
  if (entries.length === 0) {
    process.stderr.write(
      `[check-e2e-coverage] FAIL: \`## e2e_smoke\` section parsed 0 entries. Need ≥ 1 entry with flow + playwright_spec.\n`,
    );
    process.exit(1);
  }

  let failedAny = false;
  for (const [i, entry] of entries.entries()) {
    process.stderr.write(`[check-e2e-coverage] entry ${i + 1}: flow="${entry.flow ?? '?'}"\n`);
    if (entry.playwright_spec === undefined) {
      process.stderr.write(`  FAIL: missing playwright_spec\n`);
      failedAny = true;
      continue;
    }
    // Strip trailing :testname if present
    const specPath = entry.playwright_spec.replace(/:.*$/, '').trim();
    const fullPath = path.resolve(process.cwd(), specPath);
    if (!existsSync(fullPath)) {
      process.stderr.write(`  FAIL: playwright_spec file does not exist: ${specPath}\n`);
      failedAny = true;
    } else {
      process.stderr.write(`  OK: spec exists ${specPath}\n`);
    }
  }

  if (failedAny) {
    process.stderr.write(`[check-e2e-coverage] FAIL\n`);
    process.exit(1);
  }

  process.stderr.write(`[check-e2e-coverage] PASS (${entries.length} e2e_smoke entries verified)\n`);
  process.exit(0);
}

main();
