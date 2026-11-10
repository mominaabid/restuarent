"use client";

import { RESTAURANT_CONTACT } from "@/lib/constants";
import { useI18n } from "@/context/LocaleContext";

/*
  Location.jsx
  -----------------------------------------------------------
  "Visit us" section: address, hours and phone next to an
  embedded Google Map of the restaurant.
*/

export default function Location() {
  const { t } = useI18n();
  return (
    <section id="visit" className="bg-brand-black py-14 md:py-20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-[2fr_3fr] md:px-10">
        <div>
          <h2 className="font-display text-4xl leading-tight tracking-wide text-white md:text-5xl">
            {t.location.heading} <span className="text-brand-red">{t.location.headingAccent}</span>
          </h2>
          <span className="heading-underline !mx-0" />
          <dl className="mt-6 space-y-4 font-body text-white/70">
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-brand-gold">{t.contact.hoursLabel}</dt>
              <dd className="mt-1">{t.contact.openDaily} · {t.contact.hours}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-brand-gold">{t.contact.addressLabel}</dt>
              <dd className="mt-1">{t.contact.address}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-brand-gold">{t.contact.phoneLabel}</dt>
              <dd className="mt-1">
                <a href={RESTAURANT_CONTACT.phoneHref} dir="ltr" className="hover:text-brand-gold">
                  {RESTAURANT_CONTACT.phoneDisplay}
                </a>
              </dd>
            </div>
          </dl>
          <a href={RESTAURANT_CONTACT.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-8 inline-block">
            {t.common.getDirections}
          </a>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <iframe
            src={RESTAURANT_CONTACT.mapEmbedUrl}
            title={t.location.mapTitle}
            className="h-[360px] w-full border-0 md:h-[450px]"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </section>
  );
}
