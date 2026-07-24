import type { Subscription } from '../entities/subscription.js';

/**
 * A stored subscription plus the persistence/sync metadata the entity deliberately
 * omits (ADR 0003). `version` + `updatedAt` are the last-writer-wins tiebreakers, and
 * `deletedAt` is a soft delete so a removal can still be propagated by sync (ADR 0002).
 */
export interface SubscriptionRecord {
  readonly subscription: Subscription;
  /** Epoch ms of first insert. */
  readonly createdAt: number;
  /** Epoch ms of the most recent change. */
  readonly updatedAt: number;
  /** Epoch ms of soft deletion, or `null` if live. */
  readonly deletedAt: number | null;
  /** Monotonic per-record version, bumped on every mutation. */
  readonly version: number;
}

/**
 * Persistence port for subscriptions. Adapters (in-memory, SQLite native/web) must all
 * satisfy the same contract — see the shared contract test. Reads exclude soft-deleted
 * records; {@link getRecord} exposes metadata (and tombstones) for sync.
 */
export interface SubscriptionRepository {
  /** Insert or update. Bumps `version` and `updatedAt`; resurrects a soft-deleted row. */
  save(subscription: Subscription): Promise<void>;
  /** The live subscription, or `null` if unknown or soft-deleted. */
  findById(id: string): Promise<Subscription | null>;
  /** All live subscriptions, oldest first. */
  findAll(): Promise<Subscription[]>;
  /** Soft-delete a subscription. Throws if unknown; idempotent if already deleted. */
  softDelete(id: string): Promise<void>;
  /** The full record incl. metadata and tombstones, or `null` if never stored. */
  getRecord(id: string): Promise<SubscriptionRecord | null>;
}
