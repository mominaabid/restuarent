import { Bebas_Neue, Cairo, Poppins } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import { CartProvider } from "@/context/CartContext";
import { BrandingProvider } from "@/context/BrandingContext";
import { LocaleProvider } from "@/context/LocaleContext";
import { SITE_URL } from "@/lib/constants";
import { getBranding } from "@/lib/branding";
import { getI18n } from "@/lib/i18n/server";
import "./globals.css";

// Bebas Neue = bold condensed display font for all headlines.
// Exposed as the CSS variable --font-bebas, wired to "font-display" in globals.css.
const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

// Poppins = clean readable font for body copy, nav links, buttons, etc.
// Exposed as --font-poppins, wired to "font-body" in globals.css.
const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

// Cairo = Arabic display + body font. globals.css swaps both font tokens to it
// under html[lang="ar"]. Not preloaded, so English visitors never download it.
const cairo = Cairo({
  weight: ["400", "600", "700", "800"],
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  preload: false,
});

/**
 * Dynamic because the restaurant name and favicon are configured in the admin
 * (Settings -> Branding) rather than compiled in, and the title follows the
 * visitor's language.
 *
 * getBranding() already falls back to SITE_NAME on any failure, so a backend
 * blip degrades to the previous hard-coded title rather than an empty one.
 */
export async function generateMetadata() {
  const [branding, { locale, t }] = await Promise.all([getBranding(), getI18n()]);
  const name = locale === "ar" ? branding.nameAr : branding.name;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t.meta.homeTitle,
      template: `%s | ${name}`,
    },
    description: t.meta.description,
    openGraph: {
      siteName: name,
      description: t.meta.description,
      type: "website",
      locale: t.meta.ogLocale,
    },
    // Only override the bundled app/favicon.ico when one is actually
    // configured — an empty string here would emit a broken <link>.
    ...(branding.faviconUrl ? { icons: { icon: branding.faviconUrl, apple: "/brand/farzan-icon-192.png" } } : {}),
  };
}

export default async function RootLayout({ children }) {
  const [branding, { locale, dir }] = await Promise.all([getBranding(), getI18n()]);
  return (
    // The font variables go on <html>: the theme tokens (--font-display/--font-body)
    // are declared at :root and resolve var(--font-bebas) etc. there.
    <html lang={locale} dir={dir} className={`${bebasNeue.variable} ${poppins.variable} ${cairo.variable}`}>
      <body className="font-body bg-brand-black text-white antialiased">
        {/* SmoothScroll wraps the whole app so Lenis + GSAP ScrollTrigger stay in sync everywhere */}
        <LocaleProvider locale={locale}>
          <BrandingProvider branding={branding}><CartProvider><SmoothScroll>{children}</SmoothScroll></CartProvider></BrandingProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
