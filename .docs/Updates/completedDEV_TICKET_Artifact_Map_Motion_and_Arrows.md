# Dev Ticket: Artifact Map Homepage Motion and Directional Arrows

## Summary
- Implement subtle homepage motion and directional arrows to communicate the guided flow across Artifact Map nodes (Safety → Clarity → Calibration → VOID → Implementation → Resets), with accessibility, responsiveness, analytics, and performance in mind.

## Context
- Stack: React + Vite + TypeScript + Tailwind + Framer Motion.
- Routing: Homepage is the Artifact Map (likely `src/pages/ArtifactMapPage.tsx` or `src/routes/Artifact.tsx`).
- Nodes: Safety, Clarity, Calibration, Implementation, Resets; center anchor: VOID.
- Assets: SVG/WebP under `public/assets`; consider SVGR for inline SVG control.
- Design: Minimal, soft motion, honors `prefers-reduced-motion`.

## Goals
1) Add a subtle animation that brings the homepage to life without distraction.
2) Add directional arrows to depict the intended flow. Arrows should be visible, unobtrusive, keyboard-accessible, react to hover/focus, and gently imply direction.

## Deliverables
- PR(s) including Storybook stories for `ArtifactNode` and `ArtifactArrow`.
- Screenshots/GIFs demonstrating desktop and mobile behavior.
- Lighthouse screenshots for Performance and Accessibility (scores ≥ 90).

## Components & Files (create if missing)
- Components: `ArtifactMap`, `ArtifactNode`, `ArtifactArrow`, `MotionPrefsProvider`.
- Files:
  - `src/components/artifact/ArtifactMap.tsx`
  - `src/components/artifact/ArtifactNode.tsx`
  - `src/components/artifact/ArtifactArrow.tsx`
  - `src/components/artifact/useMotionPrefs.ts`
  - `src/components/artifact/MotionPrefsProvider.tsx`
  - `src/config/artifactFlow.ts` (ordered steps, positions, routes, ARIA labels)
- Assets: Use SVGR for interactive SVGs; lazy-load large bitmaps; keep assets in `public/assets`.

---

## Prioritized Backlog (Epics → Stories)

Order: Foundation (Epic C) → Arrows (Epic B) → Motion (Epic A)

### Epic C — Foundation, A11y, Docs, QA
Description: Establish motion preference plumbing, flow config, analytics, Storybook scaffolding, and quality gates to support arrows and node motion.

1) Story: MotionPrefsProvider + useMotionPrefs (S)
- Description: Provide a wrapper over `prefers-reduced-motion` and Framer Motion settings.
- Implementation Notes:
  - Add `MotionPrefsProvider.tsx` and `useMotionPrefs.ts`.
  - Expose `{ reduced: boolean, prefersReducedMotion: boolean, shouldAnimate: (kind: string) => boolean }`.
  - Subscribe to `matchMedia('(prefers-reduced-motion: reduce)')` changes.
- Acceptance Criteria:
  - Reduced motion state updates live on OS preference change.
  - Stories or tests demonstrate that animations disable when reduced motion is on.
  - No continuous animation runs when reduced motion is on.
- Dependencies: None

2) Story: artifactFlow config (S)
- Description: Centralize step order, ids, labels, ARIA labels, route slugs, analytics step_index, and breakpoint positions (`xs, md, lg, xl`).
- Implementation Notes:
  - Add `src/config/artifactFlow.ts` with nodes: Safety, Clarity, Calibration, VOID, Implementation, Resets; optional wrap back to Safety.
  - Include per-breakpoint positions and simplified mobile layout mapping.
- Acceptance Criteria:
  - Consumers map nodes and arrows from a single source of truth.
  - Positions switch by breakpoint without layout shift.
  - Config is easily extended to add a new node/arrow.
- Dependencies: None

3) Story: Analytics event for navigation (S)
- Title: `artifact_map_navigate`
- Description: Emit a lightweight analytics event when user navigates via node or arrow.
- Implementation Notes:
  - Add `src/lib/analytics.ts` with `track(event, payload)` shim.
  - Payload: `{ from: string | null, to: string, step_index: number, source: 'node' | 'arrow' }`.
  - No PII; console.warn in dev if schema invalid; suppress in tests.
- Acceptance Criteria:
  - Event fires on node click and arrow click, including keyboard activation.
  - Payload matches schema; no PII collected.
- Dependencies: Flow config (C2)

