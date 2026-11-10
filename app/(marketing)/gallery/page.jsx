import PageHeader from "@/components/PageHeader";
import GalleryGrid from "@/components/GalleryGrid";
import { getMenu } from "@/lib/api/products";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/pageMetadata";

export function generateMetadata() {
  return pageMetadata("/gallery", (t) => t.pages.gallery);
}

export default async function GalleryPage() {
  const { locale, t } = await getI18n();
  const page = t.pages.gallery;
  const { items } = await getMenu(locale);

  // Dish photos come from the menu (uploaded in the admin); items still on the
  // placeholder image are left out so the gallery only shows real food.
  const seen = new Set();
  const dishPhotos = items
    .filter((item) => item.image && !item.image.includes("menu-placeholder") && !seen.has(item.image) && seen.add(item.image))
    .map((item) => ({ src: item.image, alt: item.name, unoptimized: true }));

  const sections = [
    {
      title: page.restaurant,
      wide: true,
      photos: [
        { src: "/hero/farzan-hero.png", alt: t.hero.slides[0] },
        { src: "/hero/farzan-hero-2.png", alt: t.hero.slides[1] },
      ],
    },
    { title: page.dishes, photos: dishPhotos },
  ];

  return (
    <>
      <PageHeader kicker={page.kicker} title={page.heading} crumb={t.nav.gallery} homeLabel={t.nav.home} breadcrumbLabel={t.nav.breadcrumb} />
      <div className="mx-auto max-w-7xl px-6 pb-12 md:px-10">
        <GalleryGrid sections={sections} />
      </div>
    </>
  );
}
