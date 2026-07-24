import type { Money } from '../value-objects/money';
import type { BillingCycle } from '../value-objects/billing-cycle';
import type { DateOnly } from '../value-objects/date-only';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

/** Inputs accepted by {@link Subscription.create}. Optional fields may be omitted. */
export interface SubscriptionProps {
  readonly id: string;
  readonly name: string;
  readonly amount: Money;
  readonly cycle: BillingCycle;
  readonly anchorDate: DateOnly;
  readonly status?: SubscriptionStatus;
  readonly category?: string;
  readonly trialEndsAt?: DateOnly;
  readonly paymentLabel?: string;
  readonly url?: string;
  readonly notes?: string;
  readonly catalogServiceId?: string;
  /** People sharing this plan equally, including the user (>= 2). Omit if not shared. */
  readonly sharedWith?: number;
}

/** Normalized, fully-validated internal shape (status resolved, strings trimmed). */
type ValidatedProps = Omit<SubscriptionProps, 'status'> & { readonly status: SubscriptionStatus };

/**
 * A tracked subscription. Pure domain model — no persistence metadata (ids for sync,
 * timestamps, versions) lives here; the repository layer owns that mapping (ADR 0003).
 * Immutable: state changes return a new instance.
 */
export class Subscription {
  private constructor(private readonly props: ValidatedProps) {}

  static create(props: SubscriptionProps): Subscription {
    const id = props.id.trim();
    if (id.length === 0) {
      throw new RangeError('Subscription id must not be blank');
    }
    const name = props.name.trim();
    if (name.length === 0) {
      throw new RangeError('Subscription name must not be blank');
    }
    if (props.amount.isNegative()) {
      throw new RangeError('Subscription amount must not be negative');
    }
    if (props.trialEndsAt !== undefined && props.trialEndsAt.isBefore(props.anchorDate)) {
      throw new RangeError('Subscription trial cannot end before the anchor date');
    }
    if (
      props.sharedWith !== undefined &&
      (!Number.isInteger(props.sharedWith) || props.sharedWith < 2)
    ) {
      throw new RangeError('Shared plan must include at least 2 people');
    }

    return new Subscription({
      ...props,
      id,
      name,
      status: props.status ?? 'active',
    });
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get amount(): Money {
    return this.props.amount;
  }

  get cycle(): BillingCycle {
    return this.props.cycle;
  }

  get anchorDate(): DateOnly {
    return this.props.anchorDate;
  }

  get status(): SubscriptionStatus {
    return this.props.status;
  }

  get category(): string | undefined {
    return this.props.category;
  }

  get trialEndsAt(): DateOnly | undefined {
    return this.props.trialEndsAt;
  }

  get paymentLabel(): string | undefined {
    return this.props.paymentLabel;
  }

  get url(): string | undefined {
    return this.props.url;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get catalogServiceId(): string | undefined {
    return this.props.catalogServiceId;
  }

  get sharedWith(): number | undefined {
    return this.props.sharedWith;
  }

  /** The next renewal date on or after `from`, derived from the anchor and cycle. */
  nextRenewalOnOrAfter(from: DateOnly): DateOnly {
    return this.props.cycle.nextRenewalOnOrAfter(this.props.anchorDate, from);
  }

  /** The whole plan's cost normalized to a monthly equivalent (same currency). */
  monthlyCost(): Money {
    const { numerator, denominator } = this.props.cycle.monthlyEquivalentFactor();
    return this.props.amount.mulDiv(numerator, denominator);
  }

  /** The user's monthly cost: their equal share when shared, else the whole cost. */
  myMonthlyCost(): Money {
    const monthly = this.monthlyCost();
    return this.props.sharedWith === undefined
      ? monthly
      : monthly.equalShare(this.props.sharedWith);
  }

  /** Whether the free trial is still running on `on` (inclusive of the end date). */
  isTrialActive(on: DateOnly): boolean {
    const end = this.props.trialEndsAt;
    return end !== undefined && !on.isAfter(end);
  }

  /** Days left in the trial on `on`, or `null` if there is no active trial. */
  trialDaysRemaining(on: DateOnly): number | null {
    const end = this.props.trialEndsAt;
    if (end === undefined || on.isAfter(end)) {
      return null;
    }
    return on.daysUntil(end);
  }

  pause(): Subscription {
    if (this.props.status !== 'active') {
      throw new RangeError(`Cannot pause a ${this.props.status} subscription`);
    }
    return this.withStatus('paused');
  }

  resume(): Subscription {
    if (this.props.status !== 'paused') {
      throw new RangeError(`Cannot resume a ${this.props.status} subscription`);
    }
    return this.withStatus('active');
  }

  cancel(): Subscription {
    if (this.props.status === 'cancelled') {
      throw new RangeError('Cannot cancel an already-cancelled subscription');
    }
    return this.withStatus('cancelled');
  }

  private withStatus(status: SubscriptionStatus): Subscription {
    return new Subscription({ ...this.props, status });
  }
}
