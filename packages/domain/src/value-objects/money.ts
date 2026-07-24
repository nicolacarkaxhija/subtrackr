const CURRENCY_PATTERN = /^[A-Z]{3}$/;

/**
 * An exact monetary amount held as integer minor units (cents) plus an ISO-4217
 * currency. Floating point is never used: a subscription tracker that loses a cent
 * when splitting a family plan is broken (ADR 0008).
 */
export class Money {
  private constructor(
    readonly amountMinor: bigint,
    readonly currency: string,
  ) {}

  static of(amountMinor: number | bigint, currency: string): Money {
    if (typeof amountMinor === 'number' && !Number.isInteger(amountMinor)) {
      throw new RangeError(`Money requires an integer number of minor units, got ${amountMinor}`);
    }
    if (!CURRENCY_PATTERN.test(currency)) {
      throw new RangeError(`Invalid currency code "${currency}": expected ISO-4217 (e.g. EUR)`);
    }
    return new Money(BigInt(amountMinor), currency);
  }

  static zero(currency: string): Money {
    return Money.of(0, currency);
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new TypeError(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }

  plus(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountMinor + other.amountMinor, this.currency);
  }

  minus(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountMinor - other.amountMinor, this.currency);
  }

  times(factor: number | bigint): Money {
    if (typeof factor === 'number' && !Number.isInteger(factor)) {
      throw new RangeError(`Money.times requires an integer factor, got ${factor}`);
    }
    return new Money(this.amountMinor * BigInt(factor), this.currency);
  }

  /**
   * Multiply by a rational factor `numerator / denominator`, rounding the result to the
   * nearest minor unit (ties away from zero). Used to convert a billing amount to a
   * monthly equivalent (e.g. weekly is 13/3 of a month). Exact bigint arithmetic; no
   * floating point.
   */
  mulDiv(numerator: number | bigint, denominator: number | bigint): Money {
    if (typeof numerator === 'number' && !Number.isInteger(numerator)) {
      throw new RangeError(`Money.mulDiv numerator must be an integer, got ${numerator}`);
    }
    if (typeof denominator === 'number' && !Number.isInteger(denominator)) {
      throw new RangeError(`Money.mulDiv denominator must be an integer, got ${denominator}`);
    }
    let num = BigInt(numerator);
    let den = BigInt(denominator);
    if (den === 0n) {
      throw new RangeError('Money.mulDiv denominator must not be zero');
    }
    if (den < 0n) {
      num = -num;
      den = -den;
    }
    const value = this.amountMinor * num;
    let quotient = value / den;
    const remainder = value % den;
    const twiceRemainder = 2n * (remainder < 0n ? -remainder : remainder);
    if (twiceRemainder >= den) {
      quotient += value < 0n ? -1n : 1n;
    }
    return new Money(quotient, this.currency);
  }

  negate(): Money {
    return new Money(-this.amountMinor, this.currency);
  }

  abs(): Money {
    return new Money(this.amountMinor < 0n ? -this.amountMinor : this.amountMinor, this.currency);
  }

  /**
   * Split this amount across `weights` so that the parts sum **exactly** back to the
   * total — no minor unit invented or lost. Indivisible remainder is distributed by
   * the largest-remainder method, ties broken by position, so the result is stable
   * across recomputation (feat-shared-plan).
   */
  allocate(weights: readonly number[]): Money[] {
    if (weights.length === 0) {
      throw new RangeError('Money.allocate requires at least one weight');
    }
    if (weights.some((w) => !Number.isInteger(w) || w < 0)) {
      throw new RangeError('Money.allocate weights must be non-negative integers');
    }
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    if (totalWeight <= 0) {
      throw new RangeError('Money.allocate requires the total weight to be positive');
    }

    const divisor = BigInt(totalWeight);
    const entries = weights.map((weight, index) => {
      const numerator = this.amountMinor * BigInt(weight);
      const base = numerator / divisor; // truncates toward zero
      const remainder = numerator - base * divisor;
      return { index, base, remainder: remainder < 0n ? -remainder : remainder };
    });

    const distributed = entries.reduce((sum, entry) => sum + entry.base, 0n);
    let outstanding = this.amountMinor - distributed;
    const step = outstanding < 0n ? -1n : 1n;
    if (outstanding < 0n) {
      outstanding = -outstanding;
    }

    // Largest remainder first; ties by original position for determinism.
    const byRemainder = [...entries].sort((a, b) => {
      if (a.remainder === b.remainder) {
        return a.index - b.index;
      }
      return a.remainder > b.remainder ? -1 : 1;
    });
    for (const entry of byRemainder) {
      if (outstanding === 0n) {
        break;
      }
      entry.base += step;
      outstanding -= 1n;
    }

    return entries.map((entry) => new Money(entry.base, this.currency));
  }

  compareTo(other: Money): number {
    this.assertSameCurrency(other);
    if (this.amountMinor < other.amountMinor) {
      return -1;
    }
    return this.amountMinor > other.amountMinor ? 1 : 0;
  }

  /** Equality never throws on mismatched currency — different currencies are simply unequal. */
  equals(other: Money): boolean {
    return this.currency === other.currency && this.amountMinor === other.amountMinor;
  }

  isZero(): boolean {
    return this.amountMinor === 0n;
  }

  isNegative(): boolean {
    return this.amountMinor < 0n;
  }

  isPositive(): boolean {
    return this.amountMinor > 0n;
  }

  toString(): string {
    return `${this.currency} ${this.amountMinor}`;
  }
}
