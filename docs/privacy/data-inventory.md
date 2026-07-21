---
id: data-inventory
title: Data Inventory
status: draft
owner: nicola
updated: 2026-07-21
related: [privacy-policy, dpia, mod-data-model]
---

# Data Inventory

Every category of data the app touches, where it lives, and why. Kept in sync with the
[data model](../../engineering/modules/data-model.md). "Egress" = does it ever leave the
device.

## User-entered data (local only)

| Data | Purpose | Storage | Egress |
| --- | --- | --- | --- |
| Subscription name, amount, currency, cycle, dates | Core tracking | Local SQLite | None |
| Category, notes, URL, payment **label** (free-text) | Organization | Local SQLite | None |
| Trial end date | Grace-period reminders | Local SQLite | None |
| Shared-plan member labels + split | Cost splitting | Local SQLite | None |
| Usage logs (counts) | Cost-per-use | Local SQLite | None |
| Reminder settings | Local notifications | Local SQLite | None |
| App preferences / feature flags | Configuration | Local SQLite / KV | None |

## Derived / transient

| Data | Purpose | Storage | Egress |
| --- | --- | --- | --- |
| OCR image + extracted text | Autofill from receipts | **In memory** (not persisted unless user attaches) | None |
| Analytics aggregates | Spend insights | Computed on device | None |
| Bundled exchange rates | Currency conversion | Shipped in app bundle | N/A (inbound only) |
| Bundled service catalog | Autofill | Shipped in app bundle | N/A (inbound only) |

## Explicitly NOT collected

Bank/card numbers · bank credentials · Plaid/aggregator tokens · contacts · precise
location · advertising identifiers · biometrics · device fingerprinting · third-party
analytics/ad SDK data.

## Third parties

| Party | Data they get | Notes |
| --- | --- | --- |
| Apple / Google (IAP) | Purchase receipt / entitlement | Independent controller; we get entitlement, not payment details |
| App stores (distribution) | Standard install metrics | Aggregate, store-side |

## Future (deferred, will update inventory)

| Data | Trigger | Safeguard |
| --- | --- | --- |
| Encrypted sync payload | Cloud sync feature | E2E encrypted, user-held key; provider sees ciphertext only |
| Anonymous flag fetch | Remote config | Anonymous, opt-in, disclosed; IP visible to CDN only |
