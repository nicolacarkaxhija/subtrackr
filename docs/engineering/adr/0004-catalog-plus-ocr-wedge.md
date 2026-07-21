---
id: adr-0004
title: Catalog + on-device OCR as the v1 wedge
status: accepted
date: 2026-07-21
related: [adr-0001, feat-catalog, feat-ocr]
---

# ADR 0004 — Catalog + on-device OCR as the v1 wedge

## Context

The differentiator over Bobby/Subby is **killing data-entry friction** without
touching a bank or a server. Candidate mechanisms: a bundled service catalog, on-device
OCR, and share-sheet/paste parsing.

## Decision

Ship **catalog + OCR together** in v1:

- **Catalog** — a bundled, offline database of known services (price, cycle, logo,
  category, cancellation URL). Typing a name autofills the rest. Works on all platforms.
- **OCR** — on-device receipt/screenshot extraction, **mobile-focused**: VisionKit
  (iOS), ML Kit (Android), WASM fallback (web). OCR output is **normalized against the
  catalog** (fuzzy match → autofill), so the two are complementary, not redundant.

**Web is a secondary/demo surface**: OCR and notifications are degraded there.

## Alternatives considered

- **Catalog only in v1, OCR in v1.1** — lower risk and CI cost (recommended during
  grilling); rejected in favor of a more complete first release.
- **OCR only** — useless without the catalog to normalize noisy output.

## Consequences / risks

- OCR is the **highest-risk, highest-cost** part of v1: three engines, device-based
  E2E, variable output quality. Tracked as a risk in the [PRD](../../product/prd.md).
- **Catalog data is a hidden cost + legal wrinkle**: prices go stale and bundling
  brand **logos** raises trademark/brand-guideline concerns. Sourcing and logo-usage
  policy are tracked in [feat-catalog](../../product/features/catalog.md).
- Web OCR quality is explicitly out of scope for parity.
