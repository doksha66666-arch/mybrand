import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const MerchantAuthContext = createContext(null);

export function MerchantAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [merchant, setMerchant] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = () => {
    localStorage.removeItem('mybrand_merchant_token');
    setUser(null);
    setMerchant(null);
    setStats(null);
  };

  const loadProfile = async () => {
    const { data } = await api.get('/merchants/me');
    setMerchant(data.merchant);
    setStats(data.stats || null);
    return data;
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
        if (data.user?.role !== 'merchant') {
          clearSession();
          return;
        }

        setUser(data.user);
        await loadProfile();
      })
      .catch(() => {
        clearSession();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.user?.role !== 'merchant') {
        throw new Error('هذا الحساب ليس حساب تاجر');
      }

      localStorage.setItem('mybrand_merchant_token', data.token);
      setUser(data.user);
      await loadProfile();
    } catch (error) {
      clearSession();
      throw error;
    }
  };

  const register = async (payload) => {
    try {
      const { data } = await api.post('/merchants/register', payload);
      localStorage.setItem('mybrand_merchant_token', data.token);
      setUser(data.user);
      setMerchant(data.merchant);
      await loadProfile();
    } catch (error) {
      clearSession();
      throw error;
    }
  };

  const logout = () => {
    clearSession();
  };

  return (
    <MerchantAuthContext.Provider value={{ user, merchant, stats, loading, login, register, logout, refresh: loadProfile }}>
      {children}
    </MerchantAuthContext.Provider>
  );
}

export const useMerchantAuth = () => useContext(MerchantAuthContext);
