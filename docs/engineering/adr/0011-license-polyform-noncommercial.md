---
id: adr-0011
title: Source-available under PolyForm Noncommercial
status: accepted
date: 2026-07-21
related: [adr-0005]
---

# ADR 0011 — Source-available under PolyForm Noncommercial

## Context

We want to **showcase the code publicly** (trust for a privacy app, portfolio value)
while retaining commercial rights. But zero-server (ADR 0002) forces a **client-side**
Pro gate (ADR 0005). This creates a trilemma: you can have at most two of
{public source, zero-server, tamper-proof paywall}.

## Decision

License the code **source-available** under **PolyForm Noncommercial 1.0.0**:
public for study and non-commercial use; commercial use reserved to the author. Keep
the client-side Pro gate and **accept paywall leakage** — a technical user could
self-build a source-available binary and remove the gate.

## Alternatives considered

- **Proprietary / closed source** — best paywall obfuscation, but no public showcase.
- **Source-available + server-gated Pro** — tamper-proof paywall, but requires moving
  Pro value behind the (deferred) backend; revisit when the backend lands.

## Consequences

- Source is public; `LICENSE` carries the PolyForm Noncommercial text + `Required
  Notice`.
- The paywall is **honor-system for the technical minority**; the vast majority install
  signed store builds and are unaffected.
- Not an OSI "open source" license — cannot be marketed as such.
- Revisit toward **server-gated Pro** once the backend exists to make the paywall
  tamper-proof (links back to ADR 0002/0005).
