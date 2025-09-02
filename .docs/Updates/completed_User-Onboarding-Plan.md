# User Onboarding Plan

Goal: Welcome new users, explain terms, and show progress so the journey feels clear and gentle.

## Objectives
- Provide a brief, skippable first‑run tutorial.
- Explain core terms (micro‑act, overlap, friction) with examples.
- Surface progress and “where you left off”.

## Flows
- First‑Run Tutorial (3–4 cards)
  1) Overview of the 5 scenes; estimated time per scene.
  2) What you’ll do: reflect, rehearse, release, implement.
  3) Terms with examples (tap to expand):
     - Micro‑act: a tiny behavior that expresses your principle (e.g., “Pause before replying”).
     - Overlap: a recent moment you already embodied the trait.
     - Friction: a removable obstacle (e.g., “Phone in another room while cooking”).
  4) Controls: Save, Continue, progress tracker, storage/backup.

- Returning Users
  - “Resume where you left off” card on landing; highlight current scene.
  - Recent plan(s) and quick actions (rehearse 60s, edit, continue).

## UI Elements
- `IntroModal` (skippable; do not show again unless reset in Settings).
- `TermBadge` + `DefinitionPopover` inline in forms.
- `ProgressSummary` on landing with stepper and last‑saved timestamp.

## Content & Tone
- Gentle, non‑judgmental language; short sentences.
- Reinforce autonomy: “You can move at your own pace.”
- Provide concrete examples; avoid jargon without definitions.

## Acceptance Criteria
- First run: tutorial appears once; persists dismissal state.
- Terms available as tooltips in relevant scenes.
- Landing shows “Resume” CTA if any in‑progress scene/plan exists.

## Implementation Notes
- Store `hasSeenOnboarding` flag and timestamp in app storage.
- Content as markdown or JSON to enable iteration without code changes.
- Analytics (privacy‑respecting) to track tutorial completion rate.

