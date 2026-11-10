import type { Weekday } from "@/lib/weekday";
import { todayWeekday } from "@/lib/weekday";

/**
 * Limited-time special pricing. A deal is a set of per-day time windows —
 * different days can have different start/end times — plus the price that
 * applies while any one of them is active. Hand-mirrored into
 * restaurant-admin/src/lib/deals.ts and restaurant-mobile/src/lib/deals.ts.
 */
export interface DealWindow {
  day: Weekday;
  /** 24h "HH:MM", inclusive. */
  startTime: string;
  /** 24h "HH:MM", exclusive. */
  endTime: string;
}

export interface Deal {
  price: number;
  windows: DealWindow[];
}

function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function parseTime(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function isWindowActive(window: DealWindow, date: Date = new Date()): boolean {
  if (todayWeekday(date) !== window.day) return false;
  const minutes = minutesOfDay(date);
  return minutes >= parseTime(window.startTime) && minutes < parseTime(window.endTime);
}

/** The deal price right now, or undefined when no window is currently active. */
export function activeDealPrice(deal: Deal | undefined, date: Date = new Date()): number | undefined {
  if (!deal || deal.windows.length === 0) return undefined;
  return deal.windows.some((window) => isWindowActive(window, date)) ? deal.price : undefined;
}
