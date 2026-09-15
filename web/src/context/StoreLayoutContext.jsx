import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const StoreLayoutContext = createContext({ layouts: {}, loading: true });

export function StoreLayoutProvider({ children }) {
  const [layouts, setLayouts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get('/config')
      .then(({ data }) => {
        if (!active) return;
        const value = data?.pageLayouts;
        if (value && typeof value === 'object' && !Array.isArray(value)) setLayouts(value);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({ layouts, loading }), [layouts, loading]);
  return <StoreLayoutContext.Provider value={value}>{children}</StoreLayoutContext.Provider>;
}

export function useStoreLayout(pageId) {
  const { layouts, loading } = useContext(StoreLayoutContext);
  const configured = layouts?.[pageId];
  const map = new Map(Array.isArray(configured) ? configured.map((item, index) => [item.id, item]) : []);
  return {
    loading,
    getStyle(id) {
      const item = map.get(id);
      if (!item) return { order: 0 };
      return { order: Number.isFinite(Number(item.order)) ? Number(item.order) : 0, display: item.enabled === false ? 'none' : undefined };
    },
    isEnabled(id) {
      return !map.has(id) || map.get(id)?.enabled !== false;
    },
  };
}
