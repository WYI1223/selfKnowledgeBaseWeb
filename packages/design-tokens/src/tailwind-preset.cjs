/**
 * @skb/design-tokens Tailwind preset (Tailwind 3.x).
 *
 * Single source of truth for color / spacing / typography / radius / shadow /
 * motion across apps/site and every block ui-default. Consumers MUST import
 * this preset rather than hand-rolling theme values (ADR-0003).
 *
 * Color channel pattern: `rgb(var(--color-xxx) / <alpha-value>)` keeps full
 * Tailwind opacity-modifier support intact.
 *
 * Bundled plugins:
 *  - @tailwindcss/typography: provides the `prose` utility class for MDX/markdown
 *    content rendering. Theme bindings below derive prose colors from our CSS
 *    vars so prose styling auto-tracks light/dark theme switches.
 */
const typography = require('@tailwindcss/typography');

/** @type {import('tailwindcss').Config} */
module.exports = {
  plugins: [typography],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      bg: 'rgb(var(--color-bg) / <alpha-value>)',
      fg: 'rgb(var(--color-fg) / <alpha-value>)',
      'surface-1': 'rgb(var(--color-surface-1) / <alpha-value>)',
      'surface-2': 'rgb(var(--color-surface-2) / <alpha-value>)',
      border: 'rgb(var(--color-border) / <alpha-value>)',
      muted: 'rgb(var(--color-muted) / <alpha-value>)',
      accent: 'rgb(var(--color-accent) / <alpha-value>)',
      'accent-fg': 'rgb(var(--color-accent-fg) / <alpha-value>)',
      info: 'rgb(var(--color-info) / <alpha-value>)',
      warn: 'rgb(var(--color-warn) / <alpha-value>)',
      note: 'rgb(var(--color-note) / <alpha-value>)',
      success: 'rgb(var(--color-success) / <alpha-value>)',
      error: 'rgb(var(--color-error) / <alpha-value>)',
    },
    spacing: {
      0: '0',
      1: 'var(--space-1)',
      2: 'var(--space-2)',
      3: 'var(--space-3)',
      4: 'var(--space-4)',
      6: 'var(--space-6)',
      8: 'var(--space-8)',
      12: 'var(--space-12)',
      px: '1px',
      auto: 'auto',
      full: '100%',
    },
    fontFamily: {
      sans: 'var(--font-sans)',
      mono: 'var(--font-mono)',
    },
    fontSize: {
      base: ['var(--text-base)', { lineHeight: 'var(--leading-base)' }],
    },
    borderRadius: {
      none: '0',
      sm: 'var(--radius-sm)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
      full: '9999px',
    },
    boxShadow: {
      none: 'none',
      sm: 'var(--shadow-sm)',
      md: 'var(--shadow-md)',
      lg: 'var(--shadow-lg)',
    },
    transitionDuration: {
      fast: 'var(--duration-fast)',
      base: 'var(--duration-base)',
    },
    transitionTimingFunction: {
      base: 'var(--ease-base)',
    },
    extend: {
      // typography plugin hook: bind prose colors to our design-token CSS vars
      // so light/dark theme switching applies to MDX prose content as well.
      typography: () => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': 'rgb(var(--color-fg))',
            '--tw-prose-headings': 'rgb(var(--color-fg))',
            '--tw-prose-lead': 'rgb(var(--color-muted))',
            '--tw-prose-links': 'rgb(var(--color-accent))',
            '--tw-prose-bold': 'rgb(var(--color-fg))',
            '--tw-prose-counters': 'rgb(var(--color-muted))',
            '--tw-prose-bullets': 'rgb(var(--color-muted))',
            '--tw-prose-hr': 'rgb(var(--color-border))',
            '--tw-prose-quotes': 'rgb(var(--color-fg))',
            '--tw-prose-quote-borders': 'rgb(var(--color-border))',
            '--tw-prose-captions': 'rgb(var(--color-muted))',
            '--tw-prose-code': 'rgb(var(--color-fg))',
            '--tw-prose-pre-code': 'rgb(var(--color-fg))',
            '--tw-prose-pre-bg': 'rgb(var(--color-surface-1))',
            '--tw-prose-th-borders': 'rgb(var(--color-border))',
            '--tw-prose-td-borders': 'rgb(var(--color-border))',
            // dark mode uses same vars (which auto-flip via :root[data-theme=dark])
            '--tw-prose-invert-body': 'rgb(var(--color-fg))',
            '--tw-prose-invert-headings': 'rgb(var(--color-fg))',
            '--tw-prose-invert-links': 'rgb(var(--color-accent))',
            '--tw-prose-invert-bold': 'rgb(var(--color-fg))',
            '--tw-prose-invert-quotes': 'rgb(var(--color-fg))',
            '--tw-prose-invert-quote-borders': 'rgb(var(--color-border))',
            '--tw-prose-invert-pre-bg': 'rgb(var(--color-surface-1))',
            // inline code: small visual differentiation via surface tone
            'code': {
              backgroundColor: 'rgb(var(--color-surface-2))',
              padding: '0.125em 0.375em',
              borderRadius: 'var(--radius-sm)',
              fontWeight: '400',
            },
            'code::before': { content: 'none' },
            'code::after': { content: 'none' },
          },
        },
      }),
    },
  },
};
