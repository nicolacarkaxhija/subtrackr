---
id: feat-cost-per-use
title: Cost-per-Use
status: draft
owner: nicola
tier: free
platforms: [ios, android, web]
related: [feat-analytics]
---

# Cost-per-Use

## Summary

Let users log how often they use a service to reveal its true cost-per-use — surfacing
subscriptions that aren't worth keeping.

## User stories

- As a user, I log gym visits and see "€6.25 per visit this month".
- As a user, I spot a €15/mo app I used twice → a cancel candidate.

## Behaviour / rules

- **Usage logging:** quick increment ("+1 use") or manual count per period.
- **Cost-per-use = period cost / uses** in the period; uses = 0 → show "unused" (not ÷0).
- Period aligns with the billing cycle (monthly-equivalent basis).
- Optional **"low value" hint** when cost-per-use exceeds a user-set threshold.
- Purely manual/local — no tracking of actual app usage, no device monitoring.

## Feature-registry wiring

- **Capability:** all platforms. **Entitlement:** free. **Flag:** default off (opt-in).
- **Preference:** per-subscription "track usage" toggle; global threshold.
- **Depends on:** analytics (cost basis).

## Acceptance criteria

- [ ] Cost-per-use computed correctly; zero-use handled without division error.
- [ ] Period boundaries align with billing cycle.
- [ ] Low-value hint triggers exactly at/above threshold.

## Open questions / risks

- Keep it manual to preserve privacy; never infer usage from device signals.
