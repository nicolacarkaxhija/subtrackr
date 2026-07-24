import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { Money } from './money';

const eur = (minor: number | bigint): Money => Money.of(minor, 'EUR');

describe('Money.of', () => {
  it('stores minor units exactly', () => {
    expect(eur(1799).amountMinor).toBe(1799n);
    expect(eur(1799).currency).toBe('EUR');
  });

  it('accepts bigint input', () => {
    expect(Money.of(9007199254740993n, 'EUR').amountMinor).toBe(9007199254740993n);
  });

  it('accepts negative amounts (refunds/credits)', () => {
    expect(eur(-500).amountMinor).toBe(-500n);
  });

  it.each([1.5, Number.NaN, Number.POSITIVE_INFINITY])('rejects non-integer amount %s', (n) => {
    expect(() => Money.of(n, 'EUR')).toThrow(RangeError);
    // Assert OUR guard fired, not BigInt()'s own coincidental "not an integer" error.
    expect(() => Money.of(n, 'EUR')).toThrow(/minor units/);
  });

  it.each(['eur', 'EURO', 'E1R', '', 'US'])('rejects invalid currency %s', (c) => {
    expect(() => Money.of(100, c)).toThrow(RangeError);
    expect(() => Money.of(100, c)).toThrow(/currency/i);
  });
});

describe('Money.parse', () => {
  it.each<[string, bigint]>([
    ['17.99', 1799n],
    ['17', 1700n],
    ['17.9', 1790n],
    ['0.99', 99n],
    ['0', 0n],
    ['-5.00', -500n],
    ['1000000.00', 100000000n],
  ])('parses "%s" to %s minor units', (text, minor) => {
    expect(Money.parse(text, 'EUR').amountMinor).toBe(minor);
  });

  it('trims surrounding whitespace', () => {
    expect(Money.parse('  17.99  ', 'EUR').amountMinor).toBe(1799n);
  });

  it('keeps the given currency', () => {
    expect(Money.parse('9.00', 'USD').currency).toBe('USD');
  });

  it.each(['', 'abc', '17.999', '1,99', '1.2.3', '17.', '.99', ' '])(
    'rejects malformed input "%s"',
    (text) => {
      expect(() => Money.parse(text, 'EUR')).toThrow(/invalid amount/i);
    },
  );

  it('rejects an invalid currency', () => {
    expect(() => Money.parse('1.00', 'eur')).toThrow(/currency/i);
  });
});

describe('Money.zero', () => {
  it('creates a zero amount in the given currency', () => {
    const z = Money.zero('EUR');
    expect(z.amountMinor).toBe(0n);
    expect(z.currency).toBe('EUR');
    expect(z.isZero()).toBe(true);
  });

  it('is the additive identity', () => {
    expect(Money.zero('EUR').plus(eur(1799)).equals(eur(1799))).toBe(true);
  });

  it('validates the currency', () => {
    expect(() => Money.zero('nope')).toThrow(RangeError);
  });
});

describe('Money arithmetic', () => {
  it('adds and subtracts', () => {
    expect(eur(1000).plus(eur(799)).amountMinor).toBe(1799n);
    expect(eur(1000).minus(eur(1799)).amountMinor).toBe(-799n);
  });

  it('negates and takes absolute value', () => {
    expect(eur(500).negate().amountMinor).toBe(-500n);
    expect(eur(-500).abs().amountMinor).toBe(500n);
    expect(eur(500).abs().amountMinor).toBe(500n);
  });

  it('multiplies by an integer factor', () => {
    expect(eur(1799).times(12).amountMinor).toBe(21588n);
    expect(eur(1799).times(0).amountMinor).toBe(0n);
    expect(eur(1799).times(-1).amountMinor).toBe(-1799n);
  });

  it('rejects a non-integer factor', () => {
    expect(() => eur(100).times(1.5)).toThrow(RangeError);
    expect(() => eur(100).times(1.5)).toThrow(/integer factor/);
  });

  it('accepts a bigint factor', () => {
    expect(eur(1799).times(3n).amountMinor).toBe(5397n);
  });

  it('negate and abs leave zero unchanged', () => {
    expect(eur(0).negate().amountMinor).toBe(0n);
    expect(eur(0).abs().amountMinor).toBe(0n);
  });

  it('refuses to mix currencies', () => {
    const usd = Money.of(100, 'USD');
    expect(() => eur(100).plus(usd)).toThrow(TypeError);
    expect(() => eur(100).plus(usd)).toThrow(/currency mismatch/i);
    expect(() => eur(100).minus(usd)).toThrow(TypeError);
    expect(() => eur(100).compareTo(usd)).toThrow(TypeError);
  });
});

