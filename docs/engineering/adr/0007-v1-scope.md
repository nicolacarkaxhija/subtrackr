---
id: adr-0007
title: "v1 scope: wedge + optimization"
status: accepted
date: 2026-07-21
related: [adr-0004, prd]
---

# ADR 0007 — v1 scope: wedge + optimization

## Context

The brainstorm lists ~9 features. Shipping all of them alongside catalog+OCR+full test
pyramid is too large for a first release. We need a deliberate cut.

## Decision

**v1 = wedge + optimization.**

**In v1:**
- Core: catalog, on-device OCR (mobile), manual entry, local reminders, local storage
- Free-trial **grace-period countdowns**
- **CSV export** (data portability)
- **Spend analytics** (multi-currency totals by category/cycle)
- **Shared-plan splitting** (per-member cost)
- **Cost-per-use** tracking

**Deferred but designed-for:**
- **Price-hike alerts** (needs a price feed → arrives with backend/remote config)
- **E2E cloud sync** (iCloud/Drive, user-held key)

Everything remains buildable behind the feature registry (ADR 0006) regardless of when
it ships.

## Consequences

- First release is differentiated (beats Bobby) yet shippable.
- Deferred features have their ports/seams present from day one (sync, remote config).
- Scope is enforced by the registry: deferred features exist as disabled entries with a
  `capability`/`flag` of `false`.
