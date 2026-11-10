import Link from "next/link";

/*
  PageHeader.jsx
  -----------------------------------------------------------
  Title block shared by the inner pages (menu, about, contact,
  reviews, …): breadcrumb, gold kicker, big display heading,
  red underline and an optional intro paragraph. Server
  component — callers pass already-translated strings.
*/

export default function PageHeader({ kicker, title, crumb, intro, homeLabel, breadcrumbLabel, children }) {
  return (
    <header className="relative overflow-hidden px-6 pb-8 pt-32 md:px-10 md:pb-12 md:pt-40">
      <div className="red-glow pointer-events-none absolute inset-x-0 -top-24 mx-auto h-72 w-[36rem] max-w-full opacity-40" />
      <div className="relative mx-auto max-w-7xl">
        {homeLabel ? (
          <nav aria-label={breadcrumbLabel} className="mb-5 flex items-center gap-2 font-body text-xs uppercase tracking-[0.18em] text-white/45">
            <Link href="/" className="transition-colors hover:text-brand-gold">{homeLabel}</Link>
            <span aria-hidden="true">/</span>
            <span className="text-brand-gold">{crumb ?? title}</span>
          </nav>
        ) : null}
        {kicker ? <p className="font-body text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold">{kicker}</p> : null}
        <h1 className="mt-2 font-display text-5xl leading-tight tracking-wide text-white md:text-7xl">{title}</h1>
        <span className="heading-underline !mx-0" />
        {intro ? <p className="mt-6 max-w-2xl font-body text-base leading-relaxed text-white/65 md:text-lg">{intro}</p> : null}
        {children}
      </div>
    </header>
  );
}
