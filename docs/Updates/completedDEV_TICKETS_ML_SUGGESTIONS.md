## Dev Ticket: ML Suggestions — audit + low-risk improvements

Summary
-------
This ticket captures a small audit of the app's on-device ML suggestion flow and recommends a set of low-risk improvements to reduce surprising fallbacks to static "anchor" chips (Calm, Generous, Brave, Creative, Precise) and improve observability and UX.

Why this matters
-----------------
- Users see starter/anchor chips before or during typing. The root causes are deliberate fallbacks and timing/rate-limit behaviors that make ML suggestions silent or slow.

Confirmed code locations
------------------------
- Main worker orchestration and rate-limiter: `src/ml/index.ts` (getSuggestions, ensureWorker, rateLimitOk)
- Worker suggestion/embedding logic, pipeline init and fallbacks: `src/ml/worker.ts`
- UI consumes suggestions and falls back to starter traits: `src/scenes/Clarity.tsx`
- Chip UI labels seed items as "anchor": `src/components/Chips.tsx`
- Persistent embeddings storage helpers: `src/storage/embeddings.ts`

Root causes (observed)
----------------------
1. Worker posts `ready` regardless of whether the transformers pipeline initialized successfully. This allows the main thread to call for suggestions while the worker will still run fuzzy fallback.
2. `getSuggestions()` returns an empty array when the client-side rate limiter denies a call, which makes the UI fall back to static starter traits.
3. Seed embedding is computed in background after `ready` (async). Early suggestion requests may run when seed/user vectors are not yet available and thus run fallback paths.
4. Ingestion of user text uses `ingestUserText` (called on save), so new user embeddings are not available until after save + persistence.

Proposed low-risk improvements (prioritized)
-------------------------------------------
1) Add pipeline availability flag on worker ready message (high)
   - Change: Worker should post `{type:'ready', pipelineAvailable: boolean}` where `pipelineAvailable` is true only when pipeline_ is usable.
   - Files: `src/ml/worker.ts` (postMessage), `src/ml/index.ts` (read and expose to callers).
   - Acceptance criteria: `getSuggestions()` can detect pipeline unavailability and optionally avoid calling worker for heavy ops; console logs show pipelineAvailable=false when appropriate.

2) Return last-known suggestions or a throttled flag instead of `[]` when rate-limited (medium)
   - Change: `getSuggestions()` should return an object `{items: Chip[], throttled?: true}` or re-use last suggestions so UI doesn't silently fall back to starter chips.
   - Files: `src/ml/index.ts`, `src/scenes/Clarity.tsx` (handle throttled response and show subtle UI state).
   - Acceptance criteria: Rapid typing no longer immediately shows starter anchors; UI may show a subtle "throttled" indicator and reuse last suggestions.

3) Debounce input-driven calls to `getSuggestions()` (medium)
   - Change: Current debounce is 250ms; consider 300–500ms in `Clarity.tsx` and ensure it's consistent with rate limits.
   - Files: `src/scenes/Clarity.tsx`
   - Acceptance criteria: Fewer rate-limit hits during rapid typing (manual test reproducible), and smoother UX.

4) Surface whether each suggestion came from ML vs fallback (low)
   - Change: `worker.ts` include `source` already does this (`seed` | `user`), but add a metadata flag for `fallback` or `method` (e.g., `method: 'embedding'|'fuzzy'`) in responses. Update `ChipList` to optionally render a non-intrusive badge or aria-label.
   - Files: `src/ml/worker.ts`, `src/ml/index.ts` (typing), `src/components/Chips.tsx` (display).
   - Acceptance criteria: In developer mode or a hidden debug toggle, chips indicate ML/fallback origin.

5) Persist ingest results immediately and optionally keep an in-memory suggestions cache (low)
   - Change: On ingest, `ml/index.ts` already saves embedding on worker `ingest` response. Add an in-memory cache of recent user embeddings/suggestions to return quickly before IndexedDB read completes.
   - Files: `src/ml/index.ts`, `src/ml/worker.ts`.
   - Acceptance criteria: After Save, subsequent suggestions may include the new user item without a full reload.

Runtime checks & test steps (how to validate)
-------------------------------------------
1. Start dev server (`npm run dev`) and open browser console. Check logs:
   - Worker logs: "Initializing transformers.js pipeline...", "Transformers pipeline ready." or "Failed to initialize pipeline:.".
   - `Loaded X user embeddings` message from worker when `load-user-embeddings` is processed.
2. Observe `getSuggestions()` flow: ensure worker messages `{type:'suggest'}` arrive and inspect their `items`.
3. Reproduce rapid typing to trigger client-side rate limiter and confirm that UI does not silently fallback to starter anchors; confirm throttled behavior.
4. Inspect IndexedDB (`embeddings` table) to confirm embeddings persisted after Save.

