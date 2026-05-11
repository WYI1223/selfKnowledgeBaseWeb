/**
 * Wave 6 cf-25 R1 F1 — install the mixed-grid demo (Markdown
 * col={1} colSpan={6} + Image col={7} colSpan={6}) into the
 * snapshotted sample-blocks MDX.
 *
 * The cf-25 demo lives in `content/notes/sample-blocks/index.mdx`
 * (committed to the repo by orchestrator stage 5). When tests run
 * via the cf-22 R3 fixture-leak protocol, `snapshotSampleBlocksFixture`
 * captures `git show HEAD:<path>`. If HEAD doesn't yet have the demo
 * (e.g., during the same R1 cycle that introduces it OR during
 * pre-orchestrator-commit dev), the snapshot baseline lacks the demo
 * and any cf-25 spec case asserting the demo's grid placement fails
 * with "expected '1 / span 6', received '1 / span 12'".
 *
 * This helper sidesteps the chicken-and-egg by deriving the demo'd
 * MDX from the snapshotted bytes at test-runtime (idempotent if
 * already present), writing to disk, then letting the standard
 * `restoreSampleBlocksFixture` afterEach hook clean up.
 *
 * Pattern mirrors `helpers/resize-pointer-events.ts:installPersistedOverflowFixture`
 * (cf-20d D10 R3 amendment).
 */
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';

const CF_25_DEMO_TAIL = [
  '',
  '## Markdown wrapper-block (cf-25 mixed-grid demo)',
  '',
  'Wave 6 cf-25 promotes prose chunks to first-class grid blocks via the',
  '`<Markdown>` wrapper. The two blocks below pair a markdown chunk at',
  '`col={1} colSpan={6}` with an image at `col={7} colSpan={6}` — proof',
  'that the 12-col grid is the LEGO baseboard carrying any mix of block',
  'kinds at any placement.',
  '',
  '{/* fixture-cf-25: side-by-side markdown wrapper + image */}',
  '<Markdown col={1} colSpan={6}>',
  '  ### Side-by-side text',
  '',
  '  This markdown block lives at columns 1-6 of the same grid row as',
  '  the image to the right. Resize either block via the cf-20d resize',
  '  handles to verify the LEGO mental model in action.',
  '</Markdown>',
  '',
  '<Image',
  '  col={7}',
  '  colSpan={6}',
  '  rowSpan={1}',
  '  src="/sample-assets/diagram-small.png"',
  '  alt="Side-by-side image paired with the markdown block at columns 7-12"',
  '/>',
  '',
].join('\n');

/**
 * Install the cf-25 mixed-grid demo into sample-blocks/index.mdx.
 *
 * Idempotent: if the source already contains the cf-25 demo marker
 * (`fixture-cf-25:`), the install is a no-op (the snapshot already
 * has the demo because orchestrator committed F1 in the same PR).
 *
 * Cleanup: pair with `restoreSampleBlocksFixture()` in afterEach to
 * roll back. Per the cf-22 R3 protocol, also call the standard
 * `waitForAutosaveLanded` if the test triggers any editor mutation.
 */
export function installCf25MixedGridFixture(
  originalMdxBytes: string,
  mdxPath: string,
  statePath: string,
): void {
  const snapshotHasDemo = originalMdxBytes.includes('fixture-cf-25:');
  // Fast path A: the snapshotted bytes already contain the demo
  // (orchestrator stage 5 commit landed F1 → GIT HEAD has it). The
  // standard restoreSampleBlocksFixture afterEach hook will already
  // be writing demo'd bytes to disk — nothing to do here.
  if (snapshotHasDemo) return;
  // Fast path B: pre-orchestrator-commit but the on-disk file ALREADY
  // contains the demo (a previous test's install in this run, OR the
  // working-tree mod by ux-ui-lead). Skip the redundant write to
  // avoid triggering the dev server's content-watcher / HMR cycle.
  // This eliminates the cross-test flake observed at cf-25 R2 F6
  // sweep where back-to-back installs cascaded into the cf-20e /
  // cf-24 specs that ran AFTER the cf-25 suite.
  if (existsSync(mdxPath)) {
    const onDisk = readFileSync(mdxPath, 'utf8');
    if (onDisk.includes('fixture-cf-25:')) return;
  }
  // Slow path: derive demo'd MDX + write. Subsequent tests in the
  // same run that don't expect the demo rely on the cf-22 R3 fixture
  // restore (afterEach) to roll back HEAD bytes; future
  // installCf25Demo calls in this run hit Fast path B above.
  writeFileSync(mdxPath, `${originalMdxBytes}${CF_25_DEMO_TAIL}`, 'utf8');
  // Clear any state.json sidecar so the dev server's ApiAdapter
  // loads the new MDX from disk on next page-goto (state.json would
  // otherwise mask the disk update).
  if (existsSync(statePath)) {
    unlinkSync(statePath);
  }
}
