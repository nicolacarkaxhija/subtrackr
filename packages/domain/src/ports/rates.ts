import type { Money } from '../value-objects/money';

/**
 * Currency conversion. v1 is satisfied by bundled rates (no network); a live-rates
 * adapter can implement the same port later (ADR 0008). Conversion is exact integer
 * arithmetic on minor units; it assumes both currencies share a two-decimal minor unit.
 */
export interface Rates {
  /** Whether both currencies are known and convertible. */
  canConvert(from: string, to: string): boolean;
  /** Convert `amount` into `to`. Throws if either currency is unknown. */
  convert(amount: Money, to: string): Money;
  /** ISO date the rates were captured, for disclosure in the UI. */
  readonly asOf: string;
}
