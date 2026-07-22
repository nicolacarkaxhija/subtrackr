# Work Ledger

Estimated **human** engineering effort for each commit — i.e. how long a competent
senior engineer would plausibly have taken to produce the same result unaided
(design + implementation + review + docs). Estimates are deliberately conservative
and expressed as a range.

Totals are recomputed at the bottom. One row per commit, newest at the top of its
section.

| Commit (type/scope)                       | Summary                                                                                                                                                                       | Est. human effort |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `feat: dependency-aware feature registry` | Four-axis resolver + DAG validation (duplicate/unknown/cycle with path), transitive cascade, atomic presets with rollback, `explain()`; TDD + mutation hardening 79.5 → 93.0% | 6 – 9 h           |
| `feat: Money value object`                | Exact bigint money with currency safety; largest-remainder `allocate()` (the shared-plan invariant); TDD red-green + mutation-driven hardening 82.8 → 98.1%                   | 4 – 6 h           |
| `style: prettier formatting`              | Format all docs/config authored before the toolchain existed                                                                                                                  | 0.25 – 0.5 h      |
| `test: harden domain tests`               | Close mutation-revealed gaps (every month length, error messages, ISO padding); mutation score 95.98 → 98.85%                                                                 | 1.5 – 2.5 h       |
| `fix: tooling configuration`              | ESLint dot-CJS ignore, dep-cruiser excludes, coverage arg-forwarding fix; first install + full gate run                                                                       | 1.5 – 3 h         |
| `ci: deferred CI/CD workflows`            | GitHub Actions CI + release workflows, gated off via `CI_ENABLED` until credits return                                                                                        | 1.5 – 2.5 h       |
| `feat: DateOnly + BillingCycle`           | Two pure value objects with month-end/leap-year renewal math; unit tables + fast-check property tests                                                                         | 4 – 6 h           |
| `chore: scaffold domain package`          | Domain package with strict tsconfig, Vitest (100% gate), Stryker config                                                                                                       | 0.5 – 1 h         |
| `chore: workspace tooling + gates`        | pnpm workspace, ESLint flat + domain-purity rules, Prettier, commitlint, lint-staged, Changesets, dependency-cruiser, Husky hooks                                             | 3 – 5 h           |
| `docs: process and privacy docs`          | Testing strategy, CI/CD, coding standards, contributing; privacy policy, DPIA, data inventory                                                                                 | 5 – 8 h           |
| `docs: tech spec + module designs`        | Tech-spec registry, architecture overview + ports, config-registry/data-model/repository-sync module docs                                                                     | 5 – 8 h           |
| `docs: PRD + feature specs`               | PRD registry, 8 feature specs with edge cases + acceptance criteria, template                                                                                                 | 5 – 7 h           |
| `docs: registry + ADRs`                   | Docs registry + 11 ADRs capturing every design decision & alternatives                                                                                                        | 4 – 6 h           |
| `chore: initialize repository`            | git init, `.gitignore`, `.gitattributes`, PolyForm license, README                                                                                                            | 1.5 – 2.5 h       |

> Note: the design-decision work behind the ADRs (the grilling/architecture session)
> would realistically be several additional hours of senior/architect time; it is
> folded conservatively into the ADR and spec rows above.

## Running total

| Metric                        | Value   |
| ----------------------------- | ------- |
| Commits logged                | 16      |
| Estimated human effort (low)  | 42.75 h |
| Estimated human effort (high) | 67 h    |

> Methodology: estimates cover the equivalent hand-written work, not the elapsed
> assisted time. Research/decision work captured in ADRs is attributed to the commit
> that introduces the corresponding artifact.
