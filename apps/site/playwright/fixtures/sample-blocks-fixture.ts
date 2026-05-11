import { execSync } from 'node:child_process';
import { existsSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Wave 6 cf-22 follow-up (2026-05-10) — single source of truth for the
 * sample-blocks fixture restore protocol used by every spec that mutates
 * `content/notes/sample-blocks/index.mdx` via the editor's `ApiAdapter.save`
 * write chain.
 *
 * # Why this file exists
 *
 * Pre-cf-22-followup the 4 mutating specs (kebab-menu, drag-handle,
 * resize-handles, keyboard-a11y) each duplicated an identical
 * `restoreSampleBlocksFixture()` body inline. Identical-by-eyeball is not
 * identical-by-CI: PR #116 visual-smoke runs surfaced 1 hard FAIL + 3
 * FLAKY-on-retry, all 4 of the form "first callout grid-column got
 * polluted bytes after page-goto". The pollution is deterministic in
 * `--workers=1` sequential mode — the bug is real, not flaky.
 *
 * Root cause is **not** asymmetric restore code; ALL 4 specs had the same
 * snapshot-MDX + restore-or-delete-state.json pattern. The actual leak is
 * the editor's debounced autosave at `EditorShellMountInner.tsx:370`
 * (`setTimeout(..., 800)`): a test mutates → handleChange schedules an
 * 800 ms save → the test asserts → the test calls restore → the 800 ms
 * timer **fires after** the restore, the in-flight `ApiAdapter.save`
 * POSTs the polluted MDX back to disk, and the next test's page-goto
 * loads the polluted state.
 *
 * # The fix
 *
 * 1. Single helper consumed by all 4 specs (this file). Future drift
 *    fails at compile time, not in CI.
 * 2. Per-spec `beforeEach(restoreSampleBlocksFixture)` so a leak from
 *    test N (or its still-pending debounce) gets cleaned before
 *    test N+1's page-goto.
 * 3. `settleAutosave()` (waits >800 ms) called by mutating tests after
 *    their last edit so the debounced save fires + completes BEFORE the
 *    test calls restore.
 * 4. Post-restore verification via `existsSync` + `readFileSync` —
 *    fail loudly if the cleanup didn't take (e.g., a still-in-flight
 *    POST raced past us).
 *
 * # Operational rule (rule #26 in retrospective doc)
 *
 * "pre-existing flake" is NOT a valid CI-deferral framing. If a test is
 * blocking CI, the root-cause fix is mandatory; the framing itself is
 * the lie. See
 * `docs/orchestrator-reflections/2026-05-09-cf-15a-19-retrospective.md`.
 */

export const SAMPLE_BLOCKS_MDX_PATH = resolve(
  process.cwd(),
  '../../content/notes/sample-blocks/index.mdx',
);

export const SAMPLE_BLOCKS_STATE_PATH = resolve(
  process.cwd(),
  '../../content/notes/sample-blocks/state.json',
);

/**
 * Snapshot module-scoped for the calling spec file.
 * Populated by `snapshotSampleBlocksFixture()` in `test.beforeAll`.
 */
let originalMdxBytes: string | null = null;
let originalStateBytes: string | null = null;
let snapshotted = false;

/**
 * Snapshot the GIT-TRACKED canonical fixture bytes (NOT on-disk). Call
 * from `test.beforeAll` in each spec file. Idempotent within a process.
 *
 * # cf-24 R2 hardening (2026-05-10) — git-baseline snapshot
 *
 * Pre-cf-24-R2 this read `readFileSync(SAMPLE_BLOCKS_MDX_PATH)` —
 * which means a previous run's debounced-autosave leak that raced past
 * `afterAll(restoreSampleBlocksFixture)` would corrupt the on-disk
 * file BETWEEN test processes; the next process's `beforeAll` would
 * snapshot the corrupted bytes as the "canonical" baseline + restore
 * to corruption + tests fail with confusing
 * `calloutCountBefore` mismatches.
 *
 * The cf-24 R2 fix root-causes this: the canonical fixture state is
 * what's COMMITTED to the repo (`git show HEAD:<path>`), not what
 * happens to be on disk at process-start. A leak from a previous
 * process can no longer corrupt the snapshot.
 *
 * `state.json` is NOT git-tracked (in .gitignore). The canonical
 * baseline is "no state.json"; we never include it in the snapshot
 * regardless of disk state. Restore always deletes any existing
 * state.json (post-fix `originalStateBytes` is permanently null).
 *
 * # cf-24 R3 F7 hardening (2026-05-10) — NO disk fallback
 *
 * If `git show HEAD:<path>` fails, the suite is non-deterministic —
 * we have no trustworthy baseline. The pre-R3 fallback (silent
 * `readFileSync` of polluted disk bytes + console.warn) was the
 * EXACT failure mode R2 was supposed to eliminate; a transient git
 * issue would silently revert to disk-read, the leak would return,
 * and only a downstream confusing Playwright assertion mismatch
 * would surface — long after the actual root cause.
 *
 * R3 contract: snapshot MUST come from git HEAD. If git is
 * unavailable (shallow clone without history, missing .git, perm
 * error, ENOMEM, etc.) the helper THROWS with explicit context so
 * the operator investigates the environment before continuing. CI
 * runs surface the failure immediately rather than masquerading as
 * a fixture pollution flake.
 */
