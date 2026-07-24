import { describe, expect, it } from 'vitest';
import { BundledRates } from './bundled-rates';
import { Money } from '../value-objects/money';

describe('BundledRates', () => {
  const rates = new BundledRates();

  it('exposes an as-of date', () => {
    expect(rates.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns the same amount when converting to the same currency', () => {
    const eur = Money.of(1799, 'EUR');
    expect(rates.convert(eur, 'EUR').equals(eur)).toBe(true);
  });

  it('converts between known currencies', () => {
    // 10.00 USD -> EUR at 0.92 -> 9.20
    expect(rates.convert(Money.of(1000, 'USD'), 'EUR').amountMinor).toBe(920n);
    // 10.00 GBP -> EUR at 1.17 -> 11.70
    expect(rates.convert(Money.of(1000, 'GBP'), 'EUR').amountMinor).toBe(1170n);
  });

  it('produces money in the target currency', () => {
    expect(rates.convert(Money.of(1000, 'USD'), 'EUR').currency).toBe('EUR');
  });

  it('round-trips approximately through the base', () => {
    // 100.00 EUR -> USD -> EUR should be within a cent or two.
    const usd = rates.convert(Money.of(10000, 'EUR'), 'USD');
    const back = rates.convert(usd, 'EUR').amountMinor;
    expect(back >= 9998n && back <= 10002n).toBe(true);
  });

  it('reports convertibility', () => {
    expect(rates.canConvert('USD', 'EUR')).toBe(true);
    expect(rates.canConvert('EUR', 'JPY')).toBe(false);
    expect(rates.canConvert('ZZZ', 'EUR')).toBe(false);
  });

  it('throws when converting an unknown currency', () => {
    expect(() => rates.convert(Money.of(100, 'EUR'), 'JPY')).toThrow(/unknown|rate/i);
    expect(() => rates.convert(Money.of(100, 'ZZZ'), 'EUR')).toThrow(/unknown|rate/i);
  });
});
