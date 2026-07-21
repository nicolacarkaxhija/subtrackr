---
id: feat-manual-entry
title: Manual Entry
status: draft
owner: nicola
tier: free
platforms: [ios, android, web]
related: [feat-catalog, mod-data-model]
---

# Manual Entry

## Summary
Add or edit a subscription entirely by hand. The always-available baseline that catalog
and OCR accelerate but never replace.

## User stories
- As a user, I add a niche subscription not in the catalog.
- As a user, I correct any autofilled field before saving.

## Behaviour / rules
- Required: name, amount (minor units) + currency, billing cycle, next renewal date.
- Optional: category, notes, start date, free-trial end, payment method label, URL,
  color/icon, shared-plan config, usage tracking opt-in.
- **Billing cycles:** weekly, monthly, quarterly, semi-annual, annual, custom (every N
  days/weeks/months). Renewal date derivation is domain-core logic (property-tested).
- **Validation:** amount ≥ 0; currency is ISO-4217; renewal date valid; custom cycle N ≥ 1.
- Editing recomputes derived fields (next renewal, monthly-equivalent cost).

## Feature-registry wiring
- **Capability:** all platforms. **Entitlement:** free. **Flag:** always on (core).
- **Preference:** n/a (baseline). **Depends on:** none.

## Acceptance criteria
- [ ] Invalid inputs rejected with clear, localized messages.
- [ ] Next-renewal derivation correct across all cycle types incl. month-end edge cases
      (e.g. Jan 31 → Feb 28/29).
- [ ] Monthly-equivalent cost computed correctly per cycle.

## Open questions / risks
- Month-end and leap-year renewal math is a classic edge-case source → exhaustive
  property tests in the domain core.