export function snapshotSampleBlocksFixture(): void {
  if (snapshotted) return;
  const gitPath = 'content/notes/sample-blocks/index.mdx';
  const repoRoot = resolve(process.cwd(), '../..');
  try {
    originalMdxBytes = execSync(`git show HEAD:${gitPath}`, {
      cwd: repoRoot,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 4, // 4MB headroom
    });
  } catch (err) {
    // cf-24 R3 F7: NO fallback. A failed git read means we cannot
    // guarantee a pollution-free baseline; silently using on-disk
    // bytes (the pre-R3 behavior) reintroduces the cross-process
    // leak the R2 fix was designed to eliminate. Throw loudly so
    // CI fails at the source instead of producing a downstream
    // assertion mismatch the operator has to reverse-engineer.
    throw new Error(
      `[sample-blocks-fixture] cf-24 R3 F7: git show HEAD:${gitPath} failed ` +
        `(${err instanceof Error ? err.message : 'unknown'}). ` +
        `The suite REQUIRES a git-tracked baseline to defend against ` +
        `cross-process autosave leaks; disk-read fallback was removed ` +
        `because it silently reintroduced the R2 leak. Investigate the ` +
        `environment: missing .git directory? shallow clone without ` +
        `history? CI sandbox without git binary? Restore git access ` +
        `or run the suite from a full clone.`,
    );
  }
  // state.json is NEVER part of the canonical baseline (it's
  // .gitignore'd; the read route serves directly from the MDX file
  // when state.json is absent). Always restore to "no state.json".
  originalStateBytes = null;
  snapshotted = true;
}

/**
 * Restore the fixture to the snapshotted bytes. Writes MDX + restores or
 * deletes state.json so the GET endpoint serves a pristine document on
 * the next page-goto. Verifies via existsSync + byte-compare and throws
 * if the cleanup didn't take.
 *
 * Call from `test.beforeEach` AND `test.afterAll` in every mutating spec.
 * Mutating tests can also call it explicitly mid-test (e.g., before a
 * 2nd page-goto in the same test body).
 */
export function restoreSampleBlocksFixture(): void {
  if (!snapshotted) {
    throw new Error(
      '[sample-blocks-fixture] restoreSampleBlocksFixture() called before snapshotSampleBlocksFixture(); ' +
        'add `test.beforeAll(snapshotSampleBlocksFixture)` to your spec file.',
    );
  }
  if (originalMdxBytes !== null) {
    writeFileSync(SAMPLE_BLOCKS_MDX_PATH, originalMdxBytes, 'utf8');
  }
  if (originalStateBytes !== null) {
    writeFileSync(SAMPLE_BLOCKS_STATE_PATH, originalStateBytes, 'utf8');
  } else if (existsSync(SAMPLE_BLOCKS_STATE_PATH)) {
    unlinkSync(SAMPLE_BLOCKS_STATE_PATH);
  }

  // Post-restore verification: fail loudly if the disk doesn't reflect
  // what we just wrote (e.g., an in-flight POST from a prior test's
  // pending debounce raced past us). The 4 PR #116 CI failures all
  // surfaced as "first callout grid-column got polluted bytes" —
  // catching the leak HERE turns a confusing downstream Playwright
  // expect-mismatch into a clear "fixture restore failed" error at
  // the source.
  const mdxOnDisk = readFileSync(SAMPLE_BLOCKS_MDX_PATH, 'utf8');
  if (mdxOnDisk !== originalMdxBytes) {
    throw new Error(
      `[sample-blocks-fixture] MDX restore did not take. on-disk bytes ` +
        `(${mdxOnDisk.length}) !== snapshot bytes (${originalMdxBytes?.length ?? 0}). ` +
        'A previous test\'s debounced autosave likely raced past restoreSampleBlocksFixture(); ' +
        'call settleAutosave() before restore.',
    );
  }
  if (originalStateBytes === null && existsSync(SAMPLE_BLOCKS_STATE_PATH)) {
    throw new Error(
      '[sample-blocks-fixture] state.json deletion did not take. ' +
        'A previous test\'s debounced autosave POST raced past restore.',
    );
  }
  if (originalStateBytes !== null) {
    const stateOnDisk = readFileSync(SAMPLE_BLOCKS_STATE_PATH, 'utf8');
    if (stateOnDisk !== originalStateBytes) {
      throw new Error(
        `[sample-blocks-fixture] state.json restore did not take. on-disk bytes ` +
          `(${stateOnDisk.length}) !== snapshot bytes (${originalStateBytes.length}).`,
      );
    }
  }
}

