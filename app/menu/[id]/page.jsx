import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductDetail from "@/components/ProductDetail";
import { getProductById, getRelatedProducts } from "@/lib/api/products";
import { getGoogleReviews } from "@/lib/api/reviews";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { locale, t, money } = await getI18n();
  const product = await getProductById(id, locale);

  if (!product) {
    return { title: t.product.notFoundTitle };
  }

  const description = `${product.description} ${money(product.price)} — ${t.product.metaSuffix}`.trim();

  return {
    title: product.name,
    description,
    alternates: { canonical: `/menu/${id}` },
    openGraph: {
      title: product.name,
      description,
      images: [{ url: product.image }],
    },
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const { locale } = await getI18n();
  const [product, reviews] = await Promise.all([getProductById(id, locale), getGoogleReviews()]);
  const relatedProducts = product ? await getRelatedProducts(product, 4, locale) : [];

  return (
    <>
      <Navbar />
      <ProductDetail product={product} relatedProducts={relatedProducts} rating={reviews.rating} reviewCount={reviews.totalCount} />
      <Footer />
    </>
  );
}
