# Work Ledger

Estimated **human** engineering effort for each commit — i.e. how long a competent
senior engineer would plausibly have taken to produce the same result unaided
(design + implementation + review + docs). Estimates are deliberately conservative
and expressed as a range.

Totals are recomputed at the bottom. One row per commit, newest at the top of its
section.

| Commit (type/scope)                                 | Summary                                                                                                                                                                                                | Est. human effort |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| `feat: converted monthly total in the summary`      | Show one approximate base-currency total + per-currency breakdown + rate date when multi-currency                                                                                                      | 0.5 – 1 h         |
| `feat: base-currency conversion (bundled rates)`    | Rates port + BundledRates (offline EUR table, exact mulDiv conversion) + monthlyTotalInBase; closes ADR 0008; TDD, 100% coverage & mutation                                                            | 2 – 3 h           |
| `feat: track and show cost-per-use`                 | Persist usesPerMonth, usage field in the form, per-card "X per use" line                                                                                                                               | 0.5 – 1 h         |
| `feat: cost-per-use (domain)`                       | Subscription.usesPerMonth + costPerUse (monthly cost / uses, uses the shared share); CSV column; TDD, 100% coverage & mutation                                                                         | 1.5 – 2 h         |
| `feat: CSV export from the app`                     | Export CSV action that downloads the file in the browser                                                                                                                                               | 0.5 – 1 h         |
| `feat: CSV exporter + Money.toDecimalString`        | RFC-4180 exporter (BOM, CRLF, quoting, minor-unit round-trip) + decimal-string rendering (inverse of parse); TDD, 100% coverage & mutation                                                             | 2 – 3 h           |
| `feat: catalog quick-add in the form`               | Type-ahead suggestions that autofill name, price, currency, cycle, category from the catalog                                                                                                           | 1 – 1.5 h         |
| `feat: bundled service catalog + fuzzy search`      | @subtrackr/catalog package: curated ~30-service seed + ranked fuzzy search (exact/prefix/substring/subsequence, popularity ties); TDD, 100% coverage, 95% mutation                                     | 3 – 4 h           |
| `feat: free-trial grace-period countdowns`          | Trial-end field on the form + "Free trial: N days left" countdown on cards (in-app), using the tested domain trial math                                                                                | 1 – 1.5 h         |
| `feat: shared plans (persist + UI)`                 | Codec serialization for sharedWith, add/edit form field, and per-card "your share" line                                                                                                                | 1 – 1.5 h         |
| `feat: equal-split shared plans`                    | Money.equalShare (payer's share, absorbs remainder), Subscription.sharedWith + myMonthlyCost, spend uses the user share; TDD + property + mutation                                                     | 2 – 3 h           |
| `feat: edit subscriptions`                          | Dual-mode form (id param loads and prefills, submits via the update use case) + Edit action on each card; verified in-browser                                                                          | 1.5 – 2 h         |
| `feat: update use case`                             | SubscriptionService.update (replace editable fields, preserve id and status); 100% coverage & mutation                                                                                                 | 1 – 1.5 h         |
| `feat: add-subscription form`                       | Modal form (name, price + currency, cycle incl. custom, first-charge date, category) wired to the service; parsing reuses the domain; inline validation                                                | 2 – 3 h           |
| `feat: Money.parse`                                 | Decimal-string amount parser (two-decimal minor unit, rejects malformed input); TDD, 95% mutation                                                                                                      | 1 – 1.5 h         |
| `feat: spend summary UI`                            | Monthly and yearly spend summary card on the Subscriptions screen                                                                                                                                      | 0.5 – 1 h         |
| `feat: monthly-equivalent cost math + spend totals` | Money.mulDiv (rational scaling, round half away from zero), BillingCycle.monthlyEquivalentFactor (365.25-day year), Subscription.monthlyCost, per-currency spend totals; TDD + property + mutation     | 3 – 5 h           |
| `feat: web persistence via localStorage`            | Wire the app to the persistent repository through a localStorage KeyValueStore; subscriptions survive reload                                                                                           | 1 – 2 h           |
| `feat: key-value persistence + durable repository`  | KeyValueStore port, PersistentSubscriptionRepository (lazy hydrate, write-through, same contract as in-memory), schema-versioned JSON codec preserving bigint amounts; durability tests; 100% coverage | 4 – 6 h           |
| `feat: rebrand app shell + fix web layout`          | Replace Expo template chrome with a clean Stack layout + Subtrackr branding; centered max-width column with explicit width chain; remove demo components; verified running on web                      | 2 – 3 h           |
| `feat: Expo app + subscriptions screen`             | @subtrackr/mobile Expo SDK 57 app in the pnpm monorepo (Metro config), Subscriptions screen wired to the real service (in-memory repo + system clock + UUID gen); web bundle builds end-to-end         | 4 – 6 h           |
| `refactor: extensionless relative imports`          | Drop `.js` from relative imports so Metro resolves TS sources (tsc/Vitest still green)                                                                                                                 | 0.5 – 1 h         |
| `feat: application package + SubscriptionService`   | @subtrackr/application; subscription lifecycle service (add/list/get/pause/resume/cancel/remove) over the ports; tested against the in-memory adapter + ManualClock; 100% coverage & mutation          | 4 – 6 h           |
| `feat: IdGenerator port`                            | Port so use cases mint ids without a platform RNG (pure/deterministic)                                                                                                                                 | 0.5 – 1 h         |
| `feat: persistence package + in-memory repository`  | @subtrackr/persistence package, InMemorySubscriptionRepository (upsert, soft-delete tombstones, resurrect, copy-on-read), reusable cross-adapter contract test (14 cases)                              | 5 – 8 h           |
| `feat: Clock port + repository port`                | Clock port + deterministic ManualClock (100% mutation), SubscriptionRepository + SubscriptionRecord ports; hexagonal seam across packages                                                              | 2 – 3 h           |
| `feat: Subscription entity`                         | Pure domain model: validated construction, immutable status machine, next-renewal, trial helpers; TDD. Mutation testing caught collection-time fixtures masking guards → fixed, 100% mutation score    | 5 – 7 h           |
| `fix: exclude mutation output from lint`            | Stop ESLint linting `.stryker-tmp`/reports (false errors blocking pre-push)                                                                                                                            | 0.25 – 0.5 h      |
| `feat: dependency-aware feature registry`           | Four-axis resolver + DAG validation (duplicate/unknown/cycle with path), transitive cascade, atomic presets with rollback, `explain()`; TDD + mutation hardening 79.5 → 93.0%                          | 6 – 9 h           |
| `feat: Money value object`                          | Exact bigint money with currency safety; largest-remainder `allocate()` (the shared-plan invariant); TDD red-green + mutation-driven hardening 82.8 → 98.1%                                            | 4 – 6 h           |
| `style: prettier formatting`                        | Format all docs/config authored before the toolchain existed                                                                                                                                           | 0.25 – 0.5 h      |
| `test: harden domain tests`                         | Close mutation-revealed gaps (every month length, error messages, ISO padding); mutation score 95.98 → 98.85%                                                                                          | 1.5 – 2.5 h       |
| `fix: tooling configuration`                        | ESLint dot-CJS ignore, dep-cruiser excludes, coverage arg-forwarding fix; first install + full gate run                                                                                                | 1.5 – 3 h         |
| `ci: deferred CI/CD workflows`                      | GitHub Actions CI + release workflows, gated off via `CI_ENABLED` until credits return                                                                                                                 | 1.5 – 2.5 h       |
| `feat: DateOnly + BillingCycle`                     | Two pure value objects with month-end/leap-year renewal math; unit tables + fast-check property tests                                                                                                  | 4 – 6 h           |
| `chore: scaffold domain package`                    | Domain package with strict tsconfig, Vitest (100% gate), Stryker config                                                                                                                                | 0.5 – 1 h         |
| `chore: workspace tooling + gates`                  | pnpm workspace, ESLint flat + domain-purity rules, Prettier, commitlint, lint-staged, Changesets, dependency-cruiser, Husky hooks                                                                      | 3 – 5 h           |
| `docs: process and privacy docs`                    | Testing strategy, CI/CD, coding standards, contributing; privacy policy, DPIA, data inventory                                                                                                          | 5 – 8 h           |
| `docs: tech spec + module designs`                  | Tech-spec registry, architecture overview + ports, config-registry/data-model/repository-sync module docs                                                                                              | 5 – 8 h           |
| `docs: PRD + feature specs`                         | PRD registry, 8 feature specs with edge cases + acceptance criteria, template                                                                                                                          | 5 – 7 h           |
| `docs: registry + ADRs`                             | Docs registry + 11 ADRs capturing every design decision & alternatives                                                                                                                                 | 4 – 6 h           |
| `chore: initialize repository`                      | git init, `.gitignore`, `.gitattributes`, PolyForm license, README                                                                                                                                     | 1.5 – 2.5 h       |

> Note: the design-decision work behind the ADRs (the grilling/architecture session)
> would realistically be several additional hours of senior/architect time; it is
> folded conservatively into the ADR and spec rows above.

## Running total

| Metric                        | Value  |
| ----------------------------- | ------ |
| Commits logged                | 44     |
| Estimated human effort (low)  | 94.5 h |
| Estimated human effort (high) | 146 h  |

> Methodology: estimates cover the equivalent hand-written work, not the elapsed
> assisted time. Research/decision work captured in ADRs is attributed to the commit
> that introduces the corresponding artifact.
