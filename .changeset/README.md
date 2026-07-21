# Changesets

This directory is managed by [Changesets](https://github.com/changesets/changesets).

Add a changeset for any user-facing change:

```bash
pnpm changeset
```

Pick the affected packages and a semver bump, and describe the change. On release, the
(deferred, ADR 0010) CI job aggregates changesets into version bumps and `CHANGELOG.md`
entries. `@subtrackr/mobile` is versioned by app store build config, so it is ignored
here.
