import type { Metadata } from "next";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getI18n } from "@/lib/i18n/server";

/**
 * Title, description and canonical URL for an inner page, in the visitor's
 * language. Both languages share one URL (the language is a cookie), so the
 * canonical is just the path.
 */
export async function pageMetadata(
  path: string,
  select: (t: Dictionary) => { title: string; description: string }
): Promise<Metadata> {
  const { t } = await getI18n();
  const { title, description } = select(t);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, locale: t.meta.ogLocale },
  };
}
