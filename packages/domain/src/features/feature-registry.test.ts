import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { FeatureRegistry } from './feature-registry.js';
import type { FeatureDefinition, ResolutionContext } from './feature-registry.js';

const def = (key: string, over: Partial<FeatureDefinition> = {}): FeatureDefinition => ({
  key,
  tier: 'free',
  platforms: ['ios', 'android', 'web'],
  defaultFlag: true,
  defaultPreference: true,
  userConfigurable: true,
  ...over,
});

const ctx = (over: Partial<ResolutionContext> = {}): ResolutionContext => ({
  platform: 'ios',
  entitlement: 'free',
  ...over,
});

/** The four resolution axes, for exhaustive per-axis assertions. */
interface AxisFlags {
  capability: boolean;
  entitlement: boolean;
  flag: boolean;
  preference: boolean;
}

describe('FeatureRegistry construction', () => {
  it('rejects duplicate keys', () => {
    expect(() => new FeatureRegistry([def('a'), def('a')], ctx())).toThrow(/duplicate/i);
  });

  it('rejects a dependency on an unknown feature', () => {
    // Assert the SPECIFIC message: without this guard the failure would surface later
    // as a generic "Unknown feature" from the cycle walk, masking the missing check.
    expect(() => new FeatureRegistry([def('a', { requires: ['ghost'] })], ctx())).toThrow(
      /Feature "a" requires unknown feature "ghost"/,
    );
  });

  it('rejects a direct cycle and reports the path', () => {
    const defs = [def('a', { requires: ['b'] }), def('b', { requires: ['a'] })];
    expect(() => new FeatureRegistry(defs, ctx())).toThrow(/cycle/i);
    expect(() => new FeatureRegistry(defs, ctx())).toThrow(/a -> b -> a/);
  });

  it('rejects a self-cycle', () => {
    expect(() => new FeatureRegistry([def('a', { requires: ['a'] })], ctx())).toThrow(/a -> a/);
  });

  it('rejects a transitive cycle and reports the full path', () => {
    const defs = [
      def('a', { requires: ['b'] }),
      def('b', { requires: ['c'] }),
      def('c', { requires: ['a'] }),
    ];
    expect(() => new FeatureRegistry(defs, ctx())).toThrow(/a -> b -> c -> a/);
  });

  it('accepts a diamond dependency (shared prerequisite is not a cycle)', () => {
    const defs = [
      def('base'),
      def('left', { requires: ['base'] }),
      def('right', { requires: ['base'] }),
      def('top', { requires: ['left', 'right'] }),
    ];
    expect(() => new FeatureRegistry(defs, ctx())).not.toThrow();
  });
});

describe('FeatureRegistry axis resolution', () => {
  it('is available when all four axes pass', () => {
    const r = new FeatureRegistry([def('a')], ctx());
    expect(r.isAvailable('a')).toBe(true);
  });

  it('capability: unavailable on an unsupported platform', () => {
    const r = new FeatureRegistry(
      [def('ocr', { platforms: ['ios', 'android'] })],
      ctx({ platform: 'web' }),
    );
    expect(r.isAvailable('ocr')).toBe(false);
    expect(r.explain('ocr').capability).toBe(false);
  });

  it('entitlement: pro feature is unavailable on the free tier', () => {
    const r = new FeatureRegistry([def('export', { tier: 'pro' })], ctx({ entitlement: 'free' }));
    expect(r.isAvailable('export')).toBe(false);
    expect(r.explain('export').entitlement).toBe(false);
  });

  it('entitlement: pro feature is available on the pro tier', () => {
    const r = new FeatureRegistry([def('export', { tier: 'pro' })], ctx({ entitlement: 'pro' }));
    expect(r.isAvailable('export')).toBe(true);
  });

  it('a free feature is available regardless of tier', () => {
    const r = new FeatureRegistry([def('a')], ctx({ entitlement: 'free' }));
    expect(r.isAvailable('a')).toBe(true);
  });

  it('flag: kill-switched feature is unavailable', () => {
    const r = new FeatureRegistry([def('a', { defaultFlag: false })], ctx());
    expect(r.isAvailable('a')).toBe(false);
    expect(r.explain('a').flag).toBe(false);
  });

  it('flag: context override wins over the default', () => {
    const r = new FeatureRegistry([def('a', { defaultFlag: false })], ctx({ flags: { a: true } }));
    expect(r.isAvailable('a')).toBe(true);
  });

  it('preference: opt-out feature is unavailable by default', () => {
    const r = new FeatureRegistry([def('a', { defaultPreference: false })], ctx());
    expect(r.isAvailable('a')).toBe(false);
    expect(r.explain('a').preference).toBe(false);
  });

  it('preference: context override wins over the default', () => {
    const r = new FeatureRegistry(
      [def('a', { defaultPreference: false })],
      ctx({ preferences: { a: true } }),
    );
    expect(r.isAvailable('a')).toBe(true);
  });

  it('throws on an unknown key', () => {
    const r = new FeatureRegistry([def('a')], ctx());
    expect(() => r.isAvailable('ghost')).toThrow(/unknown/i);
    expect(() => r.explain('ghost')).toThrow(/unknown/i);
  });
});

