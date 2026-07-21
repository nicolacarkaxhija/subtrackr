---
id: dpia
title: Data Protection Impact Assessment (Draft)
status: draft
owner: nicola
updated: 2026-07-21
related: [privacy-policy, data-inventory, adr-0002]
---

# Data Protection Impact Assessment (Draft)

> Lightweight DPIA for the zero-server v1. Revisit when a backend or sync is introduced
> (that changes the controller/processor analysis materially).

## 1. Processing overview

| Question | Answer (v1) |
| --- | --- |
| What is processed? | User-entered subscription data + optional on-device OCR |
| Where? | On the user's device only |
| By whom? | The user, on their device. The developer operates **no server** receiving data |
| Legal basis | Not applicable to developer processing — no server-side processing occurs. Local processing is under the user's own control |
| Special-category data? | No |
| Automated decisions/profiling? | No |
| International transfers? | None (no data leaves the device) |

## 2. Necessity & proportionality

- Data collected is the **minimum** needed to track subscriptions. No bank linkage, no
  contacts, no location, no advertising IDs.
- OCR is on-device; no image/text egress.

## 3. Controller/processor analysis

- In v1 the developer neither stores nor transmits personal data, so the classic
  controller/processor obligations (DPA, records of processing for user data,
  cross-border transfer safeguards) have **minimal applicability**.
- The **app store** processes purchase data as an independent controller; the developer
  receives only entitlement/receipt info.

## 4. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Device loss exposes local data | Medium | Medium | Rely on OS device encryption; optional app lock (biometric) roadmap; no cloud copy by default |
| Accidental inclusion of a tracker SDK | Low | High | Policy: no analytics/ad SDKs; dependency review in CI; documented in [data-inventory](./data-inventory.md) |
| Future sync leaks data | N/A v1 | High | Deferred; when added, **E2E encryption, user-held key**, zero-knowledge (ADR 0002) |
| OCR image retention | Low | Medium | Images processed in memory; not persisted unless user attaches |
| Export file mishandled by user | Low | Low | User-initiated; documented; no auto-upload |

## 5. Store privacy disclosures

- Apple **Privacy Nutrition Label** and Google **Data Safety** form: declare "data not
  collected"/"data not shared" for v1, matching reality. Re-file if sync/telemetry is
  added.

## 6. Review triggers

Re-run this DPIA before shipping any of: first-party backend, hosted sync, telemetry,
push server, remote config that identifies users.
