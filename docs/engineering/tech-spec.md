---
id: tech-spec
title: Subtrackr — Technical Specification (Registry)
status: living
owner: nicola
updated: 2026-07-21
related: [architecture, adr-index, prd]
---

# Subtrackr — Technical Specification

> **Registry doc.** Thin orientation + links. Detail lives in the module docs and ADRs.

## Stack

| Concern           | Choice                                                     | ADR       |
| ----------------- | ---------------------------------------------------------- | --------- |
| Language          | TypeScript, strict + `noUncheckedIndexedAccess`            | 0010      |
| App framework     | Expo (React Native + react-native-web), Expo Router        | 0001      |
| Architecture      | Hexagonal (ports & adapters)                               | 0003      |
| Persistence       | Drizzle ORM over SQLite: `op-sqlite` (native) / WASM (web) | 0003      |
| Reactivity        | TanStack Query over the repository                         | 0003      |
| Feature/config    | Local dependency-aware registry (class-based)              | 0006      |
| Money             | Integer minor units + `Money` value object                 | 0008      |
| i18n              | `Intl` formatting; externalized strings, EN v1             | 0008      |
| Testing           | Vitest + fast-check + Stryker; Maestro; Playwright         | 0009      |
| Lint/format       | ESLint flat + Prettier + dependency-cruiser                | 0010      |
| Commits/release   | Conventional Commits + Changesets                          | 0010      |
| Package mgmt      | pnpm workspaces                                            | 0010      |
| Crypto (deferred) | libsodium XChaCha20-Poly1305, user-held key                | 0002/0007 |

## Repository layout (target)

```
subscription-tracker/
├─ apps/
│  └─ mobile/            # Expo app (iOS/Android/Web via RNW)
├─ packages/
│  ├─ domain/            # pure-TS core: entities, value objects, use cases, ports
│  ├─ persistence/       # Drizzle schema + Repository adapters (native/web)
│  ├─ config/            # feature registry engine + feature definitions
│  ├─ catalog/           # bundled service catalog + fuzzy search
│  └─ ui/                # shared RN components (optional split)
├─ docs/                 # this registry
├─ .changeset/
└─ .github/workflows/    # inert until CI credits (ADR 0010)
```

## Modules

| ID                    | Doc                                                        | Responsibility                  |
| --------------------- | ---------------------------------------------------------- | ------------------------------- |
| `architecture`        | [architecture.md](./architecture.md)                       | Hexagonal overview, ports list  |
| `mod-config-registry` | [modules/config-registry.md](./modules/config-registry.md) | Feature resolution engine       |
| `mod-data-model`      | [modules/data-model.md](./modules/data-model.md)           | Entities, schema, sync fields   |
| `mod-repository-sync` | [modules/repository-sync.md](./modules/repository-sync.md) | Repository + SyncProvider ports |

## Cross-cutting requirements

- **Domain purity:** `packages/domain` imports no framework/platform code (enforced by
  dependency-cruiser). Enables mutation testing (ADR 0009).
- **No telemetry** by default; diagnostics on-device + opt-in only (ADR 0002).
- **Accessibility:** components meet WCAG 2.2 AA where applicable; RN a11y props required.
- **Determinism:** all time via a `Clock` port; all money via `Money`; no `Date.now()`
  or floats in the domain core.
