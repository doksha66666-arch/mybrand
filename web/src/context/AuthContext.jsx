import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [merchant, setMerchant] = useState(null);

  const loadMerchantIfNeeded = async (u) => {
    if (u?.role === 'merchant') {
      try { const { data } = await api.get('/merchants/me'); setMerchant(data.merchant); } catch { setMerchant(null); }
    } else setMerchant(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('mybrand_token');
    if (!token) return setLoading(false);
    api.get('/auth/me').then(async ({ data }) => { setUser(data.user); await loadMerchantIfNeeded(data.user); }).catch(() => localStorage.removeItem('mybrand_token')).finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('mybrand_token', data.token);
    setUser(data.user);
    await loadMerchantIfNeeded(data.user);
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    if (data.token) {
      localStorage.setItem('mybrand_token', data.token);
      setUser(data.user);
      await loadMerchantIfNeeded(data.user);
    }
    return data;
  };

  const registerMerchant = async (payload) => {
    const { data } = await api.post('/merchants/register', payload);
    if (data.token) {
      localStorage.setItem('mybrand_token', data.token);
      setUser(data.user);
      await loadMerchantIfNeeded(data.user);
    }
    return data;
  };

  const verifyEmail = async (email, code) => {
    const { data } = await api.post('/auth/verify-email', { email, code });
    if (data.token) {
      localStorage.setItem('mybrand_token', data.token);
      setUser(data.user);
      await loadMerchantIfNeeded(data.user);
    }
    return data;
  };

  const resendVerificationCode = async (email) => {
    const { data } = await api.post('/auth/resend-verification', { email });
    return data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('mybrand_token');
    setUser(null); setMerchant(null);
  };

  return <AuthContext.Provider value={{ user, merchant, loading, login, register, registerMerchant, verifyEmail, resendVerificationCode, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);