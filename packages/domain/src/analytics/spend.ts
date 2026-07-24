import type { Subscription } from '../entities/subscription';
import { Money } from '../value-objects/money';
import type { Rates } from '../ports/rates';

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

/**
 * Total monthly-equivalent spend across active subscriptions, converted to a single
 * base currency via `rates`. Returns null if any active subscription uses a currency the
 * rates cannot convert, so the caller can fall back to the per-currency breakdown.
 */
export function monthlyTotalInBase(
  subscriptions: readonly Subscription[],
  rates: Rates,
  baseCurrency: string,
): Money | null {
  let total = Money.zero(baseCurrency);
  for (const subscription of subscriptions) {
    if (subscription.status !== 'active') {
      continue;
    }
    const monthly = subscription.myMonthlyCost();
    if (!rates.canConvert(monthly.currency, baseCurrency)) {
      return null;
    }
    total = total.plus(rates.convert(monthly, baseCurrency));
  }
  return total;
}
