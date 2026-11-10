"use client";

import { useI18n } from "@/context/LocaleContext";

/**
 * Shown the instant a link inside the table session is tapped (menu, cart, my
 * order, pay) while the next page renders, so every tap responds immediately
 * instead of the screen sitting still until the server answers.
 */
export default function TableSessionLoading() {
  const { t } = useI18n();
  return (
    <main className="min-h-screen bg-brand-black px-4 pb-16 pt-24 sm:px-5 md:px-8 md:pt-32" aria-busy="true" aria-live="polite">
      <div className="mx-auto max-w-3xl animate-pulse">
        <div className="mb-4 h-9 rounded-xl bg-white/5" />
        <div className="mb-2 h-3 w-24 rounded bg-white/10" />
        <div className="mb-5 h-8 w-40 rounded bg-white/10" />
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex gap-3 rounded-xl border border-white/10 bg-brand-black-soft p-2.5">
              <div className="h-[4.5rem] w-[4.5rem] flex-none rounded-lg bg-white/5" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 w-2/3 rounded bg-white/10" />
                <div className="h-3 w-full rounded bg-white/5" />
                <div className="h-3 w-1/3 rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
        <span className="sr-only">{t.table.loading}</span>
      </div>
    </main>
  );
}
