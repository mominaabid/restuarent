/**
 * Day-of-week menu scheduling. Hand-mirrored from restaurant-admin/src/lib/weekday.ts
 * and into restaurant-mobile/src/lib/weekday.ts — same discipline as the
 * Product type itself (no shared package; see docs/architecture-plan.md §05).
 */
export const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export function todayWeekday(date: Date = new Date()): Weekday {
  return WEEKDAYS[date.getDay()];
}

/** No days set (undefined or empty) means "every day" — the common case. */
export function isAvailableToday(days: Weekday[] | undefined, date: Date = new Date()): boolean {
  if (!days || days.length === 0) return true;
  return days.includes(todayWeekday(date));
}
