"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/context/LocaleContext";

export default function QrOccupancyNotice({ tableCode }) {
  const { t } = useI18n();
  const [occupied, setOccupied] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function check() {
      try {
        const response = await fetch(`/api/qr/session?token=${encodeURIComponent(tableCode)}`, { cache: "no-store", signal: controller.signal });
        if (response.ok) setOccupied(Boolean((await response.json()).occupied));
      } catch { /* Cart verifies access before submission. */ }
    }
    check();
    const timer = setInterval(check, 10000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [tableCode]);
  return occupied ? <p role="status" className="mx-4 mt-28 rounded-xl border border-brand-gold/30 bg-brand-black-soft p-3 font-body text-sm text-brand-gold">{t.qrCart.occupiedNotice}</p> : null;
}
