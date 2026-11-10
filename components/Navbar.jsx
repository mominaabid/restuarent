"use client";

/*
  Navbar.jsx
  -----------------------------------------------------------
  Sticky navbar that is transparent over the hero and turns
  solid black once the user scrolls down. Links go to the
  site's pages; "Home" on the home page smooth-scrolls to the
  top through the shared Lenis instance instead of reloading.
*/

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "./SmoothScroll";
import { useCart } from "@/context/CartContext";
import { useBranding, useBrandName } from "@/context/BrandingContext";
import { useI18n } from "@/context/LocaleContext";
import { DEFAULT_LOGO_URL } from "@/lib/constants";
import LanguageSwitch from "@/components/LanguageSwitch";

// Edit these to change the nav links shown in the navbar.
const NAV_LINKS = [
  { key: "home", href: "/" },
  { key: "menu", href: "/menu" },
  { key: "deals", href: "/deals" },
  { key: "about", href: "/about" },
  { key: "reviews", href: "/reviews" },
  { key: "contact", href: "/contact" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const lenis = useLenis();
  const pathname = usePathname();
  const { cartCount, activeTableCode } = useCart();
  // A seated guest's cart is the table's, never the website's takeaway checkout.
  const cartHref = activeTableCode ? `/t/${encodeURIComponent(activeTableCode)}/cart` : "/cart";
  const branding = useBranding();
  const brandName = useBrandName();
  const { t } = useI18n();

  // Watch scroll position to switch the navbar from transparent to solid black.
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 40);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleNavClick(e, href) {
    setIsMobileMenuOpen(false);
    if (href !== "/" || pathname !== "/") return;
    // Already home: glide back to the top instead of re-navigating.
    e.preventDefault();
    if (lenis) lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const isActive = (href) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isMobileMenuOpen ? "bg-brand-black/95 backdrop-blur-sm shadow-lg shadow-black/40" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 md:px-10">
        {/* Logo */}
        <Link
          href="/"
          onClick={(e) => handleNavClick(e, "/")}
          className="flex items-center gap-3 font-display text-2xl tracking-wider text-white md:text-3xl"
        >
          <img src={branding?.logoUrl || DEFAULT_LOGO_URL} alt={brandName} className="h-12 w-12 rounded-full bg-white object-cover ring-2 ring-brand-gold/60 md:h-14 md:w-14" />
          <span className="hidden 2xl:inline">{brandName}</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-7 lg:flex xl:gap-9">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`font-body text-sm font-medium uppercase tracking-wide transition-colors hover:text-brand-red ${isActive(link.href) ? "text-brand-gold" : "text-white/80"}`}
              >
                {t.nav[link.key]}
              </Link>
            </li>
          ))}
        </ul>

        {/* Language + Order Now + cart (desktop) */}
        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitch />
          <Link href="/menu" className="btn-primary !py-2.5 !px-6 !text-sm">{t.common.orderNow}</Link>
          <CartButton href={cartHref} count={cartCount} label={t.common.cartAria(cartCount)} />
        </div>

        {/* Mobile: language and cart stay reachable without opening the menu */}
        <div className="flex items-center gap-3 lg:hidden">
          <LanguageSwitch className="!px-3 !py-1.5 !text-xs" />
          <CartButton href={cartHref} count={cartCount} label={t.common.cartAria(cartCount)} small />
          <button
            aria-label={t.common.toggleMenu}
            aria-expanded={isMobileMenuOpen}
            className="flex flex-col gap-1.5 p-1"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            <span className={`h-0.5 w-7 bg-white transition-transform duration-300 ${isMobileMenuOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`h-0.5 w-7 bg-white transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-7 bg-white transition-transform duration-300 ${isMobileMenuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      <div
        className={`overflow-hidden bg-brand-black transition-[max-height] duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? "max-h-[32rem]" : "max-h-0"
        }`}
      >
        <ul className="flex flex-col gap-1 px-6 pb-6">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`block py-2 font-body text-base uppercase tracking-wide hover:text-brand-red ${isActive(link.href) ? "text-brand-gold" : "text-white/80"}`}
              >
                {t.nav[link.key]}
              </Link>
            </li>
          ))}
          <li className="pt-2">
            <Link href="/menu" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary mt-2 inline-block !py-2.5 !px-6 !text-sm">
              {t.common.orderNow}
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}

function CartButton({ href, count, label, small = false }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`relative flex items-center justify-center rounded-full border border-white/15 text-white transition-all hover:border-brand-gold hover:text-brand-gold ${small ? "h-10 w-10" : "h-11 w-11"}`}
    >
      <CartIcon />
      {count > 0 ? (
        <span className="absolute -end-1 -top-1 min-w-5 rounded-full bg-brand-red px-1 text-center font-body text-[10px] font-bold leading-5 text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}

function CartIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="rtl:-scale-x-100"><path d="M3 4h2l1.7 10.1a2 2 0 0 0 2 1.7h7.9a2 2 0 0 0 1.9-1.5L20 8H7" /><circle cx="9" cy="20" r="1" /><circle cx="17" cy="20" r="1" /></svg>;
}
