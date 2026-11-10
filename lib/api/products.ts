import type { Category, Product } from "@/types";
import { unstable_rethrow } from "next/navigation";
import { qrBackendFetch } from "@/lib/qrBackend";
import { DEFAULT_LOCALE, pick, type Locale } from "@/lib/i18n/config";

/**
 * Every function here is async and wraps mock, in-memory data today.
 * Components only ever call these — never import the mocks directly —
 * so swapping to a real backend later means rewriting the inside of
 * this file to use fetch(), with zero changes to any component.
 * See docs/architecture-plan.md §07.
 */

export interface MenuVariant {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  onDeal?: boolean;
  isOrderable?: boolean;
  /** How many can still be ordered (capped by the server); undefined = unknown. */
  availableQuantity?: number;
}

export type ProductWithCategory = Product & {
  categoryName: string;
  originalPrice?: number;
  onDeal?: boolean;
  isOrderable: boolean;
  /** How many can still be ordered (capped by the server); undefined = unknown. */
  availableQuantity?: number;
  hasRecipe: boolean;
  /** Portions this item can be ordered in. Empty = single price. */
  variants?: MenuVariant[];
};

interface PublicMenuProduct {
  id: number | string;
  name_en?: string | null;
  name_ar?: string | null;
  description_en?: string | null;
  description_ar?: string | null;
  price: number | string;
  original_price?: number | string | null;
  on_deal?: boolean;
  image?: string | null;
  badge?: Product["badge"];
  is_available?: boolean;
  is_orderable?: boolean;
  available_quantity?: number | null;
  has_recipe?: boolean;
  variants?: PublicMenuVariant[];
}

/**
 * A portion the customer can choose — "Half KG", "1 KG", "Cup".
 *
 * Price only: the public menu deliberately carries no ingredient cost,
 * multiplier or margin, because those are staff figures on an endpoint anyone
 * can call. Each price already has today's deal applied server-side.
 */
interface PublicMenuVariant {
  id: number | string;
  name_en?: string | null;
  name_ar?: string | null;
  price: number | string;
  original_price?: number | string | null;
  on_deal?: boolean;
  is_orderable?: boolean;
  available_quantity?: number | null;
}

interface PublicMenuCategory {
  id: number | string;
  name_en?: string | null;
  name_ar?: string | null;
  sort_order?: number | string | null;
  products?: PublicMenuProduct[];
}

interface PublicMenuResponse {
  branch?: { id: number | string };
  categories?: PublicMenuCategory[];
}

async function loadMenu(locale: Locale = DEFAULT_LOCALE): Promise<{ items: ProductWithCategory[]; categories: Category[]; branchId: string }> {
  let payload: PublicMenuResponse;
  try {
    const response = await qrBackendFetch("/api/menu/");
    if (!response.ok) throw new Error(`Menu request failed (${response.status})`);
    payload = (await response.json()) as PublicMenuResponse;
  } catch (error) {
    unstable_rethrow(error);
    console.error("Could not load the customer menu:", error);
    return { items: [], categories: [], branchId: "" };
  }
  const categories: Category[] = (payload.categories ?? []).map((category) => ({
    id: String(category.id), branchId: "", name: pick(locale, category.name_en, category.name_ar) || "Menu",
    sortOrder: Number(category.sort_order ?? 0),
  }));
  const items: ProductWithCategory[] = (payload.categories ?? []).flatMap((category) =>
    (category.products ?? []).map((product) => {
      const price = Number(product.price);
      const originalPrice = product.original_price == null ? undefined : Number(product.original_price);
      return {
        id: String(product.id), branchId: "", categoryId: String(category.id),
        categoryName: pick(locale, category.name_en, category.name_ar) || "Menu",
        name: pick(locale, product.name_en, product.name_ar) || "Menu item",
        description: pick(locale, product.description_en, product.description_ar) || "", price,
        costPrice: 0, image: product.image || "/images/menu-placeholder.png",
        isAvailable: product.is_available !== false, isOrderable: product.is_orderable !== false, availableQuantity: product.available_quantity ?? undefined, badge: product.badge ?? null,
        hasRecipe: product.has_recipe === true,
        originalPrice, onDeal: Boolean(product.on_deal),
        variants: (product.variants ?? []).map((variant) => ({
          id: String(variant.id), name: pick(locale, variant.name_en, variant.name_ar) || "", price: Number(variant.price),
          originalPrice: variant.original_price == null ? undefined : Number(variant.original_price), onDeal: Boolean(variant.on_deal), isOrderable: variant.is_orderable !== false, availableQuantity: variant.available_quantity ?? undefined,
        })),
      } as ProductWithCategory;
    })
  );
  const visibleItems = items.filter((item) => item.hasRecipe && item.isAvailable && item.isOrderable);
  const visibleCategoryIds = new Set(visibleItems.map((item) => item.categoryId));
  return {
    items: visibleItems,
    categories: categories.filter((category) => visibleCategoryIds.has(category.id)),
    branchId: payload.branch?.id == null ? "" : String(payload.branch.id),
  };
}

