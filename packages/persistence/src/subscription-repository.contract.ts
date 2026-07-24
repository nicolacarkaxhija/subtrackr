import { beforeEach, describe, expect, it } from 'vitest';
import {
  BillingCycle,
  DateOnly,
  ManualClock,
  Money,
  Subscription,
  type SubscriptionRepository,
} from '@subtrackr/domain';

/**
 * Behavioural contract every {@link SubscriptionRepository} adapter must satisfy.
 * Import and call this from each adapter's test file so the in-memory, SQLite-native
 * and SQLite-web implementations are all held to identical behaviour (ADR 0003).
 *
 * `createRepository` must return a fresh, empty repository backed by the given clock.
 */
export function subscriptionRepositoryContract(
  name: string,
  createRepository: (clock: ManualClock) => SubscriptionRepository,
): void {
  describe(`SubscriptionRepository contract: ${name}`, () => {
    let clock: ManualClock;
    let repo: SubscriptionRepository;

    const sub = (
      id: string,
      over: Partial<{ name: string; amountMinor: number }> = {},
    ): Subscription =>
      Subscription.create({
        id,
        name: over.name ?? `Service ${id}`,
        amount: Money.of(over.amountMinor ?? 999, 'EUR'),
        cycle: BillingCycle.monthly(),
        anchorDate: DateOnly.fromISO('2026-01-15'),
      });

    beforeEach(() => {
      clock = new ManualClock(1_000_000);
      repo = createRepository(clock);
    });

    describe('save / findById', () => {
      it('persists and retrieves a subscription', async () => {
        await repo.save(sub('a', { name: 'Netflix' }));
        const found = await repo.findById('a');
        expect(found?.name).toBe('Netflix');
      });

      it('returns null for an unknown id', async () => {
        expect(await repo.findById('nope')).toBeNull();
      });

      it('upserts: a second save replaces the entity', async () => {
        await repo.save(sub('a', { name: 'Netflix' }));
        await repo.save(sub('a', { name: 'Netflix Premium' }));
        expect((await repo.findById('a'))?.name).toBe('Netflix Premium');
      });
    });

    describe('findAll', () => {
      it('returns an empty list initially', async () => {
        expect(await repo.findAll()).toEqual([]);
      });

      it('returns live subscriptions oldest first', async () => {
        await repo.save(sub('a'));
        clock.advance(1000);
        await repo.save(sub('b'));
        clock.advance(1000);
        await repo.save(sub('c'));
        expect((await repo.findAll()).map((s) => s.id)).toEqual(['a', 'b', 'c']);
      });

      it('excludes soft-deleted subscriptions', async () => {
        await repo.save(sub('a'));
        await repo.save(sub('b'));
        await repo.softDelete('a');
        expect((await repo.findAll()).map((s) => s.id)).toEqual(['b']);
      });
    });

    describe('metadata', () => {
      it('stamps version 1 and equal timestamps on insert', async () => {
        await repo.save(sub('a'));
        const record = await repo.getRecord('a');
        expect(record?.version).toBe(1);
        expect(record?.createdAt).toBe(1_000_000);
        expect(record?.updatedAt).toBe(1_000_000);
        expect(record?.deletedAt).toBeNull();
      });

      it('bumps version and updatedAt on update but keeps createdAt', async () => {
        await repo.save(sub('a'));
        clock.advance(5000);
        await repo.save(sub('a', { name: 'Renamed' }));
        const record = await repo.getRecord('a');
        expect(record?.version).toBe(2);
        expect(record?.createdAt).toBe(1_000_000);
        expect(record?.updatedAt).toBe(1_005_000);
      });

      it('returns null metadata for an unknown id', async () => {
        expect(await repo.getRecord('nope')).toBeNull();
      });
    });

    describe('softDelete', () => {
      it('hides the subscription but keeps a tombstone record', async () => {
        await repo.save(sub('a'));
        clock.advance(2000);
        await repo.softDelete('a');

        expect(await repo.findById('a')).toBeNull();
        const record = await repo.getRecord('a');
        expect(record?.deletedAt).toBe(1_002_000);
        expect(record?.version).toBe(2);
        expect(record?.subscription.id).toBe('a');
      });

      it('throws when deleting an unknown id', async () => {
        await expect(repo.softDelete('nope')).rejects.toThrow(/unknown/i);
      });

      it('is idempotent: a second delete does not bump the version', async () => {
        await repo.save(sub('a'));
        await repo.softDelete('a');
        const afterFirst = await repo.getRecord('a');
        await repo.softDelete('a');
        const afterSecond = await repo.getRecord('a');
        expect(afterSecond?.version).toBe(afterFirst?.version);
        expect(afterSecond?.deletedAt).toBe(afterFirst?.deletedAt);
      });

      it('resurrects a soft-deleted subscription on save', async () => {
        await repo.save(sub('a'));
        await repo.softDelete('a');
        clock.advance(3000);
        await repo.save(sub('a', { name: 'Back' }));

        expect((await repo.findById('a'))?.name).toBe('Back');
        const record = await repo.getRecord('a');
        expect(record?.deletedAt).toBeNull();
        expect(record?.version).toBe(3);
      });
    });

    describe('isolation', () => {
      it('does not leak internal state through getRecord', async () => {
        await repo.save(sub('a'));
        const record = await repo.getRecord('a');
        // Mutating the returned record must not affect the store.
        (record as { version: number }).version = 999;
        expect((await repo.getRecord('a'))?.version).toBe(1);
      });
    });
  });
}
