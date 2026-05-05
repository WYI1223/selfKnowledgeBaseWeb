/**
 * scripts/check-ui-touch.ts
 *
 * Detects whether a PR's diff touches user-facing UI surfaces per ADR-0011
 * D9.1 path patterns. Outputs `ui_touch: true|false` to stdout (one line) +
 * detailed pattern-match table to stderr (for human / CI log).
 *
 * UI-touch path patterns (ADR-0011 D9.1):
 *   - apps/site/src/pages/**
 *   - apps/site/src/components/**
 *   - apps/site/src/styles/**
 *   - packages/* /src/ui-default/**     (any block / editor sub-module visual layer)
 *   - packages/heavy-block-boundary/src/**
 *   - packages/editor-shell/src/**
 *   - packages/design-tokens/**
 *
 * Usage:
 *   tsx scripts/check-ui-touch.ts                     # diff vs origin/main
 *   tsx scripts/check-ui-touch.ts --base <ref>        # diff vs <ref>
 *   tsx scripts/check-ui-touch.ts --files file1 file2 # explicit file list
 *
 * Exit codes:
 *   0 — script ran successfully (regardless of ui_touch value)
 *   2 — git invocation failed / unreadable diff
 */

import { execSync } from 'node:child_process';

const UI_TOUCH_PATTERNS: ReadonlyArray<RegExp> = [
  /^apps\/site\/src\/pages\//,
  /^apps\/site\/src\/components\//,
  /^apps\/site\/src\/styles\//,
  /^packages\/[^/]+\/src\/ui-default\//,
  /^packages\/heavy-block-boundary\/src\//,
  /^packages\/editor-shell\/src\//,
  /^packages\/design-tokens\//,
];

interface CliArgs {
  base: string;
  explicitFiles: ReadonlyArray<string> | null;
}

function parseArgs(argv: ReadonlyArray<string>): CliArgs {
  let base = 'origin/main';
  let explicitFiles: string[] | null = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--base' && i + 1 < argv.length) {
      base = argv[++i];
    } else if (arg === '--files') {
      explicitFiles = argv.slice(i + 1);
      break;
    }
  }
  return { base, explicitFiles };
}

function getChangedFiles(base: string): ReadonlyArray<string> {
  try {
    const out = execSync(`git diff --name-only ${base}...HEAD`, {
      encoding: 'utf8',
    });
    return out
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  } catch (err) {
    process.stderr.write(`[check-ui-touch] git diff failed: ${(err as Error).message}\n`);
    process.exit(2);
  }
}

function classifyFile(file: string): RegExp | null {
  for (const pattern of UI_TOUCH_PATTERNS) {
    if (pattern.test(file)) return pattern;
  }
  return null;
}

function main(): void {
  const { base, explicitFiles } = parseArgs(process.argv.slice(2));
  const files = explicitFiles ?? getChangedFiles(base);

  const matches: { file: string; pattern: string }[] = [];
  for (const file of files) {
    const pattern = classifyFile(file);
    if (pattern !== null) {
      matches.push({ file, pattern: pattern.source });
    }
  }

  const uiTouch = matches.length > 0;

  // stderr: detailed match table for human / CI log
  process.stderr.write(`[check-ui-touch] base=${base}\n`);
  process.stderr.write(`[check-ui-touch] files scanned: ${files.length}\n`);
  process.stderr.write(`[check-ui-touch] UI-touch matches: ${matches.length}\n`);
  for (const m of matches) {
    process.stderr.write(`  ${m.file}  (matched: ${m.pattern})\n`);
  }
  process.stderr.write(`[check-ui-touch] verdict: ui_touch=${uiTouch}\n`);

  // stdout: machine-readable single line
  process.stdout.write(`ui_touch=${uiTouch}\n`);
}

main();
