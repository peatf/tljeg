# TLJEG (Timeline Jumping Embodiment Guide)

Offline-first PWA that guides the Timeline Jumping Embodiment practice. Supports install on iOS/Android/Desktop and an optional native offline package (Tauri).

## Quick start

```bash
# install deps
npm ci

# dev server
npm run dev

# run tests
npm test
```

## Build & preview

```bash
npm run build
npm run preview
```

Outputs to `dist/` with minified JS and no public sourcemaps.

## Install (PWA)
- On desktop Chrome/Edge: use the install icon in the address bar.
- On Android Chrome: tap the in-app Install banner when shown.
- On iOS Safari: Share → Add to Home Screen.

The app works offline after first load; updates auto-apply via the service worker.

## Packaging options
- Hosted PWA (recommended): deploy `dist/` to Netlify/Cloudflare Pages; link from Squarespace.
- Native offline app (optional): see docs/Updates/DEV_TICKET_Minification_and_Code_Protection.md “Ticket Extension: Offline App (Tauri)”.

## Repo scripts
- `npm run dev` – Vite dev server
- `npm run build` – Type-check + build (with size check script)
- `npm run preview` – Preview build
- `npm test` – Unit tests (Vitest)
- `npm run lint` – ESLint for src
- `npm run format` – Prettier write

## Notes
- ML model (~22MB) is lazy-loaded; consider a “Lite” build without ML for small downloads.
- Public sourcemaps are disabled by default.

