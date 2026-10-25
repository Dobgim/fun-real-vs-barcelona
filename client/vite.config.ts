import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
      '@data': fileURLToPath(new URL('../server/data', import.meta.url)),
    },
  },
  server: { port: 5250, strictPort: true, fs: { allow: ['..'] } },
  preview: { port: 5250 },
});
