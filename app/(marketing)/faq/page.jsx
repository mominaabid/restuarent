import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/pageMetadata";
import { jsonLdScript } from "@/lib/structuredData";

export function generateMetadata() {
  return pageMetadata("/faq", (t) => t.pages.faq);
}

export default async function FaqPage() {
  const { t } = await getI18n();
  const page = t.pages.faq;
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.items.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(faqJsonLd)} />
      <PageHeader kicker={page.kicker} title={page.heading} crumb={t.nav.faq} homeLabel={t.nav.home} breadcrumbLabel={t.nav.breadcrumb} />

      <section className="px-6 pb-20 md:px-10">
        <div className="mx-auto max-w-3xl space-y-3">
          {page.items.map((item, index) => (
            <details key={item.q} open={index === 0} className="group rounded-2xl border border-white/10 bg-brand-black-soft p-5 open:border-brand-red/50">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-body text-base font-semibold text-white [&::-webkit-details-marker]:hidden">
                {item.q}
                <span aria-hidden="true" className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-white/20 text-brand-gold transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 font-body text-sm leading-relaxed text-white/70">{item.a}</p>
            </details>
          ))}

          <div className="mt-10 rounded-2xl border border-brand-gold/25 p-6 text-center">
            <p className="font-display text-2xl tracking-wide text-white">{page.stillQuestions}</p>
            <Link href="/contact" className="btn-primary mt-4 inline-block">{page.contactUs}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
