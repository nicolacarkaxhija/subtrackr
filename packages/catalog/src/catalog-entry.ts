import type { CycleUnit } from '@subtrackr/domain';

/**
 * A known subscription service. Prices are indicative defaults the user can edit; they
 * are not guaranteed current (see feat-catalog). Amounts are integer minor units.
 */
export interface CatalogEntry {
  readonly id: string;
  readonly name: string;
  /** Alternate spellings that should also match this entry in search. */
  readonly aliases: readonly string[];
  readonly category: string;
  readonly amountMinor: number;
  readonly currency: string;
  readonly cycle: CycleUnit;
}
