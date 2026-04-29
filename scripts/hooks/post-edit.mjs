#!/usr/bin/env node
/**
 * PostToolUse hook: after Edit/Write, warn on >300-line files and run ESLint on the touched file.
 *
 * Spec: docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md §3.7
 *
 * Hook is wired by `.claude/settings.json` (generated from agent-contract.md):
 *   { matcher: "Edit|Write", hooks: [{ type: "command", command: "node scripts/hooks/post-edit.mjs" }] }
 *
 * Stdin payload from Claude Code:
 *   { tool_input: { file_path: "<absolute path>" }, ... }
 */

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const SOFT_LIMIT = 300;
const SOURCE_EXT = /\.(ts|tsx|js|mjs|cjs|jsx|py|astro|svelte)$/;

function readStdinPayload() {
  try {
    const raw = readFileSync(0, 'utf8');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function softWarn(file) {
  try {
    const content = readFileSync(file, 'utf8');
    const lines = content.endsWith('\n')
      ? content.slice(0, -1).split('\n').length
      : content.split('\n').length;
    if (lines > SOFT_LIMIT) {
      console.error(`⚠ ${file}: ${lines} lines (soft warn at ${SOFT_LIMIT})`);
    }
  } catch {
    // file may have been deleted between Edit and hook firing — silently ignore
  }
}

function affectedLint(file) {
  // Pass the file path as an argv array (no shell), so paths with quotes /
  // dollar signs / backticks cannot break out and execute arbitrary commands.
  try {
    execFileSync('pnpm', ['exec', 'eslint', file, '--max-warnings=0'], {
      stdio: 'inherit',
    });
  } catch {
    // eslint exited non-zero; let its output speak for itself
  }
}

const payload = readStdinPayload();
const file = payload?.tool_input?.file_path;
if (!file || !SOURCE_EXT.test(file)) process.exit(0);

softWarn(file);
affectedLint(file);
