/**
 * A timezone-agnostic calendar date (year/month/day). Subscriptions renew on calendar
 * dates, not instants, so the domain never uses `Date`/timezones for renewal math —
 * this avoids DST and off-by-one drift (see mod-data-model).
 */
export class DateOnly {
  private constructor(
    readonly year: number,
    /** 1-12 */
    readonly month: number,
    /** 1-31, valid for the month */
    readonly day: number,
  ) {}

  static of(year: number, month: number, day: number): DateOnly {
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
      throw new RangeError('DateOnly components must be integers');
    }
    if (month < 1 || month > 12) {
      throw new RangeError(`Invalid month: ${month}`);
    }
    const max = DateOnly.daysInMonth(year, month);
    if (day < 1 || day > max) {
      throw new RangeError(`Invalid day ${day} for ${year}-${month}`);
    }
    return new DateOnly(year, month, day);
  }

  static fromISO(iso: string): DateOnly {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (match === null) {
      throw new RangeError(`Invalid ISO date: ${iso}`);
    }
    return DateOnly.of(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  static daysInMonth(year: number, month: number): number {
    if (month === 2) {
      return DateOnly.isLeapYear(year) ? 29 : 28;
    }
    if (month === 4 || month === 6 || month === 9 || month === 11) {
      return 30;
    }
    return 31;
  }

  /** Days since the Unix epoch (proleptic Gregorian). Used for exact day arithmetic. */
  private toEpochDay(): number {
    return Math.trunc(Date.UTC(this.year, this.month - 1, this.day) / 86_400_000);
  }

  private static fromEpochDay(days: number): DateOnly {
    const utc = new Date(days * 86_400_000);
    return DateOnly.of(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate());
  }

  addDays(days: number): DateOnly {
    return DateOnly.fromEpochDay(this.toEpochDay() + days);
  }

  /**
   * Add calendar months, clamping the day to the target month's length.
   * e.g. Jan 31 + 1 month → Feb 28 (or 29 in a leap year).
   */
  addMonths(months: number): DateOnly {
    const total = this.year * 12 + (this.month - 1) + months;
    const monthIndex = ((total % 12) + 12) % 12;
    const year = (total - monthIndex) / 12;
    const targetMonth = monthIndex + 1;
    const day = Math.min(this.day, DateOnly.daysInMonth(year, targetMonth));
    return DateOnly.of(year, targetMonth, day);
  }

  /** Signed day difference `other - this`. */
  daysUntil(other: DateOnly): number {
    return other.toEpochDay() - this.toEpochDay();
  }

  compareTo(other: DateOnly): number {
    return this.toEpochDay() - other.toEpochDay();
  }

  isBefore(other: DateOnly): boolean {
    return this.compareTo(other) < 0;
  }

  isAfter(other: DateOnly): boolean {
    return this.compareTo(other) > 0;
  }

  equals(other: DateOnly): boolean {
    return this.compareTo(other) === 0;
  }

  toISO(): string {
    const y = String(this.year).padStart(4, '0');
    const m = String(this.month).padStart(2, '0');
    const d = String(this.day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
