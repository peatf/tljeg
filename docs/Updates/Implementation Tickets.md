# Implementation Tickets — Detailed Plan

Owner: Implementation & Safety flows
When: Next sprint (1–2 days for IMP-4/SAF-1, remainder in following day)
Scope: UI copy, interaction tweaks, local storage reads/writes, light helper logic

This plan covers the following tickets:
- IMP-4: Guided Input Prompts
- IMP-5: Micro-Act Suggestion System
- SAF-1: Reorder Flow for Body Awareness
- SAF-2: Clarify Consent + “Not Yet” State
- SAF-3: Simplify Environment Anchors
- STG-3: Humanized Counts Summary
- STG-4: Grouped History View

---

## IMP-4: Guided Input Prompts
Priority: High
Files: `src/scenes/Implementation.tsx`

Goal
- Add inline guidance and example scaffolding so users know what to write for Title, Principle, and Micro‑acts.
- Show hint placeholders that disappear on type.
- Store unchanged: `microActs: string[]`, same write path via `addRuntimeSpec` in `src/storage/storage.ts`.

Current
- Inputs are rendered via `InputPanel` with labels: TITLE, PRINCIPLE, MICRO‑ACT 1/2; no helper copy.
- `InputPanel` already supports `placeholder` and `helperText` props.

Planned UX Copy
- Title helper: “Give your action plan a simple name (e.g., Morning reset, Saying no gracefully).”
- Principle helper: “What core value or intention does this reflect? (e.g., Calm, Honesty, Patience).”
- Micro‑acts helper: “List 1–2 small, concrete actions that express this principle. (e.g., Pause before replying, Put phone in drawer at dinner).”
- Placeholders:
  - Title placeholder: “Morning reset, Saying no gracefully…”
  - Principle placeholder: “Calm, Honesty, Patience…”
  - Micro‑act placeholders: “Pause before replying…”, “Phone in drawer at dinner…”

Implementation Steps
1) Add a brief explainer paragraph above each input block using a small, secondary text style.
2) Provide `placeholder` props on the `InputPanel`s so hints disappear on typing.
3) Optionally add `helperText` on `InputPanel` if we prefer below-field reinforcement (keeps whitespace compact on mobile).
4) Do not change calls to `addRuntimeSpec`; keep schema `{ label, principle, microActs, friction }` intact.

Accessibility
- Maintain `aria-label` on inputs.
- Associate helper text with inputs via `InputPanel`’s `helperText` (uses `aria-describedby`).

Test Cases
- Typing into any field hides placeholder.
- Saving persists `microActs` as an array of non‑empty strings.
- Reloading shows saved plans unchanged.

Risks/Notes
- Keep helper text short to avoid mobile overflow.

---

## IMP-5: Micro‑Act Suggestion System
Priority: Medium
Files: `src/scenes/Implementation.tsx`, `src/storage/storage.ts`

Goal
- Offer 3–5 context‑aware micro‑act chips under Micro‑acts, derived from recent:
  - VOID: dissolutions/reflections → inspiration/possibility text
  - Clarity: overlaps (Step 3 results)
  - Safety: frictions/needs (named needs / unmet needs)
- Tapping a chip autofills the next empty Micro‑act input.
- Indicate subtle origin: “From VOID”, “From Clarity”, “From Safety”.

Current
- Implementation already surfaces `microActChips` from `getSuggestions('contexts')`, `getSuggestions('traits')`, and `listEntries('implementation_suggestions')` (VOID). Chips display a source tag; some chips include `from: 'void'`.
- Friction chips are separate under FRICTION and already merge ML + Safety + Calibration.

Proposed Changes
1) Extend micro‑act chip sources:
   - VOID: continue reading `implementation_suggestions` (already saved in `VOID.tsx` with `source: 'void'`). Ensure label shows “From VOID”.
   - Clarity: read latest `clarity` entries; map `content.overlap` → acts like “Repeat: [overlap] once today”. Tag `from: 'clarity'`.
   - Safety: read latest `safety` entries; map `needsText`/`partNeed` → acts like “Give yourself: [need] for 2m”. Tag `from: 'safety'`.
2) Ranking + capping:
   - Prefer same‑day items first; then recent (last 7 days), then seeds from `traits/contexts` fallback.
   - Cap to 3–5 visible chips. Mix origins when available (at least 1 if each exists).
3) Autofill behavior:
   - On click, fill `micro1` if empty; else `micro2`; else replace the older of the two via simple LRU (optional, skip if over‑scope).
4) Origin affordance:
   - Render subdued origin text: `(from VOID)`/`(from Clarity)`/`(from Safety)` using a light color token.

Data/Storage
- Read only; no schema changes. Continue storing micro‑acts as strings in the `runtimeSpecs` document.

Pseudocode
- Fetch concurrently: latest `listEntries('implementation_suggestions')`, `listEntries('clarity')`, `listEntries('safety')`.
- Same‑day filter: `new Date(ts).toDateString() === todayString` where `ts` = `timestamp` or parsed `created_at`.
- Map to chips: `{ id, text, source: 'user', from: 'void'|'clarity'|'safety' }`.
- Merge, de‑dupe by normalized text, sort by recency, slice to 5.

Tests
- If no recent data, fallback shows seeds from traits/contexts.
- Clicking a chip moves its text into the next empty micro‑act field.
- Origin label visible and unobtrusive.

