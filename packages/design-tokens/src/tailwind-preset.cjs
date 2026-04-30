/**
 * @skb/design-tokens Tailwind preset (Tailwind 3.x).
 *
 * Single source of truth for color / spacing / typography / radius / shadow /
 * motion across apps/site and every block ui-default. Consumers MUST import
 * this preset rather than hand-rolling theme values (ADR-0003).
 *
 * Color channel pattern: `rgb(var(--color-xxx) / <alpha-value>)` keeps full
 * Tailwind opacity-modifier support intact.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
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
    extend: {},
  },
};
