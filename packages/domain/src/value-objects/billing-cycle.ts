import type { DateOnly } from './date-only.js';

export type CycleUnit = 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'custom';

/**
 * A subscription billing cycle and the renewal-date math derived from it.
 * Renewal dates are always computed from the ORIGINAL anchor (never iteratively from
 * the previous renewal) so month-end anchoring is preserved:
 * Jan 31 → Feb 28 → Mar 31, not Jan 31 → Feb 28 → Mar 28.
 */
export class BillingCycle {
  private constructor(
    readonly unit: CycleUnit,
    /** Interval in days; only meaningful for `custom`, otherwise 0. */
    private readonly customDays: number,
  ) {}

  static weekly(): BillingCycle {
    return new BillingCycle('weekly', 0);
  }

  static monthly(): BillingCycle {
    return new BillingCycle('monthly', 0);
  }

  static quarterly(): BillingCycle {
    return new BillingCycle('quarterly', 0);
  }

  static semiannual(): BillingCycle {
    return new BillingCycle('semiannual', 0);
  }

  static annual(): BillingCycle {
    return new BillingCycle('annual', 0);
  }

  static custom(intervalDays: number): BillingCycle {
    if (!Number.isInteger(intervalDays) || intervalDays < 1) {
      throw new RangeError(`Custom interval must be a positive integer, got ${intervalDays}`);
    }
    return new BillingCycle('custom', intervalDays);
  }

  /** The custom interval in days, or `null` for non-custom cycles. */
  get customIntervalDays(): number | null {
    return this.unit === 'custom' ? this.customDays : null;
  }

  /** The date `periods` cycles after `date`, measured from `date` as the anchor. */
  advance(date: DateOnly, periods = 1): DateOnly {
    switch (this.unit) {
      case 'weekly':
        return date.addDays(7 * periods);
      case 'monthly':
        return date.addMonths(periods);
      case 'quarterly':
        return date.addMonths(3 * periods);
      case 'semiannual':
        return date.addMonths(6 * periods);
      case 'annual':
        return date.addMonths(12 * periods);
      case 'custom':
        return date.addDays(this.customDays * periods);
    }
  }

  /**
   * The earliest renewal date on or after `from`, given the subscription's `anchor`
   * (its first/first-known charge date). If `from` is on or before `anchor`, the
   * anchor itself is the next renewal.
   */
  nextRenewalOnOrAfter(anchor: DateOnly, from: DateOnly): DateOnly {
    let periods = 0;
    let renewal = anchor;
    while (renewal.isBefore(from)) {
      periods += 1;
      renewal = this.advance(anchor, periods);
    }
    return renewal;
  }
}
