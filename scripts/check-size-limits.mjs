#!/usr/bin/env node
/**
 * 文件大小硬上限检查
 * - 300 行 soft warn (ESLint 已处理 .ts/.tsx)
 * - 500 行 hard fail (本脚本，覆盖所有源文件)
 *
 * Spec: docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md §3.6
 */

import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const HARD_LIMIT = 500;
const EXTENSIONS = /\.(ts|tsx|js|mjs|jsx|py|astro|svelte)$/;

const trackedFiles = execSync('git ls-files --cached --others --exclude-standard', {
  encoding: 'utf8',
})
  .split('\n')
  .filter((f) => f && EXTENSIONS.test(f));

let violations = 0;
for (const file of trackedFiles) {
  const content = readFileSync(file, 'utf8');
  const lines = content.endsWith('\n')
    ? content.slice(0, -1).split('\n').length
    : content.split('\n').length;
  if (lines > HARD_LIMIT) {
    console.error(`✗ ${file}: ${lines} lines (limit ${HARD_LIMIT})`);
    violations++;
  }
}

if (violations > 0) {
  console.error(`\n${violations} file(s) exceed the ${HARD_LIMIT}-line hard limit.`);
  process.exit(1);
}
console.log(`✓ All ${trackedFiles.length} source files under ${HARD_LIMIT} lines.`);
