# Mobile Experience Optimization

Goal: Improve mobile usability for self‑paced, offline PWA usage.

## Priorities
- P0
  - Enlarge touch targets (≥44×44px) for radios, chips, timers, CTA.
  - Sticky bottom action bar with `Save` and `Continue` when relevant.
  - Manage scroll: auto‑scroll to expanded input; return to top on scene change (respect reduced motion).
  - Safe‑area support (iOS notch/home indicator) with `env(safe-area-inset-*)` padding.
- P1
  - Keyboard‑aware layout: prevent important CTAs from being covered; add spacer when virtual keyboard opens.
  - Prefetch next scene route/assets after save for snappy transitions.
  - Break long scenes into sub‑sections with quick jump links.
- P2
  - Bottom sheet patterns for pickers (e.g., anchor selection), with swipe‑to‑close and accessibility.
  - Lazy‑load heavy visuals; reduce main bundle for first run.

## Changes
- Controls & Spacing
  - `button.lg` size default on mobile; increase chip padding; radio groups vertical by default.
  - Minimum tap spacing between controls (8–12px) to avoid accidental taps.

- Layout
  - `MobileActions` component: sticky bar with safe‑area padding, houses `Save/Continue` and progress.
  - `Section` components with `onSave` and `onContinue` slots; collapse completed sections.

- Scrolling
  - `scrollIntoView({ block: 'start' })` when expanding a question; gated by `!reducedMotion`.
  - “Jump to Next Required” button to move user through minimal path.

- Performance
  - Route prefetch after save; code split per scene.
  - Cache static assets via Vite PWA plugin; verify offline availability on mobile.

## QA Checklist
- Tap accuracy on small devices (iPhone SE, Pixel 4a).
- Sticky bar not obscured by keyboard; safe‑area respected.
- No layout shifts when toggling reduced motion or text size.
- Smooth inter‑scene navigation without noticeable jank.

