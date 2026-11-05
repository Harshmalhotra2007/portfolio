import { defineConfig } from 'vite';

/**
 * Build pipeline for the personal portfolio.
 *
 * The site is a static multi-page application. Vite is used for:
 *  - `npm run dev`     — fast local dev server with HMR (port 5173)
 *  - `npm run build`   — production bundle into `dist/` with hashed assets
 *  - `npm run preview` — preview the production build locally (port 4173)
 *
 * Third-party libraries (Lenis, Chart.js, Lucide, Leaflet, Font Awesome,
 * Google Fonts) are intentionally kept as CDN `<script>`/`<link>` tags with
 * Subresource Integrity hashes, so Vite leaves them untouched and only
 * optimizes local JS/CSS assets.
 */
export default defineConfig({
  root: '.',
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      input: {
        main: 'index.html',
        weather: 'projects/weather.html',
        expense: 'projects/expense.html',
        wild: 'projects/wild.html',
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    cors: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
  },
});
