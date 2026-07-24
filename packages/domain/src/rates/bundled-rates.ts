import { Money } from '../value-objects/money';
import type { Rates } from '../ports/rates';

/**
 * Rates relative to EUR, as ten-thousandths of EUR per one unit of the currency
 * (four decimal places). Indicative values shipped with the app and updated via
 * releases; not live (ADR 0008). Extend this table to add currencies.
 */
const TEN_THOUSANDTHS_PER_EUR: Readonly<Record<string, bigint>> = {
  EUR: 10_000n,
  USD: 9_200n,
  GBP: 11_700n,
  CHF: 10_400n,
  CAD: 6_800n,
  AUD: 6_100n,
};

/** The date the {@link TEN_THOUSANDTHS_PER_EUR} table was captured. */
const AS_OF = '2026-07-01';

/** Bundled, offline {@link Rates} using a static EUR-relative table. */
export class BundledRates implements Rates {
  readonly asOf = AS_OF;

  canConvert(from: string, to: string): boolean {
    return from in TEN_THOUSANDTHS_PER_EUR && to in TEN_THOUSANDTHS_PER_EUR;
  }

  convert(amount: Money, to: string): Money {
    const from = rate(amount.currency);
    const target = rate(to);
    // minorTo = minorFrom * (EUR-per-from) / (EUR-per-to); both share a 2-decimal unit.
    return Money.of(amount.mulDiv(from, target).amountMinor, to);
  }
}

function rate(currency: string): bigint {
  const value = TEN_THOUSANDTHS_PER_EUR[currency];
  if (value === undefined) {
    throw new RangeError(`No bundled exchange rate for currency "${currency}"`);
  }
  return value;
}