describe('Money.equalShare', () => {
  it('splits evenly when divisible', () => {
    expect(eur(1000).equalShare(4).amountMinor).toBe(250n);
  });

  it('gives the payer (first share) the leftover unit', () => {
    // 17.99 / 4 = 4.4975 -> my share 4.50, the other three pay 4.49
    expect(eur(1799).equalShare(4).amountMinor).toBe(450n);
  });

  it('returns the full amount for a single-person split', () => {
    expect(eur(1799).equalShare(1).amountMinor).toBe(1799n);
  });

  it('handles negative amounts', () => {
    expect(eur(-1799).equalShare(4).amountMinor).toBe(-450n);
  });

  it('keeps the currency', () => {
    expect(Money.of(1000, 'USD').equalShare(3).currency).toBe('USD');
  });

  it.each([0, -1, 1.5, Number.NaN])('rejects an invalid part count %s', (n) => {
    expect(() => eur(100).equalShare(n)).toThrow(/parts/i);
  });

  it('matches allocate for the first share (property)', () => {
    fc.assert(
      fc.property(arbMinor, fc.integer({ min: 1, max: 50 }), (minor, parts) => {
        const money = Money.of(minor, 'EUR');
        const viaAllocate = money.allocate(new Array<number>(parts).fill(1))[0];
        expect(money.equalShare(parts).amountMinor).toBe(viaAllocate?.amountMinor);
      }),
    );
  });
});

describe('Money.mulDiv', () => {
  it('multiplies then divides exactly when divisible', () => {
    expect(eur(12000).mulDiv(1, 12).amountMinor).toBe(1000n); // annual to monthly
    expect(eur(3000).mulDiv(1, 3).amountMinor).toBe(1000n); // quarterly to monthly
  });

  it('rounds to the nearest minor unit (half away from zero)', () => {
    // 1000 * 13 / 3 = 4333.33 -> 4333
    expect(eur(1000).mulDiv(13, 3).amountMinor).toBe(4333n);
    // 10000 / 12 = 833.33 -> 833
    expect(eur(10000).mulDiv(1, 12).amountMinor).toBe(833n);
    // exactly .5 rounds away from zero: 5 / 2 = 2.5 -> 3
    expect(eur(5).mulDiv(1, 2).amountMinor).toBe(3n);
  });

  it('rounds negatives away from zero too', () => {
    expect(eur(-5).mulDiv(1, 2).amountMinor).toBe(-3n);
    expect(eur(-1000).mulDiv(13, 3).amountMinor).toBe(-4333n);
  });

  it('accepts bigint arguments', () => {
    expect(eur(3000).mulDiv(1n, 3n).amountMinor).toBe(1000n);
  });

  it('normalizes a negative denominator', () => {
    expect(eur(1000).mulDiv(1, -3).amountMinor).toBe(-333n);
    expect(eur(1000).mulDiv(1, -3).amountMinor).toBe(eur(1000).mulDiv(-1, 3).amountMinor);
  });

  it('preserves currency', () => {
    expect(Money.of(1000, 'USD').mulDiv(1, 3).currency).toBe('USD');
  });

  it('rejects a zero denominator', () => {
    expect(() => eur(100).mulDiv(1, 0)).toThrow(/denominator/i);
  });

  // Assert the specific guard message: without it, a removed guard falls through to
  // BigInt(1.5) which also throws RangeError, masking the mutation.
  it.each([1.5, Number.NaN])('rejects a non-integer numerator %s', (n) => {
    expect(() => eur(100).mulDiv(n, 3)).toThrow(/numerator must be an integer/);
  });

  it.each([1.5, Number.NaN])('rejects a non-integer denominator %s', (n) => {
    expect(() => eur(100).mulDiv(1, n)).toThrow(/denominator must be an integer/);
  });

  it('stays within half a minor unit of the exact value (property)', () => {
    fc.assert(
      fc.property(
        arbMinor,
        fc.integer({ min: 1, max: 100_000 }),
        fc.integer({ min: 1, max: 100_000 }),
        (minor, num, den) => {
          const result = Money.of(minor, 'EUR').mulDiv(num, den);
          const scaledError = result.amountMinor * BigInt(den) - minor * BigInt(num);
          const magnitude = scaledError < 0n ? -scaledError : scaledError;
          expect(2n * magnitude <= BigInt(den)).toBe(true);
        },
      ),
    );
  });
});

