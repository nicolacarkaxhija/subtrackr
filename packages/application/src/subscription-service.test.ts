import { beforeEach, describe, expect, it } from 'vitest';
import {
  BillingCycle,
  DateOnly,
  ManualClock,
  Money,
  type IdGenerator,
  type SubscriptionRepository,
} from '@subtrackr/domain';
import { InMemorySubscriptionRepository } from '@subtrackr/persistence';
import { SubscriptionService, type AddSubscriptionInput } from './subscription-service';

class SequentialIdGenerator implements IdGenerator {
  private count = 0;
  next(): string {
    this.count += 1;
    return `id-${this.count}`;
  }
}

const input = (over: Partial<AddSubscriptionInput> = {}): AddSubscriptionInput => ({
  name: 'Netflix',
  amount: Money.of(1799, 'EUR'),
  cycle: BillingCycle.monthly(),
  anchorDate: DateOnly.fromISO('2026-01-15'),
  ...over,
});

describe('SubscriptionService', () => {
  let clock: ManualClock;
  let repository: SubscriptionRepository;
  let service: SubscriptionService;

  beforeEach(() => {
    clock = new ManualClock(1_000_000);
    repository = new InMemorySubscriptionRepository(clock);
    service = new SubscriptionService({
      repository,
      idGenerator: new SequentialIdGenerator(),
    });
  });

  describe('add', () => {
    it('assigns a generated id and persists the subscription', async () => {
      const created = await service.add(input({ name: 'Spotify' }));
      expect(created.id).toBe('id-1');
      expect(created.name).toBe('Spotify');
      expect((await service.get('id-1'))?.name).toBe('Spotify');
    });

    it('gives each subscription a distinct id', async () => {
      const a = await service.add(input());
      const b = await service.add(input());
      expect(a.id).not.toBe(b.id);
    });

    it('starts new subscriptions active', async () => {
      expect((await service.add(input())).status).toBe('active');
    });

    it('rejects invalid input and persists nothing', async () => {
      await expect(service.add(input({ name: '   ' }))).rejects.toThrow(/name/i);
      expect(await service.list()).toEqual([]);
    });

    it('forwards optional metadata to the entity', async () => {
      const created = await service.add(input({ category: 'Music', notes: 'family' }));
      expect(created.category).toBe('Music');
      expect(created.notes).toBe('family');
    });
  });

  describe('list', () => {
    it('is empty initially', async () => {
      expect(await service.list()).toEqual([]);
    });

    it('returns subscriptions oldest first', async () => {
      await service.add(input({ name: 'A' }));
      clock.advance(1000);
      await service.add(input({ name: 'B' }));
      expect((await service.list()).map((s) => s.name)).toEqual(['A', 'B']);
    });
  });

  describe('get', () => {
    it('returns null for an unknown id', async () => {
      expect(await service.get('missing')).toBeNull();
    });
  });

  describe('pause / resume', () => {
    it('pauses and persists', async () => {
      const { id } = await service.add(input());
      const paused = await service.pause(id);
      expect(paused.status).toBe('paused');
      expect((await service.get(id))?.status).toBe('paused');
    });

    it('resumes a paused subscription', async () => {
      const { id } = await service.add(input());
      await service.pause(id);
      const resumed = await service.resume(id);
      expect(resumed.status).toBe('active');
      expect((await service.get(id))?.status).toBe('active');
    });

    it('rejects an illegal transition (from the entity)', async () => {
      const { id } = await service.add(input());
      await expect(service.resume(id)).rejects.toThrow(/cannot resume/i);
    });

    it('throws not-found for an unknown id', async () => {
      await expect(service.pause('missing')).rejects.toThrow(/not found/i);
      await expect(service.resume('missing')).rejects.toThrow(/not found/i);
    });
  });

  describe('cancel', () => {
    it('marks the subscription cancelled but keeps it retrievable', async () => {
      const { id } = await service.add(input());
      const cancelled = await service.cancel(id);
      expect(cancelled.status).toBe('cancelled');
      expect((await service.get(id))?.status).toBe('cancelled');
    });

    it('throws not-found for an unknown id', async () => {
      await expect(service.cancel('missing')).rejects.toThrow(/not found/i);
    });
  });

  describe('update', () => {
    it('changes fields and persists them', async () => {
      const { id } = await service.add(input({ name: 'Netflix' }));
      const updated = await service.update(
        id,
        input({ name: 'Netflix Premium', amount: Money.of(2199, 'EUR') }),
      );
      expect(updated.name).toBe('Netflix Premium');
      expect(updated.amount.amountMinor).toBe(2199n);
      expect((await service.get(id))?.name).toBe('Netflix Premium');
    });

    it('keeps the same id and preserves the current status', async () => {
      const { id } = await service.add(input());
      await service.pause(id);
      const updated = await service.update(id, input({ name: 'Renamed' }));
      expect(updated.id).toBe(id);
      expect(updated.status).toBe('paused');
    });

    it('bumps the version and keeps the created timestamp', async () => {
      const { id } = await service.add(input());
      clock.advance(5000);
      await service.update(id, input({ name: 'Renamed' }));
      const record = await repository.getRecord(id);
      expect(record?.version).toBe(2);
      expect(record?.createdAt).toBe(1_000_000);
      expect(record?.updatedAt).toBe(1_005_000);
    });

    it('throws not-found for an unknown id', async () => {
      await expect(service.update('missing', input())).rejects.toThrow(/not found/i);
    });

    it('rejects invalid input and leaves the stored value unchanged', async () => {
      const { id } = await service.add(input({ name: 'Netflix' }));
      await expect(service.update(id, input({ name: '   ' }))).rejects.toThrow(/name/i);
      expect((await service.get(id))?.name).toBe('Netflix');
    });
  });

  describe('remove', () => {
    it('soft-deletes so the subscription disappears from reads', async () => {
      const { id } = await service.add(input());
      await service.remove(id);
      expect(await service.get(id)).toBeNull();
      expect(await service.list()).toEqual([]);
    });

    it('propagates the repository error for an unknown id', async () => {
      await expect(service.remove('missing')).rejects.toThrow(/unknown/i);
    });
  });
});
