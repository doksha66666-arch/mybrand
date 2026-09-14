import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const railwayPublicDomain = process.env.RAILWAY_PUBLIC_DOMAIN;

const railwayHosts = railwayPublicDomain
  ? [railwayPublicDomain]
  : ['.up.railway.app'];

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 5173,
    host: '0.0.0.0',
    allowedHosts: ['localhost', '127.0.0.1', ...railwayHosts],
  },
  preview: {
    port: Number(process.env.PORT) || 5173,
    host: '0.0.0.0',
    allowedHosts: ['localhost', '127.0.0.1', ...railwayHosts],
  },
});