---

## SAF-1: Reorder Flow for Body Awareness
Priority: High
Files: `src/scenes/Safety.tsx`

Goal
- Body readiness leads the flow after intro; make it required before proceeding.

Current
- Body readiness input appears lower in the page; Save not gated on it.

Changes
1) Reorder sections: Intro → Body readiness prompt + textarea → Consent check‑in → Environment → Needs → Part name/need → Save.
2) Require body readiness before Save:
   - Disable Save until `bodyReflection.trim().length > 0`.
   - Provide inline helper: “Required. A brief body read helps set safe pace.”
3) Store unchanged: included in existing `addEntry('safety', { consent, needsText, env, partName, partNeed, bodyReflection })`.

Accessibility
- Keep the label “Where in your body do you feel ready/not ready?” and link helper via `helperText`.

Tests
- Save disabled when body readiness is empty.
- After entering text, Save enables and entry persists.

---

## SAF-2: Clarify Consent + “Not Yet” State
Priority: Medium
Files: `src/scenes/Safety.tsx`

Goal
- When user selects “Not yet”, show explicit guidance and autofocus a need input. Prevent progression until a need is named.

Current
- Selecting “not yet” reveals a single `InputPanel` with a generic placeholder. Save is not blocked.

Changes
1) Dynamic guidance block under radios when `consent === 'not yet'`:
   - Copy: “Pause. Name what would help you feel safer before moving on.”
2) Autofocus the need field when shown (use `ref` to the `InputPanel`’s underlying input/textarea).
3) Block Save until at least one of `needsText` or `partNeed` is non‑empty if consent is “not yet”.
4) Keep existing “Part name/Part need” block; encourage pairing with the need.

Tests
- Choosing “Not yet” autofocuses the need input.
- Save disabled until a need is entered.

---

## SAF-3: Simplify Environment Anchors
Priority: Low
Files: `src/scenes/Safety.tsx`

Goal
- Replace jargon. Rename “Environment Anchor” to “Supportive Environment” and add an explanatory subline. Keep quick‑select chips.

Changes
1) Rename label to “SUPPORTIVE ENVIRONMENT”.
2) Replace helper copy under the section header:
   - “Optional: Add anything that makes this space feel better for you (e.g., blanket, open window).”
3) Keep chip list (door locked, warmth, etc.) and custom‑add input. Update aria‑labels accordingly.

---

## STG-3: Humanized Counts Summary
Priority: Medium
Files: `src/scenes/Storage.tsx`

Goal
- Replace raw table counts with a human summary card.

Summary Copy
- “You’ve logged X overlaps, Y principles, Z micro‑acts.”
- “Last updated: [date]”.

Definition of Counts
- Overlaps: number of `clarity` entries with non‑empty `content.overlap`.
- Principles: count of unique `principle` strings across `runtimeSpecs` (case‑insensitive trim).
- Micro‑acts: total of all `runtimeSpecs[*].microActs.length`.

Implementation Steps
1) Compute counts alongside existing `useEffect` that already loads tables; reuse arrays in memory to avoid extra reads.
2) Render a bordered card at top of page with the human copy. Hide raw `db.tables` count table from default view (keep in Advanced).
3) Keep “Last updated” using existing `lastModified` state.

Tests
- Summary updates after adding new Clarity overlap or saving a new Implementation plan.
- Technical tables (embeddings, contexts) are not displayed in the summary.

---

## STG-4: Grouped History View
Priority: Low
Files: `src/scenes/Storage.tsx`

Goal
- Add a simple UI toggle to group Evidence by Trait or by Week; grouping applies to UI only. Keep CSV export unmodified.

Current
- Logic exists for `groupBy: 'none' | 'trait' | 'date'` and grouped rendering; toggle UI not present; “date” is per‑day.

Changes
1) Add a compact toggle control near filters:
   - Radios or select: “No grouping”, “Group by Trait”, “Group by Week”.
   - Map to state values: `'none' | 'trait' | 'week'` (rename “date” to “week”).
2) Implement week grouping function:
   - Key by ISO week: `YYYY‑WW` based on `created_at` timestamp.
   - Display group header as “Week of Mon, MMM D (YYYY‑WW)”.
3) Preserve CSV export (no changes to data source).

Tests
- Switching grouping updates list headers without changing item order within groups (still recent first).
- CSV export unaffected.

---

## Cross‑Cutting Notes
- Keep all existing storage schemas the same; this work is UI + read aggregation only.
- Follow existing `InputPanel` patterns for accessibility and helper copy.
- Use subdued text tokens for helper/headers to minimize visual noise.

## Milestones & Estimates
1) IMP‑4 + SAF‑1: 0.5–1 day (copy + layout + gating)
2) SAF‑2 + SAF‑3: 0.5 day (branching, autofocus, relabel)
3) IMP‑5: 0.5–0.75 day (extend chip sources + origin labels)
4) STG‑3 + STG‑4: 0.5 day (summary card + toggle)

## Verification Checklist
- Implementation: Inline scaffolding visible; placeholders disappear on type; save still stores identical shape.
- Micro‑acts: 3–5 chips appear with subtle origin labels; tap to autofill.
- Safety: Body readiness first and required; “Not yet” forces naming a need with autofocus; environment wording updated.
- Storage: Human summary present; grouping toggle between none/trait/week works; CSV export unchanged.

