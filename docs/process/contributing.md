---
id: contributing
title: Contributing & Local Workflow
status: living
owner: nicola
updated: 2026-07-21
related: [coding-standards, ci-cd, testing-strategy]
---

# Contributing & Local Workflow

## Prerequisites

- Node ≥ 20, **pnpm** ≥ 9.
- iOS: Xcode + Simulator (OCR/notifications). Android: Android Studio + emulator.
- (Optional) Maestro CLI for mobile E2E.

## Setup

```bash
pnpm install          # (run when bandwidth allows — see note below)
pnpm dev              # start Expo; pick platform
```

> **Bandwidth note:** the initial `pnpm install` and any `expo`/native prebuild download
> packages. On constrained connections, defer these; all documentation and config work
> proceeds without them.

## Everyday commands

| Command | Does |
| --- | --- |
| `pnpm verify` | lint + typecheck + unit/integration + coverage (the local CI gate) |
| `pnpm test` | unit/integration (watch: `pnpm test:watch`) |
| `pnpm test:mutation` | Stryker on the domain core |
| `pnpm lint` / `pnpm format` | ESLint / Prettier |
| `pnpm typecheck` | `tsc --noEmit` across the workspace |
| `pnpm e2e:web` / `pnpm e2e:mobile` | Playwright / Maestro |

## TDD loop (required for domain logic)

1. **Red** — write a failing test (unit or property) for the next behaviour.
2. **Green** — minimal code to pass.
3. **Refactor** — clean up; keep green.
4. Commit the micro-change (Conventional Commit).

## Branch & commit

- Branch off `main`: `feat/<slug>`, `fix/<slug>`, `docs/<slug>`.
- **Conventional Commits**, enforced by commitlint (commit-msg hook).
- **Micro-commits**; each commit passes hooks. **Do not reference tooling/assistants in
  messages.**
- Add a **changeset** (`pnpm changeset`) for any user-facing change.

## Git hooks (Husky)

- `pre-commit`: lint-staged (Prettier + ESLint on staged) + typecheck.
- `commit-msg`: commitlint.
- `pre-push`: `pnpm verify`.

Hooks reproduce the deferred CI gates locally (ADR 0010). If a hook fails, fix the cause
— do not bypass with `--no-verify`.

## Work ledger

After each commit, add a row to [`WORK_LEDGER.md`](../../WORK_LEDGER.md) estimating the
equivalent unaided human effort.
