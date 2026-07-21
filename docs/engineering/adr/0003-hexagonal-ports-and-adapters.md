---
id: adr-0003
title: Hexagonal ports-and-adapters + repository/sync
status: accepted
date: 2026-07-21
related: [adr-0001, adr-0002, mod-repository-sync, mod-data-model]
---

# ADR 0003 — Hexagonal ports-and-adapters + repository/sync

## Context

We need one shared domain core that runs on three platforms (ADR 0001), stays free
of framework/persistence details, is exhaustively testable (ADR 0009), and can later
gain a backend (ADR 0002) without disruption.

## Decision

Adopt **hexagonal architecture (ports & adapters)**:

- A **pure-TS domain core** (`packages/domain`) with zero React/Expo/DB imports.
- **`Repository` port** for persistence. Adapters: native SQLite (`op-sqlite`) and
  web SQLite (WASM) — both via **Drizzle ORM** for a typed, migration-driven schema.
- **`SyncProvider` port** for synchronization. Adapters: local-only (v1), then
  iCloud/Drive E2E, then first-party backend — all interchangeable.
- **`Clock`, `Rates`, `Ocr`, `Notifier`** ports for time, exchange rates, OCR, and
  notifications, so the core never touches platform APIs directly.

A **boundary lint rule** (dependency-cruiser) forbids `packages/domain` from importing
any platform/framework module, keeping the core pure and mutation-testable.

## Alternatives considered

- **Direct ORM calls from UI/services** — faster short-term, but couples domain to
  persistence, breaks portability and mutation testing, and blocks the future backend.

## Consequences

- Domain logic is unit/property/mutation-tested in isolation with fake adapters.
- Two persistence adapters must be maintained (native + web); the port keeps their
  differences out of the domain.
- New capabilities (backend sync, remote config) are additive adapters, not rewrites.