/** Names and descriptions come back in `locale`, falling back to the other language when one is blank. */
export async function getMenu(locale: Locale = DEFAULT_LOCALE): Promise<{ items: ProductWithCategory[]; categories: Category[]; branchId: string }> {
  return loadMenu(locale);
}

export async function getCategories(locale: Locale = DEFAULT_LOCALE): Promise<Category[]> {
  return (await loadMenu(locale)).categories;
}

/** QR menu for the branch encoded by the scanned table token. */
export async function getQrMenu(branchId: string, locale: Locale = DEFAULT_LOCALE): Promise<{ items: ProductWithCategory[]; categories: Category[] }> {
  try {
    const response = await qrBackendFetch(`/api/menu/?branch=${encodeURIComponent(branchId)}`);
    if (!response.ok) throw new Error(`Menu request failed (${response.status})`);
    const payload = (await response.json()) as PublicMenuResponse;
    const categories: Category[] = (payload.categories ?? []).map((category) => ({
      id: String(category.id),
      branchId,
      name: pick(locale, category.name_en, category.name_ar) || "Menu",
      sortOrder: Number(category.sort_order ?? 0),
    }));
    const items: ProductWithCategory[] = (payload.categories ?? []).flatMap((category) =>
      (category.products ?? []).map((product) => ({
        id: String(product.id),
        branchId,
        categoryId: String(category.id),
        categoryName: pick(locale, category.name_en, category.name_ar) || "Menu",
        name: pick(locale, product.name_en, product.name_ar) || "Menu item",
        description: pick(locale, product.description_en, product.description_ar) || "",
        price: Number(product.price),
        costPrice: 0,
        image: product.image || "/images/menu-placeholder.png",
        isAvailable: product.is_available !== false,
        isOrderable: product.is_orderable !== false,
        availableQuantity: product.available_quantity ?? undefined,
        hasRecipe: product.has_recipe === true,
        badge: product.badge ?? null,
        originalPrice: product.original_price == null ? undefined : Number(product.original_price),
        onDeal: Boolean(product.on_deal),
        variants: (product.variants ?? []).map((variant) => ({
          id: String(variant.id),
          name: pick(locale, variant.name_en, variant.name_ar) || "",
          price: Number(variant.price),
          originalPrice: variant.original_price == null ? undefined : Number(variant.original_price),
          onDeal: Boolean(variant.on_deal),
          isOrderable: variant.is_orderable !== false,
          availableQuantity: variant.available_quantity ?? undefined,
        })),
      }))
    );
    const visibleItems = items.filter((item) => item.hasRecipe && item.isAvailable && item.isOrderable);
    const visibleCategoryIds = new Set(visibleItems.map((item) => item.categoryId));
    return {
      items: visibleItems,
      categories: categories.filter((category) => visibleCategoryIds.has(category.id)),
    };
  } catch (error) {
    console.error("Could not load QR menu:", error);
    return { items: [], categories: [] };
  }
}

export async function getProducts(locale: Locale = DEFAULT_LOCALE): Promise<ProductWithCategory[]> {
  return (await loadMenu(locale)).items;
}

/** Today's menu — available items whose day schedule (if any) includes today. */
export async function getAvailableProducts(locale: Locale = DEFAULT_LOCALE): Promise<ProductWithCategory[]> {
  return (await loadMenu(locale)).items.filter((product) => product.isOrderable);
}

export async function getProductById(id: string, locale: Locale = DEFAULT_LOCALE): Promise<ProductWithCategory | undefined> {
  return (await loadMenu(locale)).items.find((item) => item.id === id);
}

export async function getRelatedProducts(product: ProductWithCategory, limit = 4, locale: Locale = DEFAULT_LOCALE): Promise<ProductWithCategory[]> {
  const all = (await loadMenu(locale)).items.filter((item) => item.id !== product.id);
  const sameCategory = all.filter((item) => item.categoryId === product.categoryId);
  const rest = all.filter((item) => item.categoryId !== product.categoryId);
  return [...sameCategory, ...rest].slice(0, limit);
}