/**
 * Wait long enough for any pending `EditorShellMountInner.handleChange`
 * debounce timer (800 ms) PLUS the in-flight `ApiAdapter.save` fetch +
 * the 250 ms `saveSettleTimerRef` to flush to disk.
 *
 * Call from a mutating test BEFORE its trailing restoreSampleBlocksFixture()
 * so the autosave POST lands on disk INSIDE the test's window — then
 * restore overwrites it cleanly. Without this, the autosave races past
 * restore and the next test's page-goto loads polluted state.
 *
 * Budget breakdown:
 *   - 800 ms editor debounce (handleChange setTimeout)
 *   - ~50-200 ms fetch + endpoint write (local Astro dev server)
 *   - 250 ms saveSettleTimerRef
 *   - 200 ms safety headroom
 *   = 1500 ms total
 *
 * If `EditorShellMountInner` ever increases the debounce window, bump
 * this value. Spec files don't need to know the math.
 */
export const AUTOSAVE_SETTLE_MS = 1500;

/**
 * cf-24 R2 hardening (2026-05-10) — DETERMINISTIC autosave wait
 * (preferred over blind `page.waitForTimeout(AUTOSAVE_SETTLE_MS)`).
 *
 * Pattern:
 *   const t0 = sampleBlocksMdxMtimeMs();
 *   // ... do the editing action that triggers debounced save ...
 *   await waitForAutosaveLanded(page, t0);
 *
 * Captures the BASELINE mtime BEFORE the mutating action, then
 * polls AFTER the action until mtime advances past the baseline
 * (proving the autosave POST landed on disk) OR a hard timeout.
 * This eliminates two races the blind `waitForTimeout` did NOT
 * cover:
 *   (a) Slow CI runner: WSL2 dev-server may take 1.6-2.5 s to
 *       flush; blind 1500 ms wait races past + leaves an in-flight
 *       POST that lands AFTER cleanup → pollution leaks across
 *       processes (root cause of cf-24 R2 finding).
 *   (b) Hooked-restore vs in-flight-POST: per-test `afterEach
 *       (restoreSampleBlocksFixture)` writes clean bytes, but if
 *       the autosave POST is mid-flight when restore writes, the
 *       POST overwrites clean bytes after.
 *
 * Polling is hard-capped at `timeoutMs` (default 5 s = 3.3× the
 * pre-R2 blind 1500 ms wait — generous headroom for WSL2 slow CI).
 * If the timeout elapses without mtime advance the helper THROWS,
 * surfacing the latent bug ("autosave never landed") at the
 * source instead of letting a downstream restore-leak masquerade
 * as flake.
 */
export async function waitForAutosaveLanded(
  page: import('@playwright/test').Page,
  baselineMtimeMs: number,
  timeoutMs = 5_000,
): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (sampleBlocksMdxMtimeMs() > baselineMtimeMs) return;
    await page.waitForTimeout(100);
  }
  throw new Error(
    `[sample-blocks-fixture] waitForAutosaveLanded timed out after ` +
      `${timeoutMs} ms — MDX mtime did NOT advance from baseline ` +
      `${baselineMtimeMs} (current ${sampleBlocksMdxMtimeMs()}). ` +
      `The mutating test did not produce an on-disk write within the ` +
      `budget; check that the editor onChange + ApiAdapter.save POST ` +
      `actually fired. If the test legitimately doesn't mutate, use ` +
      `page.waitForTimeout(AUTOSAVE_SETTLE_MS) instead.`,
  );
}

/**
 * Returns the on-disk mtime of the MDX fixture, or 0 if the file is
 * missing. Useful for assertions that an autosave actually fired
 * during a test (mtime advanced) vs assertions that it did NOT
 * (mtime equal to a captured baseline).
 */
export function sampleBlocksMdxMtimeMs(): number {
  try {
    return statSync(SAMPLE_BLOCKS_MDX_PATH).mtimeMs;
  } catch {
    return 0;
  }
}

/**
 * Returns the snapshotted MDX bytes (whatever was on disk at
 * `snapshotSampleBlocksFixture()` time). Used by per-spec
 * mutating-fixture installers (e.g., `installColSpan6Fixture`,
 * `installPersistedOverflowFixture`) that need to derive a variant
 * MDX body from the pristine baseline.
 *
 * Throws if called before `snapshotSampleBlocksFixture()`.
 */
export function getSampleBlocksOriginalMdxBytes(): string {
  if (originalMdxBytes === null) {
    throw new Error(
      '[sample-blocks-fixture] getSampleBlocksOriginalMdxBytes() called before ' +
        'snapshotSampleBlocksFixture(); add `test.beforeAll(snapshotSampleBlocksFixture)`.',
    );
  }
  return originalMdxBytes;
}
