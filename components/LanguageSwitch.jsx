"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/context/LocaleContext";
import { LOCALE_COOKIE } from "@/lib/i18n/config";

/**
 * EN ⇄ العربية. Saves the choice in a cookie for a year and re-renders the
 * current page on the server in the new language — same URL, nothing reloads.
 */
export default function LanguageSwitch({ className = "" }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchLanguage() {
    document.cookie = `${LOCALE_COOKIE}=${t.common.switchToLang}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={switchLanguage}
      disabled={pending}
      lang={t.common.switchToLang}
      aria-label={t.common.switchAria}
      className={`rounded-full border border-white/15 px-3.5 py-2 font-body text-sm font-semibold text-white/85 transition-colors hover:border-brand-gold hover:text-brand-gold disabled:opacity-60 ${className}`}
    >
      {t.common.switchTo}
    </button>
  );
}
