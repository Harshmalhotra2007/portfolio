import { defineConfig } from "vite";
import { copyFileSync, existsSync } from "fs";

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
  root: ".",
  base: "/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    minify: "esbuild",
    target: "es2020",
    rollupOptions: {
      input: {
        main: "index.html",
        weather: "projects/weather.html",
        expense: "projects/expense.html",
        wild: "projects/wild.html",
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
  plugins: [
    {
      name: "copy-project-assets",
      closeBundle() {
        // Copy sw.js to dist/projects/ for weather.html service worker
        const swSrc = "projects/sw.js";
        const swDst = "dist/projects/sw.js";
        if (existsSync(swSrc)) {
          copyFileSync(swSrc, swDst);
          console.log(`Copied ${swSrc} -> ${swDst}`);
        }
        // Copy test_suite.js to dist/projects/ for expense.html dynamic test loading
        const testSrc = "projects/test_suite.js";
        const testDst = "dist/projects/test_suite.js";
        if (existsSync(testSrc)) {
          copyFileSync(testSrc, testDst);
          console.log(`Copied ${testSrc} -> ${testDst}`);
        }
        // Copy inline JS files for project pages
        const inlineFiles = ["expense-inline.js", "weather.js", "wild.js"];
        for (const file of inlineFiles) {
          const src = `projects/${file}`;
          const dst = `dist/projects/${file}`;
          if (existsSync(src)) {
            copyFileSync(src, dst);
            console.log(`Copied ${src} -> ${dst}`);
          }
        }
        // Copy favicon.svg as favicon.ico for browser default request
        const faviconSrc = "favicon.svg";
        const faviconDst = "dist/favicon.ico";
        if (existsSync(faviconSrc)) {
          copyFileSync(faviconSrc, faviconDst);
          console.log(`Copied ${faviconSrc} -> ${faviconDst}`);
        }
      },
    },
  ],
});