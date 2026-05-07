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

export const colorVarsV2 = {
  bg: 'var(--bg)',
  panel: 'var(--panel)',
  surface: 'var(--surface)',
  border: 'var(--border)',
  borderStrong: 'var(--border-strong)',
  text: 'var(--text)',
  text2: 'var(--text-2)',
  text3: 'var(--text-3)',
  accent: 'var(--accent)',
  accentSoft: 'var(--accent-soft)',
  accentSuccess: 'var(--accent-success)',
  canvas: 'var(--canvas)',
  canvasSoft: 'var(--canvas-soft)',
  gridLine: 'var(--grid-line)',
  gridLineStrong: 'var(--grid-line-strong)',
} as const;

export const layoutVarsV2 = {
  rowH: 'var(--row-h)',
  gap: 'var(--gap)',
  radius: 'var(--radius)',
} as const;

export const fontVarsV2 = {
  sans: 'var(--sans)',
  mono: 'var(--mono)',
} as const;

export const accentKindVarsV2 = {
  accentCanvas: 'var(--accent-canvas)',
  accentRunnable: 'var(--accent-runnable)',
  accentImage: 'var(--accent-image)',
  accentMath: 'var(--accent-math)',
  accentPdf: 'var(--accent-pdf)',
  accentJupyter: 'var(--accent-jupyter)',
  accentNnViz: 'var(--accent-nn-viz)',
  accentAgentFlow: 'var(--accent-agent-flow)',
} as const;

export const typographyVarsV2 = {
  fontSizeBody: 'var(--font-size-body)',
  fontSizeH1: 'var(--font-size-h1)',
  fontSizeH2: 'var(--font-size-h2)',
  fontSizeH3: 'var(--font-size-h3)',
  fontSizeBP: 'var(--font-size-b-p)',
  fontSizeBCode: 'var(--font-size-b-code)',
  fontWeightBody: 'var(--font-weight-body)',
  fontWeightH1: 'var(--font-weight-h1)',
  fontWeightH2: 'var(--font-weight-h2)',
  fontWeightH3: 'var(--font-weight-h3)',
  lineHeightBody: 'var(--line-height-body)',
  lineHeightH1: 'var(--line-height-h1)',
  lineHeightH2: 'var(--line-height-h2)',
  lineHeightH3: 'var(--line-height-h3)',
  lineHeightBP: 'var(--line-height-b-p)',
  lineHeightBCode: 'var(--line-height-b-code)',
  letterSpacingH1: 'var(--letter-spacing-h1)',
  letterSpacingH2: 'var(--letter-spacing-h2)',
} as const;

export const tokensV2 = {
  color: colorVarsV2,
  layout: layoutVarsV2,
  font: fontVarsV2,
  accentKind: accentKindVarsV2,
  typography: typographyVarsV2,
} as const;

export type ColorTokenName = keyof typeof colorVars;
export type SpaceTokenName = keyof typeof spaceVars;
export type ColorTokenNameV2 = keyof typeof colorVarsV2;
export type LayoutTokenNameV2 = keyof typeof layoutVarsV2;
export type FontTokenNameV2 = keyof typeof fontVarsV2;
export type AccentKindTokenNameV2 = keyof typeof accentKindVarsV2;
export type TypographyTokenNameV2 = keyof typeof typographyVarsV2;
