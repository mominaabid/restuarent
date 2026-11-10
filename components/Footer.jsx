"use client";

import Link from "next/link";
import { useBranding, useBrandName } from "@/context/BrandingContext";
import { useI18n } from "@/context/LocaleContext";
import { DEFAULT_LOGO_URL, RESTAURANT_CONTACT } from "@/lib/constants";

/*
  Footer.jsx
  -----------------------------------------------------------
  Dark footer: brand blurb, links to every page, contact
  details and socials. A client component only because the
  restaurant name and language come from client contexts.
*/

const EXPLORE_LINKS = ["menu", "deals", "gallery", "reviews", "catering"];
const HELP_LINKS = ["about", "faq", "contact"];
const LEGAL_LINKS = ["privacy", "terms", "refund"];
const HREFS = {
  menu: "/menu", deals: "/deals", gallery: "/gallery", reviews: "/reviews", catering: "/catering",
  about: "/about", faq: "/faq", contact: "/contact", privacy: "/privacy", terms: "/terms", refund: "/refund-policy",
};

// Simple inline SVG icons so we don't need an extra icon package.
const SOCIALS = [
  {
    label: "Facebook",
    href: "#",
    icon: (
      <path d="M13.5 9H15V6h-1.5A3.5 3.5 0 0 0 10 9.5V11H8v3h2v7h3v-7h2.1l.4-3H13v-1c0-.6.4-1 1-1Z" />
    ),
  },
  {
    label: "Instagram",
    href: "#",
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="16.6" cy="7.4" r="1" />
      </>
    ),
  },
  {
    label: "Twitter",
    href: "#",
    icon: (
      <path d="M21 5.9c-.7.3-1.4.5-2.1.6a3.6 3.6 0 0 0 1.6-2 7.2 7.2 0 0 1-2.3.9 3.6 3.6 0 0 0-6.2 3.3A10.2 10.2 0 0 1 4.6 5a3.6 3.6 0 0 0 1.1 4.8c-.6 0-1.2-.2-1.7-.5v.1a3.6 3.6 0 0 0 2.9 3.5c-.5.1-1.1.2-1.7.1a3.6 3.6 0 0 0 3.4 2.5A7.3 7.3 0 0 1 3 16.9a10.2 10.2 0 0 0 5.6 1.6c6.7 0 10.4-5.6 10.4-10.4v-.5c.7-.5 1.3-1.1 1.8-1.8Z" />
    ),
  },
];

export default function Footer() {
  const branding = useBranding();
  const brandName = useBrandName();
  const { t } = useI18n();
  return (
    <footer id="footer" className="border-t border-white/10 bg-brand-black">
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-10">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          {/* Logo + blurb */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3">
              <img src={branding?.logoUrl || DEFAULT_LOGO_URL} alt="" className="h-16 w-16 rounded-full bg-white object-cover ring-2 ring-brand-gold/60" />
              <p className="font-display text-2xl tracking-wider text-white">{brandName}</p>
            </div>
            <p className="mt-4 max-w-xs font-body text-sm leading-relaxed text-white/50">{t.footer.blurb}</p>
            <div className="mt-5 flex gap-3">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition-all duration-300 hover:scale-110 hover:border-brand-red hover:text-brand-red"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    {social.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <FooterLinks title={t.footer.explore} keys={EXPLORE_LINKS} t={t} />
          <FooterLinks title={t.footer.help} keys={HELP_LINKS} t={t} />

          {/* Contact info */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-display text-lg tracking-wide text-white">{t.footer.contact}</h4>
            <ul className="mt-4 space-y-2 font-body text-sm text-white/50">
              <li>
                <a href={RESTAURANT_CONTACT.mapsUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-brand-gold">
                  {t.contact.address}
                </a>
              </li>
              <li>
                <a href={RESTAURANT_CONTACT.phoneHref} dir="ltr" className="transition-colors hover:text-brand-gold">
                  {RESTAURANT_CONTACT.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={RESTAURANT_CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-brand-gold">
                  {t.common.chatWhatsapp}
                </a>
              </li>
              <li>{t.contact.openDaily} · {t.contact.hours}</li>
            </ul>
          </div>
        </div>

        {/* Bottom line: copyright + legal pages */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 font-body text-xs text-white/35 md:flex-row">
          <p>© {new Date().getFullYear()} {brandName}. {t.footer.rights}</p>
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((key) => (
              <li key={key}><Link href={HREFS[key]} className="transition-colors hover:text-brand-gold">{t.nav[key]}</Link></li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({ title, keys, t }) {
  return (
    <div>
      <h4 className="font-display text-lg tracking-wide text-white">{title}</h4>
      <ul className="mt-4 space-y-2">
        {keys.map((key) => (
          <li key={key}>
            <Link href={HREFS[key]} className="font-body text-sm text-white/50 transition-colors hover:text-brand-red">
              {t.nav[key]}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
