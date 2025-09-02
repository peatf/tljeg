IMPLEMENTATION PROMPT

You are implementing a UX/content overhaul of the Artifact app based on the “App Critique & Implementation Feedback”. Maintain current architecture and storage semantics, but update labels, routes, and scene UIs to match the new flow. Keep changes minimal and focused, write accessible UI, and preserve existing tests unless a ticket explicitly asks to update them. Where the Explainers file has placeholder content, wire the hooks/slots and reference path for future copy.

—

DEV TICKETS

Ticket A1: Remove redundant Home screen and label
- Description: The map itself is the home. Remove the explicit Home screen and the “Home” node/label in the flow map. Redirect `/artifact` to the flow map and eliminate `/artifact/home`.
- Files: `src/App.tsx`, `src/scenes/Home.tsx`, `src/components/FlowMap.tsx`
- Tasks:
  - Remove `Home` link from header nav and route (`/artifact/home`).
  - Change `/artifact` route element to the flow map component directly (no separate Home scene).
  - In `FlowMap.tsx`, remove the `home` node from `nodes`.
  - Delete `src/scenes/Home.tsx` if no longer used (adjust imports).
- Acceptance:
  - No “Home” node/link appears anywhere.
  - Navigating to `/artifact` shows the map with VOID centered.

Ticket A2: Rename Runtime → Implementation everywhere
- Description: Rename the scene and all references (labels, routes, tests) from “Runtime” to “Implementation”.
- Files: `src/scenes/Runtime.tsx` (rename file to `Implementation.tsx`), `src/App.tsx`, `src/components/FlowMap.tsx`, `src/__tests__/runtime_ui.test.tsx`, any other tests referencing “runtime”.
- Tasks:
  - Rename component and file to `Implementation.tsx` and default export to `Implementation`.
  - Update import paths, route (`/artifact/implementation`), header link label, and map node label/route.
  - Add route compatibility alias: optional 302/redirect from `/artifact/runtime` to `/artifact/implementation` in router.
  - Update test names and selectors accordingly.
- Acceptance:
  - All UI and routes say “Implementation”; old route redirects.
  - Tests referencing runtime updated and passing locally.

Ticket A3: Text-only guide → multi-screen with back/next; remove “Page XX” labels
- Description: Convert the text-only reader into a multi-screen sequence with Next/Back. Strip or ignore lines like “Page 02”.
- Files: `src/scenes/TextOnlyReader.tsx`, `src/content/guide.md`, optional new helper `src/hooks/usePager.ts`.
- Tasks:
  - Parse the markdown into logical pages. Strategy: split on headings or “Page XX” markers; render one “page” at a time with Next/Back.
  - Remove page labels visually (do not render “Page XX”).
  - Add persisted position (e.g., `localStorage`) so returning resumes where left off.
  - Keyboard navigation (← →) and ARIA labels for pagination controls.
- Acceptance:
  - Reader shows one page/section with Next/Back and returns to last read.
  - No literal “Page XX” strings appear in the UI.

Ticket A4: Explainers and subtitles at top of every section
- Description: Each scene begins with a brief explainer plus a short subtitle under the title.
- Files: All scenes: `src/scenes/Safety.tsx`, `src/scenes/Clarity.tsx`, `src/scenes/Calibration.tsx`, `src/scenes/VOID.tsx`, `src/scenes/Implementation.tsx` (post-rename), `src/scenes/Resets.tsx`. Copy source at: `docs/Updates/Explainers`.
- Tasks:
  - Add a `Subtitle` slot under the `h1`. Add a small explainer paragraph at the top. Wire to constants or inline for now, and include a TODO referencing `docs/Updates/Explainers`.
  - Ensure subtitles use subdued styling (e.g., `text-ink-700 text-sm`).
- Acceptance:
  - Each section displays a subtitle and short intro.
  - All intros are sourced or referenced to `docs/Updates/Explainers`.

Ticket A5: Environment setters use ✔ checkmarks
- Description: Replace toggle-style pills with checkmark confirmations and success copy e.g., “✔ Door locked”.
- Files: `src/scenes/Safety.tsx`.
- Tasks:
  - Render selected environment items prefixed with a ✔ and success tone.
  - Update button styles to read as checklist chips; announce state changes with `aria-live`.
