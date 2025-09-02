# UI Kit Adoption Plan — Buttons & Inputs

## Goals
- Align all buttons and text inputs with the provided UI kit (stacked buttons and floating-label inputs) while preserving accessibility, responsiveness, and theming.

## Scope
- Replace existing primary/CTA buttons with stacked layered buttons.
- Replace existing icon/nav buttons with circular stacked nav buttons.
- Replace text inputs and textareas with floating-label input panels.
- Do not change unrelated components (modals, tabs, tables), unless required for consistency.

## Deliverables
- Global CSS with design tokens and component styles.
- New reusable components for buttons and inputs (framework-specific, e.g., React/Vue/Svelte or HTML partials).
- Refactor of existing screens to use the new components.
- Documentation with usage examples and guidance.

## Implementation Steps
1) Add design tokens and global styles
- Create `src/styles/ui-kit.css` (or project-equivalent) with `:root` variables from the UI kit and base body styles.
- Include Google Fonts (Inter, IBM Plex Mono, Syne) via `<link>` or bundler. Fallback to system fonts if offline.
- Ensure `body` uses the new variables for background and text colors.

2) Add component CSS for buttons and inputs
- Copy the UI kit CSS for:
  - `.stacked-button`, `.rect-btn`, `.nav-btn` (+ `.layer`, `.feathered`, `.nav-icon`).
  - `.input-panel`, `.input-panel-label`, `.form-element`.
- Keep transitions, hover/active, and focus-within effects intact.
- If Tailwind is used, keep these as plain CSS utilities alongside Tailwind; no Tailwind config changes are required. Optionally expose tokens via Tailwind theme for consistency later.

3) Build reusable components
- Button (stacked): props — `label`, `size` (e.g., `rect`), `onClick`, `as` (button/link), `disabled`.
- NavButton (circular icon): props — `icon` (slot/child), `active`, `ariaLabel`, `onClick`.
- InputPanel: props — `id`, `label`, `type` (`text`, `textarea`), `value`, `onChange`, `placeholder`, `disabled`, `error`, `helperText`.
- Forward refs where applicable; support full-width layout; ensure minimal DOM to match CSS selectors.

4) Accessibility
- Use semantic `<button>` elements (avoid `div` with role unless unavoidable); preserve keyboard interactions (Space/Enter).
- Provide `aria-label` for icon-only nav buttons.
- Ensure focus states are visible and meet contrast (accent + glow is OK but verify WCAG 2.1 AA for 3:1 on focus indicator; adjust if needed).
- Inputs: connect `<label for>` with `id`; use `aria-describedby` for helper/error text; toggle `aria-invalid` and `required` when applicable.

5) States & variants
- Buttons: default, hover, active (press cascade), disabled (reduce opacity, disable pointer events, remove transform).
- Nav buttons: `active` variant lights the inner layer and inverts icon color.
- Inputs: focus-within style; error state border/shadow color; disabled state grayed and non-interactive.

6) Refactor usage across the app
- Identify all primary CTA buttons → replace with stacked rectangular button.
- Identify icon navigation or toolbar buttons → replace with circular nav buttons.
- Wrap every text input/textarea in `.input-panel` with floating `.input-panel-label` and `.form-element`.
- Preserve existing aria labels, test-ids, analytics selectors.

7) Testing
- Unit/Component tests: render, props, disabled/active/focus states, icon-only A11y checks, label-input association.
- Visual checks: add storybook/examples or a static demo page mirroring the UI kit for quick regression review.
- E2E smoke: submit forms, navigate with keyboard, ensure no layout shift or clipped labels.

8) Documentation
- Add a “Buttons & Inputs” guide with code snippets for common patterns (CTA, toolbar icon, form field with helper/error).
- Include do/don’t notes (e.g., don’t nest block-level elements inside button label).

9) Rollout plan
- Add styles and components behind a small feature flag if risky; otherwise ship styles and migrate screen-by-screen.
- Prioritize high-traffic screens; migrate remaining as they’re touched.
- Remove legacy button/input classes after full migration to avoid style conflicts.

## Acceptance Criteria
- Buttons and inputs visually match the UI kit examples (spacing, layers, shadows, typography, transitions).
- All interactive elements remain keyboard-accessible with visible focus.
- No regressions in form validation and submission flows.
- Tokens are centralized; no duplicated hard-coded colors for these components.

## Risks & Mitigations
- Visual diffs across themes: validate tokens against dark/light if applicable; gate per theme.
- Performance of shadows: keep feathered shadows as in kit; consider reducing blur on low-power devices if jank observed.
- DOM restructuring: audit selectors/tests relying on previous markup; update tests accordingly.

## Open Questions
- Which framework/component library are we standardizing on (if any)?
- Are there brand constraints on accent color or focus styles?
- Do we need small/compact button/input sizes beyond what’s in the kit?

## Snippets (for reference)
- Rectangular stacked button skeleton:
  ```html
  <button class="stacked-button rect-btn" aria-label="Enter">
    <div class="layer l1"></div>
    <div class="layer l2 feathered"></div>
    <div class="layer l3 feathered"></div>
    <div class="layer l4 feathered"></div>
    <div class="layer l5 feathered"></div>
    <div class="layer l6 feathered"></div>
    <span class="relative z-10 font-bold text-white font-mono text-lg tracking-wider">ENTER</span>
  </button>
  ```
- Floating label input skeleton:
  ```html
  <div class="input-panel">
    <label class="input-panel-label" for="oracleQuery">ORACLE QUERY</label>
    <input id="oracleQuery" type="text" class="form-element" placeholder="Ask your question..." />
  </div>
  ```

## Estimate
- Styles & tokens: S (0.5–1 day)
- Components: M (1–2 days)
- Screen refactors: M–L (depends on app surface)
- Tests/docs: M (1–2 days)

