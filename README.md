# Personal Portfolio — "The Void"

A brutalist, high-contrast personal portfolio for **Harsh Malhotra** — systems
engineer, web developer, and algorithm designer. Built as a fast, accessible,
multi-page static site with zero runtime framework dependencies.

**Live:** https://harshmalhotra2007.github.io/

## Pages

| Page | Path | Description |
|---|---|---|
| Home | `index.html` | Hero, wireframe globe canvas, skills, project grid, contact form |
| Weather | `projects/weather.html` | Interactive weather dashboard |
| Expense Tracker | `projects/expense.html` | Full client-side expense manager (recurring transactions, budgets, charts, webhook import) |
| Wild India | `projects/wild.html` | Leaflet-powered forests, wildlife & national-parks explorer |

## Design System — "The Void"

- **Palette** — pure black `#000000` base, neon cyan `#00f0ff` primary
  accent, acid green `#00ff66` secondary accent (see
  `assets/css/styles.css` CSS custom properties).
- **Typography** — Google Fonts (Space Grotesk / JetBrains Mono style
  pairing), loaded with preconnect hints.
- **Motion** — Lenis smooth scroll (respects `prefers-reduced-motion`),
  canvas wireframe globe, scroll-triggered reveals. All animation is
  gated behind a reduced-motion check.

## Tech Stack

- **HTML5 / CSS3 / Vanilla JS** — no build-time framework; scripts are
  IIFE-wrapped to avoid global namespace pollution.
- **CDN libraries** (all pinned with Subresource Integrity hashes):
  Lenis 1.0.19, Chart.js, Lucide icons, Font Awesome 6.4.0, Leaflet 1.9.4.
- **Vite 5** — dev server, production bundling, and local preview only.

## Build Pipeline

```
npm install        # install dev dependencies (Vite, ESLint, Prettier)
npm run dev        # dev server with HMR on http://localhost:5173
npm run build      # production bundle → dist/
npm run preview    # serve the production build on http://localhost:4173
npm run lint       # ESLint over JS/HTML
npm run format     # Prettier (write)
npm run sri        # regenerate CDN SRI hashes (node generate-sri.js)
npm run og-image   # regenerate assets/og-image.png (node generate-og-image.js)
```

The site is intentionally **static and multi-page**. Vite treats each HTML
file as an entry point (`vite.config.js`), hashes local assets, and leaves
CDN `<script>`/`<link>` tags untouched. Third-party libraries are kept on
CDNs *on purpose* with `integrity` + `crossorigin` attributes — they are not
bundled or npm-installed.

## Security & Quality

- **Subresource Integrity** — every external CDN resource carries a
  `sha256-` integrity hash, verified by `generate-sri.js`.
- **Content Security Policy** — meta-tag CSP in each page's `<head>`.
- **XSS hardening** — all user-generated data in the expense tracker is
  rendered through an `escapeHTML()` helper.
- **Accessibility** — skip link, ARIA labels on nav/modals/filters,
  keyboard focus traps in modals, `aria-hidden` on decorative canvas,
  `prefers-reduced-motion` support.
- **SEO** — meta descriptions, canonical URLs, Open Graph + Twitter card
  tags with a branded `assets/og-image.png` (1200×630).

## Project Layout

```
├── index.html               # home page
├── projects/
│   ├── weather.html
│   ├── expense.html
│   ├── wild.html
│   └── wild.css / wild.js
├── assets/
│   ├── css/styles.css       # shared "Void" design system
│   ├── js/main.js           # shared home-page behavior (IIFE)
│   └── og-image.png         # Open Graph image
├── vite.config.js           # multi-page Vite build config
├── package.json             # scripts + dev dependencies
├── generate-sri.js          # SRI hash generator
├── generate-og-image.js     # OG image generator
└── backups/                 # superseded / orphaned scripts
```

## Deployment

The `main` (or `master`) branch is published via **GitHub Pages**. After
committing and pushing, GitHub Pages rebuilds from the repository root.

1. `npm run build` (optional locally to verify the bundle)
2. Commit and push — GitHub Pages serves the source pages directly
   (the site is static; no compiled `dist/` deploy is required).

## Notes

- The expense tracker persists data in `localStorage` under
  `expenses_db` / `expenses_budgets`.
- Webhook import in the expense tracker is opt-in and file-driven.
- All contact details are centralized in `assets/js/main.js`
  (`CONTACT_EMAIL` constant) to change in one place.
