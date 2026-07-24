import { describe, expect, it } from 'vitest';
import { ManualClock } from './clock.js';

describe('ManualClock', () => {
  it('starts at epoch 0 by default', () => {
    expect(new ManualClock().now()).toBe(0);
  });

  it('starts at a given instant', () => {
    expect(new ManualClock(1_700_000_000_000).now()).toBe(1_700_000_000_000);
  });

  it('advances by a positive number of milliseconds', () => {
    const clock = new ManualClock(1000);
    clock.advance(500);
    expect(clock.now()).toBe(1500);
    clock.advance(0);
    expect(clock.now()).toBe(1500);
  });

  it('returns a stable value between advances', () => {
    const clock = new ManualClock(42);
    expect(clock.now()).toBe(42);
    expect(clock.now()).toBe(42);
  });

  it.each([-1, 1.5, Number.NaN])('rejects an invalid start %s', (start) => {
    expect(() => new ManualClock(start)).toThrow(RangeError);
    expect(() => new ManualClock(start)).toThrow(/instant/i);
  });

  it.each([-1, 1.5, Number.NaN])('rejects an invalid advance %s', (ms) => {
    const clock = new ManualClock(0);
    expect(() => clock.advance(ms)).toThrow(RangeError);
    expect(() => clock.advance(ms)).toThrow(/milliseconds/i);
  });
});
