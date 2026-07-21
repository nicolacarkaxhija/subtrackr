---
id: adr-index
title: Architecture Decision Records
status: living
owner: nicola
updated: 2026-07-21
---

# Architecture Decision Records

Each ADR captures one decision, its context, the alternatives weighed, and the
consequences. Format is a lightweight [MADR](https://adr.github.io/madr/) variant.
ADRs are immutable once `accepted`; a reversal is a **new** ADR that marks the old
one `superseded-by`.

| # | Title | Status |
| --- | --- | --- |
| [0001](./0001-platform-expo.md) | Cross-platform via Expo (iOS/Android/Web) | accepted |
| [0002](./0002-zero-server-backend-ready.md) | Zero-server v1, backend-ready architecture | accepted |
| [0003](./0003-hexagonal-ports-and-adapters.md) | Hexagonal ports-and-adapters + repository/sync | accepted |
| [0004](./0004-catalog-plus-ocr-wedge.md) | Catalog + on-device OCR as the v1 wedge | accepted |
| [0005](./0005-freemium-one-time-pro.md) | Freemium: free core + one-time Pro | accepted |
| [0006](./0006-feature-registry.md) | Local, dependency-aware feature registry | accepted |
| [0007](./0007-v1-scope.md) | v1 scope: wedge + optimization | accepted |
| [0008](./0008-multi-currency-bundled-rates.md) | Multi-currency with bundled exchange rates | accepted |
| [0009](./0009-testing-tiered-rigor.md) | Tiered test rigor (property + mutation on core) | accepted |
| [0010](./0010-tooling-and-cicd.md) | Toolchain & CI/CD (GitHub, deferred activation) | accepted |
| [0011](./0011-license-polyform-noncommercial.md) | Source-available under PolyForm Noncommercial | accepted |

## Decision map

```
0001 platform ─┬─> 0003 hexagonal ─┬─> 0006 feature registry ─> 0007 v1 scope
               │                   └─> 0008 multi-currency
0002 zero-server ┘
0004 wedge ──> 0007 v1 scope
0005 freemium ──> 0006 feature registry (entitlement layer)
0011 license ──> 0005 freemium (paywall leakage accepted)
0009 testing ──> 0010 tooling/ci
```
