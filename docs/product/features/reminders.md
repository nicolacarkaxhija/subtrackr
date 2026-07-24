---
id: feat-reminders
title: Renewal & Grace-Period Reminders
status: partial
owner: nicola
tier: free
platforms: [ios, android, web]
related: [mod-config-registry]
implemented:
  - packages/domain/src/entities/subscription.ts (isTrialActive, trialDaysRemaining)
  - apps/mobile/src/app/index.tsx (in-app trial countdown on cards)
notes: >
  In-app grace-period countdowns ship. OS-scheduled push notifications (renewal and
  trial alerts) are deferred; they lean native and web push is unreliable.
---

# Renewal & Grace-Period Reminders

## Summary

Local notifications before a renewal charges, and countdowns for free-trial grace
periods so users can cancel in time.

## User stories

- As a user, I'm reminded N days before a subscription renews.
- As a trial user, I see exactly how many days remain to cancel without being charged.

## Behaviour / rules

- **Renewal reminders:** user-configurable lead times (e.g. 3 days / 1 day before);
  multiple lead times allowed.
- **Grace-period countdowns:** for entries with a `trialEndsAt`, show days remaining and
  fire an urgent reminder before the trial converts.
- Scheduling is **local** (no push server). Rescheduled on data change / device reboot.
- **Quiet hours** respected; user picks notification time-of-day.
- Actionable notifications (mark paid / skip / snooze) where the platform allows.

## Feature-registry wiring

- **Capability:** ios/android full; **web degraded** (web notifications unreliable,
  esp. iOS Safari — flagged, best-effort).
- **Entitlement:** free.
- **Flag:** default on; kill-switch stops scheduling.
- **Preference:** per-type toggles + lead times + quiet hours.
- **Depends on:** none.

## Acceptance criteria

- [ ] Reminders scheduled at the correct local times for each lead time.
- [ ] Grace-period countdown accurate across timezones/DST.
- [ ] No reminders scheduled when capability/flag/preference is off.
- [ ] Reschedule occurs after editing a subscription.

## Open questions / risks

- Web/background scheduling limits; document degradation clearly in-app.