describe('Money comparisons', () => {
  it('compares and tests equality', () => {
    expect(eur(100).equals(eur(100))).toBe(true);
    expect(eur(100).equals(eur(101))).toBe(false);
    expect(eur(100).equals(Money.of(100, 'USD'))).toBe(false);
    expect(eur(100).compareTo(eur(200))).toBeLessThan(0);
    expect(eur(200).compareTo(eur(100))).toBeGreaterThan(0);
    expect(eur(100).compareTo(eur(100))).toBe(0);
  });

  it('reports sign', () => {
    expect(eur(0).isZero()).toBe(true);
    expect(eur(1).isZero()).toBe(false);
    expect(eur(-1).isNegative()).toBe(true);
    expect(eur(1).isNegative()).toBe(false);
    expect(eur(1).isPositive()).toBe(true);
    expect(eur(0).isPositive()).toBe(false);
  });
});

describe('Money.allocate (shared-plan splitting)', () => {
  it('splits evenly when it divides exactly', () => {
    const parts = eur(1000).allocate([1, 1, 1, 1]);
    expect(parts.map((p) => p.amountMinor)).toEqual([250n, 250n, 250n, 250n]);
  });

  it('distributes indivisible remainder cents deterministically', () => {
    // 17.99 across 4 people: 449.75 each → 450,450,450,449
    const parts = eur(1799).allocate([1, 1, 1, 1]);
    expect(parts.map((p) => p.amountMinor)).toEqual([450n, 450n, 450n, 449n]);
  });

  it('honours weighted splits', () => {
    const parts = eur(1000).allocate([50, 30, 20]);
    expect(parts.map((p) => p.amountMinor)).toEqual([500n, 300n, 200n]);
  });

  it('gives the leftover unit to the largest remainder, not just the first member', () => {
    // W=6 → exact shares 166.67 / 333.33 / 500.00; remainders 4/6, 2/6, 0.
    // Largest remainder is index 0, so it takes the odd cent.
    expect(
      eur(1000)
        .allocate([1, 2, 3])
        .map((p) => p.amountMinor),
    ).toEqual([167n, 333n, 500n]);
  });

  it('breaks remainder ties by position', () => {
    // Equal remainders → earliest members win.
    expect(
      eur(1000)
        .allocate([1, 1, 1])
        .map((p) => p.amountMinor),
    ).toEqual([334n, 333n, 333n]);
    expect(
      eur(1001)
        .allocate([1, 1, 1])
        .map((p) => p.amountMinor),
    ).toEqual([334n, 334n, 333n]);
  });

  it('handles negative totals without losing units', () => {
    const parts = eur(-1799).allocate([1, 1, 1, 1]);
    expect(parts.map((p) => p.amountMinor)).toEqual([-450n, -450n, -450n, -449n]);
  });

  it('supports a single share', () => {
    expect(
      eur(1799)
        .allocate([1])
        .map((p) => p.amountMinor),
    ).toEqual([1799n]);
  });

  it('allows zero-weight members', () => {
    const parts = eur(1000).allocate([1, 0, 1]);
    expect(parts.map((p) => p.amountMinor)).toEqual([500n, 0n, 500n]);
  });

  // Each case asserts the SPECIFIC guard message: a broken guard would otherwise fall
  // through to a BigInt division-by-zero that also throws RangeError, masking the bug.
  it.each<[number[], RegExp]>([
    [[], /at least one weight/],
    [[0, 0], /total weight to be positive/],
    [[-1, 2], /non-negative integers/],
    [[1.5, 1], /non-negative integers/],
  ])('rejects invalid weights %j', (weights, message) => {
    expect(() => eur(1000).allocate(weights)).toThrow(RangeError);
    expect(() => eur(1000).allocate(weights)).toThrow(message);
  });

  it('preserves currency on every part', () => {
    expect(
      eur(1000)
        .allocate([1, 1])
        .every((p) => p.currency === 'EUR'),
    ).toBe(true);
  });
});

