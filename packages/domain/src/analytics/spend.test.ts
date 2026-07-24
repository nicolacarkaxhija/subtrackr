import { describe, expect, it } from 'vitest';
import { monthlyTotalInBase, monthlyTotalsByCurrency } from './spend';
import { Subscription, type SubscriptionProps } from '../entities/subscription';
import { Money } from '../value-objects/money';
import { BillingCycle } from '../value-objects/billing-cycle';
import { DateOnly } from '../value-objects/date-only';
import { BundledRates } from '../rates/bundled-rates';

const sub = (id: string, over: Partial<SubscriptionProps> = {}): Subscription =>
  Subscription.create({
    id,
    name: id,
    amount: Money.of(1000, 'EUR'),
    cycle: BillingCycle.monthly(),
    anchorDate: DateOnly.fromISO('2026-01-15'),
    ...over,
  });

const asPairs = (totals: Money[]): Array<[string, bigint]> =>
  totals.map((m) => [m.currency, m.amountMinor]);

describe('monthlyTotalsByCurrency', () => {
  it('is empty for no subscriptions', () => {
    expect(monthlyTotalsByCurrency([])).toEqual([]);
  });

  it('sums monthly-equivalent cost within a currency', () => {
    const totals = monthlyTotalsByCurrency([
      sub('a', { amount: Money.of(1799, 'EUR') }),
      sub('b', { amount: Money.of(1099, 'EUR') }),
    ]);
    expect(asPairs(totals)).toEqual([['EUR', 2898n]]);
  });

  it('normalizes cycles to monthly before summing', () => {
    const totals = monthlyTotalsByCurrency([
      sub('a', { amount: Money.of(8990, 'EUR'), cycle: BillingCycle.annual() }), // 749
      sub('b', { amount: Money.of(1000, 'EUR'), cycle: BillingCycle.monthly() }), // 1000
    ]);
    expect(asPairs(totals)).toEqual([['EUR', 1749n]]);
  });

  it('groups by currency, sorted by code', () => {
    const totals = monthlyTotalsByCurrency([
      sub('a', { amount: Money.of(900, 'USD') }),
      sub('b', { amount: Money.of(1000, 'EUR') }),
      sub('c', { amount: Money.of(100, 'USD') }),
    ]);
    expect(asPairs(totals)).toEqual([
      ['EUR', 1000n],
      ['USD', 1000n],
    ]);
  });

  it('uses the user share for shared plans', () => {
    const totals = monthlyTotalsByCurrency([
      sub('a', { amount: Money.of(1799, 'EUR'), sharedWith: 4 }), // my share 450
      sub('b', { amount: Money.of(1000, 'EUR') }), // 1000
    ]);
    expect(asPairs(totals)).toEqual([['EUR', 1450n]]);
  });

  it('counts only active subscriptions', () => {
    const totals = monthlyTotalsByCurrency([
      sub('a', { amount: Money.of(1000, 'EUR') }),
      sub('b', { amount: Money.of(5000, 'EUR'), status: 'paused' }),
      sub('c', { amount: Money.of(9000, 'EUR'), status: 'cancelled' }),
    ]);
    expect(asPairs(totals)).toEqual([['EUR', 1000n]]);
  });
});

describe('monthlyTotalInBase', () => {
  const rates = new BundledRates();

  it('is zero in the base currency for no subscriptions', () => {
    const total = monthlyTotalInBase([], rates, 'EUR');
    expect(total?.amountMinor).toBe(0n);
    expect(total?.currency).toBe('EUR');
  });

  it('converts and sums active subscriptions into the base currency', () => {
    const total = monthlyTotalInBase(
      [
        sub('a', { amount: Money.of(1000, 'EUR') }), // 10.00 EUR
        sub('b', { amount: Money.of(1000, 'USD') }), // 10.00 USD -> 9.20 EUR
      ],
      rates,
      'EUR',
    );
    expect(total?.amountMinor).toBe(1920n);
  });

  it('uses the user share for shared plans', () => {
    const total = monthlyTotalInBase(
      [sub('a', { amount: Money.of(2000, 'EUR'), sharedWith: 2 })], // share 10.00 EUR
      rates,
      'EUR',
    );
    expect(total?.amountMinor).toBe(1000n);
  });

  it('excludes paused and cancelled subscriptions', () => {
    const total = monthlyTotalInBase(
      [
        sub('a', { amount: Money.of(1000, 'EUR') }),
        sub('b', { amount: Money.of(5000, 'EUR'), status: 'paused' }),
      ],
      rates,
      'EUR',
    );
    expect(total?.amountMinor).toBe(1000n);
  });

  it('returns null when a currency cannot be converted', () => {
    const total = monthlyTotalInBase([sub('a', { amount: Money.of(1000, 'JPY') })], rates, 'EUR');
    expect(total).toBeNull();
  });
});
