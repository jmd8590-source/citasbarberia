import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    cssMinify: true
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'BarberClub — Reserva tu cita',
        short_name: 'BarberClub',
        description: 'Reserva tu cita en la mejor barbería y peluquería. Estilo, precisión y actitud.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#FAF8F4',
        theme_color: '#0A0A0B',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // App shell (HTML/CSS/JS) precached for instant + offline loads.
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        // Online-first: any future Appwrite API/network call tries the network
        // first (fresh data while online) and only falls back to the last
        // cached response when the request fails (offline).
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname === 'cloud.appwrite.io' || url.hostname.endsWith('.appwrite.network'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'appwrite-api',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 }, // 1 day
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ url }) => url.origin === self.location.origin && /\.(?:woff2?|ttf)$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ]
});
