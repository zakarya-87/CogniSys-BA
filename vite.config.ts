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
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts',
      }
    };
});
