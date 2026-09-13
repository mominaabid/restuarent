/*
  Footer.jsx
  -----------------------------------------------------------
  Static dark footer — no animation/browser APIs needed here,
  so this file does NOT need "use client".
*/

const QUICK_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Menu", href: "#menu" },
  { label: "About", href: "#about" },
];

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
  return (
    <footer id="footer" className="border-t border-white/10 bg-brand-black">
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Logo + blurb */}
          <div>
            <p className="font-display text-2xl tracking-wider text-white">
              SMOKE<span className="text-brand-red">&</span>CHAR
            </p>
            <p className="mt-4 max-w-xs font-body text-sm leading-relaxed text-white/50">
              Bold, fire-grilled burgers made from premium ingredients. No shortcuts, ever.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-display text-lg tracking-wide text-white">Quick Links</h4>
            <ul className="mt-4 space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="font-body text-sm text-white/50 transition-colors hover:text-brand-red">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="font-display text-lg tracking-wide text-white">Contact</h4>
            <ul className="mt-4 space-y-2 font-body text-sm text-white/50">
              <li>123 Grill Street, Food District</li>
              <li>+1 (555) 234-5678</li>
              <li>Mon – Sun: 11:00 AM – 11:00 PM</li>
            </ul>
          </div>

          {/* Social icons */}
          <div>
            <h4 className="font-display text-lg tracking-wide text-white">Follow Us</h4>
            <div className="mt-4 flex gap-3">
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
        </div>

        {/* Bottom copyright line */}
        <div className="mt-14 border-t border-white/10 pt-6 text-center font-body text-xs text-white/35">
          © {new Date().getFullYear()} Smoke &amp; Char. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
