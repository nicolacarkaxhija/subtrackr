import {
  Subscription,
  type IdGenerator,
  type SubscriptionProps,
  type SubscriptionRepository,
} from '@subtrackr/domain';

/** Everything needed to add a subscription except the id (minted by the service). */
export type AddSubscriptionInput = Omit<SubscriptionProps, 'id' | 'status'>;

/**
 * Application service for the subscription lifecycle. Orchestrates the domain entity
 * over its ports (repository + id generator); it holds no persistence or platform
 * detail itself. Timestamps/versioning are the repository's concern (ADR 0003).
 */
export class SubscriptionService {
  private readonly repository: SubscriptionRepository;
  private readonly idGenerator: IdGenerator;

  constructor(deps: { repository: SubscriptionRepository; idGenerator: IdGenerator }) {
    this.repository = deps.repository;
    this.idGenerator = deps.idGenerator;
  }

  /** Create and persist a new active subscription, returning it. */
  async add(input: AddSubscriptionInput): Promise<Subscription> {
    const subscription = Subscription.create({ ...input, id: this.idGenerator.next() });
    await this.repository.save(subscription);
    return subscription;
  }

  /**
   * Replace an existing subscription's editable fields, preserving its id and current
   * status. Throws if the subscription is unknown or soft-deleted.
   */
  async update(id: string, input: AddSubscriptionInput): Promise<Subscription> {
    const existing = await this.repository.findById(id);
    if (existing === null) {
      throw new RangeError(`Subscription "${id}" not found`);
    }
    const updated = Subscription.create({ ...input, id, status: existing.status });
    await this.repository.save(updated);
    return updated;
  }

  /** All live subscriptions, oldest first. */
  list(): Promise<Subscription[]> {
    return this.repository.findAll();
  }

  /** A single live subscription, or `null` if unknown/deleted. */
  get(id: string): Promise<Subscription | null> {
    return this.repository.findById(id);
  }

  /** Pause an active subscription. */
  pause(id: string): Promise<Subscription> {
    return this.transition(id, (subscription) => subscription.pause());
  }

  /** Resume a paused subscription. */
  resume(id: string): Promise<Subscription> {
    return this.transition(id, (subscription) => subscription.resume());
  }

  /** Cancel an active or paused subscription (keeps it retrievable as a record). */
  cancel(id: string): Promise<Subscription> {
    return this.transition(id, (subscription) => subscription.cancel());
  }

  /** Soft-delete a subscription so it disappears from reads. */
  remove(id: string): Promise<void> {
    return this.repository.softDelete(id);
  }

  private async transition(
    id: string,
    change: (subscription: Subscription) => Subscription,
  ): Promise<Subscription> {
    const current = await this.repository.findById(id);
    if (current === null) {
      throw new RangeError(`Subscription "${id}" not found`);
    }
    const updated = change(current);
    await this.repository.save(updated);
    return updated;
  }
}
