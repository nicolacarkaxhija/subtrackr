---
id: mod-config-registry
title: Feature/Config Resolution Engine
status: living
implemented: packages/domain/src/features/feature-registry.ts
owner: nicola
updated: 2026-07-21
related: [adr-0006, adr-0005, adr-0001]
---

# Feature/Config Resolution Engine

The single source of truth for "is feature X available right now?" (ADR 0006).
Implemented as a class-based engine, not a plain object, so it can hold a dependency
graph, cache resolutions, and expose a stable injected API.

## The four axes

```
available(X) = capability(X) ∧ entitlement(X) ∧ flag(X) ∧ preference(X)
```

| Axis        | Source                                 | Mutable at runtime?     |
| ----------- | -------------------------------------- | ----------------------- |
| capability  | platform/device probe                  | no (per environment)    |
| entitlement | purchase state (free/pro)              | on purchase             |
| flag        | bundled defaults (+ remote seam later) | via app update / remote |
| preference  | user settings                          | yes (user)              |

If **any** axis is false, the feature is unavailable. `preference` cannot enable a
feature that `capability`/`entitlement`/`flag` disallow (it can only turn _off_).

## Feature definition (shape)

```ts
interface FeatureDefinition {
  key: FeatureKey; // e.g. "ocr", "ocr.web", "analytics.projections"
  tier: 'free' | 'pro'; // entitlement requirement
  platforms: Platform[]; // capability allow-list
  defaultFlag: boolean; // rollout / kill-switch default
  defaultPreference: boolean; // user toggle default
  requires?: FeatureKey[]; // dependency edges
  userConfigurable: boolean; // does it show a toggle?
}
```

## Dependency graph

- Features form a **DAG** via `requires`. Registry validation **rejects cycles** at
  construction time.
- Resolution is **transitive**: `available(X)` is false if any prerequisite is
  unavailable. Disabling a prerequisite **cascades** to dependents.
- Enables presets: a preset is a set of preference values; the graph keeps them
  consistent (can't enable a dependent while its prerequisite is off).

## Public API (injected everywhere)

```ts
class FeatureRegistry {
  constructor(defs: FeatureDefinition[], ctx: ResolutionContext);
  isAvailable(key: FeatureKey): boolean;
  explain(key: FeatureKey): AxisBreakdown; // why on/off — for UI + debugging
  setPreference(key: FeatureKey, on: boolean): void; // validates against graph
  applyPreset(preset: Preset): void;
  snapshot(): ResolvedState; // for tests / persistence
}
```

`ResolutionContext` supplies `{ platform, entitlement, flags, preferences }`; `flags`
is fed by a `ConfigSource` port (bundled now, remote-capable later — ADR 0002 seam).

## Testing (ADR 0009)

- **Property tests** on the resolver: for random DAGs + axis assignments,
  `available(X) ⇒ all(requires) available`; no cycle passes validation; preference
  never overrides a hard-off axis.
- **Mutation tested** — pure logic, no platform deps.
- Preset application is idempotent and graph-consistent.

## UX

- Settings surface **presets** ("Privacy Max", "Everything on", "Minimal") plus an
  advanced per-feature list showing `explain()` reasons for anything forced off (e.g.
  "Unavailable on web", "Requires Pro").
