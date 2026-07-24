import {
  BillingCycle,
  DateOnly,
  Money,
  Subscription,
  type CycleUnit,
  type SubscriptionRecord,
  type SubscriptionStatus,
} from '@subtrackr/domain';

/** Bump when the serialized shape changes; deserialize rejects unknown versions. */
const SCHEMA_VERSION = 1;

interface SerializedSubscription {
  id: string;
  name: string;
  amountMinor: string; // bigint as string; JSON has no bigint
  currency: string;
  cycleUnit: CycleUnit;
  customIntervalDays: number | null;
  anchorDate: string; // ISO YYYY-MM-DD
  status: SubscriptionStatus;
  category?: string;
  trialEndsAt?: string;
  paymentLabel?: string;
  url?: string;
  notes?: string;
  catalogServiceId?: string;
}

interface SerializedRecord {
  subscription: SerializedSubscription;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  version: number;
}

interface SerializedStore {
  schema: number;
  records: SerializedRecord[];
}

/** Serialize records to a JSON string suitable for a KeyValueStore. */
export function serializeSubscriptionRecords(records: readonly SubscriptionRecord[]): string {
  const store: SerializedStore = { schema: SCHEMA_VERSION, records: records.map(encodeRecord) };
  return JSON.stringify(store);
}

/** Parse records previously produced by {@link serializeSubscriptionRecords}. */
export function deserializeSubscriptionRecords(raw: string): SubscriptionRecord[] {
  const store = JSON.parse(raw) as SerializedStore;
  if (store.schema !== SCHEMA_VERSION) {
    throw new Error(`Unsupported subscription store schema: ${String(store.schema)}`);
  }
  return store.records.map(decodeRecord);
}

function encodeRecord(record: SubscriptionRecord): SerializedRecord {
  const s = record.subscription;
  const subscription: SerializedSubscription = {
    id: s.id,
    name: s.name,
    amountMinor: s.amount.amountMinor.toString(),
    currency: s.amount.currency,
    cycleUnit: s.cycle.unit,
    customIntervalDays: s.cycle.customIntervalDays,
    anchorDate: s.anchorDate.toISO(),
    status: s.status,
  };
  if (s.category !== undefined) subscription.category = s.category;
  if (s.trialEndsAt !== undefined) subscription.trialEndsAt = s.trialEndsAt.toISO();
  if (s.paymentLabel !== undefined) subscription.paymentLabel = s.paymentLabel;
  if (s.url !== undefined) subscription.url = s.url;
  if (s.notes !== undefined) subscription.notes = s.notes;
  if (s.catalogServiceId !== undefined) subscription.catalogServiceId = s.catalogServiceId;
  return {
    subscription,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt,
    version: record.version,
  };
}

function decodeRecord(record: SerializedRecord): SubscriptionRecord {
  const s = record.subscription;
  const subscription = Subscription.create({
    id: s.id,
    name: s.name,
    amount: Money.of(BigInt(s.amountMinor), s.currency),
    cycle: decodeCycle(s.cycleUnit, s.customIntervalDays),
    anchorDate: DateOnly.fromISO(s.anchorDate),
    status: s.status,
    ...(s.category !== undefined ? { category: s.category } : {}),
    ...(s.trialEndsAt !== undefined ? { trialEndsAt: DateOnly.fromISO(s.trialEndsAt) } : {}),
    ...(s.paymentLabel !== undefined ? { paymentLabel: s.paymentLabel } : {}),
    ...(s.url !== undefined ? { url: s.url } : {}),
    ...(s.notes !== undefined ? { notes: s.notes } : {}),
    ...(s.catalogServiceId !== undefined ? { catalogServiceId: s.catalogServiceId } : {}),
  });
  return {
    subscription,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt,
    version: record.version,
  };
}

function decodeCycle(unit: CycleUnit, customIntervalDays: number | null): BillingCycle {
  switch (unit) {
    case 'weekly':
      return BillingCycle.weekly();
    case 'monthly':
      return BillingCycle.monthly();
    case 'quarterly':
      return BillingCycle.quarterly();
    case 'semiannual':
      return BillingCycle.semiannual();
    case 'annual':
      return BillingCycle.annual();
    case 'custom':
      if (customIntervalDays === null) {
        throw new Error('Custom cycle is missing its interval');
      }
      return BillingCycle.custom(customIntervalDays);
  }
}
