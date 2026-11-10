import { qrBackendFetch } from "@/lib/qrBackend";
import { DEFAULT_FAVICON_URL, DEFAULT_LOGO_URL, SITE_NAME, SITE_NAME_AR } from "@/lib/constants";

/**
 * Restaurant branding, read from the backend rather than baked into this app.
 *
 * The admin configures name/logo/favicon under Settings; this is the public,
 * unauthenticated read of those values (GET /api/branches/public/). Every
 * caller is a server component or route handler, so this runs server-side and
 * BACKEND_BASE_URL never reaches the browser.
 *
 * Falls back to the compiled-in SITE_NAME whenever the backend is unreachable
 * or unconfigured — a branding lookup must never be able to blank the site.
 */

export interface Branding {
  name: string;
  /** Arabic name for the Arabic version of the site; falls back to `name`. */
  nameAr: string;
  logoUrl: string;
  faviconUrl: string;
}

export const FALLBACK_BRANDING: Branding = { name: SITE_NAME, nameAr: SITE_NAME_AR, logoUrl: DEFAULT_LOGO_URL, faviconUrl: DEFAULT_FAVICON_URL };

interface PublicBranchResponse {
  id: number;
  name_en: string;
  name_ar: string;
  logo_url: string;
  favicon_url: string;
  currency: string;
}

export async function getBranding(): Promise<Branding> {
  try {
    const response = await qrBackendFetch("/api/branches/public/");
    if (!response.ok) return FALLBACK_BRANDING;
    const row = (await response.json()) as PublicBranchResponse;
    return {
      // Each language falls back to the other when one was left blank.
      name: (row.name_en || row.name_ar || SITE_NAME).trim(),
      nameAr: (row.name_ar || row.name_en || SITE_NAME_AR).trim(),
      // Blank in Settings -> the bundled Farzan logo/favicon (public/brand).
      logoUrl: row.logo_url || DEFAULT_LOGO_URL,
      faviconUrl: row.favicon_url || DEFAULT_FAVICON_URL,
    };
  } catch {
    return FALLBACK_BRANDING;
  }
}
