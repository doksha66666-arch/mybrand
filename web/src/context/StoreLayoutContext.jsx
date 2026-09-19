import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const DEFAULT_THEME = {
  accent: '#0F172A',
  accentSoft: '#F1F5F9',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#111827',
  border: '#E5E7EB',
  radius: 18,
};

const StoreLayoutContext = createContext({ layouts: {}, theme: DEFAULT_THEME, loading: true });

export function StoreLayoutProvider({ children }) {
  const [layouts, setLayouts] = useState({});
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-mybrand-store-layout', 'true');
    style.textContent = `
      :root{
        --store-accent:var(--store-accent-raw);
        --store-accent-soft:var(--store-accent-soft-raw);
        --store-bg:var(--store-bg-raw);
        --store-surface:var(--store-surface-raw);
        --store-text:var(--store-text-raw);
        --store-border:var(--store-border-raw);
        --store-radius:var(--store-radius-raw);
      }
      body{background:var(--store-bg-raw);color:var(--store-text-raw)}
      .home-reference,.categories-reference,.product-reference,.cart-reference,.checkout-reference,.orders-reference,.wishlist-reference,.account-reference,.register-app,.app{--store-radius-local:var(--store-radius-raw)}
      .home-reference .logo,.categories-reference .categories-logo{color:var(--store-accent-raw)!important}
      .home-reference .home-add-cart,.home-reference .bottom-nav .active .trend-circle,.home-reference .bottom-nav .nav-item.active{background:var(--store-accent-raw)!important;color:#fff!important}
      .categories-reference .categories-rail-item.active{border-color:var(--store-accent-raw)!important;color:var(--store-accent-raw)!important}
      .store-customizer-preview-shell{border-radius:var(--store-radius-raw)}
    `;
    document.head.appendChild(style);

    let active = true;
    api.get('/config')
      .then(({ data }) => {
        if (!active) return;
        const value = data?.pageLayouts;
        if (value && typeof value === 'object' && !Array.isArray(value)) setLayouts(value);
        const remoteTheme = data?.theme;
        if (remoteTheme && typeof remoteTheme === 'object' && !Array.isArray(remoteTheme)) setTheme({ ...DEFAULT_THEME, ...remoteTheme });
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
      style.remove();
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--store-accent-raw', theme.accent);
    root.style.setProperty('--store-accent-soft-raw', theme.accentSoft);
    root.style.setProperty('--store-bg-raw', theme.background);
    root.style.setProperty('--store-surface-raw', theme.surface);
    root.style.setProperty('--store-text-raw', theme.text);
    root.style.setProperty('--store-border-raw', theme.border);
    root.style.setProperty('--store-radius-raw', `${theme.radius}px`);
    return () => {
      [
        '--store-accent-raw',
        '--store-accent-soft-raw',
        '--store-bg-raw',
        '--store-surface-raw',
        '--store-text-raw',
        '--store-border-raw',
        '--store-radius-raw',
      ].forEach((key) => root.style.removeProperty(key));
    };
  }, [theme]);

  const value = useMemo(() => ({ layouts, theme, loading }), [layouts, theme, loading]);
  return <StoreLayoutContext.Provider value={value}>{children}</StoreLayoutContext.Provider>;
}

export function useStoreLayout(pageId) {
  const { layouts, loading } = useContext(StoreLayoutContext);
  const configured = layouts?.[pageId];
  const map = new Map(Array.isArray(configured) ? configured.map((item, index) => [item.id, { ...item, __index: index }]) : []);
  return {
    loading,
    getStyle(id) {
      const item = map.get(id);
      if (!item) return { order: 0 };
      return {
        order: item.__index,
        display: item.enabled === false ? 'none' : undefined,
      };
    },
    isEnabled(id) {
      return !map.has(id) || map.get(id)?.enabled !== false;
    },
  };
}
