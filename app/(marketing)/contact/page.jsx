import PageHeader from "@/components/PageHeader";
import { RESTAURANT_CONTACT } from "@/lib/constants";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/pageMetadata";
import { jsonLdScript, restaurantJsonLd } from "@/lib/structuredData";

export function generateMetadata() {
  return pageMetadata("/contact", (t) => t.pages.contact);
}

/** Open right now in Saudi time? Handles hours that run past midnight (04:30 → 00:30). */
function isOpenNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Riyadh", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const minutes = Number(parts.find((p) => p.type === "hour")?.value) * 60 + Number(parts.find((p) => p.type === "minute")?.value);
  const toMinutes = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  const opens = toMinutes(RESTAURANT_CONTACT.opensAt);
  const closes = toMinutes(RESTAURANT_CONTACT.closesAt);
  return opens < closes ? minutes >= opens && minutes < closes : minutes >= opens || minutes < closes;
}

export default async function ContactPage() {
  const { t } = await getI18n();
  const page = t.pages.contact;
  const open = isOpenNow();
  const whatsappHref = `${RESTAURANT_CONTACT.whatsappUrl}?text=${encodeURIComponent(page.whatsappGreeting)}`;

  const cards = [
    { label: page.callCard, value: <span dir="ltr">{RESTAURANT_CONTACT.phoneDisplay}</span>, href: RESTAURANT_CONTACT.phoneHref, icon: <PhoneIcon /> },
    { label: page.whatsappCard, value: <span dir="ltr">{RESTAURANT_CONTACT.phoneDisplay}</span>, href: whatsappHref, icon: <ChatIcon />, external: true },
    { label: page.directionsCard, value: t.contact.address, href: RESTAURANT_CONTACT.mapsUrl, icon: <PinIcon />, external: true },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(restaurantJsonLd())} />
      <PageHeader kicker={page.kicker} title={page.heading} crumb={t.nav.contact} intro={page.intro} homeLabel={t.nav.home} breadcrumbLabel={t.nav.breadcrumb} />

      <section className="px-6 pb-20 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 md:grid-cols-3">
            {cards.map((card) => (
              <a
                key={card.label}
                href={card.href}
                {...(card.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-brand-black-soft p-6 transition-all hover:-translate-y-1 hover:border-brand-red/60"
              >
                <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-brand-red/15 text-brand-red">{card.icon}</span>
                <span>
                  <span className="block font-display text-xl tracking-wide text-white group-hover:text-brand-gold">{card.label}</span>
                  <span className="mt-1 block font-body text-sm text-white/60">{card.value}</span>
                </span>
              </a>
            ))}
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-[2fr_3fr]">
            <div className="rounded-2xl border border-white/10 bg-brand-black-soft p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl tracking-wide text-white">{t.contact.hoursLabel}</h2>
                <span className={`rounded-full px-3 py-1 font-body text-xs font-semibold ${open ? "bg-emerald-500/15 text-emerald-400" : "bg-brand-red/15 text-brand-red"}`}>
                  {open ? page.openNow : page.closedNow}
                </span>
              </div>
              <p className="mt-4 font-body text-white/70">{t.contact.openDaily}</p>
              <p className="mt-1 font-display text-3xl tracking-wide text-brand-gold">{t.contact.hours}</p>
              <dl className="mt-6 space-y-4 border-t border-white/10 pt-6 font-body text-sm text-white/70">
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] text-brand-gold">{t.contact.addressLabel}</dt>
                  <dd className="mt-1">{t.contact.address}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] text-brand-gold">{t.contact.phoneLabel}</dt>
                  <dd className="mt-1"><a href={RESTAURANT_CONTACT.phoneHref} dir="ltr" className="hover:text-brand-gold">{RESTAURANT_CONTACT.phoneDisplay}</a></dd>
                </div>
              </dl>
              <a href={RESTAURANT_CONTACT.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-8 inline-block">{t.common.getDirections}</a>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <iframe
                src={RESTAURANT_CONTACT.mapEmbedUrl}
                title={t.location.mapTitle}
                className="h-[360px] w-full border-0 md:h-full md:min-h-[440px]"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function PhoneIcon() {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>;
}

function ChatIcon() {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 12a8 8 0 0 1-11.8 7L4 20l1-4.1A8 8 0 1 1 20 12Z" /><path d="M9 10.5c.5 2 2.5 4 4.5 4.5l1-1.5 2 .8" /></svg>;
}

function PinIcon() {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 21s7-6.1 7-11.5a7 7 0 1 0-14 0C5 14.9 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>;
}
