import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { Subscription } from './subscription';
import type { SubscriptionProps, SubscriptionStatus } from './subscription';
import { Money } from '../value-objects/money';
import { BillingCycle } from '../value-objects/billing-cycle';
import { DateOnly } from '../value-objects/date-only';

const base = (over: Partial<SubscriptionProps> = {}): SubscriptionProps => ({
  id: 'sub-1',
  name: 'Netflix',
  amount: Money.of(1799, 'EUR'),
  cycle: BillingCycle.monthly(),
  anchorDate: DateOnly.fromISO('2026-01-15'),
  ...over,
});

const make = (over: Partial<SubscriptionProps> = {}): Subscription =>
  Subscription.create(base(over));

describe('Subscription.create validation', () => {
  it('creates a valid active subscription with defaults', () => {
    const s = make();
    expect(s.id).toBe('sub-1');
    expect(s.name).toBe('Netflix');
    expect(s.amount.equals(Money.of(1799, 'EUR'))).toBe(true);
    expect(s.cycle.unit).toBe('monthly');
    expect(s.anchorDate.toISO()).toBe('2026-01-15');
    expect(s.status).toBe('active');
    expect(s.category).toBeUndefined();
    expect(s.trialEndsAt).toBeUndefined();
  });

  it('trims the name', () => {
    expect(make({ name: '  Spotify  ' }).name).toBe('Spotify');
  });

  it.each(['', '   '])('rejects a blank name %j', (name) => {
    expect(() => make({ name })).toThrow(/name/i);
  });

  it('rejects a blank id', () => {
    expect(() => make({ id: '  ' })).toThrow(/id/i);
  });

  it('rejects a negative amount', () => {
    expect(() => make({ amount: Money.of(-1, 'EUR') })).toThrow(/amount/i);
  });

  it('accepts a zero amount (free tier / trial)', () => {
    expect(make({ amount: Money.of(0, 'EUR') }).amount.isZero()).toBe(true);
  });

  it('rejects a trial that ends before the anchor date', () => {
    expect(() =>
      make({
        anchorDate: DateOnly.fromISO('2026-01-15'),
        trialEndsAt: DateOnly.fromISO('2026-01-14'),
      }),
    ).toThrow(/trial/i);
  });

  it('accepts a trial that ends on or after the anchor date', () => {
    const s = make({
      anchorDate: DateOnly.fromISO('2026-01-15'),
      trialEndsAt: DateOnly.fromISO('2026-01-29'),
    });
    expect(s.trialEndsAt?.toISO()).toBe('2026-01-29');
  });

  it('preserves optional metadata', () => {
    const s = make({
      category: 'Entertainment',
      paymentLabel: 'Visa ••1234',
      url: 'https://netflix.com/account',
      notes: 'shared with family',
      catalogServiceId: 'netflix',
    });
    expect(s.category).toBe('Entertainment');
    expect(s.paymentLabel).toBe('Visa ••1234');
    expect(s.url).toBe('https://netflix.com/account');
    expect(s.notes).toBe('shared with family');
    expect(s.catalogServiceId).toBe('netflix');
  });

  it('honours an explicit initial status', () => {
    expect(make({ status: 'paused' }).status).toBe('paused');
  });
});

describe('Subscription status transitions', () => {
  it('pauses an active subscription', () => {
    const s = make().pause();
    expect(s.status).toBe('paused');
  });

  it('resumes a paused subscription', () => {
    expect(make().pause().resume().status).toBe('active');
  });

  it('cancels from active or paused', () => {
    expect(make().cancel().status).toBe('cancelled');
    expect(make().pause().cancel().status).toBe('cancelled');
  });

  it('rejects pausing a non-active subscription', () => {
    expect(() => make({ status: 'paused' }).pause()).toThrow(/cannot pause/i);
    expect(() => make({ status: 'cancelled' }).pause()).toThrow(/cannot pause/i);
  });

  it('rejects resuming a non-paused subscription', () => {
    expect(() => make().resume()).toThrow(/cannot resume/i);
    expect(() => make({ status: 'cancelled' }).resume()).toThrow(/cannot resume/i);
  });

  it('rejects cancelling an already-cancelled subscription', () => {
    expect(() => make({ status: 'cancelled' }).cancel()).toThrow(/cannot cancel/i);
  });

  it('returns a new instance and leaves the original unchanged (immutability)', () => {
    const active = make();
    const paused = active.pause();
    expect(active.status).toBe('active');
    expect(paused).not.toBe(active);
    // All other fields carry over unchanged.
    expect(paused.id).toBe(active.id);
    expect(paused.amount.equals(active.amount)).toBe(true);
  });
});

describe('Subscription.nextRenewalOnOrAfter', () => {
  it('delegates to the billing cycle from the anchor', () => {
    const s = make({ anchorDate: DateOnly.fromISO('2026-01-31'), cycle: BillingCycle.monthly() });
    expect(s.nextRenewalOnOrAfter(DateOnly.fromISO('2026-07-10')).toISO()).toBe('2026-07-31');
  });

  it('returns the anchor when asked before it', () => {
    const s = make({ anchorDate: DateOnly.fromISO('2026-06-10') });
    expect(s.nextRenewalOnOrAfter(DateOnly.fromISO('2026-01-01')).toISO()).toBe('2026-06-10');
  });
});

