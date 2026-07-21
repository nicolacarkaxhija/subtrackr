---
id: docs-index
title: Documentation Registry
status: living
owner: nicola
updated: 2026-07-21
---

# Documentation Registry

This is the **master index** for all Subtrackr documentation. Docs are modular:
each file is small and focused, with YAML front-matter (`id`, `title`, `status`,
`related`) so a human or an agent can select exactly what they need **without
loading the whole corpus into context**.

## How to use this registry

1. Find the topic in the tables below.
2. Open only the leaf doc(s) you need — each links to its `related` docs.
3. Registry docs (PRD, tech-spec, ADR index) are **thin**: they orient and link,
   they do not duplicate content.

## Product

| ID | Doc | Status | Purpose |
| --- | --- | --- | --- |
| `prd` | [product/prd.md](./product/prd.md) | living | Product requirements registry → feature specs |
| `feat-catalog` | [product/features/catalog.md](./product/features/catalog.md) | draft | Smart service catalog |
| `feat-ocr` | [product/features/ocr.md](./product/features/ocr.md) | draft | On-device receipt/screenshot OCR |
| `feat-manual-entry` | [product/features/manual-entry.md](./product/features/manual-entry.md) | draft | Manual subscription entry |
| `feat-reminders` | [product/features/reminders.md](./product/features/reminders.md) | draft | Renewal & grace-period reminders |
| `feat-analytics` | [product/features/analytics.md](./product/features/analytics.md) | draft | Multi-currency spend analytics |
| `feat-shared-plan` | [product/features/shared-plan-split.md](./product/features/shared-plan-split.md) | draft | Shared-plan cost splitting |
| `feat-cost-per-use` | [product/features/cost-per-use.md](./product/features/cost-per-use.md) | draft | Cost-per-use tracking |
| `feat-csv-export` | [product/features/csv-export.md](./product/features/csv-export.md) | draft | CSV data export/portability |

## Engineering

| ID | Doc | Status | Purpose |
| --- | --- | --- | --- |
| `tech-spec` | [engineering/tech-spec.md](./engineering/tech-spec.md) | living | Technical spec registry → modules + ADRs |
| `architecture` | [engineering/architecture.md](./engineering/architecture.md) | living | Hexagonal architecture overview |
| `adr-index` | [engineering/adr/README.md](./engineering/adr/README.md) | living | Architecture Decision Records index |
| `mod-config-registry` | [engineering/modules/config-registry.md](./engineering/modules/config-registry.md) | draft | Feature/config resolution engine |
| `mod-data-model` | [engineering/modules/data-model.md](./engineering/modules/data-model.md) | draft | Domain entities & schema |
| `mod-repository-sync` | [engineering/modules/repository-sync.md](./engineering/modules/repository-sync.md) | draft | Repository & sync ports |

## Privacy & legal

| ID | Doc | Status | Purpose |
| --- | --- | --- | --- |
| `privacy-policy` | [privacy/privacy-policy.md](./privacy/privacy-policy.md) | draft | User-facing privacy policy |
| `dpia` | [privacy/dpia.md](./privacy/dpia.md) | draft | Data Protection Impact Assessment |
| `data-inventory` | [privacy/data-inventory.md](./privacy/data-inventory.md) | draft | What data exists, where, why |

## Process

| ID | Doc | Status | Purpose |
| --- | --- | --- | --- |
| `testing-strategy` | [process/testing-strategy.md](./process/testing-strategy.md) | living | Test pyramid, coverage tiers, tooling |
| `ci-cd` | [process/ci-cd.md](./process/ci-cd.md) | living | Pipeline design (deferred activation) |
| `coding-standards` | [process/coding-standards.md](./process/coding-standards.md) | living | Lint, format, conventions, boundaries |
| `contributing` | [process/contributing.md](./process/contributing.md) | living | Local dev workflow & commit rules |

## Conventions

- **Status** values: `draft` → `living` → `stable` → `deprecated`.
- Every architectural decision gets an **ADR**; superseded ADRs stay in place and
  are marked `superseded-by`.
- Feature docs follow the template in [product/features/_template.md](./product/features/_template.md).
