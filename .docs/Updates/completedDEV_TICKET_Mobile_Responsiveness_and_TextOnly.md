# DEV TICKET: Mobile responsiveness & Text-only formatting improvements

Priority: High
Estimate: 3-5 points

Summary

This ticket addresses two related UX issues discovered during manual testing on small viewports:

1) Mobile responsiveness: the app layout and several scenes do not adapt cleanly to small screens (phones). UI elements overflow, touch targets are small, and the flow feels cramped. Improve responsive breakpoints, spacing, and touch affordances across the app.

2) Text-only reader formatting: the text-only reader currently renders long markdown content as a single scroll or with raw "Page XX" markers. Improve the reader so entries are better-structured (titles, subtitles, sections), visually clear, and readable on mobile.

Goals / Acceptance criteria

- Mobile responsiveness
  - All primary scenes (Safety, Clarity, Calibration, VOID, Implementation, Resets, Storage, TextOnlyReader) render without horizontal overflow at common phone widths (320px, 375px, 414px).
  - Header/nav collapses or adapts on narrow viewports so the main content is visible and reachable.
  - Touch targets (buttons, chips) meet a minimum 44x44px guideline on mobile where feasible.
  - Forms and inputs stack vertically with adequate spacing; dialogs and modals are full-width or centered with comfortable padding.
  - No visual overlap or clipped elements on iPhone SE / small Android viewport sizes.

- Text-only reader formatting
  - The TextOnlyReader presents content split into logical pages/sections (see Ticket A3 for pager behavior). Headings in `content/guide.md` should be used to define pages where possible.
  - Titles and section headers are visually distinct (H1/H2 styling scaled for mobile). Body text uses readable line-length and font-size on phones.
  - Remove literal "Page XX" markers from the rendered UI. If the source contains them, ignore or strip when rendering.
  - Provide explicit Title and Subtitle rendering at the top of each page when available in the markdown.
  - Provide Next/Back footer controls that are sticky or fixed above the on-screen keyboard on mobile.

Tasks (suggested breakdown)

1. Audit and small-viewport checklist
  - Manually test the app (or run responsive viewport emulator) at 320/375/414 widths and note breakage points for each scene.
  - Create a short list of targeted fixes per scene (e.g., FlowMap overflow, header wrapping in App.tsx, chips row overflow in Clarity).

2. Layout & CSS fixes
  - Add or refine responsive utilities in `src/styles/index.css` (or Tailwind config) to ensure common components (header, main container, flow grid, chips, modals) adapt at `sm`/`md` breakpoints.
  - Ensure container max-widths are constrained and padding increases on small screens: e.g., `.app-container { padding: 1rem; }` on small viewports.
  - Convert certain horizontal stacks into vertical stacks at small widths (e.g., chip rows → wrap with gap-y).
  - Increase touch target sizes for primary actions (buttons, chips). Where space is constrained, add `min-height` and `padding` to maintain tappability.

3. Header & navigation
  - Make header/hamburger responsive: collapse secondary links into a single menu or use a compact header on mobile.
  - Ensure active route title remains visible and centered when nav collapses.

4. TextOnlyReader improvements
  - Update `src/scenes/TextOnlyReader.tsx` and/or `src/hooks/usePager.ts` to prefer splitting content on top-level headings (`#`, `##`) and fallback to `Page XX` markers if headings are absent.
  - Strip/ignore raw `Page XX` lines when rendering content.
  - Render an optional page title (derived from the first H1/H2 in the section) and optional subtitle block (first paragraph under heading) at the top of the screen.
  - Ensure the Next/Back buttons are reachable on phones (sticky footer above keyboard). Add keyboard navigation (←/→) and persisted position (localStorage) per Ticket A3.

5. Small polish & accessibility
  - Respect `prefers-reduced-motion` for any layout/accordion transitions.
  - Ensure sufficient color contrast for scaled fonts on mobile.
  - Add `aria-live` region for pager position changes if helpful.

Files likely to change

- `src/scenes/TextOnlyReader.tsx` (pager splitting, title/subtitle rendering)
- `src/hooks/usePager.ts` (if used for pager state)
- `src/App.tsx` (responsive header/nav changes)
- `src/styles/index.css` and/or `tailwind.config.cjs` (responsive utilities or breakpoints)
- `src/components/FlowMap.tsx` (grid sizing for mobile)
- `src/components/Chips.tsx` (wrap/stack behavior)
- Scene files where overflow was observed (Clarity, VOID, Calibration) — small responsive tweaks

Implementation notes / heuristics

- Pager split heuristic: parse markdown sections using a lightweight rule: split on H1/H2 headings and treat the heading + following content until the next heading as one page. Fallback: remove any line matching `/^\s*Page\s*\d+/i` and then split by paragraph count (every N paragraphs) if no headings.
- Use Tailwind responsive classes (`sm:`, `md:`, `lg:`) where possible. If custom breakpoints are needed, add them to `tailwind.config.cjs` carefully.
- Prioritize layout fixes that don't change storage or public APIs.

QA / Acceptance testing

- Manual verification on iPhone SE (320px) and iPhone 14 (390/430) sizes via browser devtools.
- Run existing unit/UI tests; update any snapshot tests if layout changes cause known diffs. Add a small test for pager title rendering in `__tests__/storage_screen.test.ts` or a new `__tests__/textonlyreader.test.tsx` covering the new split behavior.

Notes / open questions / assumptions

- Assumption: this is a client-side only change; no backend changes required.
- If the app relies on fixed canvas/grid widths that can't be trivially responsive (e.g., complex SVG map), we should add a mobile-specific simplified layout (stacked vertical map legend) rather than attempting to scale the desktop map.
- If you prefer, I can implement the TextOnlyReader pager split and a minimal responsive header patch as a small PR to validate the approach before doing a full sweep.

---

Created by: automated ticket generator
Date: 2025-08-19
