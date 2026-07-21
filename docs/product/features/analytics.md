---
id: feat-analytics
title: Multi-currency Spend Analytics
status: draft
owner: nicola
tier: free
platforms: [ios, android, web]
related: [adr-0008, mod-data-model]
---

# Multi-currency Spend Analytics

## Summary
Show what the user spends across all subscriptions — totals by category and cycle,
normalized to a chosen base currency using bundled exchange rates.

## User stories
- As a user with mixed-currency subs, I see one monthly/annual total in my base currency.
- As a user, I see spend broken down by category and by billing cycle.

## Behaviour / rules
- **Normalization:** each subscription's cost is converted to a **monthly-equivalent**
  and to the **base currency** via bundled rates (ADR 0008).
- **Money math:** integer minor units; a `Money` value object owns arithmetic and
  rounding (banker's rounding for display, exact for storage). No floats.
- Breakdowns: by category, by cycle, active vs. paused, projected next-30-days spend.
- **Rate staleness:** show the bundled-rate "as of" date; converted figures labelled
  as estimates.
- Empty/edge: zero subscriptions → friendly empty state; single-currency user → no
  conversion shown.

## Feature-registry wiring
- **Capability:** all platforms. **Entitlement:** basic totals free; advanced
  breakdowns/projections may be pro. **Flag:** default on.
- **Preference:** base currency; include/exclude paused. **Depends on:** none.

## Acceptance criteria
- [ ] Monthly-equivalent correct for every billing cycle (property-tested).
- [ ] Base-currency totals match hand-computed fixtures within rounding rules.
- [ ] No floating-point drift across large portfolios (property test).
- [ ] Rate "as of" date shown; estimates labelled.

## Open questions / risks
- Bundled-rate cadence tied to releases; document in ci-cd/release notes.
