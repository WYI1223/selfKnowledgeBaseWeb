/*
 * TS mirror of the CSS variables in tokens.css / tokens-dark.css.
 *
 * Use these when you need the var() reference in CSS-in-JS or programmatic
 * style construction. Renaming a CSS var is a contract break — keep the
 * literal var names here in lockstep with both theme files.
 */

export const colorVars = {
  bg: 'var(--color-bg)',
  fg: 'var(--color-fg)',
  surface1: 'var(--color-surface-1)',
  surface2: 'var(--color-surface-2)',
  border: 'var(--color-border)',
  muted: 'var(--color-muted)',
  accent: 'var(--color-accent)',
  accentFg: 'var(--color-accent-fg)',
  info: 'var(--color-info)',
  warn: 'var(--color-warn)',
  note: 'var(--color-note)',
  success: 'var(--color-success)',
  error: 'var(--color-error)',
} as const;

export const spaceVars = {
  '1': 'var(--space-1)',
  '2': 'var(--space-2)',
  '3': 'var(--space-3)',
  '4': 'var(--space-4)',
  '6': 'var(--space-6)',
  '8': 'var(--space-8)',
  '12': 'var(--space-12)',
} as const;

export const tokens = {
  color: colorVars,
  space: spaceVars,
} as const;

export type ColorTokenName = keyof typeof colorVars;
export type SpaceTokenName = keyof typeof spaceVars;
