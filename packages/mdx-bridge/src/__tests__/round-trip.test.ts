import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mdxToTiptap, tiptapToMdx } from '../index';
import type { TiptapDoc } from '../parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_DIR = join(__dirname, 'fixtures');

const FIXTURES = readdirSync(FIXTURES_DIR)
  .filter((f) => f.endsWith('.mdx'))
  .sort();

/**
 * Recursively drop every `_mdast` field; simulates an editor-built doc that
 * never went through parse(). This is the path `mdx-doctor` exercises in
 * Wave 2+ for programmatically constructed blocks (e.g. via Track F's
 * agent-tools `insert_block` / `edit_block`).
 */
function stripMdast(doc: TiptapDoc): TiptapDoc {
  return JSON.parse(
    JSON.stringify(doc, (key, value: unknown) => (key === '_mdast' ? undefined : value)),
  ) as TiptapDoc;
}

describe('MDX <-> Tiptap round-trip', () => {
  for (const file of FIXTURES) {
    it(`round-trips ${file} byte-equivalently`, () => {
      const original = readFileSync(join(FIXTURES_DIR, file), 'utf8');
      const doc = mdxToTiptap(original);
      const restored = tiptapToMdx(doc);
      expect(restored.trim()).toBe(original.trim());
    });
  }

  for (const file of FIXTURES) {
    it(`round-trips ${file} byte-equivalently with _mdast stripped`, () => {
      const original = readFileSync(join(FIXTURES_DIR, file), 'utf8');
      const doc = stripMdast(mdxToTiptap(original));
      const restored = tiptapToMdx(doc);
      expect(restored.trim()).toBe(original.trim());
    });
  }

  it('finds at least 9 fixtures', () => {
    expect(FIXTURES.length).toBeGreaterThanOrEqual(9);
  });
});

/**
 * Regression tests for the link-title comparator (pr-gate R2 BLOCKER).
 *
 * Before the fix, `marksEqual` compared link marks by `href` only — so two
 * adjacent links sharing an href but carrying different titles were grouped
 * into a single run, the second title was silently dropped, and the leaves
 * merged (`[ab](url "A")` instead of `[a](url "A")[b](url "B")`).
 *
 * Each test exercises the canonical reconstruction path (no `_mdast`) so the
 * grouper logic is forced to run.
 */
describe('marksEqual link comparator', () => {
  function canonicalRTT(body: string): string {
    const source = `---\nt: x\n---\n\n${body}\n`;
    const doc = JSON.parse(
      JSON.stringify(mdxToTiptap(source), (k, v: unknown) => (k === '_mdast' ? undefined : v)),
    ) as TiptapDoc;
    return tiptapToMdx(doc);
  }

  it('adjacent same-href different-title links round-trip distinctly', () => {
    const out = canonicalRTT('[a](https://e.test "A")[b](https://e.test "B")');
    expect(out).toContain('[a](https://e.test "A")');
    expect(out).toContain('[b](https://e.test "B")');
  });

  it('adjacent same-href same-title links merge under the shared mark (documented over-bridge)', () => {
    // Both leaves carry an identical link mark; the grouper correctly merges
    // them under one wrapper. The reconstructed canonical form is therefore
    // `[ab](url "Same")`, not `[a](url "Same")[b](url "Same")` — the same
    // adjacent-same-mark canonicalization documented in CONTRACT.md for
    // `**a****b**` → `**ab**`. This is desired behavior, not a regression.
    const out = canonicalRTT('[a](https://e.test "Same")[b](https://e.test "Same")');
    expect(out).toContain('[ab](https://e.test "Same")');
  });

  it('adjacent same-href title-vs-no-title preserves both shapes', () => {
    const out = canonicalRTT('[a](https://e.test "A")[b](https://e.test)');
    expect(out).toContain('[a](https://e.test "A")');
    expect(out).toContain('[b](https://e.test)');
  });
});

/**
 * Regression tests for the fail-loud contract: every default branch in
 * parse.ts and serialize.ts MUST throw when it encounters an unknown type.
 * Silent fallbacks (returning empty text or dropping siblings) caused two
 * production-class bugs in earlier review rounds.
 */
describe('fail-loud contract', () => {
  it('throws on unknown mark type during serialization', () => {
    const doc: TiptapDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'first', marks: [{ type: 'strikethrough' }] },
            { type: 'text', text: ' second', marks: [{ type: 'strikethrough' }] },
          ],
        },
      ],
    };
    expect(() => tiptapToMdx(doc)).toThrowError(/unsupported mark type "strikethrough"/);
  });

  it('throws on unknown block type during serialization', () => {
    const doc: TiptapDoc = {
      type: 'doc',
      content: [{ type: 'unknownBlockType', content: [] }],
    };
    expect(() => tiptapToMdx(doc)).toThrowError(/unsupported block type "unknownBlockType"/);
  });

  it('throws on unknown inline type during parsing', () => {
    // mdast `image` is a phrasing node; Wave 1 declines to support it. Parse
    // must throw so callers can't accidentally introduce silently-dropped
    // content. (Wave 2 will add image support as a fixture + parse/serialize
    // case.)
    const source = '---\nt: x\n---\n\n![alt](img.png)\n';
    expect(() => mdxToTiptap(source)).toThrowError(/unsupported inline type "image"/);
  });

  it('throws on unknown inline type during serialization (no _mdast)', () => {
    const doc: TiptapDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'mysteryInline' }],
        },
      ],
    };
    expect(() => tiptapToMdx(doc)).toThrowError(/unsupported inline type "mysteryInline"/);
  });
});
