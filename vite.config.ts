import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`        -> dist/ served by server.ts (Render web service)
// `npm run build:single` -> dist-single/index.html, one self-contained file for a shareable preview
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: { outDir: mode === 'single' ? 'dist-single' : 'dist' },
}));
