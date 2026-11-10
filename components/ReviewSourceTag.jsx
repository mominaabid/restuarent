/*
  ReviewSourceTag.jsx
  -----------------------------------------------------------
  The line at the foot of a review card saying where it came
  from: "Posted on Google" (links to the review), a gold
  "Local Guide" badge for reviews the restaurant added, or
  "Verified guest" for reviews left from a table's QR code.
  Shared by the home page testimonials and /reviews.
*/

export default function ReviewSourceTag({ review, labels, placeUrl, className = "" }) {
  if (review.origin === "localGuide" || review.origin === "guest") {
    const localGuide = review.origin === "localGuide";
    return (
      <span
        className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 font-body text-[10px] font-semibold uppercase tracking-wide ${
          localGuide ? "border-brand-gold/40 bg-brand-gold/10 text-brand-gold" : "border-white/15 text-white/55"
        } ${className}`}
      >
        <span aria-hidden="true">{localGuide ? "★" : "✓"}</span>
        {localGuide ? labels.localGuide : labels.verifiedGuest}
      </span>
    );
  }
  return (
    <a
      href={review.reviewUrl || placeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block font-body text-[11px] uppercase tracking-wide text-white/35 hover:text-brand-gold ${className}`}
    >
      {labels.postedOnGoogle}
    </a>
  );
}

/** The reviewer's name: a link to their Google profile for Google reviews, plain text otherwise. */
export function ReviewAuthor({ review, placeUrl, className }) {
  if (review.origin === "localGuide" || review.origin === "guest") {
    return <span className={className}>{review.authorName}</span>;
  }
  return (
    <a href={review.authorUrl || placeUrl} target="_blank" rel="noopener noreferrer" className={`${className} hover:text-brand-gold`}>
      {review.authorName}
    </a>
  );
}
