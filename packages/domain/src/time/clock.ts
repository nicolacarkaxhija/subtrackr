/**
 * Source of the current instant, as epoch milliseconds (UTC). Injected everywhere the
 * domain needs "now" so the core stays deterministic and testable — no `Date.now()` in
 * domain code (coding-standards). Real adapters (system clock) live in infrastructure.
 */
export interface Clock {
  /** Current instant as epoch milliseconds. */
  now(): number;
}

/** A deterministic {@link Clock} for tests and simulations. Time only moves when told. */
export class ManualClock implements Clock {
  private current: number;

  constructor(start = 0) {
    ManualClock.assertInstant(start);
    this.current = start;
  }

  now(): number {
    return this.current;
  }

  /** Move time forward by `milliseconds` (non-negative). */
  advance(milliseconds: number): void {
    if (!Number.isInteger(milliseconds) || milliseconds < 0) {
      throw new RangeError(`Clock advance must be a non-negative integer of milliseconds`);
    }
    this.current += milliseconds;
  }

  private static assertInstant(instant: number): void {
    if (!Number.isInteger(instant) || instant < 0) {
      throw new RangeError(`Clock instant must be a non-negative integer (epoch ms)`);
    }
  }
}
