// @vitest-environment node
// Per-file env override: pure Node unit test for the Intl.Segmenter-backed
// word-level matcher. Node 18+ ships Intl.Segmenter natively; happy-dom
// (apps/site default) is unnecessary for this corpus.
//
// SCOPE NOTE (Wave 4 Stage B B1a; ADR-0012 v0.1.1): this corpus locks the
// runtime word-level discriminator that Wave 3 D3 found PageFind itself
// does NOT enforce (PageFind 1.5+ indexes via Intl.Segmenter at index time
// but applies partial-substring matching at query time). The pure
// utility ships without SearchBox integration; B1b consumes this matcher
// inside a PagefindUI processResult callback to hide substring-only
// false positives. Plan-challenger C3 NOT-ABSORBED verdict expanded the
// fixture set beyond pure CJK to mixed CJK+ASCII / pure ASCII /
// punctuation / edge / case-insensitivity / explicit-locale rows.
import { describe, expect, it } from 'vitest';

import { isWordLevelMatch } from '../lib/word-level-match';

describe('isWordLevelMatch (ADR-0012 v0.1.1 word-level discriminator)', () => {
  it('matches segment 笔记 in 中文笔记测试 (CJK positive)', () => {
    expect(isWordLevelMatch('笔记', '中文笔记测试')).toBe(true);
  });

  it('rejects substring 记本 within 笔记本 segment (CJK inverse, ADR-0012 criterion 4 paired discriminator)', () => {
    expect(isWordLevelMatch('记本', '笔记本电脑')).toBe(false);
  });

  it('matches word callout in a callout block (ASCII positive)', () => {
    expect(isWordLevelMatch('callout', 'a callout block')).toBe(true);
  });

  it('rejects substring all within callout (ASCII inverse)', () => {
    expect(isWordLevelMatch('all', 'callout')).toBe(false);
  });

  it('matches CJK 笔记 in mixed Today: 笔记 entry', () => {
    expect(isWordLevelMatch('笔记', 'Today: 笔记 entry')).toBe(true);
  });

  it('matches ASCII callout in mixed 一个 callout block', () => {
    expect(isWordLevelMatch('callout', '一个 callout block')).toBe(true);
  });

  it('matches CJK 笔记 separated by 。 punctuation (今天写了笔记。)', () => {
    expect(isWordLevelMatch('笔记', '今天写了笔记。')).toBe(true);
  });

  it('matches ASCII test in unit-test (hyphen segment boundary)', () => {
    expect(isWordLevelMatch('test', 'unit-test')).toBe(true);
  });

  it('rejects empty query', () => {
    expect(isWordLevelMatch('', 'foo')).toBe(false);
  });

  it('rejects empty content', () => {
    expect(isWordLevelMatch('foo', '')).toBe(false);
  });

  it('matches case-insensitively for ASCII (Callout vs callout)', () => {
    expect(isWordLevelMatch('Callout', 'callout block')).toBe(true);
  });

  it('honors explicit zh-Hans locale (笔记 in 笔记)', () => {
    expect(isWordLevelMatch('笔记', '笔记', 'zh-Hans')).toBe(true);
  });
});
