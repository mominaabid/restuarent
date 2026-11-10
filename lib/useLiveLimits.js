"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const REFRESH_MS = 20000;

/**
 * Live "how many can still be ordered" for the cart, read from the current
 * menu — the scanned table's branch, or `branchId` directly for the website
 * cart (no table) (not from what was stored when the item was added — those
 * lines can be hours old, or predate the limit entirely).
 *
 * limitFor(line) -> number (0 = sold out / no longer on the menu) or
 * undefined when unknown (menu not loaded yet, or a backend that does not
 * report counts — the server still checks on checkout).
 *
 * `onUpdate(limitFor)` runs after each refresh, so the cart can lower
 * quantities that are now over the limit.
 */
export function useLiveLimits(tableCode, onUpdate, initialBranchId = "") {
  const [lookup, setLookup] = useState(null); // { products: Map, variants: Map }
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const limitFor = useCallback((line) => {
    if (!lookup) return typeof line.maxQuantity === "number" ? line.maxQuantity : undefined;
    const product = lookup.products.get(String(line.id));
    if (!product) return 0; // sold out or taken off the menu
    if (line.variantId) {
      const variant = lookup.variants.get(`${line.id}:${line.variantId}`);
      if (!variant || variant.is_orderable === false) return 0;
      return typeof variant.available_quantity === "number" ? variant.available_quantity : undefined;
    }
    return typeof product.available_quantity === "number" ? product.available_quantity : undefined;
  }, [lookup]);

  useEffect(() => {
    if (!tableCode && !initialBranchId) return undefined;
    let active = true;
    let timer;
    let branchId = tableCode ? "" : String(initialBranchId);

    async function load() {
      try {
        if (!branchId) {
          const session = await fetch(`/api/qr/session?token=${encodeURIComponent(tableCode)}`, { cache: "no-store" });
          if (!session.ok) throw new Error("session");
          branchId = String((await session.json())?.table?.branch ?? "");
        }
        if (branchId) {
          const response = await fetch(`/api/qr/menu?branch=${encodeURIComponent(branchId)}`, { cache: "no-store" });
          if (response.ok) {
            const body = await response.json();
            const products = new Map();
            const variants = new Map();
            for (const category of body.categories ?? []) {
              for (const product of category.products ?? []) {
                products.set(String(product.id), product);
                for (const variant of product.variants ?? []) variants.set(`${product.id}:${variant.id}`, variant);
              }
            }
            if (active) setLookup({ products, variants });
          }
        }
      } catch {
        // Keep the last known limits; the server still checks on checkout.
      }
      if (active) timer = window.setTimeout(load, REFRESH_MS);
    }

    void load();
    const onFocus = () => { window.clearTimeout(timer); void load(); };
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      window.clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [tableCode, initialBranchId]);

  // After each refresh, let the cart lower anything that is now over the limit.
  useEffect(() => {
    if (lookup) onUpdateRef.current?.(limitFor);
  }, [lookup, limitFor]);

  return { limitFor, ready: Boolean(lookup) };
}