- Acceptance:
  - Selected items visually show a ✔ and success color; screen readers announce selection.

Ticket A6: Seed → rename or define as Anchor in UI
- Description: Where “seed” is surfaced to users (e.g., chip source labels), show “Anchor” or hide the source and add tooltip/glossary explaining Anchor.
- Files: `src/components/Chips.tsx`, any scene showing “(seed)” labels.
- Tasks:
  - Replace visible “(seed)” text with “(anchor)” or hide source and add an info tooltip: “Anchor = the first trait or identity shift you want to ground in.”
  - Internal storage type `source: 'seed' | 'user'` remains unchanged.
- Acceptance:
  - No literal “seed” labels in UI; “Anchor” tooltip present.

Ticket A7: Split Resets and FAQ
- Description: Resets are interactive tools. FAQ moves to separate static section.
- Files: `src/scenes/Resets.tsx`, new `src/scenes/FAQ.tsx`, `src/App.tsx` (routes/nav).
- Tasks:
  - Create `FAQ.tsx` with content migrated from Resets’ FAQ area and add route `/artifact/faq`.
  - Update header navigation to add “FAQ” link; remove FAQ content from Resets.
  - Keep Resets focused on interactive cards (see Ticket E3).
- Acceptance:
  - Resets page contains only interactive resets; FAQ exists separately.


Artifact Map (Main Flow)

Ticket B1: Remove “Home” label from map
- Description: Remove “Home” node in the flow map.
- Files: `src/components/FlowMap.tsx`.
- Tasks: Remove node with `key: 'home'`.
- Acceptance: Map shows nodes Safety, Clarity, Calibration, VOID, Implementation, Resets (no Home).

Ticket B2: Add faint flow hint and microcopy
- Description: Indicate the path Safety → Clarity → Calibration → VOID → Implementation → Resets; add microcopy intro.
- Files: `src/components/FlowMap.tsx`.
- Tasks:
  - Add a subtle flow hint: numbered captions, arrows, or ordered legend below grid. Respect reduced motion.
  - Add intro microcopy: “This is your process map. Start with Safety, flow step by step, and return to VOID anytime you want to reset.”
- Acceptance: Flow order visually apparent; microcopy present.


Safety

Ticket C1: Add subtitle and consent copy
- Description: Add subtitle: “Shifts only land if they feel safe. Begin by grounding in internal safety.” Update consent wording: “Are you ready to proceed? If not, name what’s needed.”
- Files: `src/scenes/Safety.tsx`.
- Tasks: Insert subtitle and consent label text updates per copy; keep existing storage.
- Acceptance: Updated copy and subtitle appear.

Ticket C2: Environment setters with ✔ and success text
- Description: Show selections as “✔ <label>” with success tint; items like “Door locked”.
- Files: `src/scenes/Safety.tsx`.
- Tasks: Replace pill style with checklist style; preserve toggle behavior and accessibility.
- Acceptance: Selected items visually include ✔ and success hint (e.g., “✔ Door locked”).

Ticket C3: 30-second safety scan
- Description: Label the timer explicitly as “Run 30-second safety scan (breath + body + room).”
- Files: `src/scenes/Safety.tsx`.
- Tasks: Adjust button and timer labels accordingly.
- Acceptance: Clear instructional label matches the requested copy.

Ticket C4: Feed unmet needs into Implementation as frictions
- Description: If consent is “not yet” or needs are named, carry these forward into Implementation frictions suggestions.
- Files: `src/scenes/Safety.tsx`, `src/scenes/Implementation.tsx`, `src/storage/storage.ts` (if new field), `src/ml/index.ts` (if needed).
- Tasks:
  - On save in Safety, store unmet needs value(s) in `userEntries` or contexts as friction candidates.
  - In Implementation, auto-suggest yesterday’s frictions including Safety needs (see Ticket H4).
- Acceptance: Needs entered in Safety appear as friction suggestions in Implementation.


Clarity

Ticket D1: Add entry-point prompts and reframes
- Description: Add expanded prompt sections:
  - “What inspires you?” with examples toggle.
  - “What reoccurring thought… what is it trying to get you to feel more of?”
  - “Who triggers a spark of jealousy… what does that reveal?”
