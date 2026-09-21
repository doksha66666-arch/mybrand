import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);
const GUEST_STORAGE_KEY = 'mybrand_wishlist_guest_v1';
const USER_STORAGE_PREFIX = 'mybrand_wishlist_user_v1:';
const LEGACY_STORAGE_KEY = 'mybrand_wishlist_v1';

const isCustomizerPreview = () => typeof window !== 'undefined' && (window.__MYBRAND_CUSTOMIZER_PREVIEW__ === true || new URLSearchParams(window.location.search).get('customizerPreview') === '1');

const getUserStorageKey = (userId) => `${USER_STORAGE_PREFIX}${encodeURIComponent(String(userId || ''))}`;

const readStoredWishlist = (key = GUEST_STORAGE_KEY) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

const writeStoredWishlist = (key, ids) => {
  try {
    localStorage.setItem(key, JSON.stringify([...new Set((ids || []).filter(Boolean))]));
  } catch (_) {}
};

export function WishlistProvider({ children }) {
  const previewMode = isCustomizerPreview();
  const { user } = useAuth();
  const customerUserId = user?.role === 'customer' ? String(user?._id || user?.id || '') : '';
  const [productIds, setProductIds] = useState(() => {
    if (previewMode) return [];
    return readStoredWishlist(GUEST_STORAGE_KEY);
  });

  // The previous unscoped key could contain another customer's wishlist.
  // Never migrate it into an authenticated account; remove it when a customer
  // session is present so it cannot leak across accounts.
  useEffect(() => {
    if (previewMode || !customerUserId) return;
    try { localStorage.removeItem(LEGACY_STORAGE_KEY); } catch (_) {}
  }, [customerUserId, previewMode]);

  useEffect(() => {
    if (previewMode) return;
    const storageKey = customerUserId ? getUserStorageKey(customerUserId) : GUEST_STORAGE_KEY;
    writeStoredWishlist(storageKey, productIds);
  }, [productIds, customerUserId, previewMode]);

  useEffect(() => {
    if (previewMode) return undefined;
    let active = true;
    const guestIds = readStoredWishlist(GUEST_STORAGE_KEY);
    const storageKey = customerUserId ? getUserStorageKey(customerUserId) : GUEST_STORAGE_KEY;

    // Switching accounts must replace the in-memory list immediately with the
    // new account's scoped list plus intentional guest items. This prevents
    // account A's in-memory state from being merged into account B.
    if (!customerUserId) {
      setProductIds(guestIds);
      return undefined;
    }

    const scopedIds = readStoredWishlist(storageKey);
    const initialIds = [...new Set([...scopedIds, ...guestIds])];
    setProductIds(initialIds);

    const loadAccountWishlist = async () => {
      try {
        const { data } = await api.get('/wishlist');
        const remote = data?.wishlist?.products;
        const remoteIds = Array.isArray(remote)
          ? remote.map((product) => product?._id ?? product?.id ?? product).filter(Boolean)
          : [];
        if (!active) return;

        const mergedIds = [...new Set([...initialIds, ...remoteIds])];
        setProductIds(mergedIds);

        const missing = initialIds.filter((id) => !remoteIds.some((remoteId) => String(remoteId) === String(id)));
        if (missing.length) {
          await Promise.all(missing.map((productId) => api.post('/wishlist/toggle', { productId })));
        }
        if (active) writeStoredWishlist(storageKey, mergedIds);
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
