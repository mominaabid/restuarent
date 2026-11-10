/**
 * The site's two languages. The choice lives in a cookie (not the URL) so the
 * same links keep working in both languages — the per-table QR codes and the
 * Moyasar callback URL are printed/configured once and must never change.
 */
export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "lang";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Backend rows carry both languages; prefer the active one, fall back to the other. */
export function pick(locale: Locale, en?: string | null, ar?: string | null): string {
  return ((locale === "ar" ? ar || en : en || ar) ?? "").trim();
}
