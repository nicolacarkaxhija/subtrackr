---
id: adr-0002
title: Zero-server v1, backend-ready architecture
status: accepted
date: 2026-07-21
related: [adr-0003, adr-0006, privacy-policy]
---

# ADR 0002 — Zero-server v1, backend-ready architecture

## Context

Privacy is the core wedge. The strongest privacy story — and the smallest GDPR
surface — is to own **no server that sees user data**. But we want to add server
features later (hosted multi-device sync, price-hike feed) without a rewrite.

## Decision

Ship **zero-server** in v1: all data lives on-device; any sync goes through the
**user's own** cloud (iCloud/Drive), end-to-end encrypted (deferred, see ADR 0007).
Architect so a first-party backend can be introduced later **behind existing ports**
(ADR 0003) with no changes to domain logic.

## Alternatives considered

- **Thin optional backend now** — more features, but auth infra, a DB, a DPA, and a
  materially larger GDPR surface from day one.
- **Backend-first with local cache** — contradicts the privacy thesis outright.

## Consequences

- We are **barely a data controller** in v1: no accounts, no auth, minimal legal
  surface (see [DPIA](../../privacy/dpia.md)).
- Server-dependent features are deferred; where they surface as Pro later, the
  paywall becomes server-enforced and thus unfakeable (contrast ADR 0011).
- Data model is designed **sync-ready from day one**: UUIDv7 IDs, `updatedAt`,
  soft-delete, row version — so a CRDT/sync layer drops in without migration.
- **No third-party telemetry** by default (no analytics/crash SDK); any diagnostics
  are on-device and opt-in.
