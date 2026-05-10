import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(here, '../../../../..');
// Wave 6 cf-22 R1 F1 — `EditorShellMount.tsx` was split into outer
// (LiveAnnouncer provider) + inner (`EditorShellMountInner.tsx`).
// The lifecycle wiring (registerBlocks, ApiAdapter, save chain) now
// lives in the Inner. Concatenate both source files so structural
// assertions catch either location.
const editorMountSource = [
  readFileSync(
    resolve(workspaceRoot, 'apps/site/src/components/EditorShellMount.tsx'),
    'utf8',
  ),
  readFileSync(
    resolve(
      workspaceRoot,
      'apps/site/src/components/EditorShellMountInner.tsx',
    ),
    'utf8',
  ),
].join('\n\n// --- next file ---\n\n');
const registerBlocksSource = readFileSync(
  resolve(workspaceRoot, 'packages/editor-shell/src/registerBlocks.ts'),
  'utf8',
);

const registeredBlocks = [
  ['callout', 'calloutCore', 'calloutUiDefault'],
  ['componentCode', 'codeCore', 'codeUiDefault'],
  ['image', 'imageCore', 'imageUiDefault'],
  ['math', 'mathCore', 'mathUiDefault'],
  ['pdf', 'pdfCore', 'pdfUiDefault'],
  ['jupyter', 'jupyterCore', 'jupyterUiDefault'],
  ['nn-viz', 'nnVizCore', 'nnVizUiDefault'],
  ['agent-flow', 'agentFlowCore', 'agentFlowUiDefault'],
] as const;

test.describe('C.4-2 block registry route mount', () => {
  test('/notes/<slug>/edit mounts; block-kind rendering awaits C.4-3 insertion UI', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      document.documentElement?.removeAttribute('data-theme');
      try {
        window.localStorage.removeItem('skb-theme');
        window.localStorage.removeItem('skb-note:sample-blocks');
      } catch {
        // Storage can be unavailable in hardened browser contexts.
      }
    });

    await page.goto('/notes/sample-blocks/edit');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('.ProseMirror').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.skb-grid').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.ProseMirror').first()).toHaveAttribute(
      'contenteditable',
      'true',
    );

    expect(editorMountSource).toContain('registerBlocks(registry)');
    expect(editorMountSource).toContain('new LocalStorageAdapter(slug)');
    expect(editorMountSource).toContain('versionRef.current += 1');
    expect(editorMountSource).toContain('}, 800)');

    for (const [, core, ui] of registeredBlocks) {
      expect(registerBlocksSource).toContain(`registry.registerCore(${core})`);
      expect(registerBlocksSource).toContain(`registry.registerUI(${ui}`);
    }

    const archivePath = resolve(
      workspaceRoot,
      'docs/audits/screenshots/wave-5-c4-2-block-registry.png',
    );
    if (!existsSync(dirname(archivePath))) {
      mkdirSync(dirname(archivePath), { recursive: true });
    }
    await page.screenshot({ path: archivePath, fullPage: false });
    expect(statSync(archivePath).size).toBeGreaterThanOrEqual(5_000);
  });
});