- Files: `src/scenes/Clarity.tsx`.
- Tasks: Add collapsible sections with helper text beneath the textarea or as separate inputs; keep single saved payload shape but extend as needed.
- Acceptance: Three distinct entry-point helpers are available to expand/collapse.

Ticket D2: ML/NLP assist suggests traits
- Description: After typing, suggest traits like “Brave, Free, Focused.”
- Files: `src/scenes/Clarity.tsx`, `src/ml/index.ts`, `src/ml/worker.ts`.
- Tasks:
  - Ensure existing suggestions from ML worker appear as trait chips and reflect typed input. Adjust copy to show suggestions explicitly.
  - Add a starter set of trait chips: Calm • Generous • Brave • Creative • Precise (as defaults if worker returns empty).
- Acceptance: Typing in Clarity shows suggested traits and the starter set when empty.

Ticket D3: 45s rehearsal CTA
- Description: Maintain rehearsal timer and polish copy to “Rehearse being [Trait] for 45s.”
- Files: `src/scenes/Clarity.tsx`.
- Tasks: Bind selected trait to button/aria label.
- Acceptance: Timer and copy align with request.

Ticket D4: Overlap guidance (step-by-step) and autosave to Calibration
- Description: Replace single “overlap” prompt with guided steps:
  1) Recall a recent moment you already acted this way. 2) What felt natural? 3) Name one overlap.
  Save overlaps and make them available in Calibration.
- Files: `src/scenes/Clarity.tsx`, `src/scenes/Calibration.tsx`, `src/storage/storage.ts`.
- Tasks:
  - Expand Clarity UI to capture 3-step overlap input and save.
  - In Calibration, preload overlaps from Clarity and prompt expansion; saving pushes to Evidence Shelf.
- Acceptance: Overlaps entered in Clarity appear in Calibration and can be expanded into Evidence.


Calibration

Ticket E1: Subtitle and mechanics copy
- Description: Add subtitle: “Calibration grounds clarity in ordinary life. Proof keeps the shift believable.” Update placeholders per copy.
- Files: `src/scenes/Calibration.tsx`.
- Tasks: Adjust labels and placeholder: proof example “Ex: I calmly answered an email while tired.”
- Acceptance: Copy updates visible.

Ticket E2: Evidence Shelf with timestamp + trait tag
- Description: Saved proof items show timestamp and associated trait tag.
- Files: `src/scenes/Calibration.tsx`, `src/storage/storage.ts`.
- Tasks:
  - Store/display created time (already present); add trait tag if available from latest selected trait in Clarity, or allow tagging on save.
  - Render tag next to item text.
- Acceptance: Items show timestamp and a trait tag.

Ticket E3: Mundane rehearsal and friction capture
- Description: Keep 60s rehearsal; ensure friction field “What can you reduce tomorrow to help this land?” persists to frictions list.
- Files: `src/scenes/Calibration.tsx`.
- Tasks: Verify frictions get saved with `source: user` and show in list.
- Acceptance: Users can save frictions and see/update them in the list.

Ticket E4: Pull overlaps into Calibration and prompt expansion
- Description: Preload overlaps captured in Clarity into Calibration with prompts “Where else are you already being this way?” and “How does this prove…?” Save expansions to Evidence Shelf.
- Files: `src/scenes/Calibration.tsx`, `src/storage/storage.ts`.
- Tasks: Fetch and display prior overlaps; save expansions as new Evidence Shelf entries.
- Acceptance: Overlaps from Clarity are visible and expandable into Evidence.


VOID

Ticket F1: Multiple labels input and Dissolve All
- Description: Allow multiple labels (comma or newline separated). Support dragging individual labels into the VOID and a “Dissolve All” button.
- Files: `src/scenes/VOID.tsx`.
- Tasks:
  - Transform text input into label chips; implement per-chip dissolve and a bulk “Dissolve All”.
  - Maintain current neutral reframe as fallback per chip; do not regress accessibility.
- Acceptance: Users can input multiple labels and dissolve each or all.

Ticket F2: Two-stage neutralization
- Description: First dissolve → softened label (e.g., Failure → Learning curve). Second dissolve → near-neutral description (Learning curve → Task undone).
- Files: `src/scenes/VOID.tsx`, `src/ml/index.ts`/`worker.ts` (if using helper).
- Tasks: Implement a simple mapping pipeline (heuristic) to produce stage-1 and stage-2 outputs; show transitions in UI.
- Acceptance: Each label can be dissolved twice with progressively neutral output.

