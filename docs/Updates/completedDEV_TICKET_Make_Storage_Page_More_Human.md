Title: Make Storage Page Human-first (Death Ticket)

Summary

The `Storage` page currently reads like developer documentation — heavy on technical terms and workflows — and is not approachable for non-developer users. This ticket outlines the problem, goals, acceptance criteria, suggested copy and UX changes, accessibility considerations, test cases, and an implementation task list to make the page intuitive, human-centered, and friendly.

Problem

- UI copy and layout on `Storage` (the screen users visit to save, export, and manage their artifacts) uses jargon ("embeddings", "DB", "indexing", "seed corpus"), developer-focused controls, and terse labels that confuse or intimidate general users.
- Actions lack clear, outcome-focused language and contextual help. Users may not know what will happen when they click a button (e.g., "Export", "Sync", "Rebuild embeddings").
- Visual hierarchy and affordances favor technical state over user intent (showing raw IDs, file paths, or logs prominently).

Goals

- Make the `Storage` page clearly explain what actions do in plain English and with user-focused outcomes.
- Replace jargon with human terms or surface helpful microcopy/tooltips where technical terms are unavoidable.
- Provide clear confirmation flows and safe defaults for destructive actions.
- Improve visual hierarchy: prioritize user tasks (save, export, restore, delete) and hide advanced technical details behind "Advanced" toggles.

Acceptance criteria

1. Copy: Every button, label, and explanation on `Storage` is written in plain language describing what the user will get (e.g., "Download a copy of your guide" vs "Export JSON").
2. Onboarding help: A short friendly header + one-line explanation is present at the top of the page describing why storage exists and what users can do here.
3. Jargon: Technical terms ("embeddings", "DB", "seed corpus") are either removed, replaced with plain language, or accessible via a clearly labeled "What does this mean?" link that opens inline help.
4. Safety: Destructive actions require a two-step confirmation (button + type-to-confirm or modal with explicit consequence copy). Toasts/alerts clearly state success and next steps.
5. Advanced panel: An initially collapsed section labeled "Advanced options" contains developer-facing controls and raw data (IDs, logs, embedding rebuilds). Default view is user-first.
6. Accessibility: All interactive elements have accessible names, keyboard focus states, and ARIA where needed. Color contrast and hit target sizes meet guidelines.
7. Tests: Unit/UX tests added to cover 1) header copy present, 2) export flow triggers download, 3) destructive action shows confirmation, 4) advanced panel is collapsed by default.

Suggested UX/copy changes (examples)

Header + intro
- Current terse: "Storage" — not helpful.
- Suggested: "Manage your saved guides" with a 1-line: "Keep, download, or remove versions of your guide. Everything you save stays private on your device unless you choose to export it." 

Buttons / actions
- "Save" ➜ "Save a snapshot" / tooltip: "Saves your current guide so you can restore it later."
- "Export" ➜ "Download a copy" (format selector shown as small secondary control: "JSON / Text / ZIP")
- "Import" ➜ "Upload a saved copy" with one-line explanation: "Choose a file to restore a previously saved guide."
- "Rebuild embeddings" ➜ move to Advanced and show human explanation when expanded: "Developer tool: recalculates internal search indexes. Only needed if search results look wrong."

Microcopy / Tooltips
- For any unavoidable technical label, add a dotted underline link: "What’s this?" that opens inline help with a short plain-language explanation and a link to deeper docs.
- Use outcome-first language on confirmations: "Yes, delete this saved copy — I understand I can’t undo this." Show file name, date, and size.

Visual / Layout
- Primary column: user tasks (save, download, restore, recent saves list).
- Secondary column/panel: activity log, storage usage summary with plain text (e.g., "You’ve saved 3 versions, total 120 KB"), and an "Advanced options" accordion.
- Recent saves list: show friendly labels ("Snapshot — Aug 19, 2025 — autosaved") and a small preview or excerpt where possible.

Accessibility

- Ensure color contrast and fonts meet WCAG AA.
- Keyboard-only flows for export/import and deletion confirmations.
- Screen reader labels for all dynamic controls and inline help.

Testing

- Unit tests: update or add tests in `src/__tests__` covering the `Storage` UI copy and flows.
- E2E: If an E2E framework exists, add a test that mimics a non-technical user performing: save → download → delete with confirmations.
- Add snapshot tests for the friendly header and collapsed advanced panel.

Implementation tasks (developer-friendly checklist)

- [ ] Replace page title with friendly header and 1-line intro copy.
- [ ] Update primary action labels to outcome-first language (Save → Save a snapshot; Export → Download a copy; Import → Restore from file).
- [ ] Create inline "What’s this?" help components and wiring to show short explanations.
- [ ] Add an "Advanced options" accordion and move technical controls there (rebuild embeddings, raw DB view, debug logs).
- [ ] Implement safe confirmation pattern for deletes (modal + type-to-confirm for large deletions).
- [ ] Improve visual hierarchy and mark the recent saves list as the primary affordance.
- [ ] Add or update unit tests (happy path + 1-2 edge cases) under `src/__tests__/storage*`.
- [ ] Run accessibility checks and fix violations.
- [ ] Optional: Add a tiny `storage-help.md` in docs with one-line explanations for technical terms.

Estimates & priority

- Priority: High (usability issue that impacts most non-technical users).
- Rough effort: 2–4 dev days (copy + UI changes + tests + accessibility fixes). If a designer/PM is available for copy review, 1 additional day for review and polish.

Owners

- Suggested owner: UI/Frontend dev with product/designer review.

Notes / Rationale

This change shifts the page from "developer-first" to "user-first" language and structure. Hiding technical features behind an "Advanced" section keeps power-user functionality available while making the primary experience approachable.

Files to touch (suggested)

- `src/scenes/Storage.tsx` — update header, buttons, layout, and advanced accordion.
- `src/components/*` — add `InlineHelp` or reuse existing tooltip component for "What’s this?".
- `src/__tests__/storage*` — update/add tests and snapshots.
- `docs/Updates` — this ticket (done).

Acceptance sign-off

- Product/Design: copy and microcopy sign-off
- QA: passes accessibility checks and listed tests
- Engineering: merges PR with tests green

----

Created by: automated task (requested change to make Storage page more human-first)
Date: 2025-08-19
