import type {
  Clock,
  KeyValueStore,
  Subscription,
  SubscriptionRecord,
  SubscriptionRepository,
} from '@subtrackr/domain';
import { deserializeSubscriptionRecords, serializeSubscriptionRecords } from './subscription-codec';

interface MutableRecord {
  subscription: Subscription;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  version: number;
}

const DEFAULT_KEY = 'subtrackr.subscriptions.v1';

/**
 * {@link SubscriptionRepository} that persists through a {@link KeyValueStore}. It holds
 * the records in memory (loaded once, lazily, on first use) and writes the whole store
 * back after each mutation. Fine for the small datasets a subscription tracker holds; a
 * SQLite adapter can replace it behind the same contract when scale demands.
 */
export class PersistentSubscriptionRepository implements SubscriptionRepository {
  private readonly records = new Map<string, MutableRecord>();
  private hydrated = false;
  private hydration: Promise<void> | undefined;

  constructor(
    private readonly store: KeyValueStore,
    private readonly clock: Clock,
    private readonly key: string = DEFAULT_KEY,
  ) {}

  private ensureHydrated(): Promise<void> {
    if (this.hydrated) {
      return Promise.resolve();
    }
    this.hydration ??= this.hydrate();
    return this.hydration;
  }

  private async hydrate(): Promise<void> {
    const raw = await this.store.get(this.key);
    if (raw !== null) {
      for (const record of deserializeSubscriptionRecords(raw)) {
        this.records.set(record.subscription.id, {
          subscription: record.subscription,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          deletedAt: record.deletedAt,
          version: record.version,
        });
      }
    }
    this.hydrated = true;
  }

  private persist(): Promise<void> {
    return this.store.set(this.key, serializeSubscriptionRecords([...this.records.values()]));
  }

  async save(subscription: Subscription): Promise<void> {
    await this.ensureHydrated();
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
      existing.deletedAt = null;
      existing.version += 1;
    }
    await this.persist();
  }

  async findById(id: string): Promise<Subscription | null> {
    await this.ensureHydrated();
    const record = this.records.get(id);
    return record !== undefined && record.deletedAt === null ? record.subscription : null;
  }

  async findAll(): Promise<Subscription[]> {
    await this.ensureHydrated();
    return [...this.records.values()]
      .filter((record) => record.deletedAt === null)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((record) => record.subscription);
  }

  async softDelete(id: string): Promise<void> {
    await this.ensureHydrated();
    const record = this.records.get(id);
    if (record === undefined) {
      throw new RangeError(`Cannot delete unknown subscription "${id}"`);
    }
    if (record.deletedAt === null) {
      record.deletedAt = this.clock.now();
      record.version += 1;
      await this.persist();
    }
  }

  async getRecord(id: string): Promise<SubscriptionRecord | null> {
    await this.ensureHydrated();
    const record = this.records.get(id);
    return record === undefined ? null : { ...record };
  }
}
