import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const railwayPublicDomain = process.env.RAILWAY_PUBLIC_DOMAIN;

const railwayHosts = railwayPublicDomain
  ? [railwayPublicDomain]
  : ['.up.railway.app'];

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    alias: {
      '@admin': new URL('../admin-dashboard/src', import.meta.url).pathname,
    },
  },
  server: {
    port: Number(process.env.PORT) || 5175,
    host: '0.0.0.0',
    allowedHosts: ['localhost', '127.0.0.1', ...railwayHosts],
    fs: {
      allow: ['..'],
    },
  },
  preview: {
    port: Number(process.env.PORT) || 5175,
    host: '0.0.0.0',
    allowedHosts: ['localhost', '127.0.0.1', ...railwayHosts],
  },
});
