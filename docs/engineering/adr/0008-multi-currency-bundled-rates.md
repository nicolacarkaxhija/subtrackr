---
id: adr-0008
title: Multi-currency with bundled exchange rates
status: accepted
date: 2026-07-21
related: [adr-0002, feat-analytics]
---

# ADR 0008 — Multi-currency with bundled exchange rates

## Context

Users hold subscriptions in different currencies (Netflix USD, Spotify EUR). Analytics
and shared-plan math must decide per-currency vs. converted-to-base. Live rate fetching
conflicts with the no-network privacy stance (ADR 0002).

## Decision

- Track each subscription in its **native currency**.
- Analytics convert to a **user-chosen base currency** using **bundled** exchange
  rates shipped in app updates (no live fetch, no tracking).
- All formatting is **locale-aware** via `Intl` (number/date/currency).
- UI copy is **i18n-ready** (externalized strings) but **English-only** in v1.
- All monetary math uses **integer minor units** (never floats) to avoid rounding drift.

## Alternatives considered

- **Live exchange rates** — more accurate, but a network call/tracker; deferred as an
  opt-in Pro option later.
- **Single currency** — simplest, but breaks for the common mixed-currency (EU) case.
- **Full localization (shipped translations) in v1** — added translation + per-locale
  test surface; deferred.

## Consequences

- Bundled rates go **stale** between releases; acceptable for tracking/estimation and
  disclosed in-app. A refresh cadence is tied to the release process.
- Money is represented as `{ amountMinor: bigint, currency: ISO4217 }`; a `Money` value
  object centralizes arithmetic and rounding (see
  [feat-analytics](../../product/features/analytics.md)).
