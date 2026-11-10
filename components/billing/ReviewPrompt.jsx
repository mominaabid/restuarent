"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/context/LocaleContext";
import { getTablePhone } from "@/lib/customerPhone";
import { apiErrorMessage, networkErrorMessage } from "@/lib/apiError";

/**
 * "Leave a review" card on the pay screen, once the meal is over.
 *
 * Asks the backend first whether this bill can be reviewed (paid, everything
 * served, this phone's own bill, not reviewed yet) and renders nothing when
 * it can't — so it is safe to drop onto any screen that knows the bill id.
 * Submitted reviews wait for an admin's approval before the website shows them.
 */

// The screen swaps this card out when the cashier releases the table (paid ->
// "session ended"), so an unsent draft is kept per bill for this tab.
const draftKey = (billId) => `review-draft:${billId}`;

function readDraft(billId) {
  try {
    return JSON.parse(window.sessionStorage.getItem(draftKey(billId)) || "null") || {};
  } catch {
    return {};
  }
}

function writeDraft(billId, draft) {
  try {
    if (draft) window.sessionStorage.setItem(draftKey(billId), JSON.stringify(draft));
    else window.sessionStorage.removeItem(draftKey(billId));
  } catch {
    // Storage blocked (private mode) — the draft just isn't kept.
  }
}

const INPUT_CLASS =
  "w-full rounded-lg border border-white/15 bg-black/30 px-4 py-2.5 font-body text-sm text-white placeholder:text-white/30 focus:border-brand-gold focus:outline-none";

export default function ReviewPrompt({ tableCode, billId, className = "" }) {
  const { t } = useI18n();
  const copy = t.pay.review;
  // checking -> form | already | hidden;  form -> sent
  const [state, setState] = useState(() => (tableCode && billId ? "checking" : "hidden"));
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tableCode || !billId) return;
    let cancelled = false;
    const query = new URLSearchParams({ token: tableCode, bill_id: String(billId), phone: getTablePhone(tableCode) });
    fetch(`/api/qr/review/eligibility?${query}`, { cache: "no-store" })
      .then((response) => response.json().catch(() => ({})))
      .then((body) => {
        if (cancelled) return;
        if (body.can_review) {
          const draft = readDraft(billId);
          if (draft.rating) setRating(draft.rating);
          if (draft.name) setName(draft.name);
          if (draft.comment) setComment(draft.comment);
          setState("form");
        }
        else setState(body.reason === "error.reviewAlreadySubmitted" ? "already" : "hidden");
      })
      .catch(() => !cancelled && setState("hidden"));
    return () => {
      cancelled = true;
    };
  }, [tableCode, billId]);

  useEffect(() => {
    if (state === "form") writeDraft(billId, { rating, name, comment });
  }, [state, billId, rating, name, comment]);

  async function submit(event) {
    event.preventDefault();
    if (!rating) return setError(copy.pickStars);
    if (!name.trim()) return setError(copy.nameRequired);
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/qr/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_token: tableCode,
          bill_id: Number(billId),
          phone: getTablePhone(tableCode),
          name: name.trim(),
          rating,
          comment: comment.trim(),
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok) {
        writeDraft(billId, null);
        return setState("sent");
      }
      if (body.error === "error.reviewAlreadySubmitted") return setState("already");
      setError(apiErrorMessage(t, body, response.status, copy.errors, copy.genericError));
    } catch {
      setError(networkErrorMessage(t));
    } finally {
      setBusy(false);
    }
  }

  if (state === "checking" || state === "hidden") return null;

  if (state === "sent" || state === "already") {
    return (
      <div className={`fade-up-in rounded-2xl border border-brand-gold/30 bg-brand-black-soft p-5 text-center ${className}`}>
        <p className="text-2xl text-brand-gold" aria-hidden="true">★</p>
        <p className="mt-1 font-display text-2xl tracking-wide text-white">{copy.thanksTitle}</p>
        <p className="mt-1 font-body text-sm text-white/60">{state === "sent" ? copy.thanksBody : copy.alreadyBody}</p>
      </div>
    );
  }

  const shown = hover || rating;
  return (
    <form onSubmit={submit} className={`fade-up-in rounded-2xl border border-brand-gold/30 bg-brand-black-soft p-5 text-start ${className}`}>
      <p className="font-display text-2xl tracking-wide text-white">{copy.title}</p>
      <p className="mt-1 font-body text-sm text-white/60">{copy.subtitle}</p>

      <div className="mt-4 flex items-center justify-center gap-1.5" role="radiogroup" aria-label={copy.ratingLabel} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={copy.starsAria(value)}
            onClick={() => {
              setRating(value);
              setError("");
            }}
            onMouseEnter={() => setHover(value)}
            className={`text-4xl leading-none transition-transform duration-150 hover:scale-110 focus:outline-none focus-visible:scale-110 ${
              value <= shown ? "text-brand-gold" : "text-white/20"
            }`}
          >
            ★
          </button>
        ))}
      </div>
      <p className="mt-1 h-4 text-center font-body text-xs text-white/50">{shown ? copy.ratingWords[shown - 1] : ""}</p>

      <label htmlFor="review-name" className="mt-4 mb-1.5 block font-body text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
        {copy.nameLabel} <span className="text-brand-red">*</span>
      </label>
      <input
        id="review-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={80}
        autoComplete="name"
        placeholder={copy.namePlaceholder}
        className={INPUT_CLASS}
      />

      <label htmlFor="review-comment" className="mt-4 mb-1.5 block font-body text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
        {copy.commentLabel} <span className="font-normal normal-case tracking-normal text-white/35">{copy.optional}</span>
      </label>
      <textarea
        id="review-comment"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={1000}
        rows={3}
        dir="auto"
        placeholder={copy.commentPlaceholder}
        className={`${INPUT_CLASS} resize-none`}
      />

      {error ? <p role="alert" className="mt-3 font-body text-xs font-medium text-brand-red">{error}</p> : null}

      <button type="submit" disabled={busy} className="btn-primary mt-5 w-full !rounded-xl !py-3.5 disabled:opacity-60">
        {busy ? copy.sending : copy.submit}
      </button>
      <p className="mt-2 text-center font-body text-[11px] text-white/35">{copy.moderationNote}</p>
    </form>
  );
}
