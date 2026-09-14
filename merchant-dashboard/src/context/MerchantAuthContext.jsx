import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const MerchantAuthContext = createContext(null);

export function MerchantAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [merchant, setMerchant] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    const { data } = await api.get('/merchants/me');
    setMerchant(data.merchant);
    setStats(data.stats);
  };

  useEffect(() => {
    const token = localStorage.getItem('mybrand_merchant_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then(async ({ data }) => {
        if (data.user.role !== 'merchant') {
          localStorage.removeItem('mybrand_merchant_token');
          setLoading(false);
          return;
        }
        setUser(data.user);
        await loadProfile();
      })
      .catch(() => localStorage.removeItem('mybrand_merchant_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.user.role !== 'merchant') {
      throw new Error('هذا الحساب ليس حساب تاجر');
    }
    localStorage.setItem('mybrand_merchant_token', data.token);
    setUser(data.user);
    await loadProfile();
  };

  const register = async (payload) => {
    const { data } = await api.post('/merchants/register', payload);
    localStorage.setItem('mybrand_merchant_token', data.token);
    setUser(data.user);
    setMerchant(data.merchant);
  };

  const logout = () => {
    localStorage.removeItem('mybrand_merchant_token');
    setUser(null);
    setMerchant(null);
    setStats(null);
  };

  return (
    <MerchantAuthContext.Provider value={{ user, merchant, stats, loading, login, register, logout, refresh: loadProfile }}>
      {children}
    </MerchantAuthContext.Provider>
  );
}

export const useMerchantAuth = () => useContext(MerchantAuthContext);
