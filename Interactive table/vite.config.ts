import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Web/PWA builds get a service worker. Electron and Capacitor load bundled
// files locally; a service worker is unnecessary and may fail on file://.
export default defineConfig(({ mode }) => {
  const nativeBuild = mode === 'desktop' || mode === 'android';
  return {
    base: './', // Works both under /REPOSITORY/ on GitHub Pages and locally.
    plugins: [
      react(),
      tailwindcss(),
      ...(!nativeBuild ? [VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          name: 'Электронный журнал и КТП',
          short_name: 'Журнал КТП',
          description: 'Интерактивный школьный журнал и планирование уроков.',
          theme_color: '#059669',
          background_color: '#f8fafc',
          display: 'standalone',
          start_url: './',
          scope: './',
          icons: [
            { src: './pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: './pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: './pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,xlsx,csv}'],
        },
        // Disable dev service worker: avoids old caches while editing.
        devOptions: { enabled: false },
      })] : []),
    ],
    resolve: { alias: { '@': path.resolve(import.meta.dirname, '.') } },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