describe('FeatureRegistry dependency cascade', () => {
  const build = (over: Partial<ResolutionContext> = {}) =>
    new FeatureRegistry(
      [
        def('catalog'),
        def('ocr', { requires: ['catalog'] }),
        def('receipt-import', { requires: ['ocr'] }),
      ],
      ctx(over),
    );

  it('a dependent is unavailable when its prerequisite is off', () => {
    const r = build({ flags: { catalog: false } });
    expect(r.isAvailable('catalog')).toBe(false);
    expect(r.isAvailable('ocr')).toBe(false);
  });

  it('cascades transitively through a chain', () => {
    const r = build({ flags: { catalog: false } });
    expect(r.isAvailable('receipt-import')).toBe(false);
  });

  it('reports which prerequisite blocked it', () => {
    const r = build({ flags: { catalog: false } });
    expect(r.explain('ocr').blockedBy).toEqual(['catalog']);
    expect(r.explain('ocr').available).toBe(false);
    // The dependent's own axes are all fine — only the prerequisite failed.
    expect(r.explain('ocr').flag).toBe(true);
  });

  it('is available when the whole chain is satisfied', () => {
    const r = build();
    expect(r.isAvailable('receipt-import')).toBe(true);
    expect(r.explain('receipt-import').blockedBy).toEqual([]);
  });

  it('resolves a diamond without double-counting', () => {
    const r = new FeatureRegistry(
      [
        def('base', { defaultFlag: false }),
        def('left', { requires: ['base'] }),
        def('right', { requires: ['base'] }),
        def('top', { requires: ['left', 'right'] }),
      ],
      ctx(),
    );
    expect(r.isAvailable('top')).toBe(false);
    expect(r.explain('top').blockedBy).toEqual(['left', 'right']);
  });
});

