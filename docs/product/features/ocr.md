---
id: feat-ocr
title: On-device OCR
status: draft
owner: nicola
tier: pro
platforms: [ios, android, web]
related: [feat-catalog, mod-config-registry]
---

# On-device OCR

## Summary

Extract subscription details from a receipt, screenshot, or PDF **on-device**. Output
is normalized against the [catalog](./catalog.md). Nothing leaves the device.

## User stories

- As a user, I photograph a receipt and the app pre-fills service, price, date.
- As a privacy-focused user, I trust that the image and text never leave my phone.

## Behaviour / rules

- **Adapters:** VisionKit (iOS), ML Kit (Android), WASM/`tesseract` (web, degraded).
- Pipeline: image → text → **field extraction** (amount, currency, date, merchant) →
  **catalog fuzzy-match** → editable draft subscription.
- **Currency/amount parsing** handles locale formats (1.234,56 vs 1,234.56) and symbols.
- Low-confidence fields are flagged for user confirmation; never silently committed.
- **Free tier:** small monthly OCR quota; **Pro:** unlimited (entitlement axis).
- Image is processed in memory and **not persisted** unless the user attaches it.

## Feature-registry wiring

- **Capability:** ios/android full; web degraded (flagged `ocr.web` off by default).
- **Entitlement:** pro beyond free quota.
- **Flag:** default on (mobile); kill-switch disables scanning entry point.
- **Preference:** "Scan receipts" toggle.
- **Depends on:** catalog (for normalization).

## Acceptance criteria

- [ ] Amount/currency/date parsed correctly across a fixture set of locales.
- [ ] Extracted merchant fuzzy-matches the right catalog service.
- [ ] Low-confidence fields surfaced for confirmation.
- [ ] No network calls occur during OCR (verified in integration test).
- [ ] Web build gracefully hides/limits OCR when capability is off.

## Open questions / risks

- Highest-risk v1 feature (three engines, device E2E). Mobile-first; web parity is a
  non-goal. Consider deferring web OCR entirely if quality is poor.
