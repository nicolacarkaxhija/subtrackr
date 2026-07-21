<div align="center">

# Subtrackr

**The privacy-first subscription tracker that kills data-entry friction — without ever seeing your data.**

[![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?logo=githubactions&logoColor=white)](.github/workflows/ci.yml)
[![License: PolyForm Noncommercial](https://img.shields.io/badge/license-PolyForm_Noncommercial-blue.svg)](./LICENSE)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

</div>

---

## Why Subtrackr

Existing manual trackers (Bobby, Subby) respect your privacy but make you type
everything by hand. Bank-linked trackers (Rocket Money, PocketGuard) remove the
typing but hoover up your financial data through Plaid.

**Subtrackr removes the typing _and_ keeps everything on your device.** No bank
link. No account. No server that sees your data.

- **Smart catalog** — type a name, get price, cycle, logo, and cancellation link autofilled.
- **On-device OCR** — scan a receipt or screenshot; nothing leaves the phone (mobile).
- **Zero-server** — data lives in a local encrypted store; optional sync (later) goes through _your_ cloud, end-to-end encrypted.
- **Optimization** — shared-plan splitting, cost-per-use, multi-currency spend analytics.
- **Fully configurable** — every feature is a granular, dependency-aware toggle.

## Status

> Pre-release. v1 is in active development. See [`docs/`](./docs/README.md) for the
> living PRD, tech spec, and architecture decisions.

## Platforms

| Platform | Status | Notes |
| --- | --- | --- |
| iOS | Primary | Full OCR (VisionKit), local notifications |
| Android | Primary | Full OCR (ML Kit), local notifications |
| Web (PWA) | Secondary | WASM-SQLite; degraded OCR & notifications |

## Documentation

All docs are a **modular registry** — small, focused files you can load without
blowing your context. Start at **[docs/README.md](./docs/README.md)**.

- [Product Requirements (PRD)](./docs/product/prd.md)
- [Technical Specification](./docs/engineering/tech-spec.md)
- [Architecture Decision Records](./docs/engineering/adr/)
- [Testing Strategy](./docs/process/testing-strategy.md)
- [Privacy & DPIA](./docs/privacy/privacy-policy.md)
- [Work Ledger](./WORK_LEDGER.md) — estimated human effort per commit

## Tech stack

TypeScript (strict) · Expo (React Native + react-native-web) · Drizzle ORM over
SQLite (op-sqlite native / WASM web) · Vitest + fast-check + Stryker · Maestro +
Playwright · GitHub Actions · Changesets.

See [ADR index](./docs/engineering/adr/README.md) for the reasoning behind each choice.

## Development

```bash
# prerequisites: Node >=20, pnpm >=9
pnpm install
pnpm dev        # start Expo (choose platform)
pnpm test       # unit + integration
pnpm lint       # eslint + prettier check
pnpm typecheck  # tsc --noEmit
```

Full guide: [docs/process/contributing.md](./docs/process/contributing.md).

## License

[PolyForm Noncommercial 1.0.0](./LICENSE) — source is public for study and
non-commercial use. Commercial rights are reserved by the author.
