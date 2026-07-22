---
id: feat-catalog
title: Smart Service Catalog
status: draft
owner: nicola
tier: free
platforms: [ios, android, web]
related: [feat-ocr, feat-manual-entry, mod-data-model]
---

# Smart Service Catalog

## Summary

A bundled, offline database of known subscription services. Typing (or OCR-detecting) a
service name autofills price, billing cycle, category, logo, and cancellation URL —
removing most manual entry.

## User stories

- As a user, I type "Netfl…" and pick Netflix; price/cycle/logo/category autofill.
- As a user offline, the catalog still works (bundled, no network).

## Behaviour / rules

- **Fuzzy search** over service names + aliases (e.g. "disney+", "disney plus").
- Ranking: exact prefix > alias match > fuzzy distance; ties broken by popularity rank.
- Autofilled values are **suggestions** — every field remains user-editable.
- Plans: a service may have multiple **plan templates** (e.g. Standard/Premium) with
  distinct prices/currencies; user picks one.
- **Region-aware defaults**: price/currency suggestion keyed by user's locale/region
  where data exists; otherwise show base plan + a "verify price" hint.
- Unknown service → fall through to [manual entry](./manual-entry.md); optionally
  remember as a **user-local custom service** (never uploaded).

## Feature-registry wiring

- **Capability:** all platforms.
- **Entitlement:** free.
- **Flag:** default on; kill-switch hides catalog suggestions (manual entry remains).
- **Preference:** "Suggest from catalog" toggle; default on.
- **Depends on:** none (foundational). OCR and manual entry depend on it.

## Data

`catalog_service` (bundled, read-only), `catalog_plan`, `subscription` (user rows
reference an optional `catalogServiceId`). See
[data-model](../../engineering/modules/data-model.md).

## Sourcing & legal (risk)

- **Data sourcing:** curated seed set (top ~200 services) shipped in-app; a documented
  update cadence via app releases. Prices are **estimates** and labelled as such.
- **Logos are trademarks.** Policy: prefer text/monogram or user-region-neutral marks;
  where a brand mark is used it is nominative (identifying the service). Maintain a
  `catalog/LOGO_POLICY.md` recording each asset's source and usage basis; allow a
  build without bundled logos (logos become a capability flag).

## Acceptance criteria

- [ ] Fuzzy search returns expected top hit for a table of name/alias fixtures.
- [ ] Selecting a service populates all mapped fields; each stays editable.
- [ ] Works with the network disabled.
- [ ] Multi-plan services present plan choices with correct currency.

## Open questions / risks

- Ongoing catalog maintenance cost; consider a signed, optional remote catalog refresh
  once remote config exists (ADR 0006 seam) — still anonymous, opt-in.