describe('Money.toString', () => {
  it('renders minor units with the currency code', () => {
    expect(eur(1799).toString()).toBe('EUR 1799');
  });
});

// ── Property-based invariants ──────────────────────────────────────────────
const arbMinor = fc.bigInt({ min: -10_000_000n, max: 10_000_000n });
const arbWeights = fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 1, maxLength: 12 });

describe('Money properties', () => {
  it('allocate never invents or loses a minor unit', () => {
    fc.assert(
      fc.property(arbMinor, arbWeights, (minor, weights) => {
        fc.pre(weights.reduce((a, b) => a + b, 0) > 0);
        const total = Money.of(minor, 'EUR');
        const parts = total.allocate(weights);
        const sum = parts.reduce((acc, p) => acc + p.amountMinor, 0n);
        expect(sum).toBe(minor);
        expect(parts).toHaveLength(weights.length);
      }),
    );
  });

  it('every part is within one minor unit of its exact proportional share', () => {
    // This is what makes the split *fair*, not merely summing correctly: it rules out
    // handing the odd cent to a member whose exact share did not warrant it.
    fc.assert(
      fc.property(arbMinor, arbWeights, (minor, weights) => {
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        fc.pre(totalWeight > 0);
        const parts = Money.of(minor, 'EUR').allocate(weights);
        const divisor = BigInt(totalWeight);
        parts.forEach((part, i) => {
          const weight = BigInt(weights[i] ?? 0);
          const scaledError = part.amountMinor * divisor - minor * weight;
          const magnitude = scaledError < 0n ? -scaledError : scaledError;
          expect(magnitude < divisor).toBe(true);
        });
      }),
    );
  });

  it('allocate is deterministic', () => {
    fc.assert(
      fc.property(arbMinor, arbWeights, (minor, weights) => {
        fc.pre(weights.reduce((a, b) => a + b, 0) > 0);
        const total = Money.of(minor, 'EUR');
        const a = total.allocate(weights).map((p) => p.amountMinor);
        const b = total.allocate(weights).map((p) => p.amountMinor);
        expect(a).toEqual(b);
      }),
    );
  });

  it('plus/minus round-trip', () => {
    fc.assert(
      fc.property(arbMinor, arbMinor, (a, b) => {
        const ma = Money.of(a, 'EUR');
        const mb = Money.of(b, 'EUR');
        expect(ma.plus(mb).minus(mb).equals(ma)).toBe(true);
      }),
    );
  });

  it('addition is commutative and associative', () => {
    fc.assert(
      fc.property(arbMinor, arbMinor, arbMinor, (a, b, c) => {
        const [ma, mb, mc] = [Money.of(a, 'EUR'), Money.of(b, 'EUR'), Money.of(c, 'EUR')];
        expect(ma.plus(mb).equals(mb.plus(ma))).toBe(true);
        expect(
          ma
            .plus(mb)
            .plus(mc)
            .equals(ma.plus(mb.plus(mc))),
        ).toBe(true);
      }),
    );
  });
});
