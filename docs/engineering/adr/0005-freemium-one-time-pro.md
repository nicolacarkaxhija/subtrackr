---
id: adr-0005
title: 'Freemium: free core + one-time Pro'
status: accepted
date: 2026-07-21
related: [adr-0006, adr-0011]
---

# ADR 0005 — Freemium: free core + one-time Pro

## Context

The product must be sustainable ("ultimately published") without betraying the
privacy positioning. Ad networks are trackers and are excluded.

## Decision

**Freemium**: a generous free tier (manual entry, catalog, reminders, a capped number
of subscriptions) plus a **one-time "Pro" unlock** (no recurring fee) for advanced
features (e.g. OCR beyond a quota, unlimited subscriptions, advanced analytics, CSV
export, future E2E cloud sync). **No ads, no trackers.**

Entitlement is a **two-state** model (`free` | `pro`) with **no expiry logic**,
resolved as the _entitlement_ axis of the feature registry (ADR 0006).

## Alternatives considered

- **Recurring Pro subscription** — more revenue but ironic for a subscription tracker
  and adds expiry/billing-state tests.
- **Tip jar / fully free** — weakest sustainability for a maintained, published app.

## Consequences

- Clean entitlement layer with no time-based state.
- Because v1 is zero-server, the Pro gate is **client-side** and therefore bypassable
  by technical users of a self-built source-available binary — **accepted** (ADR 0011).
- When a backend arrives, server-only Pro features become unfakeable, strengthening the
  paywall over time.
