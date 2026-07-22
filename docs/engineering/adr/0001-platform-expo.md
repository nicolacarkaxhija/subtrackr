---
id: adr-0001
title: Cross-platform via Expo (iOS/Android/Web)
status: accepted
date: 2026-07-21
related: [adr-0002, adr-0003]
---

# ADR 0001 — Cross-platform via Expo (iOS/Android/Web)

## Context

The disruption thesis (see [PRD](../../product/prd.md)) is on-device, privacy-first
subscription tracking. The brainstorm implies native mobile capabilities (OCR,
lock-screen actions, local notifications) while the "ultimately published" goal and
a desire for a web presence pull toward the web. We want one codebase, not three.

## Decision

Build on **Expo (React Native + `react-native-web`)**, targeting **iOS, Android, and
Web** from a single TypeScript codebase, using Expo Router for navigation. A shared
**domain core** holds business logic; **platform capability adapters** provide
native features where available and degrade gracefully where not.

## Alternatives considered

- **Local-first PWA only** — fastest to publish, but forfeits real OCR, lock-screen
  actions, and reliable notifications.
- **iOS-native (Swift) first** — best OCR/iCloud UX, but single-platform and diverges
  from the shared-core goal.
- **Separate web (Vite) + native (Expo) shells over a shared core** — best per-platform
  quality, but ~2× shell work. Reconsider if web becomes first-class (see ADR 0004).

## Consequences

- One dependency tree, one test toolchain, shared domain logic.
- Web is a **secondary** surface (see ADR 0004): `react-native-web` yields a working
  but not best-in-class PWA; some native features are degraded on web.
- Feature availability becomes **platform-dependent**, which is modeled explicitly as
  the _capability_ axis of the feature registry (ADR 0006).
- CI must eventually cover three targets, including device-based mobile E2E.
