import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { BillingCycle } from './billing-cycle.js';
import { DateOnly } from './date-only.js';

const iso = (s: string): DateOnly => DateOnly.fromISO(s);

describe('BillingCycle.custom', () => {
  it('exposes the interval for custom cycles', () => {
    expect(BillingCycle.custom(10).customIntervalDays).toBe(10);
  });

  it('returns null interval for non-custom cycles', () => {
    expect(BillingCycle.monthly().customIntervalDays).toBeNull();
  });

  it.each([0, -1, 1.5, Number.NaN])('rejects invalid interval %s', (n) => {
    expect(() => BillingCycle.custom(n)).toThrow(RangeError);
    expect(() => BillingCycle.custom(n)).toThrow(/must be a positive integer/);
  });

  it('accepts an interval of exactly 1 day', () => {
    expect(BillingCycle.custom(1).customIntervalDays).toBe(1);
  });
});

describe('BillingCycle.advance', () => {
  it('weekly adds 7 days per period', () => {
    expect(BillingCycle.weekly().advance(iso('2026-01-01'), 3).toISO()).toBe('2026-01-22');
  });

  it('monthly clamps month-ends from the anchor', () => {
    const monthly = BillingCycle.monthly();
    const anchor = iso('2026-01-31');
    expect(monthly.advance(anchor, 1).toISO()).toBe('2026-02-28');
    expect(monthly.advance(anchor, 2).toISO()).toBe('2026-03-31'); // re-anchored, not Feb+1
    expect(monthly.advance(anchor, 3).toISO()).toBe('2026-04-30');
  });

  it('quarterly / semiannual / annual step correctly', () => {
    const anchor = iso('2026-01-15');
    expect(BillingCycle.quarterly().advance(anchor, 1).toISO()).toBe('2026-04-15');
    expect(BillingCycle.semiannual().advance(anchor, 1).toISO()).toBe('2026-07-15');
    expect(BillingCycle.annual().advance(anchor, 1).toISO()).toBe('2027-01-15');
  });

  it('custom adds N days per period', () => {
    // 2 × 45 = 90 days after Jan 1 (day-of-year 1) → day-of-year 91 → Apr 1.
    expect(BillingCycle.custom(45).advance(iso('2026-01-01'), 2).toISO()).toBe('2026-04-01');
  });

  it('defaults to a single period', () => {
    expect(BillingCycle.monthly().advance(iso('2026-01-15')).toISO()).toBe('2026-02-15');
  });
});

describe('BillingCycle.nextRenewalOnOrAfter', () => {
  const monthly = BillingCycle.monthly();

  it('returns the anchor when from is before the anchor', () => {
    expect(monthly.nextRenewalOnOrAfter(iso('2026-06-10'), iso('2026-01-01')).toISO()).toBe(
      '2026-06-10',
    );
  });

  it('returns the anchor when from equals the anchor', () => {
    expect(monthly.nextRenewalOnOrAfter(iso('2026-06-10'), iso('2026-06-10')).toISO()).toBe(
      '2026-06-10',
    );
  });

  it('finds the next renewal strictly needed after from', () => {
    // anchor Jan 15; today Jan 20 → next is Feb 15.
    expect(monthly.nextRenewalOnOrAfter(iso('2026-01-15'), iso('2026-01-20')).toISO()).toBe(
      '2026-02-15',
    );
  });

  it('lands exactly on a renewal date (on-or-after is inclusive)', () => {
    expect(monthly.nextRenewalOnOrAfter(iso('2026-01-15'), iso('2026-03-15')).toISO()).toBe(
      '2026-03-15',
    );
  });

  it('preserves month-end anchoring far from the anchor', () => {
    // Jan 31 anchor, asked in mid-July → July has 31 days.
    expect(monthly.nextRenewalOnOrAfter(iso('2026-01-31'), iso('2026-07-10')).toISO()).toBe(
      '2026-07-31',
    );
  });

  it('handles annual across leap years', () => {
    const annual = BillingCycle.annual();
    expect(annual.nextRenewalOnOrAfter(iso('2024-02-29'), iso('2025-01-01')).toISO()).toBe(
      '2025-02-28', // 2025 not a leap year → clamp
    );
  });
});

// ── Property-based invariants ──────────────────────────────────────────────
const arbCycle = fc.oneof(
  fc.constant(BillingCycle.weekly()),
  fc.constant(BillingCycle.monthly()),
  fc.constant(BillingCycle.quarterly()),
  fc.constant(BillingCycle.semiannual()),
  fc.constant(BillingCycle.annual()),
  fc.integer({ min: 1, max: 400 }).map((n) => BillingCycle.custom(n)),
);

const arbAnchor = fc
  .record({
    year: fc.integer({ min: 1990, max: 2100 }),
    month: fc.integer({ min: 1, max: 12 }),
    dayRaw: fc.integer({ min: 1, max: 31 }),
  })
  .map(({ year, month, dayRaw }) =>
    DateOnly.of(year, month, Math.min(dayRaw, DateOnly.daysInMonth(year, month))),
  );

const arbK = fc.integer({ min: 0, max: 60 });

describe('BillingCycle properties', () => {
  it('advance is strictly increasing in the number of periods', () => {
    fc.assert(
      fc.property(arbCycle, arbAnchor, arbK, (cycle, anchor, k) => {
        expect(cycle.advance(anchor, k).isBefore(cycle.advance(anchor, k + 1))).toBe(true);
      }),
    );
  });

  it('a renewal date is a fixed point of nextRenewalOnOrAfter', () => {
    fc.assert(
      fc.property(arbCycle, arbAnchor, arbK, (cycle, anchor, k) => {
        const renewal = cycle.advance(anchor, k);
        expect(cycle.nextRenewalOnOrAfter(anchor, renewal).equals(renewal)).toBe(true);
      }),
    );
  });

  it('the day after a renewal rolls to the following renewal (period ≥ 2 days)', () => {
    fc.assert(
      fc.property(arbCycle, arbAnchor, arbK, (cycle, anchor, k) => {
        const interval = cycle.customIntervalDays;
        fc.pre(interval === null || interval >= 2);
        const renewal = cycle.advance(anchor, k);
        const next = cycle.nextRenewalOnOrAfter(anchor, renewal.addDays(1));
        expect(next.equals(cycle.advance(anchor, k + 1))).toBe(true);
      }),
    );
  });

  it('the result is never before from', () => {
    fc.assert(
      fc.property(arbCycle, arbAnchor, arbAnchor, (cycle, anchor, from) => {
        expect(cycle.nextRenewalOnOrAfter(anchor, from).isBefore(from)).toBe(false);
      }),
    );
  });
});
