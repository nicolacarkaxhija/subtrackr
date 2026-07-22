/**
 * Architecture boundary rules (ADR 0003 / coding-standards).
 * Keeps the domain core pure and dependencies pointing inward.
 */
module.exports = {
  forbidden: [
    {
      name: 'domain-stays-pure',
      comment: 'packages/domain must not import framework/platform/persistence code (ADR 0003).',
      severity: 'error',
      from: { path: '^packages/domain' },
      to: {
        pathNot: '^packages/domain',
        path: 'node_modules/(react|react-native|expo|@op-engineering|drizzle-orm)',
      },
    },
    {
      name: 'no-adapter-into-domain-reverse',
      comment: 'Dependencies point inward: domain must not depend on adapters.',
      severity: 'error',
      from: { path: '^packages/domain' },
      to: { path: '^packages/(persistence|catalog)/' },
    },
    {
      name: 'no-circular',
      comment: 'No circular dependencies.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      comment: 'Flag unreachable modules. Tests and tooling configs are legitimately orphaned.',
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: '\\.(test|spec)\\.ts$|\\.config\\.(ts|js|mjs|cjs)$',
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    // Generated output is not source; cruising it produces false orphan warnings.
    exclude: { path: '(node_modules|coverage|reports|dist|build|\\.stryker-tmp)' },
    tsConfig: { fileName: 'tsconfig.base.json' },
    tsPreCompilationDeps: true,
  },
};
