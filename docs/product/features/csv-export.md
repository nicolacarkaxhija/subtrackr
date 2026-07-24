---
id: feat-csv-export
title: CSV Export / Data Portability
status: partial
owner: nicola
tier: pro
platforms: [ios, android, web]
related: [privacy-policy, mod-data-model]
implemented:
  - packages/domain/src/export/csv.ts (RFC-4180 exporter, BOM, round-trip fidelity)
  - apps/mobile/src/app/index.tsx (web download)
notes: >
  CSV export ships on web. JSON export and native file/share export are deferred. The
  Pro entitlement gate is not enforced yet (no paywall in v1).
---

# CSV Export / Data Portability

## Summary

One-tap export of all subscription data to a standard CSV (and JSON) file — user owns
and can move their data anywhere. Supports the GDPR right to portability.

## User stories

- As a user, I export my subscriptions to a spreadsheet.
- As a user leaving the app, I take my full dataset with me.

## Behaviour / rules

- Export includes every user-entered field; stable, documented column order.
- **Encoding:** UTF-8 with BOM for spreadsheet compatibility; RFC-4180 quoting.
- Amounts exported in **major units + currency** column (human-readable) with a
  separate minor-unit column for round-trip fidelity.
- Also offer **JSON** export (lossless, for re-import later).
- File written via the platform share/save sheet; nothing uploaded.

## Feature-registry wiring

- **Capability:** all platforms. **Entitlement:** pro. **Flag:** default on.
- **Preference:** n/a. **Depends on:** none.

## Acceptance criteria

- [ ] CSV round-trips (export → parse) without data loss on a fixture dataset.
- [ ] Special characters/commas/newlines correctly quoted (RFC-4180).
- [ ] Amounts exact (minor-unit column matches stored value).

## Open questions / risks

- Keep exporter in the domain core (pure) so it is property-testable independent of
  platform file APIs.