describe('FeatureRegistry.explain', () => {
  it('names the first failing axis as the reason', () => {
    const r = new FeatureRegistry(
      [def('ocr', { platforms: ['ios'], tier: 'pro' })],
      ctx({ platform: 'web', entitlement: 'free' }),
    );
    expect(r.explain('ocr').reason).toMatch(/platform/i);
  });

  it('reports a pro requirement when the platform is fine', () => {
    const r = new FeatureRegistry([def('x', { tier: 'pro' })], ctx({ entitlement: 'free' }));
    expect(r.explain('x').reason).toMatch(/pro/i);
  });

  it('reports a kill-switched flag', () => {
    const r = new FeatureRegistry([def('x', { defaultFlag: false })], ctx());
    expect(r.explain('x').reason).toMatch(/disabled/i);
  });

  it('reports a user opt-out', () => {
    const r = new FeatureRegistry([def('x', { defaultPreference: false })], ctx());
    expect(r.explain('x').reason).toMatch(/settings/i);
  });

  it('reports blocking prerequisites by name', () => {
    const r = new FeatureRegistry(
      [def('a', { defaultFlag: false }), def('b'), def('c', { requires: ['a', 'b'] })],
      ctx(),
    );
    expect(r.explain('c').reason).toMatch(/Requires: a/);
  });

  it('has no reason when available', () => {
    const r = new FeatureRegistry([def('a')], ctx());
    expect(r.explain('a').reason).toBeNull();
  });

  // Each axis must independently drive `available` to false while leaving the other
  // three reported as passing — otherwise the conjunction could be wired wrongly.
  it.each<[string, Partial<FeatureDefinition>, Partial<ResolutionContext>, keyof AxisFlags]>([
    ['capability', { platforms: ['ios'] }, { platform: 'web' }, 'capability'],
    ['entitlement', { tier: 'pro' }, { entitlement: 'free' }, 'entitlement'],
    ['flag', { defaultFlag: false }, {}, 'flag'],
    ['preference', { defaultPreference: false }, {}, 'preference'],
  ])('%s alone makes the feature unavailable', (_name, defOver, ctxOver, failing) => {
    const r = new FeatureRegistry([def('x', defOver)], ctx(ctxOver));
    const breakdown = r.explain('x');
    expect(breakdown.available).toBe(false);
    expect(breakdown[failing]).toBe(false);
    const axes: (keyof AxisFlags)[] = ['capability', 'entitlement', 'flag', 'preference'];
    axes
      .filter((axis) => axis !== failing)
      .forEach((axis) => {
        expect(breakdown[axis]).toBe(true);
      });
  });

  it('reports available with all axes true and nothing blocking', () => {
    const breakdown = new FeatureRegistry([def('a')], ctx()).explain('a');
    expect(breakdown).toMatchObject({
      key: 'a',
      available: true,
      capability: true,
      entitlement: true,
      flag: true,
      preference: true,
      blockedBy: [],
      reason: null,
    });
  });

  it('is unavailable when only a prerequisite fails, despite all own axes passing', () => {
    const r = new FeatureRegistry(
      [def('a', { defaultFlag: false }), def('b', { requires: ['a'] })],
      ctx(),
    );
    const breakdown = r.explain('b');
    expect(breakdown.available).toBe(false);
    expect(
      breakdown.capability && breakdown.entitlement && breakdown.flag && breakdown.preference,
    ).toBe(true);
    expect(breakdown.blockedBy).toEqual(['a']);
  });
});

describe('FeatureRegistry.setPreference', () => {
  it('turns a feature off', () => {
    const r = new FeatureRegistry([def('a')], ctx());
    r.setPreference('a', false);
    expect(r.isAvailable('a')).toBe(false);
  });

  it('turns a feature back on', () => {
    const r = new FeatureRegistry([def('a')], ctx());
    r.setPreference('a', false);
    r.setPreference('a', true);
    expect(r.isAvailable('a')).toBe(true);
  });

  it('disabling a prerequisite cascades to dependents', () => {
    const r = new FeatureRegistry([def('a'), def('b', { requires: ['a'] })], ctx());
    r.setPreference('a', false);
    expect(r.isAvailable('b')).toBe(false);
  });

  it('refuses to enable a feature whose prerequisite is unavailable, naming it', () => {
    const r = new FeatureRegistry(
      [def('a', { defaultFlag: false }), def('b', { requires: ['a'], defaultPreference: false })],
      ctx(),
    );
    expect(() => r.setPreference('b', true)).toThrow(/Cannot enable "b"/);
    expect(() => r.setPreference('b', true)).toThrow(/prerequisite\(s\) a/);
    // The rejected write must not have taken effect.
    expect(r.explain('b').preference).toBe(false);
  });

  it('allows disabling a feature even when its prerequisite is unavailable', () => {
    const r = new FeatureRegistry(
      [def('a', { defaultFlag: false }), def('b', { requires: ['a'] })],
      ctx(),
    );
    expect(() => r.setPreference('b', false)).not.toThrow();
    expect(r.explain('b').preference).toBe(false);
  });

  it('refuses to change a non-configurable feature', () => {
    const r = new FeatureRegistry([def('core', { userConfigurable: false })], ctx());
    expect(() => r.setPreference('core', false)).toThrow(/Feature "core" is not user-configurable/);
  });

  it('throws on an unknown key', () => {
    const r = new FeatureRegistry([def('a')], ctx());
    expect(() => r.setPreference('ghost', true)).toThrow(/unknown/i);
  });
});

