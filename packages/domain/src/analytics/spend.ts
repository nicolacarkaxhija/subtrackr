import type { Subscription } from '../entities/subscription';
import type { Money } from '../value-objects/money';

/**
 * Total monthly-equivalent spend per currency across the active subscriptions, sorted
 * by currency code, using the user's share of any shared plan. Paused and cancelled
 * subscriptions are excluded (they are not currently billing). Amounts are not converted
 * between currencies here; a base-currency conversion needs a rates source (ADR 0008).
 */
export function monthlyTotalsByCurrency(subscriptions: readonly Subscription[]): Money[] {
  const totals = new Map<string, Money>();
  for (const subscription of subscriptions) {
    if (subscription.status !== 'active') {
      continue;
    }
    const monthly = subscription.myMonthlyCost();
    const running = totals.get(monthly.currency);
    totals.set(monthly.currency, running === undefined ? monthly : running.plus(monthly));
  }
  return [...totals.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}
