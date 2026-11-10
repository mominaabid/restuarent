"use client";

import { useState } from "react";
import { useI18n } from "@/context/LocaleContext";
import { RESTAURANT_CONTACT } from "@/lib/constants";

/*
  CateringForm.jsx
  -----------------------------------------------------------
  Catering inquiry. There is no backend endpoint for inquiries,
  so "send" opens WhatsApp to the restaurant's number with the
  details already typed out — the guest reviews and sends it,
  and the conversation lands where staff already answer.
*/

const EMPTY = { name: "", phone: "", date: "", guests: "", type: "", details: "" };

export default function CateringForm() {
  const { t } = useI18n();
  const page = t.pages.catering;
  const [fields, setFields] = useState({ ...EMPTY, type: page.types[0] });
  const [error, setError] = useState("");

  const set = (key) => (event) => setFields((current) => ({ ...current, [key]: event.target.value }));

  function handleSubmit(event) {
    event.preventDefault();
    if (!fields.name.trim() || fields.phone.trim().length < 7 || !Number(fields.guests)) {
      setError(page.required);
      return;
    }
    setError("");
    const text = page.message({ ...fields, type: fields.type || page.types[0] });
    window.open(`${RESTAURANT_CONTACT.whatsappUrl}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-white/10 bg-brand-black-soft p-6 md:p-8">
      <h2 className="font-display text-3xl tracking-wide text-white">{page.formHeading}</h2>
      <p className="mt-2 font-body text-sm text-white/50">{page.formNote}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label={page.name} required>
          <input value={fields.name} onChange={set("name")} autoComplete="name" className={INPUT} />
        </Field>
        <Field label={page.phone} required>
          <input value={fields.phone} onChange={set("phone")} type="tel" autoComplete="tel" dir="ltr" placeholder="05x xxx xxxx" className={INPUT} />
        </Field>
        <Field label={page.date}>
          <input value={fields.date} onChange={set("date")} type="date" className={INPUT} />
        </Field>
        <Field label={page.guests} required>
          <input value={fields.guests} onChange={set("guests")} type="number" min="1" inputMode="numeric" className={INPUT} />
        </Field>
        <Field label={page.type} className="sm:col-span-2">
          <select value={fields.type} onChange={set("type")} className={INPUT}>
            {page.types.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </Field>
        <Field label={page.details} className="sm:col-span-2">
          <textarea value={fields.details} onChange={set("details")} rows={4} className={INPUT} />
        </Field>
      </div>

      {error ? <p role="alert" className="mt-4 rounded-lg border border-brand-red/40 bg-brand-red/10 p-3 font-body text-sm text-white/85">{error}</p> : null}

      <button type="submit" className="btn-primary mt-6 w-full !rounded-xl">{page.send}</button>
      <p className="mt-4 text-center font-body text-sm text-white/50">
        {page.orCall}{" "}
        <a href={RESTAURANT_CONTACT.phoneHref} dir="ltr" className="text-brand-gold hover:underline">{RESTAURANT_CONTACT.phoneDisplay}</a>
      </p>
    </form>
  );
}

const INPUT =
  "mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-3 font-body text-sm text-white placeholder:text-white/30 focus:border-brand-gold focus:outline-none [color-scheme:dark]";

function Field({ label, required = false, className = "", children }) {
  return (
    <label className={`block font-body text-xs font-semibold uppercase tracking-wide text-white/60 ${className}`}>
      {label} {required ? <span className="text-brand-red">*</span> : null}
      {children}
    </label>
  );
}