describe('FeatureRegistry.applyPreset', () => {
  const defs = [def('a'), def('b', { requires: ['a'] }), def('c')];

  it('applies several preferences at once', () => {
    const r = new FeatureRegistry(defs, ctx());
    r.applyPreset({ a: false, c: false });
    expect(r.isAvailable('a')).toBe(false);
    expect(r.isAvailable('c')).toBe(false);
  });

  it('is atomic: an invalid preset leaves state untouched', () => {
    const r = new FeatureRegistry(defs, ctx());
    const before = r.snapshot();
    // Enabling b while disabling its prerequisite a is inconsistent.
    expect(() => r.applyPreset({ a: false, b: true })).toThrow(/Cannot enable "b"/);
    expect(() => r.applyPreset({ a: false, b: true })).toThrow(/prerequisite\(s\) a/);
    // Every preference must be rolled back, including the one that applied cleanly.
    expect(r.snapshot()).toEqual(before);
    expect(r.explain('a').preference).toBe(true);
    expect(r.explain('b').preference).toBe(true);
  });

  it('rolls back unrelated keys too when a later key fails validation', () => {
    const r = new FeatureRegistry(defs, ctx());
    expect(() => r.applyPreset({ c: false, a: false, b: true })).toThrow(/Cannot enable/);
    expect(r.explain('c').preference).toBe(true);
    expect(r.isAvailable('c')).toBe(true);
  });

  it('accepts a consistent preset that enables a dependent with its prerequisite', () => {
    const r = new FeatureRegistry(defs, ctx());
    r.applyPreset({ a: true, b: true });
    expect(r.isAvailable('b')).toBe(true);
  });

  it('is idempotent', () => {
    const r = new FeatureRegistry(defs, ctx());
    r.applyPreset({ a: false });
    const first = r.snapshot();
    r.applyPreset({ a: false });
    expect(r.snapshot()).toEqual(first);
  });

  it('rejects an unknown key', () => {
    const r = new FeatureRegistry(defs, ctx());
    expect(() => r.applyPreset({ ghost: true })).toThrow(/unknown/i);
  });

  it('rejects a non-configurable key', () => {
    const r = new FeatureRegistry([def('core', { userConfigurable: false })], ctx());
    expect(() => r.applyPreset({ core: false })).toThrow(/not user-configurable/i);
  });
});

describe('FeatureRegistry.snapshot', () => {
  it('reports availability for every feature', () => {
    const r = new FeatureRegistry([def('a'), def('b', { defaultFlag: false })], ctx());
    expect(r.snapshot()).toEqual({ a: true, b: false });
  });
});

// ── Property-based invariants ──────────────────────────────────────────────
describe('FeatureRegistry properties', () => {
  // A linear chain f0 <- f1 <- f2 ... where each requires the previous.
  const arbChain = fc
    .array(fc.boolean(), { minLength: 1, maxLength: 8 })
    .map((flags) =>
      flags.map((flag, i) =>
        def(
          `f${i}`,
          i === 0 ? { defaultFlag: flag } : { defaultFlag: flag, requires: [`f${i - 1}`] },
        ),
      ),
    );

  it('a feature is available only if every prerequisite is available', () => {
    fc.assert(
      fc.property(arbChain, (defs) => {
        const r = new FeatureRegistry(defs, ctx());
        defs.forEach((d) => {
          if (r.isAvailable(d.key)) {
            (d.requires ?? []).forEach((dep) => {
              expect(r.isAvailable(dep)).toBe(true);
            });
          }
        });
      }),
    );
  });

  it('in a chain, availability stops at the first disabled link', () => {
    fc.assert(
      fc.property(arbChain, (defs) => {
        const r = new FeatureRegistry(defs, ctx());
        const firstOff = defs.findIndex((d) => !d.defaultFlag);
        defs.forEach((d, i) => {
          const expected = firstOff === -1 || i < firstOff;
          expect(r.isAvailable(d.key)).toBe(expected);
        });
      }),
    );
  });

  it('preference can never enable a feature blocked by another axis', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (flag, pref) => {
        const r = new FeatureRegistry([def('a', { defaultFlag: flag })], ctx());
        if (!flag) {
          expect(() => r.setPreference('a', pref)).not.toThrow();
          expect(r.isAvailable('a')).toBe(false);
        }
      }),
    );
  });
});
