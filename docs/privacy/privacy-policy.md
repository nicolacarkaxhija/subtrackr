---
id: privacy-policy
title: Privacy Policy (Draft)
status: draft
owner: nicola
updated: 2026-07-21
related: [dpia, data-inventory, adr-0002]
---

# Subtrackr Privacy Policy (Draft)

> Draft for engineering alignment. A lawyer must review before publication. Reflects the
> zero-server v1 (ADR 0002).

## The short version

**Subtrackr stores your subscription data on your device. We do not have a server that
receives it. We have no account system. We do not sell, share, or transmit your data.**

## What data exists

All data you enter (subscription names, amounts, dates, categories, notes, usage logs,
shared-plan labels) is stored **locally** on your device. See
[data-inventory](./data-inventory.md) for the full list.

We do **not** collect: bank or card numbers, bank logins, contacts, precise location,
advertising identifiers, or biometric data.

## OCR / receipt scanning

Image processing for receipt scanning happens **entirely on your device**. Images and
extracted text are **not uploaded**. Images are not stored unless you explicitly attach
one to a subscription.

## Analytics & crash reporting

We ship **no third-party analytics or advertising SDKs**. Any diagnostic reporting is
**off by default**, processed on-device where possible, and **opt-in**.

## Exchange rates

Currency conversion uses **rate data bundled in the app** (updated via app releases). No
per-user network request is made for rates in v1.

## Sync (future)

Optional sync is **not** in this version. When added, it will go through **your own**
cloud account (e.g. iCloud/Drive), **end-to-end encrypted** with a key only you hold —
we still won't be able to read your data.

## Your rights (GDPR/CCPA)

Because your data lives on your device and we don't hold it:

- **Access/portability:** export everything to CSV/JSON at any time (in-app).
- **Erasure:** delete entries or uninstall the app to remove all local data.
- **No processing by us:** we are not processing your data on a server, so there is
  nothing for us to delete on our side.

## Payments

In-app purchase (one-time Pro) is handled by the platform store (Apple/Google). We
receive the store's purchase receipt/entitlement, not your payment details.

## Children

Not directed at children under 13/16 (per jurisdiction).

## Contact

`privacy@<domain>` — to be finalized before launch.

## Changes

Material changes will be noted in the app and the changelog.
