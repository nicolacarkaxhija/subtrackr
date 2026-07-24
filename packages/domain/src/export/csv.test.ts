import { describe, expect, it } from 'vitest';
import { exportSubscriptionsToCsv } from './csv';
import { Subscription, type SubscriptionProps } from '../entities/subscription';
import { Money } from '../value-objects/money';
import { BillingCycle } from '../value-objects/billing-cycle';
import { DateOnly } from '../value-objects/date-only';

const sub = (over: Partial<SubscriptionProps> = {}): Subscription =>
  Subscription.create({
    id: 'a',
    name: 'Netflix',
    amount: Money.of(1799, 'EUR'),
    cycle: BillingCycle.monthly(),
    anchorDate: DateOnly.fromISO('2026-01-15'),
    ...over,
  });

const BOM = String.fromCharCode(0xfeff);
const lines = (csv: string): string[] => csv.replace(BOM, '').trimEnd().split('\r\n');

describe('exportSubscriptionsToCsv', () => {
  it('starts with a UTF-8 BOM', () => {
    expect(exportSubscriptionsToCsv([]).startsWith(BOM)).toBe(true);
  });

  it('emits only the header for an empty list', () => {
    expect(lines(exportSubscriptionsToCsv([]))).toHaveLength(1);
  });

  it('has a stable header row', () => {
    const [header] = lines(exportSubscriptionsToCsv([]));
    expect(header).toBe(
      'name,category,amount,currency,amountMinor,cycle,customIntervalDays,firstCharge,status,sharedWith,trialEnds,paymentLabel,url,notes,id',
    );
  });

  it('uses CRLF line endings', () => {
    expect(exportSubscriptionsToCsv([sub()]).includes('\r\n')).toBe(true);
  });

  it('writes a row with the expected values', () => {
    const [, row] = lines(exportSubscriptionsToCsv([sub({ category: 'Streaming' })]));
    expect(row).toBe('Netflix,Streaming,17.99,EUR,1799,monthly,,2026-01-15,active,,,,,,a');
  });

  it('leaves optional fields blank when absent', () => {
    const [, row] = lines(exportSubscriptionsToCsv([sub()]));
    const cells = row?.split(',');
    expect(cells?.[1]).toBe(''); // category
    expect(cells?.[9]).toBe(''); // sharedWith
    expect(cells?.[10]).toBe(''); // trialEnds
  });

  it('includes shared and trial data when present', () => {
    const [, row] = lines(
      exportSubscriptionsToCsv([
        sub({ sharedWith: 4, trialEndsAt: DateOnly.fromISO('2026-01-29') }),
      ]),
    );
    const cells = row?.split(',');
    expect(cells?.[9]).toBe('4');
    expect(cells?.[10]).toBe('2026-01-29');
  });

  it('includes payment label and url when present', () => {
    const [, row] = lines(
      exportSubscriptionsToCsv([sub({ paymentLabel: 'Visa 1234', url: 'https://x.io' })]),
    );
    const cells = row?.split(',');
    expect(cells?.[11]).toBe('Visa 1234');
    expect(cells?.[12]).toBe('https://x.io');
  });

  it('leaves payment label and url blank when absent', () => {
    const cells = lines(exportSubscriptionsToCsv([sub()]))[1]?.split(',');
    expect(cells?.[11]).toBe('');
    expect(cells?.[12]).toBe('');
  });

  it('records the custom interval for custom cycles', () => {
    const [, row] = lines(exportSubscriptionsToCsv([sub({ cycle: BillingCycle.custom(45) })]));
    expect(row?.split(',')[6]).toBe('45');
  });

  it('quotes a field containing a comma', () => {
    const [, row] = lines(exportSubscriptionsToCsv([sub({ name: 'Acme, Inc.' })]));
    expect(row?.startsWith('"Acme, Inc.",')).toBe(true);
  });

  it('escapes embedded quotes by doubling them', () => {
    const csv = exportSubscriptionsToCsv([sub({ name: 'The "Best"' })]);
    expect(csv.includes('"The ""Best"""')).toBe(true);
  });

  it('quotes a field containing a newline', () => {
    const csv = exportSubscriptionsToCsv([sub({ notes: 'line1\nline2' })]);
    expect(csv.includes('"line1\nline2"')).toBe(true);
  });

  it('preserves the exact minor units for round-trip fidelity', () => {
    const [, row] = lines(exportSubscriptionsToCsv([sub({ amount: Money.of(999_999, 'EUR') })]));
    const cells = row?.split(',');
    expect(cells?.[2]).toBe('9999.99'); // amount
    expect(cells?.[4]).toBe('999999'); // amountMinor
  });

  it('emits one row per subscription', () => {
    const csv = exportSubscriptionsToCsv([sub({ id: 'a' }), sub({ id: 'b' }), sub({ id: 'c' })]);
    expect(lines(csv)).toHaveLength(4); // header + 3
  });
});