describe('Subscription shared plans', () => {
  it('defaults to no shared plan, so my cost equals the full cost', () => {
    const s = make();
    expect(s.sharedWith).toBeUndefined();
    expect(s.myMonthlyCost().amountMinor).toBe(s.monthlyCost().amountMinor);
  });

  it('splits my monthly cost equally when shared', () => {
    const s = make({
      amount: Money.of(1799, 'EUR'),
      cycle: BillingCycle.monthly(),
      sharedWith: 4,
    });
    expect(s.sharedWith).toBe(4);
    expect(s.myMonthlyCost().amountMinor).toBe(450n); // 17.99 / 4, payer share
  });

  it('splits the monthly-equivalent for non-monthly cycles', () => {
    const s = make({
      amount: Money.of(8990, 'EUR'),
      cycle: BillingCycle.annual(),
      sharedWith: 2,
    });
    // 8990 annual -> 749 monthly -> 374.5 -> payer 375
    expect(s.myMonthlyCost().amountMinor).toBe(375n);
  });

  it.each([1, 0, -1, 1.5])('rejects a shared count that is not at least 2 (%s)', (n) => {
    expect(() => make({ sharedWith: n })).toThrow(/at least 2/i);
  });
});

describe('Subscription cost-per-use', () => {
  it('is null when usage is not tracked', () => {
    expect(make().costPerUse()).toBeNull();
    expect(make().usesPerMonth).toBeUndefined();
  });

  it('divides the monthly cost by the number of uses', () => {
    const s = make({ amount: Money.of(1000, 'EUR'), usesPerMonth: 5 });
    expect(s.costPerUse()?.amountMinor).toBe(200n); // 10.00 / 5 = 2.00
  });

  it('rounds to the nearest cent', () => {
    const s = make({ amount: Money.of(1000, 'EUR'), usesPerMonth: 3 });
    expect(s.costPerUse()?.amountMinor).toBe(333n); // 10.00 / 3 = 3.33
  });

  it('uses the user share for shared plans', () => {
    const s = make({ amount: Money.of(2000, 'EUR'), sharedWith: 2, usesPerMonth: 5 });
    // my monthly cost 10.00 / 5 = 2.00
    expect(s.costPerUse()?.amountMinor).toBe(200n);
  });

  it('accepts a single use per month', () => {
    const s = make({ amount: Money.of(1000, 'EUR'), usesPerMonth: 1 });
    expect(s.costPerUse()?.amountMinor).toBe(1000n);
  });

  it.each([0, -1, 1.5])('rejects a non-positive-integer usage count (%s)', (n) => {
    expect(() => make({ usesPerMonth: n })).toThrow(/uses/i);
  });
});

describe('Subscription.monthlyCost', () => {
  it('returns the amount unchanged for a monthly cycle', () => {
    expect(make().monthlyCost().amountMinor).toBe(1799n);
  });

  it('divides an annual cost across twelve months', () => {
    const annual = make({ amount: Money.of(8990, 'EUR'), cycle: BillingCycle.annual() });
    expect(annual.monthlyCost().amountMinor).toBe(749n); // 8990 / 12 = 749.16 -> 749
  });

  it('keeps the currency', () => {
    const usd = make({ amount: Money.of(900, 'USD'), cycle: BillingCycle.monthly() });
    expect(usd.monthlyCost().currency).toBe('USD');
  });
});

describe('Subscription trial helpers', () => {
  // Built inside each test, never at collection time: a describe-body `make()` would
  // throw during collection under any create()-breaking mutant, masking it from Stryker.
  const trial = (): Subscription =>
    make({
      anchorDate: DateOnly.fromISO('2026-01-15'),
      trialEndsAt: DateOnly.fromISO('2026-01-29'),
    });

  it('is in trial on or before the end date', () => {
    expect(trial().isTrialActive(DateOnly.fromISO('2026-01-20'))).toBe(true);
    expect(trial().isTrialActive(DateOnly.fromISO('2026-01-29'))).toBe(true);
  });

  it('is not in trial after the end date', () => {
    expect(trial().isTrialActive(DateOnly.fromISO('2026-01-30'))).toBe(false);
  });

  it('reports days remaining until the trial ends', () => {
    expect(trial().trialDaysRemaining(DateOnly.fromISO('2026-01-27'))).toBe(2);
    expect(trial().trialDaysRemaining(DateOnly.fromISO('2026-01-29'))).toBe(0);
  });

  it('reports null days remaining once the trial has passed', () => {
    expect(trial().trialDaysRemaining(DateOnly.fromISO('2026-01-30'))).toBeNull();
  });

  it('has no trial semantics without a trial end date', () => {
    const s = make();
    expect(s.isTrialActive(DateOnly.fromISO('2026-01-20'))).toBe(false);
    expect(s.trialDaysRemaining(DateOnly.fromISO('2026-01-20'))).toBeNull();
  });
});

describe('Subscription properties', () => {
  const arbStatus = fc.constantFrom<SubscriptionStatus[]>('active', 'paused', 'cancelled');

  it('a transition only ever changes the status field', () => {
    fc.assert(
      fc.property(arbStatus, (status) => {
        const s = make({ status });
        const transitions: Array<() => Subscription> = [
          () => s.pause(),
          () => s.resume(),
          () => s.cancel(),
        ];
        for (const run of transitions) {
          let next: Subscription;
          try {
            next = run();
          } catch {
            continue; // invalid transition for this status — fine
          }
          expect(next.id).toBe(s.id);
          expect(next.name).toBe(s.name);
          expect(next.amount.equals(s.amount)).toBe(true);
          expect(next.anchorDate.equals(s.anchorDate)).toBe(true);
        }
      }),
    );
  });
});
