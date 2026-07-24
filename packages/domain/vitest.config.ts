import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      // Ports are pure type declarations (no runtime code); their behaviour is proven
      // through the adapters that implement them (contract tests in @subtrackr/persistence).
      exclude: ['src/**/*.test.ts', 'src/index.ts', 'src/ports/**'],
      // Domain core: highest bar (ADR 0009 / testing-strategy).
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
