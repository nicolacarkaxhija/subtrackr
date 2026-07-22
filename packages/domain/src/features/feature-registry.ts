export type Platform = 'ios' | 'android' | 'web';
export type Entitlement = 'free' | 'pro';
export type FeatureKey = string;

export interface FeatureDefinition {
  readonly key: FeatureKey;
  /** Minimum entitlement required to use the feature. */
  readonly tier: Entitlement;
  /** Platforms physically capable of the feature. */
  readonly platforms: readonly Platform[];
  /** Rollout / kill-switch default. */
  readonly defaultFlag: boolean;
  /** Whether the user opts in by default. */
  readonly defaultPreference: boolean;
  /** Whether the feature exposes a user-facing toggle. */
  readonly userConfigurable: boolean;
  /** Features that must be available for this one to work. */
  readonly requires?: readonly FeatureKey[];
}

export interface ResolutionContext {
  readonly platform: Platform;
  readonly entitlement: Entitlement;
  readonly flags?: Readonly<Record<FeatureKey, boolean>>;
  readonly preferences?: Readonly<Record<FeatureKey, boolean>>;
}

export interface AxisBreakdown {
  readonly key: FeatureKey;
  readonly available: boolean;
  readonly capability: boolean;
  readonly entitlement: boolean;
  readonly flag: boolean;
  readonly preference: boolean;
  /** Prerequisites that are themselves unavailable. */
  readonly blockedBy: readonly FeatureKey[];
  /** Human-readable first blocking reason, or null when available. */
  readonly reason: string | null;
}

export type Preset = Readonly<Record<FeatureKey, boolean>>;

/**
 * Single source of truth for "is this feature available right now?".
 *
 * Availability is the conjunction of four independent axes —
 * `capability ∧ entitlement ∧ flag ∧ preference` — plus the transitive
 * availability of every prerequisite. Resolution is entirely local: no network,
 * no tracker (ADR 0006).
 */
/** A feature's definition together with its current user preference. */
interface FeatureState {
  readonly definition: FeatureDefinition;
  preference: boolean;
}

export class FeatureRegistry {
  private readonly features: Map<FeatureKey, FeatureState>;
  private readonly context: ResolutionContext;

  constructor(definitions: readonly FeatureDefinition[], context: ResolutionContext) {
    this.features = new Map();
    for (const definition of definitions) {
      if (this.features.has(definition.key)) {
        throw new RangeError(`Duplicate feature key: "${definition.key}"`);
      }
      this.features.set(definition.key, {
        definition,
        preference: context.preferences?.[definition.key] ?? definition.defaultPreference,
      });
    }
    for (const definition of definitions) {
      for (const dependency of definition.requires ?? []) {
        if (!this.features.has(dependency)) {
          throw new RangeError(
            `Feature "${definition.key}" requires unknown feature "${dependency}"`,
          );
        }
      }
    }
    this.assertAcyclic();
    this.context = context;
  }

  /** Depth-first search rejecting any back edge, so resolution always terminates. */
  private assertAcyclic(): void {
    const visiting = new Set<FeatureKey>();
    const done = new Set<FeatureKey>();

    const walk = (key: FeatureKey, trail: readonly FeatureKey[]): void => {
      if (done.has(key)) {
        return;
      }
      if (visiting.has(key)) {
        throw new RangeError(`Dependency cycle detected: ${[...trail, key].join(' -> ')}`);
      }
      visiting.add(key);
      for (const dependency of this.definitionOf(key).requires ?? []) {
        walk(dependency, [...trail, key]);
      }
      visiting.delete(key);
      done.add(key);
    };

    for (const key of this.features.keys()) {
      walk(key, []);
    }
  }

  private stateOf(key: FeatureKey): FeatureState {
    const state = this.features.get(key);
    if (state === undefined) {
      throw new RangeError(`Unknown feature: "${key}"`);
    }
    return state;
  }

  private definitionOf(key: FeatureKey): FeatureDefinition {
    return this.stateOf(key).definition;
  }

  private axesOf(key: FeatureKey): {
    capability: boolean;
    entitlement: boolean;
    flag: boolean;
    preference: boolean;
  } {
    const { definition, preference } = this.stateOf(key);
    return {
      capability: definition.platforms.includes(this.context.platform),
      entitlement: definition.tier === 'free' || this.context.entitlement === 'pro',
      flag: this.context.flags?.[key] ?? definition.defaultFlag,
      preference,
    };
  }

