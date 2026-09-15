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
    const { data } = await api.post('/merchants/register', payload);
    // Merchant registration intentionally does not create a session.
    // The backend requires email verification first and returns no auth token.
    return data;
  };

  const verifyEmail = async (email, code) => {
    try {
      const { data } = await api.post('/auth/verify-email', { email, code });
      if (data.user?.role !== 'merchant' || !data.token) {
        throw new Error('تعذر تفعيل حساب التاجر');
      }

      localStorage.setItem('mybrand_merchant_token', data.token);
      setUser(data.user);
      await loadProfile();
      return data;
    } catch (error) {
      clearSession();
      throw error;
    }
  };

  const resendVerificationCode = async (email) => {
    const { data } = await api.post('/auth/resend-verification', { email });
    return data;
  };

  const logout = () => {
    clearSession();
  };

  return (
    <MerchantAuthContext.Provider value={{
      user,
      merchant,
      stats,
      loading,
      login,
      register,
      verifyEmail,
      resendVerificationCode,
      logout,
      refresh: loadProfile,
    }}>
      {children}
    </MerchantAuthContext.Provider>
  );
}

export const useMerchantAuth = () => useContext(MerchantAuthContext);
