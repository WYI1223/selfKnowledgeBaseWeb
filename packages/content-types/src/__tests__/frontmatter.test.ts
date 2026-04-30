import { describe, it, expect } from 'vitest';
import { frontmatterSchema } from '../frontmatter';

describe('frontmatterSchema', () => {
  it('accepts a minimal valid frontmatter', () => {
    const r = frontmatterSchema.safeParse({
      title: 'Hello',
      date: '2026-04-29',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.draft).toBe(false);
  });

  it('rejects missing title', () => {
    const r = frontmatterSchema.safeParse({ date: '2026-04-29' });
    expect(r.success).toBe(false);
  });

  it('coerces date string to Date', () => {
    const r = frontmatterSchema.safeParse({ title: 'X', date: '2026-04-29' });
    expect(r.success && r.data.date).toBeInstanceOf(Date);
  });
});
