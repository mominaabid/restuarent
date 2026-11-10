"use client";

import { useTableSession } from "@/context/TableSessionContext";
import { useI18n } from "@/context/LocaleContext";

export default function TableBanner() {
  const { table } = useTableSession();
  const { t } = useI18n();

  return (
    <div className="mb-6 flex items-center justify-between rounded-xl border border-brand-gold/25 bg-brand-black-soft px-4 py-2.5">
      <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
        {t.table.orderingFor} <span className="text-white">{table.label}</span>
      </p>
      <span className="rounded-full bg-brand-gold/15 px-2.5 py-0.5 font-body text-[10px] font-bold uppercase tracking-wide text-brand-gold">
        {t.table.live}
      </span>
    </div>
  );
}
