import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['**/*.test-d.ts'],
    environment: 'happy-dom',
    typecheck: { enabled: false },
  },
});
