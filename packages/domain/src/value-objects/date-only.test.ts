import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { DateOnly } from './date-only.js';

describe('DateOnly.of', () => {
  it('accepts a valid date', () => {
    const d = DateOnly.of(2026, 7, 21);
    expect(d.toISO()).toBe('2026-07-21');
  });

  it.each([
    [2026, 0, 1, /Invalid month: 0/],
    [2026, 13, 1, /Invalid month: 13/],
    [2026, 2, 29, /Invalid day 29 for 2026-2/], // 2026 is not a leap year
    [2026, 4, 31, /Invalid day 31 for 2026-4/], // April has 30 days
    [2026, 1, 0, /Invalid day 0 for 2026-1/],
  ])('rejects invalid date %i-%i-%i', (y, m, d, message) => {
    expect(() => DateOnly.of(y, m, d)).toThrow(RangeError);
    expect(() => DateOnly.of(y, m, d)).toThrow(message);
  });

  it('accepts Feb 29 in a leap year', () => {
    expect(DateOnly.of(2024, 2, 29).toISO()).toBe('2024-02-29');
  });

  it.each([
    [2026.5, 7, 21],
    [2026, 7.5, 21],
    [2026, 7, 21.5],
  ])('rejects non-integer components %s-%s-%s', (y, m, d) => {
    expect(() => DateOnly.of(y, m, d)).toThrow(RangeError);
    expect(() => DateOnly.of(y, m, d)).toThrow(/must be integers/);
  });
});

describe('DateOnly.toISO', () => {
  it('zero-pads year, month and day', () => {
    // Years < 1000 exercise the year padding that 4-digit years never reach.
    expect(DateOnly.of(999, 1, 2).toISO()).toBe('0999-01-02');
    expect(DateOnly.of(7, 12, 25).toISO()).toBe('0007-12-25');
  });
});

describe('DateOnly.fromISO', () => {
  it('round-trips a valid ISO string', () => {
    expect(DateOnly.fromISO('2026-07-21').toISO()).toBe('2026-07-21');
  });

  it.each(['2026/07/21', '2026-7-1', 'nope', ''])('rejects malformed %s', (s) => {
    expect(() => DateOnly.fromISO(s)).toThrow(RangeError);
    expect(() => DateOnly.fromISO(s)).toThrow(/Invalid ISO date/);
  });

  it('rejects a well-formed but invalid date', () => {
    // Parses structurally, then fails validation in of().
    expect(() => DateOnly.fromISO('2026-13-01')).toThrow(/Invalid month/);
  });
});

describe('DateOnly.isLeapYear', () => {
  it.each([
    [2024, true],
    [2023, false],
    [2000, true], // divisible by 400
    [1900, false], // divisible by 100 but not 400
  ])('%i → %s', (y, expected) => {
    expect(DateOnly.isLeapYear(y)).toBe(expected);
  });
});

describe('DateOnly.daysInMonth', () => {
  // Every month is asserted explicitly: sampling only a few lets a wrong month-length
  // clause slip through (caught by mutation testing).
  it.each([
    [2026, 1, 31],
    [2026, 2, 28],
    [2026, 3, 31],
    [2026, 4, 30],
    [2026, 5, 31],
    [2026, 6, 30],
    [2026, 7, 31],
    [2026, 8, 31],
    [2026, 9, 30],
    [2026, 10, 31],
    [2026, 11, 30],
    [2026, 12, 31],
  ])('%i-%i → %i', (y, m, expected) => {
    expect(DateOnly.daysInMonth(y, m)).toBe(expected);
  });

  it('returns 29 for February in a leap year', () => {
    expect(DateOnly.daysInMonth(2024, 2)).toBe(29);
  });
});

describe('DateOnly.addDays', () => {
  it('crosses a month boundary', () => {
    expect(DateOnly.of(2026, 1, 31).addDays(1).toISO()).toBe('2026-02-01');
  });

  it('crosses a year boundary', () => {
    expect(DateOnly.of(2026, 12, 31).addDays(1).toISO()).toBe('2027-01-01');
  });

  it('subtracts with a negative argument', () => {
    expect(DateOnly.of(2026, 3, 1).addDays(-1).toISO()).toBe('2026-02-28');
  });

  it('handles leap day', () => {
    expect(DateOnly.of(2024, 2, 28).addDays(1).toISO()).toBe('2024-02-29');
  });
});

