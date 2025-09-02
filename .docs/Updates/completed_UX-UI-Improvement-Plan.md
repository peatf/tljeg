# UX/UI Improvement Plan (PWA: Timeline Jumping Artifact)

Audience: Product, Design, Frontend (React/TS/Vite/Tailwind)
Context: 7/10 user rating; immediate usability wins prioritized. Maintain gentle, self‑paced tone.

## Objectives
- Reduce friction moving through scenes (Safety → Clarity → Calibration → VOID → Implementation).
- Provide clear feedback on save actions and progress.
- Make interactive targets larger and more discoverable.
- Prevent unexpected resets and preserve user state.
- Reduce excessive scrolling via progressive disclosure.

## Priorities
- P0 (this iteration, fast wins)
  - Add explicit “Saved” confirmation + primary Continue CTA after save.
  - Convert all timers to clear buttons (e.g., “Start 30‑second scan”).
  - Enforce minimum touch targets (≥44×44px) for radios, chips, timers.
  - Stabilize inputs to prevent resets; enable autosave on change.
  - Add scene stepper/progress tracker with completion checks.
  - Optional sticky bottom action bar on mobile: `Save` | `Continue`.
- P1 (next iteration)
  - Collapse long sections with accordions; “Expand all/Collapse all”.
  - Toast/snackbar system with undo where applicable.
  - Scene completion gating (show remaining items before continue).
- P2 (later, polish)
  - Settings: toggle auto‑advance after save; animation intensity.
  - Micro‑copy refinements to reinforce calm, self‑paced guidance.

## Targeted Issues & Changes
1) Save doesn’t advance automatically
- Approach: After successful save, render inline success banner with primary button: “Continue to Clarity/Calibration/…”. Do not auto‑navigate by default to preserve self‑pacing. Setting to enable auto‑advance after 2–3s for power users.
- Acceptance criteria
  - After save, user sees: check icon, “Saved”, next‑scene CTA.
  - Keyboard focus moves to the success banner for screen readers.
  - Navigation consistent across all five scenes.

2) Small interactive targets (radios, chips, timers)
- Tailwind: apply `min-h-11 min-w-11` or `p-3` with invisible hit‑area using `after:` pseudo element where needed.
- Replace inline text links for timers with `Button` component (primary/secondary variants) and clear labels.
- Acceptance criteria: All actionable controls meet ≥44×44px; accessible names exist; focus ring visible.

3) Lack of progress tracking/confirmation
- Add `StepTracker` at top: Safety, Clarity, Calibration, VOID, Implementation with current state (active, complete, pending).
- Inline saved states: show checkmarks on section headers when section saved.
- Acceptance criteria: Stepper persists across routes; completion restored from storage on reload.

4) Fields reset unexpectedly
- Audit controlled vs uncontrolled inputs; remove unstable React `key` usage that causes remounts.
- Add `useAutosaveForm(sceneId)` hook to persist to localStorage (or app store) on change with 400ms debounce.
- Acceptance criteria: No loss of entered data on navigation within the PWA; refresh restores latest draft.

5) Long scrolling pages
- Progressive disclosure: questions collapsed until tapped (“Show question”).
- “Jump to next required” link; sticky local TOC for desktop.
- After save/continue, scroll to next section smoothly (respect reduced motion).
- Acceptance criteria: The primary path requires fewer than 3 scroll lengths per scene on mobile.

## Components & Patterns
- `Button` (variants: primary, secondary, ghost; sizes: md, lg; loading state).
- `StepTracker` (props: steps[], currentIndex, completedSet).
- `SaveBanner` (props: message, onContinue, autoAdvance? boolean).
- `TimerButton` (props: duration, label, onStart, onCancel).
- `FormField` wrappers with label, description, error; avoid direct inputs.

## UX Copy (examples)
- Save confirmation: “Saved. Ready for the next step?”
- Next CTAs: “Continue to Clarity”, “Continue to Calibration”, “Continue to VOID”, “Continue to Implementation”.
- Timer labels: “Start 30‑second scan”, “Begin 45‑second rehearsal”, “Begin 90‑second hold”.

## Non‑Goals (tracked elsewhere)
- Audio or haptic guidance (see Future Enhancement Plan).

## Implementation Notes (React/TS/Vite/Tailwind)
- Centralize routes in `routes.ts` with step order constants.
- Introduce UI state store (e.g., Zustand/Context) for progress and settings.
- Tailwind utilities: `focus-visible:outline` styles, `touch-target` class, `motion-safe`/`motion-reduce` variants.
- Use semantic HTML: `button` for actions, `fieldset/legend` for radio groups.

## QA Checklist
- Save → banner appears → Continue navigates → progress updates.
- Controls meet size and focus criteria; keyboard reachable.
- No input loss when switching scenes or refreshing.
- Reduced motion honored: no auto‑scroll/animations when enabled.

## Metrics of Success
- Task completion time decreases (proxy: steps per session).
- Drop‑offs between scenes decrease ≥20%.
- Fewer “data lost”/“can’t find next step” reports in feedback.

