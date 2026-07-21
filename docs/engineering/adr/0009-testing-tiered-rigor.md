---
id: adr-0009
title: Tiered test rigor (property + mutation on core)
status: accepted
date: 2026-07-21
related: [adr-0003, testing-strategy]
---

# ADR 0009 — Tiered test rigor (property + mutation on core)

## Context

The goal is "maximum coverage / all edge cases," but a blanket 100% line-coverage gate
rewards assertion-free tests and taxes refactors. Coverage % measures lines executed,
not edge cases handled.

## Decision

Adopt **tiered rigor**, enforced **per layer** in CI:

- **Domain core** (billing/proration, date/cycle math, cost-per-use, split calc,
  `Money`): target ~100% coverage **plus property-based tests** (`fast-check`) **plus
  mutation testing** (`Stryker`) to prove the tests actually catch injected bugs.
- **Adapters/services**: integration tests against fakes and, where feasible, real
  SQLite; meaningful coverage, no vanity threshold.
- **UI**: React Native Testing Library for behavior; pragmatic coverage.
- **E2E**: Maestro (mobile), Playwright (web) for critical user journeys.

Development follows **TDD (red-green-refactor)**.

## Alternatives considered

- **High global threshold (90–95%)** — simpler but pressures low-value glue tests.
- **Literal 100% everywhere** — maximal ceremony, poor ROI on glue code.

## Consequences

- Mutation testing is fast because the domain core is **pure** (ADR 0003); a boundary
  lint keeps it framework-free.
- Coverage gates differ by package (configured in each package's test config).
- Full matrix and thresholds live in
  [testing-strategy](../../process/testing-strategy.md).