describe('DateOnly.addMonths (clamping)', () => {
  it('clamps Jan 31 to Feb 28 in a non-leap year', () => {
    expect(DateOnly.of(2026, 1, 31).addMonths(1).toISO()).toBe('2026-02-28');
  });

  it('clamps Jan 31 to Feb 29 in a leap year', () => {
    expect(DateOnly.of(2024, 1, 31).addMonths(1).toISO()).toBe('2024-02-29');
  });

  it('does not clamp when the day fits', () => {
    expect(DateOnly.of(2026, 1, 15).addMonths(1).toISO()).toBe('2026-02-15');
  });

  it('rolls over the year', () => {
    expect(DateOnly.of(2026, 12, 10).addMonths(1).toISO()).toBe('2027-01-10');
  });

  it('handles negative months across a year', () => {
    expect(DateOnly.of(2026, 1, 15).addMonths(-1).toISO()).toBe('2025-12-15');
  });

  it('handles multi-year spans', () => {
    expect(DateOnly.of(2026, 3, 31).addMonths(11).toISO()).toBe('2027-02-28');
  });
});

describe('DateOnly comparisons', () => {
  const a = DateOnly.of(2026, 1, 1);
  const b = DateOnly.of(2026, 6, 1);

  it('orders correctly', () => {
    expect(a.isBefore(b)).toBe(true);
    expect(b.isAfter(a)).toBe(true);
    expect(a.isBefore(a)).toBe(false);
    expect(a.isAfter(a)).toBe(false);
  });

  it('reports equality', () => {
    expect(a.equals(DateOnly.of(2026, 1, 1))).toBe(true);
    expect(a.equals(b)).toBe(false);
  });

  it('daysUntil is signed', () => {
    expect(DateOnly.of(2026, 1, 1).daysUntil(DateOnly.of(2026, 1, 31))).toBe(30);
    expect(DateOnly.of(2026, 1, 31).daysUntil(DateOnly.of(2026, 1, 1))).toBe(-30);
  });
});

// ── Property-based invariants ──────────────────────────────────────────────
const arbYear = fc.integer({ min: 1970, max: 2200 });
const arbMonth = fc.integer({ min: 1, max: 12 });

const arbDate = fc
  .record({ year: arbYear, month: arbMonth, dayRaw: fc.integer({ min: 1, max: 31 }) })
  .map(({ year, month, dayRaw }) =>
    DateOnly.of(year, month, Math.min(dayRaw, DateOnly.daysInMonth(year, month))),
  );

describe('DateOnly properties', () => {
  it('addDays(n) then addDays(-n) is identity', () => {
    fc.assert(
      fc.property(arbDate, fc.integer({ min: -5000, max: 5000 }), (d, n) => {
        expect(d.addDays(n).addDays(-n).equals(d)).toBe(true);
      }),
    );
  });

  it('daysUntil is antisymmetric', () => {
    fc.assert(
      fc.property(arbDate, arbDate, (a, b) => {
        expect(a.daysUntil(b)).toBe(-b.daysUntil(a));
      }),
    );
  });

  it('addMonths never produces an invalid date and never increases the day', () => {
    fc.assert(
      fc.property(arbDate, fc.integer({ min: -240, max: 240 }), (d, m) => {
        const r = d.addMonths(m);
        // Constructed via of(), so it is valid by construction; assert day-clamp holds.
        expect(r.day).toBeLessThanOrEqual(d.day);
        expect(r.day).toBeGreaterThanOrEqual(1);
      }),
    );
  });

  it('toISO/fromISO round-trip', () => {
    fc.assert(
      fc.property(arbDate, (d) => {
        expect(DateOnly.fromISO(d.toISO()).equals(d)).toBe(true);
      }),
    );
  });
});
