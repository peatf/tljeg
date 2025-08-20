import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  worker: {
    format: 'es'
  },
  plugins: [
  react(),
  svgr(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*', 'models/**/*'],
      manifest: {
        name: 'Timeline Jumping Artifact',
        short_name: 'TJE Guide',
        description: 'Privacy-first somatic practice tool for timeline jumping embodiment',
        theme_color: '#f2eee6',
        background_color: '#fafbec',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512.png', 
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-192.png',
            sizes: '192x192', 
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png', 
            purpose: 'maskable'
          },
          {
            src: 'icons/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ],
        shortcuts: [
          {
            name: 'Timeline Jump Flow',
            short_name: 'Flow',
            description: 'Access the timeline jumping flow',
            url: '/artifact',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Text Guide',
            short_name: 'Text',
            description: 'Read the text guide',
            url: '/text',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50MB for ML models
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/models/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'tja-models',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: ({ request, url }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'tja-pages'
            }
          }
        ]
      }
    })
  ],
  build: {
    sourcemap: true
  }
});

