---
id: mod-data-model
title: Domain Entities & Schema
status: draft
owner: nicola
updated: 2026-07-21
related: [adr-0002, adr-0008, mod-repository-sync]
---

# Domain Entities & Schema

All persisted rows carry **sync-ready** fields from day one (ADR 0002) so a CRDT/sync
layer needs no migration: `id` (UUIDv7), `createdAt`, `updatedAt`, `deletedAt`
(soft delete), `version` (monotonic per row).

## Core entities

### `subscription`
| Field | Type | Notes |
| --- | --- | --- |
| id | UUIDv7 | |
| name | text | required |
| catalogServiceId | text? | link to bundled catalog (nullable) |
| amountMinor | integer | minor units (cents); never float |
| currency | text | ISO-4217 |
| cycle | enum | weekly/monthly/quarterly/semiannual/annual/custom |
| customIntervalDays | integer? | for `custom` cycle |
| anchorDate | date | cycle anchor / first charge |
| nextRenewalAt | date | derived, stored for query speed |
| trialEndsAt | date? | drives grace-period reminders |
| category | text? | |
| status | enum | active/paused/cancelled |
| paymentLabel | text? | free-text (no card data) |
| url | text? | cancellation/manage link |
| notes | text? | |
| + sync fields | | id/createdAt/updatedAt/deletedAt/version |

### `shared_plan_member`
`id, subscriptionId, label, isMe, splitMode(equal|fixed|percent), shareValue,
+sync`. Invariant: member shares reconcile to the plan total exactly (largest-remainder).

### `usage_log`
`id, subscriptionId, periodStart, count, +sync`. Drives cost-per-use.

### `reminder`
`id, subscriptionId, kind(renewal|trial), leadDays, timeOfDay, +sync`. Scheduling is
local; the row is the source of truth for (re)scheduling.

### `catalog_service` / `catalog_plan` (bundled, read-only)
`id, name, aliases[], category, logoRef, cancelUrl, popularityRank` /
`id, serviceId, planName, amountMinor, currency, region, cycle`.

### `app_config`
Key/value for flags + preferences consumed by the feature registry
([config-registry](./config-registry.md)).

## Value objects (domain core, pure)

- **`Money { amountMinor: bigint, currency }`** — arithmetic, rounding, conversion via
  `Rates`. No floats anywhere.
- **`BillingCycle`** — normalization + next-renewal derivation (month-end/leap-year
  safe), monthly-equivalent factor.
- **`DateOnly`** — timezone-agnostic calendar date to avoid DST drift in renewal math.

## Migrations

Drizzle migrations are versioned and committed. Schema changes are additive where
possible; destructive changes require a migration test round-trip on a seeded DB.

## Privacy note

No card numbers, no bank identifiers, no contacts. `paymentLabel` is a free-text hint
only. See [data-inventory](../../privacy/data-inventory.md).
