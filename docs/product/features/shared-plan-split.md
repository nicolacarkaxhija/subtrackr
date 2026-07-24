---
id: feat-shared-plan
title: Shared-Plan Splitting
status: living
owner: nicola
tier: free
platforms: [ios, android, web]
related: [feat-analytics, mod-data-model]
implemented:
  - packages/domain/src/value-objects/money.ts (equalShare)
  - packages/domain/src/entities/subscription.ts (sharedWith, myMonthlyCost)
notes: >
  v1 ships equal splitting by headcount (the payer absorbs the remainder unit). Named
  members, custom weights, and fixed-amount modes from the spec below are deferred.
---

# Shared-Plan Splitting

## Summary

For plans shared across people (Netflix, Spotify Family, iCloud), compute each member's
fair share so the user tracks their **real** cost.

## User stories

- As a user, I split a €17.99 family plan across 4 members and see my €4.50 share.
- As the plan payer, I track what others owe me.

## Behaviour / rules

- **Split modes:** equal, custom fixed amounts, or custom percentages.
- **Rounding:** total of member shares must equal the plan total exactly — remainder
  cents distributed deterministically (largest-remainder method), never lost/created.
- A member may be flagged as **"me"**; analytics use the user's share, not the full price.
- Members are **local labels only** (names/notes) — no contacts access, no upload.
- Edge: 1 member = full price; 0 members = treat as personal; percentages must sum to 100.

## Feature-registry wiring

- **Capability:** all platforms. **Entitlement:** free. **Flag:** default on.
- **Preference:** "Track shared plans" toggle. **Depends on:** analytics (for "my share").

## Acceptance criteria

- [ ] Sum of shares equals plan total exactly for all modes (property-tested, no cent
      lost or invented).
- [ ] Percentage mode rejects sums ≠ 100.
- [ ] Analytics reflect the user's share when a "me" member exists.

## Open questions / risks

- Remainder-distribution determinism must be stable across recomputations.
