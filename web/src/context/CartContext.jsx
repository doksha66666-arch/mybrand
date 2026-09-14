import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api/client';
const CartContext = createContext(null);
const STORAGE_KEY = 'mybrand_cart_v2';
const MAX_QUANTITY = 1000;
const normalizeOptionValue = (value) => String(value ?? '').trim().toLocaleLowerCase('ar-EG');
const getSelectedOptions = (item) => {
  if (item?.selectedOptions && typeof item.selectedOptions === 'object' && !Array.isArray(item.selectedOptions)) return item.selectedOptions;
  if (Array.isArray(item?.selectedOptions)) return item.selectedOptions.reduce((out, option) => { const name = option?.name ?? option?.optionName; const value = option?.value ?? option?.label; if (name && value != null) out[String(name)] = value; return out; }, {});
  return {};
};
const cartLineKey = (item) => {
  const id = String(item?.id ?? item?._id ?? '');
  const variantId = item?.variantId != null ? String(item.variantId) : '';
  const options = getSelectedOptions(item);
  const optionKey = Object.keys(options).sort((a, b) => normalizeOptionValue(a).localeCompare(normalizeOptionValue(b))).map((name) => `${normalizeOptionValue(name)}=${normalizeOptionValue(options[name])}`).join('&');
  return `${id}:${variantId}:${optionKey || 'default'}`;
};
const normalizeStoredItems = (value) => !Array.isArray(value) ? [] : value.filter((item) => item && (item.id != null || item._id != null)).map((item) => ({ ...item, id: item.id ?? item._id, quantity: Math.min(MAX_QUANTITY, Math.max(1, Number(item.quantity) || 1)) }));
const isColorName = (name) => ['color', 'colour', 'اللون', 'لون'].includes(String(name ?? '').trim().toLowerCase());
const getColorImage = (product) => {
  const options = getSelectedOptions(product);
  const color = Object.entries(options).find(([name]) => isColorName(name))?.[1];
  if (color == null || !Array.isArray(product?.variants)) return '';
  const wanted = normalizeOptionValue(color);
  const match = product.variants.find((variant) => isColorName(variant?.name ?? variant?.optionName) && normalizeOptionValue(variant?.value ?? variant?.label ?? variant?.name) === wanted);
  return match?.image || match?.imageUrl || match?.photo || match?.thumbnail || match?.imagePath || '';
};
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? normalizeStoredItems(JSON.parse(raw)?.items) : []; } catch { return []; } });
  const [coupon, setCoupon] = useState(() => { try { return JSON.parse(localStorage.getItem('mybrand_coupon')) || null; } catch { return null; } });
  const [discount, setDiscount] = useState(() => Math.max(0, Number(localStorage.getItem('mybrand_coupon_discount') || 0)));
  const [shippingFee, setShippingFee] = useState(0);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ items })); } catch {} }, [items]);
  useEffect(() => { try { if (coupon) localStorage.setItem('mybrand_coupon', JSON.stringify(coupon)); else localStorage.removeItem('mybrand_coupon'); localStorage.setItem('mybrand_coupon_discount', String(Math.max(0, discount))); } catch {} }, [coupon, discount]);
  const addToCart = useCallback((product, quantity = 1) => { if (!product || (product.id == null && product._id == null)) return; const colorImage = getColorImage(product); const fallbackImage = Array.isArray(product.images) ? product.images[0] : product.images; const normalizedProduct = { ...product, id: product.id ?? product._id, image: colorImage || product.image || fallbackImage }; const safeQuantity = Math.min(MAX_QUANTITY, Math.max(1, Number(quantity) || 1)); setItems((prev) => { const key = cartLineKey(normalizedProduct); const existing = prev.find((item) => cartLineKey(item) === key); if (existing) return prev.map((item) => cartLineKey(item) === key ? { ...item, quantity: Math.min(MAX_QUANTITY, Math.max(1, Number(item.quantity) || 1) + safeQuantity) } : item); return [...prev, { ...normalizedProduct, quantity: safeQuantity }]; }); }, []);
  const removeFromCart = useCallback((id, variantId = null, selectedOptions = {}) => { const key = cartLineKey({ id, variantId, selectedOptions }); setItems((prev) => prev.filter((item) => cartLineKey(item) !== key)); }, []);
  const removeItems = useCallback((lines = []) => { const keys = new Set(Array.isArray(lines) ? lines.map(cartLineKey) : []); if (!keys.size) return; setItems((prev) => prev.filter((item) => !keys.has(cartLineKey(item)))); }, []);
  const increaseQuantity = useCallback((id, variantId = null, selectedOptions = {}) => { const key = cartLineKey({ id, variantId, selectedOptions }); setItems((prev) => prev.map((item) => cartLineKey(item) === key ? { ...item, quantity: Math.min(MAX_QUANTITY, Math.max(1, Number(item.quantity) || 1) + 1) } : item)); }, []);
  const decreaseQuantity = useCallback((id, variantId = null, selectedOptions = {}) => { const key = cartLineKey({ id, variantId, selectedOptions }); setItems((prev) => prev.map((item) => cartLineKey(item) === key ? { ...item, quantity: Math.max(1, (Number(item.quantity) || 1) - 1) } : item)); }, []);
  const clearCart = useCallback(() => { setItems([]); setCoupon(null); setDiscount(0); setShippingFee(0); }, []);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Math.max(0, Number(item.price) || 0) * Math.max(0, Number(item.quantity) || 0), 0), [items]);
  const safeDiscount = Math.min(subtotal, Math.max(0, Number(discount) || 0));
  const total = Math.max(0, subtotal - safeDiscount + Math.max(0, Number(shippingFee) || 0));
  const itemsCount = items.reduce((count, item) => count + Math.max(0, Number(item.quantity) || 0), 0);
  const applyCoupon = useCallback(async (code) => { const value = String(code || '').trim().toUpperCase(); if (!value) throw new Error('coupon_required'); const { data } = await api.post('/coupons/validate', { code: value, orderAmount: subtotal }); setCoupon(data.coupon); setDiscount(Math.min(subtotal, Math.max(0, Number(data.discount) || 0))); return data; }, [subtotal]);
  const removeCoupon = useCallback(() => { setCoupon(null); setDiscount(0); }, []);
  return <CartContext.Provider value={{ items, addToCart, removeFromCart, removeItems, increaseQuantity, decreaseQuantity, clearCart, subtotal, discount: safeDiscount, shippingFee, setShippingFee, total, itemsCount, coupon, applyCoupon, removeCoupon }}>{children}</CartContext.Provider>;
}
export const useCart = () => useContext(CartContext);
