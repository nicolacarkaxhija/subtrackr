---
id: architecture
title: Hexagonal Architecture Overview
status: living
owner: nicola
updated: 2026-07-21
related: [adr-0003, mod-repository-sync, mod-config-registry]
---

# Hexagonal Architecture Overview

Subtrackr is built as **ports & adapters** (ADR 0003). The domain core is a pure-TS
hexagon; everything platform-specific is an adapter plugged into a port.

```
                 ┌─────────────────────────────────────────┐
   UI (Expo) ───▶│  Application / Use Cases                 │
   TanStack Q    │  (add subscription, compute analytics,   │
                 │   split plan, schedule reminders, export) │
                 │                                           │
                 │  Domain core (pure TS)                    │
                 │  entities · value objects (Money, Cycle)  │
                 │  feature registry · policies              │
                 └───▲───────▲───────▲───────▲───────▲───────┘
                     │       │       │       │       │  ports
              Repository  Sync   Clock   Rates    Ocr / Notifier
                     │       │       │       │       │
        ┌────────────┴┐ ┌────┴───┐ ┌─┴──┐ ┌──┴───┐ ┌─┴───────────┐
        │ SQLite      │ │ local  │ │sys │ │bundled│ │VisionKit /  │
        │ native/web  │ │ (later │ │clock│ │rates │ │ML Kit / WASM│
        │ (Drizzle)   │ │ iCloud)│ └────┘ └──────┘ │· local notif │
        └─────────────┘ └────────┘                 └─────────────┘
                         adapters
```

## Ports (interfaces owned by the domain)

| Port | Purpose | v1 adapter(s) |
| --- | --- | --- |
| `Repository<T>` | CRUD + query for entities | SQLite native (`op-sqlite`), web (WASM) |
| `SyncProvider` | Push/pull encrypted state | local no-op (iCloud/Drive later) |
| `Clock` | Current time, timezone | system clock (fake in tests) |
| `Rates` | Currency conversion | bundled rate table |
| `Ocr` | Image → extracted fields | VisionKit / ML Kit / WASM |
| `Notifier` | Schedule/cancel local notifications | expo-notifications |
| `ConfigSource` | Read/write flags & preferences | on-device store (remote seam later) |

## Rules

1. Dependencies point **inward**: adapters depend on the domain, never the reverse.
2. The domain core has **no imports** of React, Expo, SQLite, or platform APIs
   (dependency-cruiser enforces this).
3. Use cases orchestrate entities + ports; they contain no framework code.
4. All non-determinism (time, randomness for IDs, rates, I/O) enters through a port so
   the core is fully testable and mutation-testable (ADR 0009).

## Data flow example — "add from catalog"

1. UI calls `addSubscription` use case with a catalog service id + user overrides.
2. Use case builds a `Subscription` entity (validates via value objects).
3. `Clock` stamps `createdAt/updatedAt`; a UUIDv7 id is generated.
4. `Repository.save` persists via the platform SQLite adapter.
5. `Notifier` schedules reminders per resolved feature flags.
6. TanStack Query invalidates; UI re-renders.
