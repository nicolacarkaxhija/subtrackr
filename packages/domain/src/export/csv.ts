import type { Subscription } from '../entities/subscription';

/** Byte-order mark so spreadsheet apps read the file as UTF-8. */
const BOM = String.fromCharCode(0xfeff);

const COLUMNS = [
  'name',
  'category',
  'amount',
  'currency',
  'amountMinor',
  'cycle',
  'customIntervalDays',
  'firstCharge',
  'status',
  'sharedWith',
  'trialEnds',
  'paymentLabel',
  'url',
  'notes',
  'id',
] as const;

/**
 * Export subscriptions as RFC-4180 CSV: a leading UTF-8 BOM (for spreadsheet apps),
 * CRLF line endings, fields with commas/quotes/newlines quoted (embedded quotes
 * doubled). Amounts are written both human-readable and as exact minor units so the
 * file round-trips. Pure and platform-independent; the caller handles the file save.
 */
export function exportSubscriptionsToCsv(subscriptions: readonly Subscription[]): string {
  const header = COLUMNS.join(',');
  const rows = subscriptions.map((subscription) => toRow(subscription).map(csvField).join(','));
  return `${BOM}${[header, ...rows].join('\r\n')}\r\n`;
}

function toRow(subscription: Subscription): string[] {
  return [
    subscription.name,
    subscription.category ?? '',
    subscription.amount.toDecimalString(),
    subscription.amount.currency,
    subscription.amount.amountMinor.toString(),
    subscription.cycle.unit,
    subscription.cycle.customIntervalDays === null
      ? ''
      : String(subscription.cycle.customIntervalDays),
    subscription.anchorDate.toISO(),
    subscription.status,
    subscription.sharedWith === undefined ? '' : String(subscription.sharedWith),
    subscription.trialEndsAt === undefined ? '' : subscription.trialEndsAt.toISO(),
    subscription.paymentLabel ?? '',
    subscription.url ?? '',
    subscription.notes ?? '',
    subscription.id,
  ];
}

function csvField(value: string): string {
  if (/["\r\n,]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
