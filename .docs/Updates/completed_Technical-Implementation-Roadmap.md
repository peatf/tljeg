# Technical Implementation Roadmap

Stack: React + TypeScript + Vite PWA + Tailwind CSS
Scope: Immediate UX wins first; accessibility; mobile polish; onboarding; future sensory features later.

## Estimation Scale
- S: ≤0.5–1 day
- M: 1–2 days
- L: 3–5 days

## Phases & Tasks (Priority Order)

Phase 1 — Immediate UX Wins (P0)
- Add save confirmation + Continue CTA per scene (S)
- Convert timers to primary `TimerButton` components (S)
- Enforce touch target sizes for radios/chips/timers (S)
- Stabilize forms: controlled inputs + `useAutosaveForm` hook (M)
- Add `StepTracker` with persisted completion (M)
- Mobile sticky bottom action bar: `Save`/`Continue` (M)

Phase 2 — Accessibility Core (P0→P1)
- Contrast tokens and audit; update Tailwind theme (S)
- Reduced motion support; disable animations and auto‑scroll (S)
- Text scaling control + OS scaling compatibility (M)
- `SrLiveRegion` announcements for save/timer (S)
- Keyboard support: focus order, skip link, visible outlines (M)

Phase 3 — Mobile Polish (P1)
- Collapsible sections; “Expand all/Collapse all” (S)
- Scroll management on expand; jump to next required (S)
- Keyboard‑aware layout; safe‑area padding; sticky bar resilience (M)
- Prefetch next scene bundles after save (S)

Phase 4 — Onboarding (P1)
- First‑run tutorial (cards + storage flag) (M)
- Inline definitions/tooltips for key terms (S)
- Landing progress summary + Resume CTA (S)

Phase 5 — Polish & Settings (P2)
- Auto‑advance toggle after save; animation intensity (S)
- Toast system with undo (S)

## Dependencies & Sequencing
- Build shared UI primitives (`Button`, `StepTracker`, `SaveBanner`, `TimerButton`) before scene integration.
- Implement storage utilities and `useAutosaveForm` before onboarding “Resume”.
- Contrast tokens should land before polishing component states.

## Implementation Details
- Routing: central step order constants `{ Safety, Clarity, Calibration, VOID, Implementation }`.
- Store: lightweight Zustand or React Context for `progress`, `settings`, `announcements`.
- Storage: JSON schema per scene; debounce 400ms; migrations via version key.
- Tailwind: theme tokens, motion variants, high‑contrast variant.
- Accessibility: ARIA roles for stepper, dialogs; `aria-live` regions; keyboard handlers.

## Testing Strategy
- Unit: hooks (`useAutosaveForm`, `useStepProgress`).
- Component: `StepTracker`, `SaveBanner`, `TimerButton` (interaction + a11y tests).
- E2E (Cypress/Playwright): happy path through all scenes; mobile viewport.

## Rollout Plan
- Behind feature flags where reasonable (settings + stepper).
- Release in small increments per scene to reduce risk.
- Add “What changed” notes in FAQ/Updates.

## Out of Scope (tracked separately)
- Audio guidance, ambient soundtracks, haptics, breathing metronome (see Future Enhancement Plan).

