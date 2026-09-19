import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'mybrand_wishlist_v1';
const isCustomizerPreview = () => typeof window !== 'undefined' && (window.__MYBRAND_CUSTOMIZER_PREVIEW__ === true || new URLSearchParams(window.location.search).get('customizerPreview') === '1');

export function WishlistProvider({ children }) {
  const previewMode = isCustomizerPreview();
  const [productIds, setProductIds] = useState(() => {
    if (previewMode) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (previewMode) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productIds));
  }, [productIds, previewMode]);

  useEffect(() => {
    if (!previewMode) return undefined;
    let active = true;
    api.get('/products', { params: { limit: 4, page: 1 } })
      .then(({ data }) => {
        if (!active) return;
        const products = Array.isArray(data?.products) ? data.products : Array.isArray(data) ? data : [];
        setProductIds(products.slice(0, 4).map((product) => product._id ?? product.id ?? product.productId).filter(Boolean));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [previewMode]);

  const toggleWishlist = useCallback((id) => {
    setProductIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }, []);
  const isWishlisted = useCallback((id) => productIds.includes(id), [productIds]);

  return (
    <WishlistContext.Provider value={{ productIds, toggleWishlist, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
