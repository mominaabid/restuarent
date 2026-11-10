import LegalPage from "@/components/LegalPage";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/pageMetadata";

export function generateMetadata() {
  return pageMetadata("/privacy", (t) => t.pages.privacy);
}

export default async function Page() {
  const { t } = await getI18n();
  return <LegalPage t={t} pageKey="privacy" />;
}
