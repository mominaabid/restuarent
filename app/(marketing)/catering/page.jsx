import PageHeader from "@/components/PageHeader";
import CateringForm from "@/components/CateringForm";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/pageMetadata";

export function generateMetadata() {
  return pageMetadata("/catering", (t) => t.pages.catering);
}

export default async function CateringPage() {
  const { t } = await getI18n();
  const page = t.pages.catering;

  return (
    <>
      <PageHeader kicker={page.kicker} title={page.heading} crumb={t.nav.catering} intro={page.intro} homeLabel={t.nav.home} breadcrumbLabel={t.nav.breadcrumb} />

      <section className="px-6 pb-20 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            {page.offers.map((offer, index) => (
              <article key={offer.title} className="flex gap-4 rounded-2xl border border-white/10 bg-brand-black-soft p-6">
                <span className="font-display text-4xl leading-none text-brand-red">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h2 className="font-display text-2xl tracking-wide text-brand-gold">{offer.title}</h2>
                  <p className="mt-2 font-body text-sm leading-relaxed text-white/65">{offer.body}</p>
                </div>
              </article>
            ))}
          </div>
          <CateringForm />
        </div>
      </section>
    </>
  );
}
