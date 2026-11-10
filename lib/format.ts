import type { Locale } from "@/lib/i18n/config";

export function formatCurrency(amount: number, locale: Locale = "en"): string {
  // Defensive: a stale cart item persisted before price became numeric
  // (see docs/architecture-plan.md §11) could still hand this a string.
  const value = Number(amount);
  const fixed = Number.isFinite(value) ? value.toFixed(2) : "0.00";
  return locale === "ar" ? `${fixed} ر.س` : `SAR ${fixed}`;
}

/** "3 days ago" / "منذ 3 أيام" from an ISO date. */
export function formatRelativeDate(iso: string | undefined, locale: Locale): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const seconds = (then - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60],
  ];
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(0, "minute");
}
