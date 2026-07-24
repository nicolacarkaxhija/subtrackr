---
id: testing-strategy
title: Testing Strategy
status: living
owner: nicola
updated: 2026-07-21
related: [adr-0009, coding-standards]
---

# Testing Strategy

Follows **tiered rigor** (ADR 0009) and **TDD** (red-green-refactor). Rigor is highest
where correctness matters most (money + dates), pragmatic elsewhere.

## The pyramid

| Layer                    | Scope                                                | Tools                                                       | Bar                                        |
| ------------------------ | ---------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------ |
| **Domain core**          | entities, value objects, use cases, feature registry | Vitest + **fast-check** (property) + **Stryker** (mutation) | ~100% lines/branches; mutation score ≥ 85% |
| **Adapters/persistence** | repository, sync, catalog search                     | Vitest integration + real SQLite (native harness / WASM)    | contract tests pass on both adapters       |
| **UI**                   | components, screens                                  | React Native Testing Library                                | behaviour of critical flows; no vanity %   |
| **E2E**                  | user journeys                                        | **Maestro** (mobile), **Playwright** (web)                  | happy paths + key edge journeys green      |

## Coverage gates (per package, enforced locally + CI)

- `packages/domain`: statements/branches/functions/lines ≥ 100% (allow documented
  `/* c8 ignore */` only with justification); **Stryker** mutation score ≥ 85%.
- `packages/config`, `packages/persistence`, `packages/catalog`: ≥ 90% lines, ≥ 85%
  branches.
- `apps/mobile`: meaningful coverage; no global gate, but critical flows must have tests.

## Property-test targets (fast-check)

- Billing-cycle next-renewal derivation (month-end, leap years, DST, custom N).
- `Money` arithmetic/rounding (no float drift; associativity within rounding rules).
- Shared-plan split (shares sum to total exactly; deterministic remainder).
- Feature-registry resolver (dependency cascade; preference can't override hard-off;
  no cycles accepted).
- CSV export/parse round-trip.

## Determinism rules

- No `Date.now()`/`Math.random()` in the domain — inject `Clock` and an id generator.
- Tests use fixed clocks and seeded generators; property tests log the failing seed.

## Mutation-testing pitfalls (hard-won)

- **Never construct domain objects at `describe`-body / collection time** in a
  mutation-tested suite. If a mutant makes a constructor/validator throw
  unconditionally, a collection-time construction throws during test _collection_ — so
  **zero tests run**, Stryker sees no failing test, and the mutant is wrongly reported
  as **survived**. Build fixtures inside `it`/`beforeEach` (or via a factory function)
  so a broken guard produces a real test **failure**. This masked six validation
  mutants in `Subscription` at 100% line coverage.
- **Assert error _messages_, not just error _types_.** A broken guard often falls
  through to a different code path that throws the _same_ error class (e.g. a `BigInt`
  division-by-zero also throwing `RangeError`), so `toThrow(RangeError)` passes either
  way. Assert a substring unique to the intended guard.
- Run one Stryker instance at a time; concurrent runs corrupt the `.stryker-tmp`
  sandbox and produce meaningless results.

## Local-first execution (bandwidth/credit constraint, ADR 0010)

Until CI credits return, these gates run **locally**:

```bash
pnpm verify        # lint + typecheck + unit/integration + coverage
pnpm test:mutation # Stryker on domain core (slower; run before releases/PRs)
pnpm e2e:web       # Playwright (local)
pnpm e2e:mobile    # Maestro (local device/emulator)
```

Git hooks run the fast subset on commit/push (see [contributing](./contributing.md)).

## What we do NOT test

- Third-party library internals; generated code; trivial pass-through getters.
- Exhaustive feature **combinations** — we test the **resolver** instead (bounded by the
  dependency graph), avoiding combinatorial explosion (ADR 0006).
