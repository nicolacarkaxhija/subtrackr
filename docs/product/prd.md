---
id: prd
title: Subtrackr — Product Requirements (Registry)
status: living
owner: nicola
updated: 2026-07-21
related: [tech-spec, adr-0004, adr-0007]
---

# Subtrackr — Product Requirements

> **Registry doc.** This orients and links; detailed requirements live in the
> per-feature specs under [`features/`](./features/). Load only what you need.

## 1. Problem

Manual privacy trackers (Bobby, Subby) respect privacy but force tedious data entry.
Bank-linked trackers (Rocket Money, PocketGuard) remove entry but ingest financial data
via Plaid. There is no tracker that is **both** low-friction **and** truly private.

## 2. Vision

> Know exactly what you're paying for, catch renewals and trials before they bill you,
> and never hand your financial data to anyone — including us.

## 3. Target users

- Privacy-conscious individuals who reject bank-linking.
- People with many subscriptions across currencies (esp. EU mixed-currency).
- Households splitting shared plans (Netflix, Spotify Family, iCloud).

## 4. Principles

1. **On-device by default** — no server sees user data (ADR 0002).
2. **Low friction** — the catalog + OCR remove typing (ADR 0004).
3. **Configurable** — every feature is a granular, dependency-aware toggle (ADR 0006).
4. **Honest math** — integer minor units, explicit currency, no silent rounding (ADR 0008).
5. **Accessible & localizable** — a11y and i18n are requirements, not afterthoughts.

## 5. v1 scope (see ADR 0007)

| Feature | Spec | Tier |
| --- | --- | --- |
| Smart catalog | [features/catalog.md](./features/catalog.md) | Free |
| On-device OCR (mobile) | [features/ocr.md](./features/ocr.md) | Pro (quota-gated) |
| Manual entry | [features/manual-entry.md](./features/manual-entry.md) | Free |
| Renewal & grace-period reminders | [features/reminders.md](./features/reminders.md) | Free |
| Spend analytics (multi-currency) | [features/analytics.md](./features/analytics.md) | Free/Pro |
| Shared-plan splitting | [features/shared-plan-split.md](./features/shared-plan-split.md) | Free |
| Cost-per-use | [features/cost-per-use.md](./features/cost-per-use.md) | Free |
| CSV export | [features/csv-export.md](./features/csv-export.md) | Pro |

**Deferred (designed-for):** price-hike alerts, E2E cloud sync.

## 6. Non-goals (v1)

- No bank/Plaid integration — ever.
- No account system, no server-side storage.
- No shipped translations (English only; i18n-ready).
- No live exchange-rate fetching (bundled rates).
- Web is a **secondary** surface, not at feature parity.

## 7. Success metrics (post-launch)

- Time-to-add a subscription (target: < 10s with catalog).
- % of subscriptions added via catalog/OCR vs. fully manual.
- Trial cancellations prompted before billing (reminder efficacy).
- Crash-free sessions (measured **on-device**, opt-in only).

## 8. Key risks

| Risk | Source | Mitigation |
| --- | --- | --- |
| OCR quality/cost across 3 engines | ADR 0004 | Mobile-focused; catalog normalizes output; web degraded |
| Catalog staleness + logo trademark | ADR 0004 | Sourcing + logo-usage policy in feat-catalog |
| Client-side paywall bypass | ADR 0005/0011 | Accepted; server-gate Pro when backend lands |
| Web feature degradation | ADR 0001 | Explicitly secondary; capability-flagged |
| Config combinatorial explosion | ADR 0006 | Dependency graph + presets + resolver property tests |

## 9. Release

Freemium, one-time Pro (ADR 0005). GitHub + build-only release now; store submission
gated until developer accounts exist (ADR 0010).
