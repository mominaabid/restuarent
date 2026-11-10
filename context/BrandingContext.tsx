"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Branding } from "@/lib/branding";
import { useI18n } from "@/context/LocaleContext";
import { SITE_NAME, SITE_NAME_AR } from "@/lib/constants";

const BrandingContext = createContext<Branding | null>(null);

export function BrandingProvider({ branding, children }: { branding: Branding; children: ReactNode }) {
  return <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  return useContext(BrandingContext);
}

/** The restaurant name in the visitor's language. */
export function useBrandName() {
  const branding = useBranding();
  const { locale } = useI18n();
  return locale === "ar" ? branding?.nameAr || SITE_NAME_AR : branding?.name || SITE_NAME;
}
