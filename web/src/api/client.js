import axios from 'axios';

const DEFAULT_PRODUCTION_API_BASE_URL = 'https://mybrand-app-production-e260.up.railway.app/api';
const configuredApiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');

// Development keeps the local backend; production uses the Railway variable
// when configured, with the current MYBRAND backend as a safe fallback.
const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:5000/api'
  : (configuredApiBaseUrl || DEFAULT_PRODUCTION_API_BASE_URL);

export const MERCHANT_DASHBOARD_URL = import.meta.env.DEV
  ? 'http://localhost:5175'
  : 'https://friendly-nourishment-production-25fc.up.railway.app';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: false,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mybrand_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const method = String(config.method || '').toLowerCase();
  const url = String(config.url || '').split('?')[0];
  if (method === 'post' && (url === '/orders' || url.endsWith('/orders'))) {
    const storedPoints = Math.max(0, Math.floor(Number(localStorage.getItem('mybrand_loyalty_points') || 0)));
    if (storedPoints > 0) config.data = { ...(config.data || {}), loyaltyPoints: storedPoints };
  }
  return config;
});

api.interceptors.response.use((response) => {
  const method = String(response?.config?.method || '').toLowerCase();
  const url = String(response?.config?.url || '').split('?')[0];
  if (method === 'post' && (url === '/orders' || url.endsWith('/orders'))) {
    localStorage.removeItem('mybrand_loyalty_points');
    window.dispatchEvent(new Event('mybrand:loyalty-cleared'));
  }
  return response;
});

export default api;
