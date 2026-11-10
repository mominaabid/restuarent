import LegalPage from "@/components/LegalPage";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/pageMetadata";

export function generateMetadata() {
  return pageMetadata("/refund-policy", (t) => t.pages.refund);
}

export default async function Page() {
  const { t } = await getI18n();
  return <LegalPage t={t} pageKey="refund" />;
}
