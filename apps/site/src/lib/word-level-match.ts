/**
 * Tests whether `query` appears as a COMPLETE word-level segment within
 * `content` according to `Intl.Segmenter` with `granularity: 'word'`.
 *
 * Designed for the apps/site search pipeline (ADR-0012 v0.1.1 amendment)
 * to discriminate true word-level matches from PageFind 1.5+'s native
 * runtime partial-substring fallback. PageFind correctly segments at
 * INDEX time via Intl.Segmenter but its query parser still applies
 * partial-substring matching against indexed tokens — `记本` matches the
 * `笔记本` segment as a substring and surfaces the laptop fragment. This
 * predicate restores the word-level discriminator app-side.
 *
 * Behavior:
 * - CJK (Han codepoints): `zh-Hans` segmenter splits dictionary-driven
 *   word-level tokens (e.g., `笔记本电脑` → `['笔记本', '电脑']`).
 *   Substring queries like `记本` are rejected because they are not a
 *   complete segment.
 * - ASCII: `en` segmenter splits at whitespace + punctuation boundaries
 *   per UAX #29. Hyphen-joined ASCII words (`unit-test`) are
 *   post-processed by splitting on `[-_/]` so that intra-compound
 *   queries (`test` → `unit-test`) match — this matches typical search
 *   UX expectations.
 * - Mixed CJK+ASCII content: locale is auto-detected from CONTENT
 *   (CJK present → also try `zh-Hans`; ASCII letters present → also
 *   try `en`); the matcher unions across detected locales.
 * - Explicit `locale` param overrides auto-detection (single-locale
 *   path; useful for per-note frontmatter language hints).
 * - ASCII case-insensitive comparison (`Callout` matches `callout`);
 *   CJK has no case concept so the `toLowerCase()` is a no-op there.
 *
 * Returns `false` for empty `query` or empty `content`.
 *
 * Plan-challenger 2026-05-03 B1 verdict C3 (NOT ABSORBED) drove the
 * locale-aware policy + mixed-content fixture corpus:
 * `docs/audits/codex-runs/2026-05-03-B1-plan-challenge.txt`.
 *
 * Wave 3 Stage D D3 incident memory `feedback_pagefind_query_substring.md`
 * (orchestrator-local at `~/.claude/projects/-home-weiyi-selfKnowledgeBaseWeb/memory/`)
 * is the original CI surfacing of the runtime substring fallback this
 * predicate restores app-side.
 *
 * @see docs/decisions/ADR-0012-search-index-stack.md `## Amendments § v0.1.1`
 */
export function isWordLevelMatch(
  query: string,
  content: string,
  locale?: string,
): boolean {
  if (query === '' || content === '') return false;

  const locales = locale ? [locale] : detectLocales(content);
  const needle = query.toLowerCase();

  for (const loc of locales) {
    const segmenter = new Intl.Segmenter(loc, { granularity: 'word' });
    for (const { segment } of segmenter.segment(content)) {
      if (segmentMatches(segment, needle)) return true;
    }
  }
  return false;
}

const HAN_RE = /\p{Script=Han}/u;
const ASCII_LETTER_RE = /[A-Za-z]/;
const ASCII_COMPOUND_SPLIT_RE = /[-_/]/;

function detectLocales(content: string): readonly string[] {
  const hasHan = HAN_RE.test(content);
  const hasAscii = ASCII_LETTER_RE.test(content);
  if (hasHan && hasAscii) return ['zh-Hans', 'en'];
  if (hasHan) return ['zh-Hans'];
  return ['en'];
}

function segmentMatches(segment: string, needle: string): boolean {
  if (segment.toLowerCase() === needle) return true;
  if (ASCII_COMPOUND_SPLIT_RE.test(segment)) {
    for (const sub of segment.split(ASCII_COMPOUND_SPLIT_RE)) {
      if (sub.toLowerCase() === needle) return true;
    }
  }
  return false;
}
