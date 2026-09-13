"use client";

/*
  Navbar.jsx
  -----------------------------------------------------------
  Sticky navbar that is transparent over the hero and turns
  solid black once the user scrolls down. Uses the shared Lenis
  instance (via useLenis) so clicking a link smooth-scrolls to
  the matching section instead of jumping instantly.
*/

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "./SmoothScroll";
import { useCart } from "./CartContext";

// Edit these to change the nav links shown in the navbar.
const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Menu", href: "#menu" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#footer" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const lenis = useLenis();
  const pathname = usePathname();
  const { cartCount } = useCart();

  // Watch scroll position to switch the navbar from transparent to solid black.
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 40);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleNavClick(e, href) {
    if (pathname !== "/") {
      setIsMobileMenuOpen(false);
      return;
    }
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (!target) return;

    if (lenis) {
      lenis.scrollTo(target, { offset: -80 });
    } else {
      target.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-brand-black/95 backdrop-blur-sm shadow-lg shadow-black/40" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
        {/* Logo */}
        <Link
          href={pathname === "/" ? "#home" : "/"}
          onClick={(e) => handleNavClick(e, "#home")}
          className="font-display text-2xl tracking-wider text-white md:text-3xl"
        >
          SMOKE<span className="text-brand-red">&</span>CHAR
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-10 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={pathname === "/" ? link.href : `/${link.href}`}
                onClick={(e) => handleNavClick(e, link.href)}
                className="font-body text-sm font-medium uppercase tracking-wide text-white/80 transition-colors hover:text-brand-red"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Order Now button (desktop) */}
        <div className="hidden items-center gap-3 md:flex">
          <Link href={pathname === "/" ? "#menu" : "/#menu"} onClick={(e) => handleNavClick(e, "#menu")} className="btn-primary !py-2.5 !px-6 !text-sm">Order Now</Link>
          <Link href="/cart" aria-label={`Cart with ${cartCount} items`} className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white transition-all hover:border-brand-gold hover:text-brand-gold">
            <CartIcon />
            {cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-brand-red px-1 text-center font-body text-[10px] font-bold leading-5 text-white">
                {cartCount}
              </span>
            ) : null}
          </Link>
        </div>

        {/* Hamburger button (mobile) */}
        <button
          aria-label="Toggle menu"
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          <span
            className={`h-0.5 w-7 bg-white transition-transform duration-300 ${
              isMobileMenuOpen ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span className={`h-0.5 w-7 bg-white transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-0" : ""}`} />
          <span
            className={`h-0.5 w-7 bg-white transition-transform duration-300 ${
              isMobileMenuOpen ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </nav>

      {/* Mobile dropdown menu */}
      <div
        className={`overflow-hidden bg-brand-black transition-[max-height] duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "max-h-96" : "max-h-0"
        }`}
      >
        <ul className="flex flex-col gap-2 px-6 pb-6">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={pathname === "/" ? link.href : `/${link.href}`}
                onClick={(e) => handleNavClick(e, link.href)}
                className="block py-2 font-body text-base uppercase tracking-wide text-white/80 hover:text-brand-red"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li className="flex items-center gap-3 pt-2">
            <Link
              href={pathname === "/" ? "#menu" : "/#menu"}
              onClick={(e) => handleNavClick(e, "#menu")}
              className="btn-primary mt-2 inline-block !py-2.5 !px-6 !text-sm"
            >
              Order Now
            </Link>
            <Link href="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white">
              <CartIcon />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-brand-red px-1 text-center font-body text-[10px] font-bold leading-5 text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}

function CartIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 4h2l1.7 10.1a2 2 0 0 0 2 1.7h7.9a2 2 0 0 0 1.9-1.5L20 8H7" /><circle cx="9" cy="20" r="1" /><circle cx="17" cy="20" r="1" /></svg>;
}
