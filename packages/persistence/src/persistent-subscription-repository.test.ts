import { beforeEach, describe, expect, it } from 'vitest';
import { BillingCycle, DateOnly, ManualClock, Money, Subscription } from '@subtrackr/domain';
import { InMemoryKeyValueStore } from './in-memory-key-value-store';
import { PersistentSubscriptionRepository } from './persistent-subscription-repository';
import { subscriptionRepositoryContract } from './subscription-repository.contract';

// Same behaviour as the in-memory adapter: a fresh store per repository.
subscriptionRepositoryContract(
  'PersistentSubscriptionRepository',
  (clock) => new PersistentSubscriptionRepository(new InMemoryKeyValueStore(), clock),
);

describe('PersistentSubscriptionRepository durability', () => {
  let store: InMemoryKeyValueStore;
  let clock: ManualClock;

  const sub = (id: string, name: string): Subscription =>
    Subscription.create({
      id,
      name,
      amount: Money.of(1799, 'EUR'),
      cycle: BillingCycle.monthly(),
      anchorDate: DateOnly.fromISO('2026-01-15'),
    });

  beforeEach(() => {
    store = new InMemoryKeyValueStore();
    clock = new ManualClock(1_000_000);
  });

  it('reloads saved subscriptions in a new instance sharing the store', async () => {
    const first = new PersistentSubscriptionRepository(store, clock);
    await first.save(sub('a', 'Netflix'));
    await first.save(sub('b', 'Spotify'));

    const second = new PersistentSubscriptionRepository(store, clock);
    expect((await second.findById('a'))?.name).toBe('Netflix');
    expect((await second.findAll()).map((s) => s.id)).toEqual(['a', 'b']);
  });

  it('preserves metadata across instances', async () => {
    const first = new PersistentSubscriptionRepository(store, clock);
    await first.save(sub('a', 'Netflix'));
    clock.advance(5000);
    await first.save(sub('a', 'Netflix Premium'));

    const second = new PersistentSubscriptionRepository(store, clock);
    const record = await second.getRecord('a');
    expect(record?.version).toBe(2);
    expect(record?.createdAt).toBe(1_000_000);
    expect(record?.updatedAt).toBe(1_005_000);
    expect(record?.subscription.name).toBe('Netflix Premium');
  });

  it('reflects a soft delete across instances', async () => {
    const first = new PersistentSubscriptionRepository(store, clock);
    await first.save(sub('a', 'Netflix'));
    await first.softDelete('a');

    const second = new PersistentSubscriptionRepository(store, clock);
    expect(await second.findById('a')).toBeNull();
    expect((await second.getRecord('a'))?.deletedAt).not.toBeNull();
  });

  it('uses a distinct storage key so unrelated data is untouched', async () => {
    const repo = new PersistentSubscriptionRepository(store, clock, 'custom.key');
    await repo.save(sub('a', 'Netflix'));
    expect(await store.get('custom.key')).not.toBeNull();
    expect(await store.get('subtrackr.subscriptions.v1')).toBeNull();
  });
});
