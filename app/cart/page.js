import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartPageClient from "@/components/cart/CartPageClient";
import { getMenu } from "@/lib/api/products";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getI18n();
  return {
    title: t.cart.title,
    robots: { index: false, follow: false },
  };
}

export default async function CartPage() {
  const { locale } = await getI18n();
  const { items: products, branchId } = await getMenu(locale);

  return (
    <>
      <Navbar />
      <CartPageClient products={products} branchId={branchId} />
      <Footer />
    </>
  );
}
