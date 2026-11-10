import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Menu from "@/components/Menu";
import PageHeader from "@/components/PageHeader";
import LiveMenuSync from "@/components/LiveMenuSync";
import { getMenu } from "@/lib/api/products";
import { getBackendWebSocketUrl } from "@/lib/qrBackend";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/pageMetadata";

export function generateMetadata() {
  return pageMetadata("/menu", (t) => t.pages.menu);
}

export default async function MenuPage() {
  const { locale, t } = await getI18n();
  const { items, categories, branchId } = await getMenu(locale);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-black pb-12">
        <PageHeader
          kicker={t.pages.menu.kicker}
          title={t.menu.heading}
          crumb={t.nav.menu}
          intro={t.menu.intro}
          homeLabel={t.nav.home}
          breadcrumbLabel={t.nav.breadcrumb}
        />
        <LiveMenuSync branchId={branchId} socketBaseUrl={getBackendWebSocketUrl()} />
        <Menu items={items} categories={categories} standalone />
      </main>
      <Footer />
    </>
  );
}
