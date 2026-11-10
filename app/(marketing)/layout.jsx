import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Shared frame for the inner content pages (about, contact, reviews, legal, …).
export default function MarketingLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-black">{children}</main>
      <Footer />
    </>
  );
}