Acceptance criteria for the ticket
---------------------------------
- Main thread can detect pipeline availability separately from worker "ready".
- Rate-limited calls do not cause a silent fallback to starter traits; UI shows a clear, testable behavior (reuse last suggestions or show throttled state).
- Debounce adjusted to reduce rate-limit hits while keeping latency acceptable.

Suggested implementation plan (small PRs)
----------------------------------------
1. Small PR: Worker ready message extended (worker.ts) + handle flag in `ml/index.ts`. Log and surface via `getSuggestions` comment/console for now. (est. 1–2 dev hours)
2. Small PR: Change `getSuggestions()` return shape when throttled and update `Clarity.tsx` to handle it gracefully (est. 2–3 dev hours; simple UI work).
3. Small PR: Add optional developer debug toggle to reveal suggestion method/origin (est. 1–2 dev hours).

Notes / risks
------------
- Changing the shape of `getSuggestions()` return may require small updates in code that calls it (currently only `Clarity.tsx`). Keep changes backward-compatible (e.g., support both old array return and new `{ items, throttled }`).
- Worker runtime failures are often due to browser model/runtime constraints (WebGPU/WebGL/ONNX issues); improving telemetry will help diagnose but not fix environment constraints.

Requirements coverage
---------------------
- Verify AI Dev findings are relevant: Done — mapped code locations and root causes above.
- Create dev-ticket file under `docs/Updates`: Done — this file.

Next steps
----------
1. Review and prioritize which small PR to open first (I recommend the worker-ready flag and `getSuggestions` throttled behavior).
2. If you want, I can implement the worker-ready flag change plus `ml/index.ts` handling and add tests/logging in a follow-up PR.

Contact
-------
Ticket authored by automated audit. If you want me to implement any of the PRs listed above, tell me which one to start with and I'll open a branch and apply the change.

--- Original AI Dev audit (verbatim) ---

## Files I inspected
- Clarity.tsx — UI that requests suggestions.
- Chips.tsx — UI labels chips as "anchor" for seed source.
- index.ts — worker orchestration, rate limiter, public API: getSuggestions, ingestUserText, reframeText.
- worker.ts — in-worker pipeline initialization, embedding computation, suggestion ranking, ingestion, and fallbacks.
- embeddings.ts (referenced) — persistence of user embeddings (used/loaded by ml/index and worker).

## High-level finding (summary)
- The app requests ML suggestions from getSuggestions('traits', input) in src/scenes/Clarity.tsx.
- getSuggestions ensures a Worker is created and waits for a worker "ready" signal, then enforces a client-side rate limit (10 calls / 60s). If rate-limited, it returns an empty array.
- The worker (src/ml/worker.ts) attempts to initialize @xenova/transformers pipeline for embeddings. It:
  - Posts a 'ready' message once it finishes trying to initialize (and also posts 'ready' even if initialization failed).
  - Embeds a seed corpus in the background (async after posting ready).
  - Responds to 'suggest' messages by:
   - If pipeline is available and there are seed/user embeddings: computing a query vector and ranking domain embeddings by cosine similarity (user embeddings get a +0.1 boost).
   - If there is no query vector (cold start): returning domain embeddings sorted user-first then by created_at.
   - If pipeline isn't available or an error happens, fallback to fuzzy text filtering over the seed list.
- Clarity.tsx explicitly uses starterTraits (Calm, Generous, Brave, Creative, Precise) whenever mlChips.length === 0 — so an empty or missing ML response results in those anchor chips being shown.

## Why you saw anchors before typing (concrete causes)
Any of these explain the observed behavior (Calm, Generous, Brave, Creative, Precise present before typing):
1. getSuggestions returned [] (rate-limited): ml/index returns [] when rateLimitOk() fails, so Clarity falls back to starterTraits.
2. Worker posted 'ready' even when pipeline initialization failed: ml/index sees ready and continues, but the worker will run fallback fuzzyFilter which yields seed items.
3. No user embeddings persisted yet: cold-start behavior returns seed/user pool (if no user embeddings, seeds win).
4. Pipeline initialization is asynchronous and seed embedding runs in background: early calls (right after ready) may hit a state with no embedded seed vectors yet, causing fallback.
5. Fuzzy fallback or cold-start path is explicitly coded to return seed items when ML can't be used — this is intentional behavior, not a silent bug.

Key code evidence (locations):
- getSuggestions rate limiting and empty return: index.ts
- Clarity fallback to starterTraits on empty suggestions: Clarity.tsx
- Worker fallback and suggestion logic (cosine similarity, cold-start, fuzzy fallback): worker.ts
- Chip UI labels seed -> "anchor": Chips.tsx

