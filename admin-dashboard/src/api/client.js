import axios from 'axios';

const DEFAULT_PRODUCTION_API_BASE_URL = 'https://mybrand-production-587c.up.railway.app/api';
const configuredApiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:5000/api'
  : (configuredApiBaseUrl || DEFAULT_PRODUCTION_API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000,
  withCredentials: false,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mybrand_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('mybrand_admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
