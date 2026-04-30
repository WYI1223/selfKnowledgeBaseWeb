import type { Config } from 'tailwindcss';
import designTokensPreset from '@skb/design-tokens/tailwind-preset';

export default {
  content: ['./src/**/*.{astro,html,ts,tsx,md,mdx}', '../../content/**/*.mdx'],
  presets: [designTokensPreset],
  plugins: [],
} satisfies Config;