## Risks / correctness concerns
- Worker posts ready even when pipeline init fails. This lets the main thread proceed but the worker may then always run the fuzzy fallback. That’s a likely silent cause of "seed anchors before typing".
- Returning [] on rate-limit causes UI to fall back to the static starter list; that may be surprising to users during rapid typing or on low-power/slow environments.
- Ingestion of user text happens on Save only (ingestUserText called in save()). If users expect suggestions to adapt immediately during typing, they won't see purchased user embeddings until after save + worker persistence and reload.
- Pipeline may require particular browser features (WebGL/WebGPU, onnxruntime-web constraints). If those fail, worker will fallback silently.

## Recommended runtime checks (what I can run for you or you can run locally)
Perform these in a dev run with browser console open (app running at npm run dev / vite) and reproduce the user steps:

1. Confirm worker ready vs pipeline available
   - Observe console for worker logs from initializePipeline(): "Loading transformers.js...", "Transformers pipeline ready.", or "Failed to initialize pipeline:.".
   - Also look for the worker log: "Loaded X user embeddings".

2. Check getSuggestions flow and rate limit
   - On each typing event, inspect network/console messages for the worker message flow: main thread posts {type:'suggest', domain:'traits', text:...} and worker responds {type:'suggest', items:...}.
   - If getSuggestions returns [] due to rateLimit, you'll see no worker message; check the calls array logic in src/ml/index.ts. Reproduce fast typing to see if limit is hit.

3. Inspect IndexedDB (embeddings)
   - Open Application > IndexedDB in Chrome/Firefox and inspect the embeddings table to see how many user embeddings exist for domain 'traits'. If zero, cold-start will favor seed items.

4. Model asset loading
   - In devtools > Network, filter for model files under /models/ and onnx runtime files; ensure model_quantized.onnx is fetched or cached by service worker.

5. Reproduce a save to verify ingestion
   - Select a trait, Save, then check IndexedDB and worker logs for an "ingest" sequence and that the embedding gets stored (worker posts ingest with id/vector and ml/index saves it).

If you want, I can (in this workspace) run a dev server, open the tests, and/or run a script to count saved embeddings. Tell me which runtime checks to run and I’ll execute them and report results.

## Low-risk improvements (proactive extras)
These are small changes that would improve UX and observability; I didn't change code yet but can implement on request:
- Make worker post a separate signal indicating pipeline success vs failure (e.g., postMessage({type:'ready', pipelineAvailable: true|false})), so the main thread can know whether to expect ML-based suggestions.
- Avoid returning [] on rate-limit; instead return last-known suggestions or an explicit "throttled" flag so UI can show a loading or throttled state instead of falling back silently to static anchors.
- Debounce input-driven calls to getSuggestions (e.g., 300–500ms) to reduce rate-limit hits and unnecessary pipeline calls.
- Persist user embeddings immediately after ingest and use an in-memory cache of suggestions so UI doesn't jump to starterTraits if ML responds slowly.
- Add a small debug telemetry/logging toggle to surface whether suggestions were produced by ML vs. seed/fallback (helpful for diagnosing user reports).

## Short “contract” for additionals (if you want me to run things)
If you want me to run runtime checks, I can:
- Start the dev server and watch console logs for worker initialization and model asset fetches.
- Run a small Node script that reads the Dexie DB file (if accessible from Node) or open a headless browser to inspect IndexedDB counts.
- Reproduce user steps and capture the worker message sequence.

Inputs: which runtime checks to run (console trace, DB count, network trace).
Outputs: console logs excerpt, counts of user embeddings, and the exact worker responses to getSuggestions.

## Completion summary
- Static code audit done: located and traced UI -> ml/index -> worker -> persistence.
- Root causes identified for the observed behavior: explicit UI fallback on empty suggestions plus worker fallback and rate-limiter behavior; worker posts ready even on pipeline init failure which can silently cause fuzzy/seed responses.
Here are useful, low‑friction ML/NLP upgrades that actually help a human move through the tool. No gimmicks. For each, I give the idea, the exact surface in the app, how it works under the hood, and a quick self‑critique so we don’t add complexity for sport.

⸻

1) Clarity → Trait Detector + Gentle Palette

Use: When a user types in the “Entry Points” (inspiration / recurring thought / jealousy), surface 3–5 suggested traits that feel true to their text.

UX surface
   • Beneath the expanded entry point, show a row: “Traits I’m hearing:” [calm] [precise] [generous]
   • Each chip shows a tiny “why” on hover/tap: “you wrote: ‘I keep admiring their steadiness.’”
   • Always include “something else…” chip to keep agency clean.

