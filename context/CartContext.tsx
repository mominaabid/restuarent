"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { forgetTablePhone, getTablePhone } from "@/lib/customerPhone";

const CartContext = createContext<CartContextValue | null>(null);
// v2: price became numeric instead of a formatted string (see docs/architecture-plan.md
// §11) — bumping the key so any old-shaped cart in a browser's storage is ignored
// rather than crashing formatCurrency() on load.
const STORAGE_KEY = "smoke-and-char-qr-cart-v1";
// The table this device is seated at. Remembered across reloads (and the
// online-payment redirect) so a seated guest never lands on the website's
// takeaway checkout, which would place a separate order with any number.
const ACTIVE_TABLE_KEY = `${STORAGE_KEY}:active-table`;

export interface CartItem {
  id: string;
  /**
   * Identifies the LINE, not the product. Two portions of the same dish are
   * two lines sharing one `id`, so every lookup must go through lineKey().
   */
  cartItemId?: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  notes?: string;
  /** The chosen portion, when the product has any. Sent with the order. */
  variantId?: string;
  variantName?: string;
  /** Most this line may hold (stock limit from the menu); undefined = no limit known. */
  maxQuantity?: number;
  [key: string]: unknown;
}

/**
 * The key that identifies one cart line.
 *
 * Products without variants key by id, exactly as before. With variants the
 * caller supplies `cartItemId` (`<productId>:<variantId>`), so "1 KG" and
 * "Half KG" of the same dish are separate lines — and removing one no longer
 * removes the other, which matching on `id` alone would have done.
 */
export function lineKey(item: Pick<CartItem, "id" | "cartItemId">): string {
  return item.cartItemId ?? item.id;
}

interface CartContextValue {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, newQuantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  submissionKey: string;
  cartLoaded: boolean;
  activeTableCode: string | null;
  setActiveTable: (tableCode: string) => void;
  /** The table was released: back to the ordinary website cart. */
  clearActiveTable: () => void;
  updateItemNotes: (id: string, notes: string) => void;
}

function newSubmissionKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [tableCode, setTableCode] = useState<string | null>(null);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [submissionKey, setSubmissionKey] = useState("");

  const tableCodeRef = useRef<string | null>(null);
  useEffect(() => {
    tableCodeRef.current = tableCode;
  }, [tableCode]);

  function loadWebsiteCart() {
    try {
      const savedCart = window.localStorage.getItem(STORAGE_KEY);
      const savedKey = window.localStorage.getItem(`${STORAGE_KEY}:request`);
      setCartItems(savedCart ? JSON.parse(savedCart) : []);
      setSubmissionKey(savedKey || newSubmissionKey());
    } catch {
      setCartItems([]);
      setSubmissionKey(newSubmissionKey());
    }
    setCartLoaded(true);
  }

  useEffect(() => {
    if (tableCode || cartLoaded) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      let remembered = "";
      try {
        remembered = window.localStorage.getItem(ACTIVE_TABLE_KEY) || "";
      } catch {
        // Blocked storage: nothing remembered.
      }
      if (!remembered) {
        loadWebsiteCart();
        return;
      }
      // Still seated? Only while this device's number has an unreleased bill
      // there; a guest from last week gets the normal website again.
      let seated = true;
      try {
        const query = new URLSearchParams({ token: remembered, phone: getTablePhone(remembered) });
        const response = await fetch(`/api/qr/session?${query}`, { cache: "no-store", signal: controller.signal });
        if (response.ok) seated = Boolean((await response.json()).bill_id);
        else if (response.status === 404) seated = false;
      } catch {
        if (controller.signal.aborted) return;
        // Offline: stay on the table cart; the backend still guards the order.
      }
      if (tableCodeRef.current) return; // a /t/ page set its table meanwhile
      if (seated) {
        setActiveTable(remembered);
      } else {
        forgetActiveTable();
        forgetTablePhone(remembered);
        loadWebsiteCart();
      }
    }, 0);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per load; the helpers only touch state setters
  }, [cartLoaded, tableCode]);

  useEffect(() => {
    if (!cartLoaded) return;
    if (tableCode) {
      window.localStorage.setItem(`${STORAGE_KEY}:${tableCode}`, JSON.stringify(cartItems));
      window.localStorage.setItem(`${STORAGE_KEY}:${tableCode}:request`, submissionKey);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
      window.localStorage.setItem(`${STORAGE_KEY}:request`, submissionKey);
    }
  }, [cartItems, cartLoaded, submissionKey, tableCode]);

  function setActiveTable(nextTableCode: string) {
    if (!nextTableCode || nextTableCode === tableCode) return;
    setCartLoaded(false);
    try {
      const savedCart = window.localStorage.getItem(`${STORAGE_KEY}:${nextTableCode}`);
      const savedKey = window.localStorage.getItem(`${STORAGE_KEY}:${nextTableCode}:request`);
      setCartItems(savedCart ? JSON.parse(savedCart) : []);
      setSubmissionKey(savedKey || newSubmissionKey());
    } catch {
      setCartItems([]);
      setSubmissionKey(newSubmissionKey());
    }
    setTableCode(nextTableCode);
    setCartLoaded(true);
    try {
      window.localStorage.setItem(ACTIVE_TABLE_KEY, nextTableCode);
    } catch {
      // Blocked storage: only this page load remembers the table.
    }
  }

  function forgetActiveTable() {
    try {
      window.localStorage.removeItem(ACTIVE_TABLE_KEY);
    } catch {
      // Nothing stored.
    }
  }

  function clearActiveTable() {
    forgetActiveTable();
    if (!tableCode) return;
    setTableCode(null);
    setCartLoaded(false);
    loadWebsiteCart();
  }

  function rotateSubmissionKey() {
    setSubmissionKey(newSubmissionKey());
  }

  function addToCart(item: Omit<CartItem, "quantity"> & { quantity?: number }) {
    rotateSubmissionKey();
    const quantity = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
    const itemId = item.cartItemId ?? String(item.id);
    setCartItems((currentItems) => {
      const existing = currentItems.find((cartItem) => lineKey(cartItem) === itemId);
      const limit = (item.maxQuantity ?? existing?.maxQuantity) as number | undefined;
      const cap = (value: number) => (typeof limit === "number" ? Math.min(value, limit) : value);
      if (existing) {
        return currentItems.map((cartItem) =>
          lineKey(cartItem) === itemId
            ? { ...cartItem, maxQuantity: limit, quantity: cap(cartItem.quantity + quantity) }
            : cartItem
        );
      }
      if (cap(quantity) <= 0) return currentItems;
      return [...currentItems, { ...item, quantity: cap(quantity) } as CartItem];
    });
  }

  function removeFromCart(id: string) {
    rotateSubmissionKey();
    setCartItems((currentItems) => currentItems.filter((item) => lineKey(item) !== id));
  }

  function updateQuantity(id: string, newQuantity: number) {
    rotateSubmissionKey();
    const quantity = Number(newQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems((currentItems) => currentItems.map((item) => (lineKey(item) === id
      ? { ...item, quantity: typeof item.maxQuantity === "number" ? Math.min(quantity, item.maxQuantity) : quantity }
      : item)));
  }

  function clearCart() {
    rotateSubmissionKey();
    setCartItems([]);
  }

  function updateItemNotes(id: string, notes: string) {
    rotateSubmissionKey();
    setCartItems((currentItems) => currentItems.map((item) => lineKey(item) === id ? { ...item, notes } : item));
  }

  const cartTotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
    [cartItems]
  );
  const cartCount = useMemo(() => cartItems.reduce((count, item) => count + item.quantity, 0), [cartItems]);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, submissionKey, cartLoaded, activeTableCode: tableCode, setActiveTable, clearActiveTable, updateItemNotes }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
