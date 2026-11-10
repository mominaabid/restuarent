import Link from "next/link";
import PageHeader from "@/components/PageHeader";

/*
  LegalPage.jsx
  -----------------------------------------------------------
  Privacy / terms / refund pages share one layout: header,
  "last updated" date, intro, then numbered sections from the
  dictionaries (pages.privacy / pages.terms / pages.refund).
*/

const SIBLINGS = [
  { key: "privacy", href: "/privacy" },
  { key: "terms", href: "/terms" },
  { key: "refund", href: "/refund-policy" },
];

export default function LegalPage({ t, pageKey }) {
  const page = t.pages[pageKey];
  return (
    <>
      <PageHeader title={page.heading} crumb={page.title} homeLabel={t.nav.home} breadcrumbLabel={t.nav.breadcrumb}>
        <p className="mt-5 font-body text-sm text-white/45">{t.common.lastUpdated}: {page.updated}</p>
      </PageHeader>

      <section className="px-6 pb-20 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_240px]">
          <article className="max-w-3xl font-body text-white/75">
            <p className="text-base leading-relaxed md:text-lg">{page.intro}</p>
            {page.sections.map((section, index) => (
              <section key={section.heading} className="mt-10">
                <h2 className="font-display text-2xl tracking-wide text-white md:text-3xl">
                  <span className="text-brand-red">{index + 1}.</span> {section.heading}
                </h2>
                <ul className="mt-4 space-y-3">
                  {section.body.map((paragraph) => (
                    <li key={paragraph} className="flex gap-3 leading-relaxed">
                      <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-brand-gold" />
                      <span>{paragraph}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </article>

          <aside className="h-fit rounded-2xl border border-white/10 bg-brand-black-soft p-5 lg:sticky lg:top-28">
            <ul className="space-y-2 font-body text-sm">
              {SIBLINGS.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    aria-current={link.key === pageKey ? "page" : undefined}
                    className={link.key === pageKey ? "text-brand-gold" : "text-white/60 transition-colors hover:text-brand-red"}
                  >
                    {t.nav[link.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    </>
  );
}
