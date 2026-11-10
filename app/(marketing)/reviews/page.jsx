import PageHeader from "@/components/PageHeader";
import { RESTAURANT_CONTACT } from "@/lib/constants";
import { getAllReviews } from "@/lib/api/reviews";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/pageMetadata";
import { reviewDate, reviewText } from "@/lib/reviewDisplay";
import ReviewSourceTag, { ReviewAuthor } from "@/components/ReviewSourceTag";

export function generateMetadata() {
  return pageMetadata("/reviews", (t) => t.pages.reviews);
}

export default async function ReviewsPage() {
  const [{ locale, t }, data] = await Promise.all([getI18n(), getAllReviews()]);
  const page = t.pages.reviews;
  const reviews = data.reviews ?? [];

  return (
    <>
      <PageHeader kicker={page.kicker} title={page.heading} crumb={t.nav.reviews} homeLabel={t.nav.home} breadcrumbLabel={t.nav.breadcrumb}>
        {data.rating ? (
          <div className="mt-8 flex flex-wrap items-center gap-6 rounded-2xl border border-white/10 bg-brand-black-soft p-6">
            <div>
              <p className="font-display text-6xl leading-none text-brand-gold">{data.rating.toFixed(1)}</p>
              <Stars rating={Math.round(data.rating)} label={t.testimonials.starsAria(data.rating)} />
            </div>
            {data.totalCount ? <p className="font-body text-white/65">{page.basedOn(data.totalCount)}</p> : null}
            <div className="flex flex-wrap gap-3 md:ms-auto">
              <a href={RESTAURANT_CONTACT.writeReviewUrl} target="_blank" rel="noopener noreferrer" className="btn-primary !px-6 !py-3 !text-base">{page.write}</a>
              <a href={RESTAURANT_CONTACT.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-outline !px-6 !py-3 !text-base">{page.readAll}</a>
            </div>
          </div>
        ) : null}
      </PageHeader>

      <section className="px-6 pb-20 md:px-10">
        <div className="mx-auto max-w-7xl">
          {reviews.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-brand-black-soft p-6 font-body text-white/65">
              {page.empty}{" "}
              <a href={RESTAURANT_CONTACT.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-brand-gold underline">{page.readAll}</a>
            </p>
          ) : (
            <div className="columns-1 gap-5 md:columns-2 lg:columns-3">
              {reviews.map((review) => (
                <article key={review.id} className="mb-5 break-inside-avoid rounded-2xl border border-white/10 bg-brand-black-soft p-5 transition-colors hover:border-brand-red/60">
                  <div className="flex items-center gap-3">
                    {review.authorPhotoUrl ? (
                      <img src={review.authorPhotoUrl} alt="" referrerPolicy="no-referrer" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-red font-body font-semibold text-white">{review.authorName.charAt(0)}</span>
                    )}
                    <div className="min-w-0">
                      <ReviewAuthor review={review} placeUrl={RESTAURANT_CONTACT.mapsUrl} className="block truncate font-body text-sm font-semibold text-white" />
                      <p className="font-body text-xs text-white/40">{reviewDate(review, locale)}</p>
                    </div>
                  </div>
                  <Stars rating={review.rating} label={t.testimonials.starsAria(review.rating)} />
                  {review.text ? (
                    <p dir="auto" className="mt-2 whitespace-pre-line font-body text-sm leading-relaxed text-white/75">{reviewText(review, locale)}</p>
                  ) : null}
                  {review.images?.length ? (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {review.images.slice(0, 3).map((src) => (
                        <a key={src} href={review.reviewUrl || RESTAURANT_CONTACT.mapsUrl} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden rounded-lg">
                          <img src={src} alt={page.photoAlt(review.authorName)} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                        </a>
                      ))}
                    </div>
                  ) : null}
                  <ReviewSourceTag review={review} labels={t.testimonials} placeUrl={RESTAURANT_CONTACT.mapsUrl} className="mt-3" />
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function Stars({ rating, label }) {
  return (
    <div className="mt-2 flex gap-0.5 text-sm text-brand-gold" role="img" aria-label={label}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} aria-hidden="true" className={i < rating ? "opacity-100" : "opacity-25"}>★</span>
      ))}
    </div>
  );
}
