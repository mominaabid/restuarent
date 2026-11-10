import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Menu from "@/components/Menu";
import About from "@/components/About";
import Testimonials from "@/components/Testimonials";
import Location from "@/components/Location";
import Footer from "@/components/Footer";
import { getMenu } from "@/lib/api/products";
import { getAllReviews } from "@/lib/api/reviews";
import { getBackendWebSocketUrl } from "@/lib/qrBackend";
import { getLocale } from "@/lib/i18n/server";
import { jsonLdScript, restaurantJsonLd } from "@/lib/structuredData";
import LiveMenuSync from "@/components/LiveMenuSync";

export default async function Home() {
  const locale = await getLocale();
  const [{ items, categories, branchId }, reviews] = await Promise.all([getMenu(locale), getAllReviews()]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(restaurantJsonLd(reviews))} />
      <Navbar />
      <Hero />
      <LiveMenuSync branchId={branchId} socketBaseUrl={getBackendWebSocketUrl()} />
      <Menu items={items} categories={categories} />
      <About />
      <Testimonials data={reviews} />
      <Location />
      <Footer />
    </>
  );
}
