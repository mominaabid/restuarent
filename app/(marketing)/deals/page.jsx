import Link from "next/link";
import Menu from "@/components/Menu";
import PageHeader from "@/components/PageHeader";
import LiveMenuSync from "@/components/LiveMenuSync";
import { getMenu } from "@/lib/api/products";
import { getBackendWebSocketUrl } from "@/lib/qrBackend";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/pageMetadata";

export function generateMetadata() {
  return pageMetadata("/deals", (t) => t.pages.deals);
}

/**
 * Items on a deal right now. Deal windows are resolved server-side by the
 * backend (on_deal + original_price on the product or one of its portions),
 * so this page never decides for itself what is discounted.
 */
export default async function DealsPage() {
  const { locale, t } = await getI18n();
  const page = t.pages.deals;
  const { items, categories, branchId } = await getMenu(locale);
  const deals = items.filter((item) => item.onDeal || item.variants?.some((variant) => variant.onDeal));
  const dealCategoryIds = new Set(deals.map((item) => item.categoryId));

  return (
    <div className="pb-12">
      <PageHeader kicker={page.kicker} title={page.heading} crumb={t.nav.deals} intro={page.intro} homeLabel={t.nav.home} breadcrumbLabel={t.nav.breadcrumb} />
      <LiveMenuSync branchId={branchId} socketBaseUrl={getBackendWebSocketUrl()} />
      {deals.length ? (
        <Menu items={deals} categories={categories.filter((category) => dealCategoryIds.has(category.id))} standalone />
      ) : (
        <div className="px-6 md:px-10">
          <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-white/15 bg-brand-black-soft p-10 text-center">
            <p className="font-body text-white/65">{page.none}</p>
            <Link href="/menu" className="btn-primary mt-6 inline-block">{t.menu.viewFull}</Link>
          </div>
        </div>
      )}
    </div>
  );
}
