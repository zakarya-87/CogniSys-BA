import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {
    return {
      server: {
        port: 5000,
        host: '0.0.0.0',
        allowedHosts: true as const,
      },
      plugins: [react(), tailwindcss()],
      // SECURITY: GEMINI_API_KEY must never be injected into the client bundle.
      // All Gemini calls are proxied through POST /api/gemini/generate on the server.
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Target modern browsers — smaller, faster output
        target: 'es2020',
        // Warn if any single chunk exceeds 600KB (helps catch regressions)
        chunkSizeWarningLimit: 600,
        rollupOptions: {
          output: {
            // Split heavy vendor libraries into separate cacheable chunks.
            // Each chunk is downloaded only when the view that needs it is first visited.
            manualChunks(id) {
              // Normalize path separators for Windows/Unix compatibility
              const nid = id.replace(/\\/g, '/');
              if (!nid.includes('node_modules/')) return undefined;

              // React runtime + animation — always needed, cache long-term
              if (nid.includes('/react/') || nid.includes('/react-dom/') ||
                  nid.includes('/motion/') || nid.includes('/scheduler/')) {
                return 'vendor-react';
              }
              // Firebase client SDK — needed at boot for auth
              if (nid.includes('/firebase/') || nid.includes('/@firebase/')) {
                return 'vendor-firebase';
              }
              // D3 — ~500KB, only used in ConceptModeler (lazy-loaded CortexView)
              if (nid.includes('/d3/') || nid.includes('/d3-') ||
                  nid.includes('/internmap/') || nid.includes('/delaunator/') ||
                  nid.includes('/robust-predicates/')) {
                return 'vendor-d3';
              }
              // Recharts + dependencies
              if (nid.includes('/recharts/') || nid.includes('/victory-vendor/')) {
                return 'vendor-charts';
              }
              // Chart.js — used in PredictiveCoreView
              if (nid.includes('/chart.js/')) {
                return 'vendor-chartjs';
              }
              // Gemini SDK — only used via server proxy; client uses fetch
              if (nid.includes('/@google/genai/')) {
                return 'vendor-genai';
              }
              // lucide-react icons — large, lazy per view
              if (nid.includes('/lucide-react/')) {
                return 'vendor-icons';
              }
              // Math.js — heavy (~500KB), only used in analytical views
              if (nid.includes('/mathjs/') || nid.includes('/typed-function/') ||
                  nid.includes('/decimal.js/') || nid.includes('/fraction.js/')) {
                return 'vendor-math';
              }
              // Radix UI + headless UI components
              if (nid.includes('/@radix-ui/')) {
                return 'vendor-ui';
              }
              // i18n — loaded after shell renders
              if (nid.includes('/i18next/') || nid.includes('/react-i18next/')) {
                return 'vendor-i18n';
              }
              // All other node_modules → generic vendor chunk
              return 'vendor';
            },
          },
        },
      },
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts',
        exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
      }
    };
});