Ticket F3: Dissolve animation and 2:00 hold
- Description: Add subtle fade/blur/scatter animation during dissolve; 2:00 neutrality timer persists. Respect reduced motion.
- Files: `src/scenes/VOID.tsx`.
- Tasks: Add motion effects under reduced-motion guard; timer remains and copy matches “Hold 2:00 of neutrality.”
- Acceptance: Motion appears for users without reduced motion, timer and copy match spec.

Ticket F4: Post-hold reflection prompt text
- Description: After hold: “How does this openness and emptiness feel?”
- Files: `src/scenes/VOID.tsx`.
- Tasks: Update label to the requested copy.
- Acceptance: Reflection prompt matches requested copy.


Implementation (formerly Runtime)

Ticket H1: Subtitle and explainer copy
- Description: Add subtitle: “The actions you take are reflection of who you are.” Add explainer block per spec.
- Files: `src/scenes/Implementation.tsx`.
- Tasks: Insert explainer text near top and add subtitle.
- Acceptance: Subtitle and explainer visible per copy.

Ticket H2: Field labels and prompts
- Description: Update fields to:
  - Title → “Title your next 24 hours.”
  - Principle → “What is one principle feels newly alive in you today?”
  - Micro-acts → “Two tiny acts that feel like a direct expression of who you’ve become.”
- Files: `src/scenes/Implementation.tsx`.
- Tasks: Update labels; preserve storage schema unless trivial to migrate.
- Acceptance: Field text matches requested copy.

Ticket H3: Specs list with progress dots and Repeat
- Description: Specs show progress dots and a “Repeat” action to copy a prior spec into a new one.
- Files: `src/scenes/Implementation.tsx`, `src/storage/storage.ts`.
- Tasks: Add a repeat button to clone micro-acts/principle into a fresh spec; show daily completion indicators (dots) derived from release notes.
- Acceptance: Users can repeat a prior spec and see completion dots per micro-act.

Ticket H4: Friction auto-suggest from yesterday and Safety
- Description: Auto-suggest yesterday’s friction and unmet needs captured in Safety and Calibration.
- Files: `src/scenes/Implementation.tsx`, `src/storage/storage.ts`.
- Tasks: Query most recent friction/context entries and surface as chips for friction input.
- Acceptance: Friction input shows yesterday’s frictions and Safety needs.

Ticket H4a: Add clearer friction explanation helper
- Description: Add helper text or tooltip next to the Friction input explaining what “friction” means and how it’s used (“Name one thing you can reduce tomorrow to help this land”).
- Files: `src/scenes/Implementation.tsx`.
- Tasks: Add inline helper copy and accessible tooltip/`aria-describedby` for the Friction field.
- Acceptance: Users see a concise explanation near the Friction field; assistive tech reads it.

Ticket H5: Inspiration capture: save to calendar or note, reminder stub
- Description: Allow quick-save of a note or “save to calendar” (ICS download) if inspiration arises later. Provide an “I’ll add this later” control that creates a reminder (local notification or stored todo).
- Files: `src/scenes/Implementation.tsx`, new helper `src/storage/export.ts` (ICS helper) or inline.
- Tasks: Add buttons to save a note (existing release notes table) and to download ICS event; add reminder stub saved locally.
- Acceptance: Users can add a later note, download an ICS entry, or store a reminder.


Resets (separate from FAQ)

Ticket R1: Subtitle and copy
- Description: Add subtitle “When things feel off, Resets bring you back gently.”
- Files: `src/scenes/Resets.tsx`.
- Tasks: Insert subtitle under title.
- Acceptance: Subtitle visible.

Ticket R2: Interactive reset cards & deep links
- Description: Provide three interactive cards:
  - Halve the distance → opens Clarity with gentler trait suggestions
  - Rest & VOID → shortcut to VOID timer
  - Stay with overlap → opens Calibration with “Proof” field focused
