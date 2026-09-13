"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "smoke-and-char-cart";

function priceToNumber(price) {
  return Number(String(price).replace(/[^0-9.]/g, "")) || 0;
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const savedCart = window.localStorage.getItem(STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  function addToCart(item) {
    setCartItems((currentItems) => {
      const existing = currentItems.find((cartItem) => cartItem.id === item.id);
      if (existing) {
        return currentItems.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      }
      return [...currentItems, { ...item, quantity: 1 }];
    });
  }

  function removeFromCart(id) {
    setCartItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }

  function updateQuantity(id, newQuantity) {
    const quantity = Number(newQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems((currentItems) => currentItems.map((item) => (item.id === id ? { ...item, quantity } : item)));
  }

  function clearCart() {
    setCartItems([]);
  }

  const cartTotal = useMemo(
    () => cartItems.reduce((total, item) => total + priceToNumber(item.price) * item.quantity, 0),
    [cartItems]
  );
  const cartCount = useMemo(() => cartItems.reduce((count, item) => count + item.quantity, 0), [cartItems]);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
