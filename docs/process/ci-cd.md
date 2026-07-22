---
id: ci-cd
title: CI/CD Pipeline
status: living
owner: nicola
updated: 2026-07-21
related: [adr-0010, testing-strategy, contributing]
---

# CI/CD Pipeline

Designed now, **activation deferred** until GitHub Actions credits are available
(ADR 0010). In the interim, equivalent gates run **locally** via `pnpm verify` and git
hooks.

## Stages

| Trigger                          | Stage      | Jobs                                                                                               |
| -------------------------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| **commit** (local hook)          | pre-commit | lint-staged (Prettier + ESLint on staged), typecheck changed                                       |
| **commit-msg** (local hook)      | commit-msg | commitlint (Conventional Commits)                                                                  |
| **push** (local hook)            | pre-push   | `pnpm verify` (lint + typecheck + unit/integration + coverage gates)                               |
| **PR** (CI, deferred)            | verify     | install → lint → typecheck → test + coverage → dependency-cruiser boundaries → build (all targets) |
| **PR** (CI, deferred)            | mutation   | Stryker on `packages/domain` (required for release PRs)                                            |
| **PR** (CI, deferred)            | e2e        | Playwright (web) always; Maestro (mobile) on device runners                                        |
| **merge to main** (CI, deferred) | release    | Changesets version + CHANGELOG + tag; build web PWA + deploy; EAS build (mobile)                   |
| **release tag** (CI, deferred)   | publish    | EAS Submit — **gated**: off until Apple/Google accounts + secrets exist                            |

## Branch & merge model

- Trunk-based on `main`; short-lived feature branches; **squash-merge** with a
  Conventional-Commit title (feeds Changesets/CHANGELOG).
- Required checks before merge (once CI is on): verify, boundaries, e2e-web.
- `main` is protected; releases are cut by Changesets.

## Versioning & changelog

- **Changesets**: each user-facing change adds a changeset; release job aggregates them
  into semver bump + `CHANGELOG.md`.
- App (store) version derived from the released semver; build number auto-increments.

## Secrets (added later)

`EXPO_TOKEN`, `APPLE_*`, `GOOGLE_PLAY_*`, web-host deploy token. None required for the
local-first workflow.

## Workflow files

Authored under `.github/workflows/` but **inert** until pushed with credits. They are
committed so activation is a one-step flip (push + enable). See ADR 0010.
