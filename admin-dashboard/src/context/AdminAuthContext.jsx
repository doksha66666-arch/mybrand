import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AdminAuthContext = createContext(null);

const isAdmin = (user) => user?.role === 'admin';

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mybrand_admin_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then(({ data }) => {
        if (!isAdmin(data.user)) {
          localStorage.removeItem('mybrand_admin_token');
          setUser(null);
          return;
        }
        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem('mybrand_admin_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (!isAdmin(data.user)) {
      throw new Error('هذا الحساب لا يملك صلاحيات المشرف');
    }
    localStorage.setItem('mybrand_admin_token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('mybrand_admin_token');
    setUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