Model
   • v0: curated trait lexicon (≈150 tokens) + fuzzy match + simple polarity rules.
   • v1: local embedding of user text (MiniLM or equivalent) → top‑k trait vectors.
   • Confidence < threshold → show nothing. No forced guesses.

Data
   • Input: raw entry text (never leaves device if possible).
   • Output: up to 5 traits + a short justification snippet (the exact phrase matched).

Why this helps
   • People often feel the trait, struggle to name it. A short, obvious nudge reduces stall.

Self‑critique & guardrails
   • Risk: Pigeonholing.
   • Mitigation: show few options, include “something else,” and show the reason for each suggestion so it feels like a mirror, not a verdict.

⸻

2) Clarity → Calibration Overlap Retriever

Use: Right after a trait is chosen, surface two places where this is already true based on past entries.

UX surface
   • Card stack: “Where you’ve already been this:”
   • • “Stayed soft during the client edit.” — May 3
   • • “Walked away before replying.” — July 14
   • Tap → prefill “Find your overlap” textarea.
   • Prefilled items are editable; user hits Save Overlap.

Model
   • v0: keyword match on trait + anchor tags; recency‑weighted.
   • v1: vector search over Evidence Shelf (sentence embeddings), filter by trait.

Data
   • Inputs: current trait; past proofs/evidence text.
   • Output: top‑k overlap candidates with date + source.

Why this helps
   • Overlap becomes obvious. The mind trusts what it’s seen.

Self‑critique & guardrails
   • Risk: Surface irrelevant old stuff.
   • Mitigation: limit to last 60–90 days by default, add “show older” link.

⸻

3) Calibration Proof Sharpener (1‑tap rewrite)

Use: People often log vague proof. Offer one crisper wording that makes the proof easier to trust.

UX surface
   • After saving a proof: tiny chip appears → “Tighten wording”
   • Shows a single alternative: “Paused two breaths before answering Jordan’s email.”
   • Tap Replace or Keep mine. No endless options.

Model
   • v0: template rewrite rules (detect person/action/object/time; add specifics using named entities if present).
   • v1: distilled local LLM with prompt tuned for brevity + specificity.

Data
   • Input: proof text.
   • Output: one concise rewrite (≤15 words).

Why this helps
   • Specific → believable → sticky.

Self‑critique & guardrails
   • Risk: AI overconfidently invents details.
   • Mitigation: never hallucinate nouns; only compress and keep present entities. If confidence low, don’t offer.

⸻

4) Calibration/Implementation Friction Forecaster

Use: If a friction repeats, suggest the most impactful one to remove tomorrow.

UX surface
   • In “Make tomorrow smoother,” show a hint line:
   • “This week’s biggest snag: late‑night phone scroll (3×) → “Set phone in kitchen at 10:30p?”
   • One click adds it as tomorrow’s friction in Implementation.

Model
   • Frequency + recency scoring per friction phrase (tf‑idf‑style).
   • Optional clustering (MiniLM embeddings) to merge variants like “phone at night” / “doomscrolling.”

Data
   • Inputs: saved frictions with timestamps.
   • Output: one top suggestion + variant group.

Why this helps
   • Removes thinking overhead. Keeps momentum.

Self‑critique & guardrails
   • Risk: Nudging in the wrong direction.
   • Mitigation: show suggestion as a question, always editable.

⸻

8) Storage Identity Pattern Snapshot (opt‑in weekly digest)

Use: Show the person what’s strengthening. Private, simple, and visual.

UX surface
   • In Storage, a tab: “Patterns” →
   • Top trait this week: Calm (7 proofs)
   • Anchor you used most: Morning light (5×)
   • Friction that moved: “Night phone” ↓ 60%
   • Tiny wins reel: 3 best proofs (user-picked or auto).
   • Toggle to email/export ICS notes if they want.

Model
   • Pure analytics + lightweight summarization for headlines (template first).
   • v1: clustering proofs to show “themes” over 30/90 days.

Data
   • Inputs: stored proofs, anchors, frictions, timestamps.
   • Output: counts + brief, template‑based phrasing.

Why this helps
   • Reinforces trust with real patterns. Zero extra effort.

Self‑critique & guardrails
   • Risk: Over‑summarizing.
   • Mitigation: keep numbers small, offer “see items” to drill down.

⸻

Implementation notes that keep it human
   • Default to silence. If a suggestion’s confidence is low, show nothing.
   • One nudge at a time. No panels stuffed with ideas. A single clean suggestion is enough.
   • Always editable. The person stays author. AI proposes; they choose.
   • On‑device first. Embeddings and counts can run locally. If a cloud model is truly needed, ask for explicit consent and make it obvious where text goes.
   • No personality imposition. Suggestions include a tiny “why you’re seeing this” so it reads as a mirror, not a judgment.

