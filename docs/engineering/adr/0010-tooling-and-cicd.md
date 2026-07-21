---
id: adr-0010
title: Toolchain & CI/CD (GitHub, deferred activation)
status: accepted
date: 2026-07-21
related: [adr-0009, ci-cd, coding-standards]
---

# ADR 0010 — Toolchain & CI/CD (GitHub, deferred activation)

## Context

A published, high-standard project needs consistent linting, formatting, commit
hygiene, changelogs, and a pipeline covering commit → push → merge → release. Two
practical constraints: the maintainer is currently **out of GitHub Actions credits**
and on **limited bandwidth**.

## Decision

**Toolchain:**
- **TypeScript** strict (`strict`, `noUncheckedIndexedAccess`).
- **ESLint** flat config + **Prettier**; **dependency-cruiser** for module boundaries.
- **Husky** + **lint-staged** + **commitlint** (Conventional Commits).
- **Changesets** for versioning + CHANGELOG.
- **pnpm** workspaces monorepo.

**CI/CD (GitHub Actions), activation deferred:**
- Pipeline design is documented now; workflow files are added but **inert until
  pushed with credits available**.
- **Checks run locally first**: a `pnpm verify` script (lint + typecheck + test) and
  git hooks reproduce the CI gates on the developer machine.
- Mobile store **submission** (EAS Submit) is **wired but gated** — disabled until
  Apple/Google developer accounts and secrets exist.

## Alternatives considered

- **GitLab CI / other host** — maintainer uses GitHub.
- **Enable full CI immediately** — blocked by credit + bandwidth constraints.

## Consequences

- Quality gates are enforced locally via hooks + `pnpm verify` in the interim.
- When credits return, CI is enabled by pushing the existing workflows; store submit is
  turned on by adding secrets.
- Pipeline detail lives in [ci-cd](../../process/ci-cd.md).
