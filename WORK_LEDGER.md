# Work Ledger

Estimated **human** engineering effort for each commit — i.e. how long a competent
senior engineer would plausibly have taken to produce the same result unaided
(design + implementation + review + docs). Estimates are deliberately conservative
and expressed as a range.

Totals are recomputed at the bottom. One row per commit, newest at the top of its
section.

| Commit (type/scope) | Summary | Est. human effort |
| --- | --- | --- |
| `docs: process and privacy docs` | Testing strategy, CI/CD, coding standards, contributing; privacy policy, DPIA, data inventory | 5 – 8 h |
| `docs: tech spec + module designs` | Tech-spec registry, architecture overview + ports, config-registry/data-model/repository-sync module docs | 5 – 8 h |
| `docs: PRD + feature specs` | PRD registry, 8 feature specs with edge cases + acceptance criteria, template | 5 – 7 h |
| `docs: registry + ADRs` | Docs registry + 11 ADRs capturing every design decision & alternatives | 4 – 6 h |
| `chore: initialize repository` | git init, `.gitignore`, `.gitattributes`, PolyForm license, README | 1.5 – 2.5 h |

> Note: the design-decision work behind the ADRs (the grilling/architecture session)
> would realistically be several additional hours of senior/architect time; it is
> folded conservatively into the ADR and spec rows above.

## Running total

| Metric | Value |
| --- | --- |
| Commits logged | 5 |
| Estimated human effort (low) | 20.5 h |
| Estimated human effort (high) | 31.5 h |

> Methodology: estimates cover the equivalent hand-written work, not the elapsed
> assisted time. Research/decision work captured in ADRs is attributed to the commit
> that introduces the corresponding artifact.
