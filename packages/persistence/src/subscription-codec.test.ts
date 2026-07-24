import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  BillingCycle,
  DateOnly,
  Money,
  Subscription,
  type SubscriptionRecord,
} from '@subtrackr/domain';
import { deserializeSubscriptionRecords, serializeSubscriptionRecords } from './subscription-codec';

const record = (over: Partial<SubscriptionRecord> = {}): SubscriptionRecord => ({
  subscription: Subscription.create({
    id: 'a',
    name: 'Netflix',
    amount: Money.of(1799, 'EUR'),
    cycle: BillingCycle.monthly(),
    anchorDate: DateOnly.fromISO('2026-01-15'),
  }),
  createdAt: 1000,
  updatedAt: 1000,
  deletedAt: null,
  version: 1,
  ...over,
});

const roundTrip = (records: SubscriptionRecord[]): SubscriptionRecord[] =>
  deserializeSubscriptionRecords(serializeSubscriptionRecords(records));

describe('subscription codec', () => {
  it('round-trips an empty store', () => {
    expect(roundTrip([])).toEqual([]);
  });

  it('round-trips a record with every field set', () => {
    const original = record({
      subscription: Subscription.create({
        id: 'x1',
        name: 'Amazon Prime',
        amount: Money.of(8990, 'EUR'),
        cycle: BillingCycle.annual(),
        anchorDate: DateOnly.fromISO('2026-03-31'),
        status: 'paused',
        category: 'Shopping',
        trialEndsAt: DateOnly.fromISO('2026-04-14'),
        paymentLabel: 'Visa 1234',
        url: 'https://amazon.com',
        notes: 'family',
        catalogServiceId: 'amazon-prime',
      }),
      createdAt: 500,
      updatedAt: 900,
      deletedAt: 1200,
      version: 4,
    });

    const [back] = roundTrip([original]);
    const s = back?.subscription;
    expect(s?.id).toBe('x1');
    expect(s?.name).toBe('Amazon Prime');
    expect(s?.amount.equals(Money.of(8990, 'EUR'))).toBe(true);
    expect(s?.cycle.unit).toBe('annual');
    expect(s?.anchorDate.toISO()).toBe('2026-03-31');
    expect(s?.status).toBe('paused');
    expect(s?.category).toBe('Shopping');
    expect(s?.trialEndsAt?.toISO()).toBe('2026-04-14');
    expect(s?.paymentLabel).toBe('Visa 1234');
    expect(s?.url).toBe('https://amazon.com');
    expect(s?.notes).toBe('family');
    expect(s?.catalogServiceId).toBe('amazon-prime');
    expect(back?.createdAt).toBe(500);
    expect(back?.updatedAt).toBe(900);
    expect(back?.deletedAt).toBe(1200);
    expect(back?.version).toBe(4);
  });

  it('round-trips a shared-plan count', () => {
    const rec = record({
      subscription: Subscription.create({
        id: 'shared',
        name: 'Netflix',
        amount: Money.of(1799, 'EUR'),
        cycle: BillingCycle.monthly(),
        anchorDate: DateOnly.fromISO('2026-01-15'),
        sharedWith: 4,
      }),
    });
    expect(roundTrip([rec])[0]?.subscription.sharedWith).toBe(4);
  });

  it('round-trips a minimal record leaving optionals undefined', () => {
    const [back] = roundTrip([record()]);
    expect(back?.subscription.category).toBeUndefined();
    expect(back?.subscription.trialEndsAt).toBeUndefined();
    expect(back?.subscription.notes).toBeUndefined();
  });

  it.each(['weekly', 'monthly', 'quarterly', 'semiannual', 'annual'] as const)(
    'round-trips the %s cycle',
    (unit) => {
      const cycle = BillingCycle[unit]();
      const rec = record({
        subscription: Subscription.create({
          id: 'c',
          name: 'X',
          amount: Money.of(100, 'EUR'),
          cycle,
          anchorDate: DateOnly.fromISO('2026-01-15'),
        }),
      });
      expect(roundTrip([rec])[0]?.subscription.cycle.unit).toBe(unit);
    },
  );

  it('round-trips a custom cycle with its interval', () => {
    const rec = record({
      subscription: Subscription.create({
        id: 'c',
        name: 'X',
        amount: Money.of(100, 'EUR'),
        cycle: BillingCycle.custom(45),
        anchorDate: DateOnly.fromISO('2026-01-15'),
      }),
    });
    const cycle = roundTrip([rec])[0]?.subscription.cycle;
    expect(cycle?.unit).toBe('custom');
    expect(cycle?.customIntervalDays).toBe(45);
  });

  it('preserves a large bigint amount exactly', () => {
    const big = 9_007_199_254_740_993n; // beyond Number.MAX_SAFE_INTEGER
    const rec = record({
      subscription: Subscription.create({
        id: 'big',
        name: 'X',
        amount: Money.of(big, 'EUR'),
        cycle: BillingCycle.monthly(),
        anchorDate: DateOnly.fromISO('2026-01-15'),
      }),
    });
    expect(roundTrip([rec])[0]?.subscription.amount.amountMinor).toBe(big);
  });

  it('preserves order and multiple records', () => {
    const ids = ['a', 'b', 'c'];
    const recs = ids.map((id) =>
      record({
        subscription: Subscription.create({
          id,
          name: id,
          amount: Money.of(100, 'EUR'),
          cycle: BillingCycle.monthly(),
          anchorDate: DateOnly.fromISO('2026-01-15'),
        }),
      }),
    );
    expect(roundTrip(recs).map((r) => r.subscription.id)).toEqual(ids);
  });

  describe('deserialize errors', () => {
    it('rejects malformed JSON', () => {
      expect(() => deserializeSubscriptionRecords('not json')).toThrow();
    });

    it('rejects an unknown schema version', () => {
      expect(() => deserializeSubscriptionRecords('{"schema":999,"records":[]}')).toThrow(
        /schema/i,
      );
    });

    it('rejects a custom cycle missing its interval', () => {
      const bad = JSON.stringify({
        schema: 1,
        records: [
          {
            subscription: {
              id: 'c',
              name: 'X',
              amountMinor: '100',
              currency: 'EUR',
              cycleUnit: 'custom',
              customIntervalDays: null,
              anchorDate: '2026-01-15',
              status: 'active',
            },
            createdAt: 1,
            updatedAt: 1,
            deletedAt: null,
            version: 1,
          },
        ],
      });
      expect(() => deserializeSubscriptionRecords(bad)).toThrow(/interval/i);
    });
  });

  it('preserves amounts across arbitrary values (property)', () => {
    fc.assert(
      fc.property(fc.bigInt({ min: -1_000_000_000n, max: 1_000_000_000n }), (minor) => {
        const rec = record({
          subscription: Subscription.create({
            id: 'p',
            name: 'X',
            amount: Money.of(minor < 0n ? -minor : minor, 'EUR'),
            cycle: BillingCycle.monthly(),
            anchorDate: DateOnly.fromISO('2026-01-15'),
          }),
        });
        const positive = minor < 0n ? -minor : minor;
        expect(roundTrip([rec])[0]?.subscription.amount.amountMinor).toBe(positive);
      }),
    );
  });
});