4) Story: A11y baseline for nodes and arrows (M)
- Description: Ensure nodes and arrows are keyboard reachable with visible focus states and descriptive ARIA labels.
- Implementation Notes:
  - Logical tab order follows flow sequence.
  - `aria-label` pattern: `Go to Clarity (Step 2)`.
  - Tailwind `focus-visible` styles with sufficient contrast.
- Acceptance Criteria:
  - Tab reaches all interactive nodes/arrows; Enter/Space activates navigation.
  - Focus ring visible in light/dark themes; meets WCAG AA.
- Dependencies: Flow config (C2)

5) Story: Storybook scaffolding (M)
- Title: Storybook: ArtifactNode and ArtifactArrow
- Description: Component stories with controls for reduced motion, state, and theme.
- Implementation Notes:
  - Place under `src/components/artifact/__stories__/`.
  - Controls: reduced motion, active state, hover/focus, theme.
- Acceptance Criteria:
  - Stories render with controls; reduced-motion disables animations.
  - Visuals match Tailwind tokens.
- Dependencies: Motion prefs (C1), A11y baseline (C4)

6) Story: QA checklist (S)
- Title: Manual test matrix
- Implementation Notes:
  - Add `docs/qa-artifact-map.md` with cases for breakpoints, themes, and motion prefs.
- Acceptance Criteria:
  - Verified at 320px, 768px, 1024px, 1440px; light/dark; reduced-motion on/off; Chrome/Safari/Firefox.
- Dependencies: Arrows (Epic B) and Motion (Epic A)

7) Story: Developer documentation (S)
- Title: `docs/artifact-map.md`
- Description: Document architecture, props, extension patterns.
- Implementation Notes:
  - Cover `ArtifactMap`, `ArtifactNode`, `ArtifactArrow`, `MotionPrefsProvider`, `artifactFlow`.
  - Explain how to add a new node/arrow and use motion style flag.
- Acceptance Criteria:
  - Docs cover setup, props, motion prefs, analytics, and include screenshots/GIFs.
- Dependencies: Arrows (B), Motion (A), Storybook (C5)

### Epic B — Directional Flow Arrows
Description: Render unobtrusive directional arrows that communicate the flow, animate gently, and support interaction and keyboard navigation.

1) Story: Arrow component + shared markers (M)
- Description: Build reusable SVG arrow with theme stroke and shared `<defs>` marker.
- Implementation Notes:
  - `ArtifactArrow.tsx` with SVGR/inline SVG approach.
  - Stroke 1.5–2px; color from theme token; `marker-end="url(#arrowhead)"` with shared `<defs>` in parent SVG.
- Acceptance Criteria:
  - Arrow renders with correct stroke and arrowhead; no duplicate defs.
  - Static rendering when reduced motion is on.
- Dependencies: Motion prefs (C1)

2) Story: Arrow directionality animation (S)
- Description: Convey direction via draw-on or subtle dashed drift using Framer Motion.
- Implementation Notes:
  - Use `motion.path` with `pathLength` or `strokeDashoffset` animation.
  - One-time draw-on ≤ 600ms on mount OR slow dash (opacity ≤ 0.2).
  - Disable animation when reduced motion is true.
- Acceptance Criteria:
  - Visible but non-distracting; minimal CPU; no layout shift.
- Dependencies: Arrow component (B1), Motion prefs (C1)

3) Story: Desktop flow connectors (M)
- Description: Map arrows between nodes for lg/xl without overlap.
- Implementation Notes:
  - `ArtifactMap.tsx` parent SVG overlays nodes; compute paths from `artifactFlow` positions.
  - Optional wrap arrow Resets → Safety if space allows.
- Acceptance Criteria:
  - Correct connections: Safety → Clarity → Calibration → VOID → Implementation → Resets (→ Safety optional).
  - Arrowheads oriented correctly; no overlap/jitter on resize.
- Dependencies: Flow config (C2), Arrow component (B1)

4) Story: Responsive arrow layouts (M)
- Description: Simplify to stacked vertical connectors for xs/md.
- Implementation Notes:
  - Switch to precomputed path variants per breakpoint from config.
  - Mobile: vertical chevrons between stacked nodes.
- Acceptance Criteria:
  - Readable, unobtrusive at 320px and 768px; no collisions; no layout shift on breakpoint change.
- Dependencies: Desktop connectors (B3), Flow config (C2)

