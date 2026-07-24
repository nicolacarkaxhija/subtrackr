import { SubscriptionService, type AddSubscriptionInput } from '@subtrackr/application';
import { InMemorySubscriptionRepository } from '@subtrackr/persistence';
import { BillingCycle, DateOnly, Money, type Clock, type IdGenerator } from '@subtrackr/domain';

/** Real-time clock adapter (composition root only — never imported by domain). */
class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }
}

/** UUID id generator; falls back to a random string where crypto.randomUUID is absent. */
class CryptoIdGenerator implements IdGenerator {
  next(): string {
    const maybeCrypto = globalThis.crypto;
    if (maybeCrypto && typeof maybeCrypto.randomUUID === 'function') {
      return maybeCrypto.randomUUID();
    }
    return `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

/**
 * Composition root. v1 wires the in-memory repository (state resets on reload); a
 * persistent adapter drops in here without touching the UI or the service.
 */
export const subscriptionService = new SubscriptionService({
  repository: new InMemorySubscriptionRepository(new SystemClock()),
  idGenerator: new CryptoIdGenerator(),
});

/** Today's calendar date as a domain DateOnly. */
export function todayDateOnly(): DateOnly {
  const now = new Date();
  return DateOnly.of(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Format money for display, assuming a 2-decimal minor unit (EUR/USD/GBP…). */
export function formatMoney(amount: Money): string {
  const major = Number(amount.amountMinor) / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: amount.currency,
    }).format(major);
  } catch {
    return `${amount.currency} ${major.toFixed(2)}`;
  }
}

const CYCLE_LABELS: Record<string, string> = {
  weekly: 'weekly',
  monthly: '/mo',
  quarterly: '/qtr',
  semiannual: '/6mo',
  annual: '/yr',
  custom: 'custom',
};

export function cycleLabel(cycle: BillingCycle): string {
  return CYCLE_LABELS[cycle.unit] ?? cycle.unit;
}

/** Stand-in for the future bundled catalog (feat-catalog): quick add samples. */
const SAMPLE_CATALOG: ReadonlyArray<{
  name: string;
  amountMinor: number;
  currency: string;
  makeCycle: () => BillingCycle;
  category: string;
}> = [
  {
    name: 'Netflix',
    amountMinor: 1799,
    currency: 'EUR',
    makeCycle: () => BillingCycle.monthly(),
    category: 'Streaming',
  },
  {
    name: 'Spotify',
    amountMinor: 1099,
    currency: 'EUR',
    makeCycle: () => BillingCycle.monthly(),
    category: 'Music',
  },
  {
    name: 'iCloud+',
    amountMinor: 299,
    currency: 'EUR',
    makeCycle: () => BillingCycle.monthly(),
    category: 'Storage',
  },
  {
    name: 'Amazon Prime',
    amountMinor: 8990,
    currency: 'EUR',
    makeCycle: () => BillingCycle.annual(),
    category: 'Shopping',
  },
  {
    name: 'YouTube Premium',
    amountMinor: 1299,
    currency: 'EUR',
    makeCycle: () => BillingCycle.monthly(),
    category: 'Streaming',
  },
  {
    name: 'Notion',
    amountMinor: 900,
    currency: 'USD',
    makeCycle: () => BillingCycle.monthly(),
    category: 'Productivity',
  },
];

export function sampleInput(index: number): AddSubscriptionInput {
  const item = SAMPLE_CATALOG[index % SAMPLE_CATALOG.length];
  return {
    name: item.name,
    amount: Money.of(item.amountMinor, item.currency),
    cycle: item.makeCycle(),
    anchorDate: todayDateOnly(),
    category: item.category,
  };
}
