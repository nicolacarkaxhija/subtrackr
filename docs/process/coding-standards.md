---
id: coding-standards
title: Coding Standards
status: living
owner: nicola
updated: 2026-07-21
related: [adr-0003, adr-0010, testing-strategy]
---

# Coding Standards

## Language

- **TypeScript strict**: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`,
  `exactOptionalPropertyTypes`. No `any` (use `unknown` + narrowing). No non-null `!`
  in domain code.
- Prefer pure functions and immutable data in the domain core.
- **Money is never a `number`** — use the `Money` value object. **Time is never
  `Date.now()`** — use the `Clock` port.

## Architecture boundaries (enforced)

- `packages/domain` may import: itself, standard library, tiny pure utils. It may **not**
  import React, Expo, SQLite, or any adapter. Enforced by **dependency-cruiser**; a
  violation fails `pnpm verify`.
- Adapters depend inward on the domain, never the reverse.

## Formatting & linting

- **Prettier** owns formatting (no manual style debates). Config committed.
- **ESLint flat config**: TypeScript, import ordering, unused-imports, promise/async
  correctness, RN a11y lint. Warnings are errors in CI.

## Naming & structure

- Files: `kebab-case.ts`; types/classes `PascalCase`; values `camelCase`; constants
  `SCREAMING_SNAKE` only for true module constants.
- One concept per file in the domain; co-locate `*.test.ts` next to source.
- Barrel `index.ts` only at package boundaries.

## Errors

- Domain errors are typed (`Result`/tagged unions or narrow error classes), not thrown
  strings. User-facing messages are localized keys, not literals.

## Comments

- Explain **why**, not what. Match surrounding density. Public domain APIs get short
  TSDoc.

## Accessibility

- All interactive components expose RN a11y props (`accessibilityRole`, label, state).
  Target WCAG 2.2 AA for color contrast and touch targets.

## Commits

- **Conventional Commits**, enforced by commitlint. **Micro-commits**: one logical
  change each. **No mention of tooling/assistants in commit messages.**
- Types: `feat, fix, docs, chore, refactor, test, perf, build, ci, style, revert`.
