import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/pageMetadata";

export function generateMetadata() {
  return pageMetadata("/about", (t) => t.pages.about);
}

export default async function AboutPage() {
  const { t } = await getI18n();
  const page = t.pages.about;

  return (
    <>
      <PageHeader kicker={page.kicker} title={page.heading} crumb={t.nav.about} homeLabel={t.nav.home} breadcrumbLabel={t.nav.breadcrumb} />

      {/* Story + photo */}
      <section className="px-6 pb-16 md:px-10">
        <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2">
          <div>
            {t.about.paragraphs.map((paragraph, index) => (
              <p key={index} className={`${index ? "mt-4" : ""} font-body text-base leading-relaxed text-white/70 md:text-lg`}>{paragraph}</p>
            ))}
            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 font-body text-xs uppercase tracking-wide text-white/45">
              {t.about.stats.map((stat) => (
                <span key={stat.label}><b className="block font-display text-3xl text-brand-gold">{stat.value}</b>{stat.label}</span>
              ))}
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10">
            <Image src="/hero/farzan-hero.png" alt={t.about.imageAlt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover object-[20%_center]" />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-y border-white/10 bg-brand-black-soft px-6 py-16 md:px-10">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center font-display text-4xl tracking-wide text-white md:text-5xl">{page.valuesHeading}</h2>
          <span className="heading-underline" />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {page.values.map((value) => (
              <article key={value.title} className="rounded-2xl border border-white/10 bg-brand-black p-6 transition-colors hover:border-brand-red/60">
                <h3 className="font-display text-2xl tracking-wide text-brand-gold">{value.title}</h3>
                <p className="mt-3 font-body text-sm leading-relaxed text-white/65">{value.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Hours + CTAs */}
      <section className="px-6 py-16 md:px-10">
        <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10">
            <Image src="/hero/farzan-hero-2.png" alt={t.hero.slides[1]} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </div>
          <div>
            <h2 className="font-display text-4xl tracking-wide text-white md:text-5xl">{page.hoursHeading}</h2>
            <span className="heading-underline !mx-0" />
            <p className="mt-5 font-body text-base leading-relaxed text-white/70 md:text-lg">{page.hoursBody}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/menu" className="btn-primary">{page.ctaMenu}</Link>
              <Link href="/contact" className="btn-outline">{page.ctaVisit}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
