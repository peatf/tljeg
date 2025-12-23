Title: Prepare PWA for Install UX and Deployment (Mobile + Desktop)

Summary
- Add an in-app, removable “Install/Add to Home Screen” prompt on mobile with a clear text blurb and CTA.
- Ensure the PWA installs and opens as a standalone app on iOS/Android and on desktop (Mac/PC) browsers.
- Verify manifest, icons, and service worker caching for a smooth offline-capable install experience.
- Document build/deploy steps and platform-specific install guidance.

Goals
- Mobile users see a dismissible prompt suggesting installation (A2HS), with a working install flow.
- Desktop users can install the app and launch it as a standalone window.
- PWA metadata and icons meet platform requirements (Chrome, Edge, Safari/iOS).
- App runs offline for core flows; updates are applied via auto-update SW.

Scope
- Frontend changes in React/Vite codebase.
- Manifest/icon updates under `vite-plugin-pwa` and `public`.
- Minimal styling matching existing Tailwind design.
- Docs updates under `docs` for deployment and install instructions.

Non-Goals
- No server-side changes; static hosting assumed.
- No redesign of navigation or flows unrelated to install prompt.

Implementation Plan
1) Verify/adjust PWA baseline (already present)
   - Keep `vite-plugin-pwa` config in `vite.config.ts` with `registerType: 'autoUpdate'`, `display: 'standalone'`, `start_url: '/'`.
   - Confirm SW registration in `src/main.tsx` to `'/sw.js'` (already present).
   - Ensure offline caching covers HTML/CSS/JS/icons and large model files via `workbox.runtimeCaching` (already present).

2) Add Install Prompt UX (mobile + desktop)
   - Create `src/hooks/useInstallPrompt.ts`:
     - Listen for `beforeinstallprompt` to capture `deferredPrompt` and prevent default.
     - Expose state: `canInstall`, `promptInstall()`, `dismissed`, `isStandalone` (from `window.matchMedia('(display-mode: standalone)')` and iOS detection), and `installed` (from `appinstalled` event).
     - Persist dismissal in `localStorage` (e.g., key `tja_install_prompt_dismissed_v1`).
   - Create `src/components/InstallPrompt.tsx`:
     - Dismissible banner/card with short blurb: “Add this app to your Home Screen for quick access.”
     - Button: “Install App” that calls `promptInstall()` when available.
     - iOS fallback: if `beforeinstallprompt` is unavailable and on iOS Safari, show a small hint to use Share → Add to Home Screen.
   - Render the component near the top of the app (e.g., in `App.tsx` below `<Header />`) and only show when:
     - Not already installed/standalone;
     - Not previously dismissed;
     - Either `beforeinstallprompt` is available or the platform is iOS Safari.
   - Desktop affordance: optionally add a small “Install” button in the header when `canInstall` is true on desktop (Chrome/Edge).

3) Manifest and icons
   - Provide real, properly sized icons in `public/icons` (maskable and any): 192x192, 512x512 PNG, plus `icon.svg` (already referenced).
   - Add `apple-touch-icon` (180x180) in `public/assets` or `public/icons` and reference in `index.html` head.
   - Ensure `theme-color` meta is present to match the manifest `theme_color`.
   - Optional: add `display_override: ['window-controls-overlay', 'standalone']` and `shortcuts` to manifest to enrich desktop UX.

4) iOS support specifics
   - Add `meta name="apple-mobile-web-app-capable" content="yes"` and `meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"` to `index.html`.
   - Provide an `apple-touch-startup-image` only if needed (optional, can be a follow-up).

5) QA and installation testing
   - Desktop: Chrome and Edge on Mac/Windows can install via omnibox; verify app opens in its own window and taskbar/dock entry appears.
   - Android: Chrome should show native A2HS prompt after engagement or via in-app CTA; confirm `appinstalled` fires.
   - iOS: Safari should show manual A2HS instructions; after adding, app launches full-screen with no browser chrome.
   - Verify offline behavior for core screens and that updates are fetched on next load (auto-update SW).

6) Deployment
   - Build with `npm run build`; serve with `npm run preview` for local validation.
   - Host the `dist/` folder on HTTPS (Netlify, Vercel, Cloudflare Pages, GitHub Pages with HTTPS) at site root `/` to match `start_url`.
   - If deploying under a subpath, update `base` in `vite.config.ts` and `manifest.scope/start_url` accordingly.

Acceptance Criteria
- A dismissible install banner appears on supported mobile browsers with text: “Add this app to your Home Screen for quick access.”
- Tapping “Install App” triggers the install prompt when available; on iOS, shows clear Share → Add to Home Screen guidance.
- Banner stays hidden after dismissal or after install, across sessions.
- Desktop shows an install option when available; installed app opens as a standalone window on Mac/PC.
- Manifest and icons validate in Lighthouse PWA audit; scores reflect installability and offline capability.
- App works offline for previously visited routes; updates apply on subsequent loads.

Tech Notes
- Files to add:
  - `src/hooks/useInstallPrompt.ts`
  - `src/components/InstallPrompt.tsx`
- Files to update:
  - `src/App.tsx` (render prompt component)
  - `index.html` (iOS meta + apple-touch-icon link + theme-color)
  - `public/icons/*` (supply real 192/512 maskable PNGs)
  - Optionally extend `vite.config.ts` manifest with `display_override`, `shortcuts`.
- iOS detection: check `navigator.userAgent` for iPhone/iPad and `!window.MSStream`; detect standalone via `window.navigator.standalone` or `matchMedia('(display-mode: standalone)')`.

Out of Scope / Risks
- iOS does not expose `beforeinstallprompt`; user education banner is required rather than a native-like prompt.
- Ensure icons are real assets; current `icon-192.png`/`icon-512.png` placeholders appear unusually small and should be replaced.

Rollout Plan
- Implement feature-flag behind localStorage gate for quick disable if needed.
- Merge, build, and deploy to a staging URL; validate install and offline across devices.
- Promote to production after QA sign-off.

How to Test (quick steps)
- `npm run build && npm run preview`
- Visit the preview URL on desktop Chrome → use the install icon in the omnibox, or the in-app Install button.
- On Android Chrome, open the site, interact, then tap the in-app banner → confirm install.
- On iOS Safari, verify the banner shows manual A2HS steps and that the installed app opens standalone.

Effort Estimate
- 1–2 days engineering + 0.5 day QA across devices.

