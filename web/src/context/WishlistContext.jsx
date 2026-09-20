import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'mybrand_wishlist_v1';
const isCustomizerPreview = () => typeof window !== 'undefined' && (window.__MYBRAND_CUSTOMIZER_PREVIEW__ === true || new URLSearchParams(window.location.search).get('customizerPreview') === '1');

const readStoredWishlist = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

const localIdsNeedSync = (raw, remoteIds) => {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) && parsed.some((id) => !remoteIds.some((remoteId) => String(remoteId) === String(id)));
  } catch {
    return false;
  }
};

export function WishlistProvider({ children }) {
  const previewMode = isCustomizerPreview();
  const { user } = useAuth();
  const customerUserId = user?.role === 'customer' ? String(user?._id || user?.id || '') : '';
  const [productIds, setProductIds] = useState(() => {
    if (previewMode) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (previewMode) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productIds));
  }, [productIds, previewMode]);

  useEffect(() => {
    if (previewMode) return undefined;
    if (!customerUserId) return undefined;
    let active = true;
    const loadAccountWishlist = async () => {
      try {
        const { data } = await api.get('/wishlist');
        const remote = data?.wishlist?.products;
        const remoteIds = Array.isArray(remote)
          ? remote.map((product) => product?._id ?? product?.id ?? product).filter(Boolean)
          : [];
        if (!active) return;
        setProductIds((localIds) => [...new Set([...localIds, ...remoteIds])]);
        if (localIdsNeedSync(localStorage.getItem(STORAGE_KEY), remoteIds)) {
          const localIds = readStoredWishlist();
          const missing = localIds.filter((id) => !remoteIds.some((remoteId) => String(remoteId) === String(id)));
          await Promise.all(missing.map((productId) => api.post('/wishlist/toggle', { productId })));
        }
      } catch (_) {}
    };
    loadAccountWishlist();
    return () => { active = false; };
  }, [customerUserId, previewMode]);

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
    if (!id) return;
    setProductIds((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      if (customerUserId && !previewMode) {
        const wasAdded = !prev.includes(id);
        api.post('/wishlist/toggle', { productId: id }).catch(() => {
          setProductIds((current) => {
            const has = current.includes(id);
            if (wasAdded && has) return current.filter((p) => p !== id);
            if (!wasAdded && !has) return [...current, id];
            return current;
          });
        });
      }
      return next;
    });
  }, [customerUserId, previewMode]);
  const isWishlisted = useCallback((id) => productIds.includes(id), [productIds]);

  return (
    <WishlistContext.Provider value={{ productIds, toggleWishlist, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
