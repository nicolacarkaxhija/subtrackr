---
id: adr-0006
title: Local, dependency-aware feature registry
status: accepted
date: 2026-07-21
related: [adr-0002, adr-0005, mod-config-registry]
---

# ADR 0006 — Local, dependency-aware feature registry

## Context

The app must be **fully configurable** — every feature granularly selectable — while
staying consistent across many call sites. "Is feature X on?" actually conflates four
questions, and configs depend on one another. A plain object is too weak; a SaaS flag
platform (LaunchDarkly/PostHog) is a network tracker that breaks the privacy thesis.

## Decision

Build a **local, dependency-aware feature registry** as a first-class class-based
engine (not a plain object). Effective availability is resolved as:

```
available(X) = capability(X) ∧ entitlement(X) ∧ flag(X) ∧ preference(X)
```

- **capability** — is X possible on this platform/device? (e.g. OCR on web)
- **entitlement** — is X unlocked for this tier? (free/pro, ADR 0005)
- **flag** — is X enabled / rolled-out / kill-switched?
- **preference** — has the user granularly turned X off?

The registry holds a **dependency graph** (feature B `requires` A); disabling a
prerequisite **cascades**. Resolution is fully **local** (bundled + user-set values,
no network), with a `SyncSource` **seam** so remote config can be added later (ADR 0002).

To avoid combinatorial UX/test explosion: the dependency graph **bounds valid states**,
we **property-test the resolver** rather than every feature combination, and the UI
ships **presets** ("Privacy Max", "Everything on") over raw switches.

## Alternatives considered

- **Plain config object** — no dependency handling, no single evaluation point.
- **Remote flag SaaS** — per-user tracking + network dependency; rejected.

## Consequences

- One injected evaluator is the single source of truth for gating everywhere.
- Kill-switches ship via app updates in v1 (no remote fetch).
- Exhaustive resolver semantics are specified in
  [mod-config-registry](../../engineering/modules/config-registry.md).