5) Story: Arrow interactions and accessibility (M)
- Description: Hover/focus highlights source and destination; click/Enter/Space navigates; analytics fires.
- Implementation Notes:
  - Highlight via Tailwind classes on connected nodes; arrow stroke emphasis on hover/focus.
  - Use React Router navigation to target route; fire `artifact_map_navigate` with `{ from, to, step_index, source: 'arrow' }`.
- Acceptance Criteria:
  - Hover/focus highlights both nodes; keyboard Tab reaches arrows; Enter/Space activates.
  - Analytics payload is correct.
- Dependencies: A11y baseline (C4), Analytics (C3), Desktop connectors (B3)

6) Story: Storybook — ArtifactArrow states (S)
- Description: Stories for static, draw-on, dashed drift, reduced-motion, hover/focus.
- Acceptance Criteria:
  - All states visible; reduced-motion story shows no animation; controls preview breakpoint variants.
- Dependencies: Arrow component (B1), Motion prefs (C1), Storybook (C5)

### Epic A — Homepage Motion
Description: Subtle, tasteful animation that brings the homepage alive without distraction and honors reduced-motion.

1) Story: ArtifactNode with micro-interactions (M)
- Description: Node button with accessible elevation/shadow/outline on hover/focus; navigates with analytics.
- Implementation Notes:
  - `ArtifactNode.tsx`; Tailwind `focus-visible` styles; optional `ring`/`shadow-md` on interaction.
  - Support icon/image via SVGR or public assets.
- Acceptance Criteria:
  - Focusable, hoverable; WCAG AA contrast; click navigates; analytics fires `{ from, to, step_index, source: 'node' }`.
- Dependencies: A11y baseline (C4), Analytics (C3)

2) Story: Active node breathing animation (S)
- Description: Subtle scale 0.98–1.02 and opacity 0.5–0.8 breathing around active node; default active = Safety.
- Implementation Notes:
  - Framer Motion cycle 4–6s, ease in/out; disabled when reduced motion.
  - Active node tracked via route or local state in `ArtifactMap`.
- Acceptance Criteria:
  - Amplitude and cycle match spec; smooth FPS; disabled under reduced-motion.
- Dependencies: Node component (A1), Motion prefs (C1)

3) Story: Void glow pulse + runtime switch (S)
- Description: Config flag to swap between breathing ring (A) and VOID glow (B) without code changes.
- Implementation Notes:
  - Read `import.meta.env.SITE_MOTION_STYLE` values: `node_breath` | `void_glow`; default `node_breath`.
  - VOID glow is a soft ring/box-shadow pulse; honors reduced-motion.
- Acceptance Criteria:
  - Changing the env flag switches effect without code changes; only one effect is active.
- Dependencies: Motion prefs (C1), Node component (A1)

4) Story: Integrate nodes into ArtifactMap layout (M)
- Description: Render nodes around central VOID using config positions across breakpoints; active state integrated.
- Implementation Notes:
  - Update homepage route to use new components; lazy-load large bitmaps; no layout shift.
- Acceptance Criteria:
  - VOID centered; other nodes placed per config at all breakpoints; Lighthouse Performance ≥ 90 (cold).
- Dependencies: Flow config (C2), Node component (A1)

5) Story: Storybook — ArtifactNode states (S)
- Description: Stories for default, active with breathing, void glow variant, hover/focus, reduced-motion.
- Acceptance Criteria:
  - Visual parity with in-app rendering; reduced-motion story shows no animation.
- Dependencies: Node component (A1), Motion prefs (C1), Storybook (C5)

---

## Non-Functional Requirements
- Accessibility: All nodes and arrows must be keyboard navigable with visible focus states and ARIA labels. Do not rely on color alone.
- Responsiveness: Works at 320, 768, 1024, 1440 widths. Arrows reroute/layout gracefully at narrow widths.
- Performance: Inline critical SVGs; lazy-load large images; avoid layout shift; keep CPU minimal during animation.
- Reduced Motion: Respect `prefers-reduced-motion` — disable continuous animation; provide static alternatives.
- Analytics: `artifact_map_navigate` event on node/arrow activation with schema above.

## Open Questions (if needed during implementation)
- Confirm exact homepage route file: `src/pages/ArtifactMapPage.tsx` vs `src/routes/Artifact.tsx`.
- Theme color tokens for strokes/rings and focus rings.
- Whether loopback arrow Resets → Safety should always render or be breakpoint-conditional.

