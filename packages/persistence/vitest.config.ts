import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      // Exclude test files, the shared contract harness, and the barrel.
      exclude: ['src/**/*.test.ts', 'src/**/*.contract.ts', 'src/index.ts'],
      // Adapter tier (ADR 0009 / testing-strategy): behaviour proven by contract tests.
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});