- Files: `src/scenes/Resets.tsx`, `src/scenes/Clarity.tsx`, `src/scenes/Calibration.tsx`, `src/scenes/VOID.tsx`.
- Tasks:
  - Add cards with buttons that navigate and pre-configure target scenes (e.g., focus input, preload suggestions).
  - Remove FAQ content from Resets (moved in A7).
- Acceptance: Tapping a card navigates and focuses appropriate input in target scene.


Storage

Ticket S1: Subtitle and filters by Trait/Date
- Description: Add subtitle “Storage mirrors your progress. It holds saved Evidence and Specs.” Implement filters by trait or date.
- Files: `src/scenes/Storage.tsx`, `src/storage/db.ts` (if new index helpers), `src/storage/storage.ts`.
- Tasks:
  - Add trait/date filters for viewing stored Evidence (contexts) and specs.
  - Keep export/import and counts; add filter UI above lists.
- Acceptance: Users can filter by trait tag and date; lists update live.


Cross-section flows

Ticket X1: Wire Safety → Implementation (frictions)
- Description: Unmet needs from Safety appear as friction suggestions in Implementation.
- Files: `src/scenes/Safety.tsx`, `src/scenes/Implementation.tsx`, `src/storage/storage.ts`.
- Acceptance: Covered by C4/H4.

Ticket X2: Wire Clarity → Calibration (overlaps)
- Description: Overlaps captured in Clarity preload in Calibration for grounding.
- Files: `src/scenes/Clarity.tsx`, `src/scenes/Calibration.tsx`, `src/storage/storage.ts`.
- Acceptance: Covered by D4/E4.

Ticket X3: Wire VOID → Implementation (inspiration)
- Description: After VOID, allow capturing an inspiration line that flows into Implementation as a suggested action/micro-act.
- Files: `src/scenes/VOID.tsx`, `src/scenes/Implementation.tsx`, `src/storage/storage.ts`.
- Tasks: Add optional “inspiration” save in VOID; surface as micro-act suggestion in Implementation for the same day.
- Acceptance: Inspiration saved in VOID appears as a suggestion in Implementation.

Ticket X4: Resets → deep links
- Description: Resets deep-link into relevant scenes with focused state.
- Files: `src/scenes/Resets.tsx`, target scenes.
- Acceptance: Covered by R2.


Routing and Header Navigation updates

Ticket N1: Update Header nav for Implementation and FAQ
- Description: Replace Runtime with Implementation; add FAQ; remove Home.
- Files: `src/App.tsx`.
- Tasks: Update links to `/artifact/implementation`, add `/artifact/faq`, remove `/artifact/home`.
- Acceptance: Header reflects Implementation and FAQ; no Home link.

Ticket N2: Update FlowMap nodes and labels
- Description: Remove Home, rename Runtime to Implementation.
- Files: `src/components/FlowMap.tsx`.
- Tasks: Adjust `nodes` array and labels; add flow legend per B2.
- Acceptance: Map shows correct nodes and labels.


Tests and QA

Ticket T1: Update tests for renamed routes and labels
- Description: Update any tests that expect “Runtime” or “Home”.
- Files: `src/__tests__/runtime_ui.test.tsx`, `src/__tests__/routing.test.tsx`, others referencing those labels/paths.
- Tasks: Rename selectors, labels, and routes. Add tests for FAQ route and Implementation alias redirect.
- Acceptance: Test suite passes locally.

Ticket T2: Add tests for VOID multi-label dissolve
- Description: Add coverage for multiple label chips, Dissolve All, two-stage neutralization.
- Files: `src/__tests__/scenes.test.tsx` or new test file.
- Acceptance: Tests verify per-chip and bulk dissolve behaviors.

Ticket T3: Add tests for cross-section flows
- Description: Verify Safety → Implementation frictions, Clarity → Calibration overlaps, VOID → Implementation inspiration.
- Files: `src/__tests__/scenes.test.tsx` or new tests.
- Acceptance: Cross-section data appears as suggestions in target scenes.


Copy Sources

- Explainers drafts live at: `docs/Updates/Explainers` (currently placeholder; wire for future content).
- Use subtitles exactly as provided in the critique document.


Non-goals / Notes

- Keep internal ML storage field names (`seed` vs `user`) as-is; only alter user-visible labeling.
- Do not introduce backend; all features remain client-side and local-first.
- Preserve accessibility and reduced-motion preferences.
