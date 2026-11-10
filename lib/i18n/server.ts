import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, dirOf, isLocale, type Locale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { formatCurrency } from "@/lib/format";

/**
 * The visitor's language: the saved choice from the language switch, else
 * Arabic when the browser prefers it over English, else English.
 */
export async function getLocale(): Promise<Locale> {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  const accept = (await headers()).get("accept-language") ?? "";
  const ranked = accept
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  const first = ranked.find((entry) => entry.lang === "ar" || entry.lang === "en");
  return first?.lang === "ar" ? "ar" : DEFAULT_LOCALE;
}

export async function getI18n() {
  const locale = await getLocale();
  return {
    locale,
    dir: dirOf(locale),
    t: dictionaries[locale],
    money: (amount: number) => formatCurrency(amount, locale),
  };
}
