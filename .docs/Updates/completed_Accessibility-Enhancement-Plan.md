# Accessibility Enhancement Plan

Scope: Visual contrast, text sizing, reduced motion, semantics, tooltips. Ensure calm, welcoming experience without excluding users.

## Objectives
- Meet WCAG 2.2 AA for contrast and interaction.
- Support larger text and reduced motion preferences.
- Provide clear term explanations via tooltips/popovers.
- Ensure screen reader and keyboard usability across flows.

## Priorities
- P0
  - Contrast pass and tokens: ensure 4.5:1 for text, 3:1 for UI components.
  - Text scale controls: S/M/L sizes plus OS font scaling support.
  - Reduced motion mode: disable/soften animations, breathing grid intensity.
  - Live regions: announce save success and timer state.
- P1
  - Keyboard support: focus order, visible focus, skip links.
  - Tooltips/definitions for “micro‑act”, “overlap”, “friction”.
  - Accessible timers: stage and remaining time announced periodically (opt‑out).
- P2
  - High‑contrast theme toggle; ensure brand‑consistent palette.
  - Export accessibility settings with storage backup.

## Changes by Area
- Color & Contrast
  - Introduce CSS variables and Tailwind color tokens (`--bg`, `--fg`, `--muted`, `--accent`).
  - High‑contrast variant via `data-theme="hc"` and Tailwind variant plugin.
  - Audit interactive states: hover, active, disabled, focus.

- Text Sizing
  - Global scale variable `--text-scale` with utilities `.text-scale-100/112/125`.
  - Respect OS settings: use `clamp()` with `prefers-reduced-motion` and `@media (min-resolution: 2dppx)` unaffected.
  - Ensure layout resilience (no truncation/overflow on L size).

- Motion & Effects
  - Respect `prefers-reduced-motion`: replace animated pixel grid with static variant; remove auto-scroll.
  - Use `motion-safe:animate-…` and `motion-reduce:transition-none`.

- Semantics & Navigation
  - Landmarks: `header`, `nav`, `main`, `footer` with skip link to `#main`.
  - Keyboard: tab order logical; `Enter`/`Space` trigger buttons and chips.
  - Focus: thick, high-contrast outline; maintain focus on route change.

- Tooltips/Definitions
  - Use `DefinitionPopover` component: focusable trigger `?`, ARIA `dialog` with `aria-describedby`.
  - Provide single-sentence definition + example for each term.

- Timers
  - Provide textual stage labels (“Inhale 2s”, “Hold 2s”, “Exhale 4s”).
  - `aria-live="polite"` announcements on stage change; optional “mute announcements”.
  - Visible pause/cancel buttons with clear labels.

## Implementation Notes
- Tailwind: add color tokens and variants in `tailwind.config.ts`.
- Settings store for `reducedMotion`, `textScale`, `highContrast` persisted to storage.
- Announcements: `SrLiveRegion` component and `useAnnounce()` hook.
- Tooltip/Popover: trap focus; close on `Esc` and focus return to trigger.

## QA Checklist
- Contrast ratios pass automated audit (Lighthouse/axe) and spot checks.
- Entire flow keyboard operable with visible focus.
- Definitions readable on mobile; tooltips not hover‑only.
- Motion reduced properly when enabled; timers usable without animation.

## Non‑Goals
- Audio descriptions or haptic cues (future phase).

