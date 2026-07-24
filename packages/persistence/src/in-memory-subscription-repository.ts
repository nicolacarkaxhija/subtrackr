import type {
  Clock,
  Subscription,
  SubscriptionRecord,
  SubscriptionRepository,
} from '@subtrackr/domain';

interface MutableRecord {
  subscription: Subscription;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  version: number;
}

/**
 * Reference {@link SubscriptionRepository} backed by an in-memory map. Used as a fast
 * test double and the behavioural baseline the SQLite adapters must match (validated by
 * the shared contract test). Timestamps come from the injected {@link Clock}.
 */
export class InMemorySubscriptionRepository implements SubscriptionRepository {
  private readonly records = new Map<string, MutableRecord>();

  constructor(private readonly clock: Clock) {}

  save(subscription: Subscription): Promise<void> {
    const now = this.clock.now();
    const existing = this.records.get(subscription.id);
    if (existing === undefined) {
      this.records.set(subscription.id, {
        subscription,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        version: 1,
      });
    } else {
      existing.subscription = subscription;
      existing.updatedAt = now;
      existing.deletedAt = null; // saving resurrects a soft-deleted record
      existing.version += 1;
    }
    return Promise.resolve();
  }

  findById(id: string): Promise<Subscription | null> {
    const record = this.records.get(id);
    const live = record !== undefined && record.deletedAt === null ? record.subscription : null;
    return Promise.resolve(live);
  }

  findAll(): Promise<Subscription[]> {
    const live = [...this.records.values()]
      .filter((record) => record.deletedAt === null)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((record) => record.subscription);
    return Promise.resolve(live);
  }

  softDelete(id: string): Promise<void> {
    const record = this.records.get(id);
    if (record === undefined) {
      return Promise.reject(new RangeError(`Cannot delete unknown subscription "${id}"`));
    }
    if (record.deletedAt === null) {
      record.deletedAt = this.clock.now();
      record.version += 1;
    }
    return Promise.resolve();
  }

  getRecord(id: string): Promise<SubscriptionRecord | null> {
    const record = this.records.get(id);
    // Return a copy so callers cannot mutate internal state.
    return Promise.resolve(record === undefined ? null : { ...record });
  }
}
