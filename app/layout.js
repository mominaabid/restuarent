import { Bebas_Neue, Poppins } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import { CartProvider } from "@/components/CartContext";
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

export const metadata = {
  title: "Smoke & Char | Premium Burgers",
  description:
    "Bold, fire-grilled burgers made from premium ingredients. Order the perfect burger today.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${bebasNeue.variable} ${poppins.variable} font-body bg-brand-black text-white antialiased`}>
        {/* SmoothScroll wraps the whole app so Lenis + GSAP ScrollTrigger stay in sync everywhere */}
        <CartProvider><SmoothScroll>{children}</SmoothScroll></CartProvider>
      </body>
    </html>
  );
}