  private resolve(key: FeatureKey, memo: Map<FeatureKey, boolean>): boolean {
    const cached = memo.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const axes = this.axesOf(key);
    const ownAxesPass = axes.capability && axes.entitlement && axes.flag && axes.preference;
    // Seed the memo before recursing; the graph is acyclic so this only ever
    // short-circuits repeated visits in a diamond.
    memo.set(key, false);
    const prerequisitesPass = (this.definitionOf(key).requires ?? []).every((dependency) =>
      this.resolve(dependency, memo),
    );
    const available = ownAxesPass && prerequisitesPass;
    memo.set(key, available);
    return available;
  }

  isAvailable(key: FeatureKey): boolean {
    this.definitionOf(key);
    return this.resolve(key, new Map());
  }

  explain(key: FeatureKey): AxisBreakdown {
    const axes = this.axesOf(key);
    const memo = new Map<FeatureKey, boolean>();
    const blockedBy = (this.definitionOf(key).requires ?? []).filter(
      (dependency) => !this.resolve(dependency, memo),
    );
    const available =
      axes.capability && axes.entitlement && axes.flag && axes.preference && blockedBy.length === 0;

    return {
      key,
      available,
      ...axes,
      blockedBy,
      reason: this.reasonFor(key, axes, blockedBy),
    };
  }

  private reasonFor(
    key: FeatureKey,
    axes: { capability: boolean; entitlement: boolean; flag: boolean; preference: boolean },
    blockedBy: readonly FeatureKey[],
  ): string | null {
    if (!axes.capability) {
      return `Not supported on this platform (${this.context.platform})`;
    }
    if (!axes.entitlement) {
      return 'Requires Pro';
    }
    if (!axes.flag) {
      return `Feature "${key}" is currently disabled`;
    }
    if (!axes.preference) {
      return 'Turned off in settings';
    }
    if (blockedBy.length > 0) {
      return `Requires: ${blockedBy.join(', ')}`;
    }
    return null;
  }

  /**
   * Record a user preference. A preference can only ever turn a feature *off* —
   * it cannot override capability, entitlement or flag — and a feature cannot be
   * enabled while one of its prerequisites is unavailable.
   */
  setPreference(key: FeatureKey, enabled: boolean): void {
    this.assertConfigurable(key);
    if (enabled) {
      const memo = new Map<FeatureKey, boolean>();
      const missing = (this.definitionOf(key).requires ?? []).filter(
        (dependency) => !this.resolve(dependency, memo),
      );
      if (missing.length > 0) {
        throw new RangeError(
          `Cannot enable "${key}": unavailable prerequisite(s) ${missing.join(', ')}`,
        );
      }
    }
    this.stateOf(key).preference = enabled;
  }

  private assertConfigurable(key: FeatureKey): void {
    const definition = this.definitionOf(key);
    if (!definition.userConfigurable) {
      throw new RangeError(`Feature "${key}" is not user-configurable`);
    }
  }

  /**
   * Apply a set of preferences atomically. The resulting state must be
   * self-consistent: nothing may be enabled while a prerequisite ends up off.
   * On any violation the registry is left untouched.
   */
  applyPreset(preset: Preset): void {
    const entries = Object.entries(preset);
    for (const [key] of entries) {
      this.assertConfigurable(key);
    }

    const previous = new Map(
      [...this.features].map(([key, state]) => [key, state.preference] as const),
    );
    for (const [key, enabled] of entries) {
      this.stateOf(key).preference = enabled;
    }

    try {
      for (const [key, enabled] of entries) {
        if (!enabled) {
          continue;
        }
        const memo = new Map<FeatureKey, boolean>();
        const missing = (this.definitionOf(key).requires ?? []).filter(
          (dependency) => !this.resolve(dependency, memo),
        );
        if (missing.length > 0) {
          throw new RangeError(
            `Cannot enable "${key}": unavailable prerequisite(s) ${missing.join(', ')}`,
          );
        }
      }
    } catch (error) {
      for (const [key, preference] of previous) {
        this.stateOf(key).preference = preference;
      }
      throw error;
    }
  }

  /** Availability of every known feature, for persistence or assertions in tests. */
  snapshot(): Record<FeatureKey, boolean> {
    const memo = new Map<FeatureKey, boolean>();
    const result: Record<FeatureKey, boolean> = {};
    for (const key of this.features.keys()) {
      result[key] = this.resolve(key, memo);
    }
    return result;
  }
}
