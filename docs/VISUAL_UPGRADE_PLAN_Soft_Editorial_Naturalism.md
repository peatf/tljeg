# Visual Upgrade Plan: Soft Editorial Naturalism

## Aesthetic Philosophy

**Design Direction: "Soft Editorial Naturalism"**

This aesthetic translates contemplative, ritual-focused energy into a cohesive UI language. The core principles are:

1. **Softness over sharpness** — Rounded forms, gentle shadows, muted color transitions
2. **Editorial breathing room** — Magazine-style generous whitespace that invites pause
3. **Organic geometry** — Natural shapes meeting intentional structure (pebbles + grids)
4. **Ritual pacing** — UI that moves at breath-speed, not click-speed
5. **Layered depth** — Subtle z-axis separation through soft shadows and translucency
6. **Color as mood** — Warm, organic tones that feel like morning light through curtains

The experience should feel like a skincare ritual or coffee ceremony — deliberate, sensory, grounding.

---

## Constraints (Do Not Change)

- **Content/copy** — All text, logic, and ordering preserved
- **Artifact Map** — The radial map visualization stays as the central hub
- **Typography** — Keep existing font families (Inter, monospace stack)
- **Background image** — Keep the fixed background and its 20% opacity

---

## Phase 1: Color Palette Evolution

### Current State
The palette is functional but slightly stark. The blue accent (`#005FF7`) creates a jarring electric quality that breaks the meditative mood.

### Target State
Introduce a secondary organic accent while softening the primary. Create warmth without losing clarity.

### Specific Changes

#### New CSS Variables (add to `:root`)
```css
/* Organic accent — sage green for grounding moments */
--color-accent-organic: #7B9E87;
--color-accent-organic-glow: rgba(123, 158, 135, 0.15);
--color-accent-organic-soft: rgba(123, 158, 135, 0.08);

/* Warm accent — soft terracotta for emphasis without alarm */
--color-accent-warm: #C4A484;
--color-accent-warm-glow: rgba(196, 164, 132, 0.15);

/* Soften the blue for focus states — less electric, more calm */
--color-accent-soft: #4A7FD4;
--color-accent-soft-glow: rgba(74, 127, 212, 0.12);

/* Cream variations for layering */
--color-cream-warm: #F5F3E8;
--color-cream-cool: #F8F9F5;

/* Subtle border for glass effects */
--color-border-soft: rgba(175, 175, 167, 0.3);
--color-border-focus: rgba(123, 158, 135, 0.4);
```

#### Application Guidelines
- **Primary accent (blue)**: Reserve for critical focus states only (active input focus)
- **Organic accent (sage)**: Use for success states, completed steps, confirmation
- **Warm accent (terracotta)**: Use sparingly for gentle emphasis, progress indicators
- **Focus states**: Transition from electric blue to softer blue with organic glow
- **Active/selected chips**: Use organic accent instead of blue

---

## Phase 2: Unified Component System

### 2.1 Button Unification

#### Current State
Multiple button patterns exist: stacked buttons, btn-primary/secondary/tertiary, inline links. The layered stacked buttons are striking but dominant.

#### Target State
Create a cohesive system where all buttons feel related, with the stacked buttons reserved for major rituals (phase transitions) and simpler variants for in-flow actions.

### Button Tier System

**Tier 1: Ritual Buttons (Phase Transitions)**
- Use existing stacked button pattern
- Reserved for: "Begin Practice", "Enter VOID", "Complete Phase"
- Modification: Soften the layer colors slightly, add subtle organic glow on hover
- Add a very subtle breathing animation on idle (scale 0.995 → 1.005 over 6s)

**Tier 2: Flow Buttons (In-Phase Actions)**
- New pattern: Soft pill buttons with depth
- Use for: "Save", "Continue", "Add Item"
- Style:
  ```css
  .btn-flow {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, var(--color-cream-warm) 0%, var(--color-bg) 100%);
    border: 1px solid var(--color-border-soft);
    border-radius: 999px;
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 4px 12px rgba(0, 0, 0, 0.03),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
    font-weight: 500;
    color: var(--color-text-primary);
    transition: all 0.3s ease;
  }

  .btn-flow:hover {
    transform: translateY(-1px);
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.06),
      0 8px 24px rgba(0, 0, 0, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.7);
    border-color: var(--color-border-focus);
  }

  .btn-flow:active {
    transform: translateY(0);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      inset 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  ```

**Tier 3: Quiet Buttons (Secondary Actions)**
- Simplified pattern: Text with subtle underline on hover
- Use for: "Skip", "Edit", "View Details"
- Style:
  ```css
  .btn-quiet {
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    font-weight: 450;
    position: relative;
    transition: color 0.2s ease;
  }

  .btn-quiet::after {
    content: '';
    position: absolute;
    bottom: 0.25rem;
    left: 0.75rem;
    right: 0.75rem;
    height: 1px;
    background: currentColor;
    transform: scaleX(0);
    transition: transform 0.2s ease;
  }

  .btn-quiet:hover {
    color: var(--color-text-primary);
  }

  .btn-quiet:hover::after {
    transform: scaleX(1);
  }
  ```

### 2.2 Input Panel Refinement

#### Target State
Softer focus states, more organic floating label behavior, gentle validation feedback.

```css
.input-panel {
  position: relative;
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
}

.input-panel:focus-within {
  border-color: var(--color-accent-organic);
  box-shadow:
    0 0 0 3px var(--color-accent-organic-glow),
    0 4px 16px rgba(123, 158, 135, 0.08);
  background: rgba(255, 255, 255, 0.6);
}

.input-panel-label {
  /* ... existing positioning ... */
  background: linear-gradient(180deg, var(--color-bg) 50%, transparent 50%);
  color: var(--color-text-secondary);
  transition: all 0.3s ease;
}

.input-panel:focus-within .input-panel-label {
  color: var(--color-accent-organic);
  transform: translateY(-2px);
}
```

### 2.3 Chip/Pill Unification

#### Target State
All chips share a common base with contextual variations. More organic shape, softer interactions.

```css
/* Base chip — organic pill shape */
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 1rem;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 450;
  transition: all 0.2s ease;
}

/* Interactive — selectable items */
.chip-interactive {
  background: var(--color-cream-warm);
  border: 1px solid var(--color-border-soft);
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.chip-interactive:hover {
  background: rgba(255, 255, 255, 0.7);
  border-color: var(--color-accent-organic);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.chip-interactive[aria-pressed="true"] {
  background: var(--color-accent-organic-soft);
  border-color: var(--color-accent-organic);
  color: var(--color-accent-organic);
  box-shadow:
    inset 0 1px 2px rgba(123, 158, 135, 0.1),
    0 0 0 2px var(--color-accent-organic-glow);
}

/* Display — read-only information */
.chip-display {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-secondary);
}

/* Suggestion — offered options, dashed until hovered */
.chip-suggestion {
  background: transparent;
  border: 1px dashed var(--color-border-soft);
  color: var(--color-text-secondary);
}

.chip-suggestion:hover {
  background: var(--color-cream-warm);
  border-style: solid;
  border-color: var(--color-accent-warm);
  color: var(--color-text-primary);
}
```

### 2.4 Card System

#### Target State
Cards should feel like physical objects — paper-like with subtle depth and soft edges.

```css
.section-card {
  padding: 1.75rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 16px;
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.7) 0%,
    rgba(255, 255, 255, 0.5) 100%
  );
  backdrop-filter: blur(8px);
  box-shadow:
    0 1px 1px rgba(0, 0, 0, 0.02),
    0 4px 8px rgba(0, 0, 0, 0.02),
    0 16px 32px rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
}

.section-card:hover {
  box-shadow:
    0 2px 2px rgba(0, 0, 0, 0.02),
    0 8px 16px rgba(0, 0, 0, 0.03),
    0 24px 48px rgba(0, 0, 0, 0.03);
}

/* Elevated card — for important content blocks */
.section-card--elevated {
  background: rgba(255, 255, 255, 0.85);
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.03),
    0 12px 24px rgba(0, 0, 0, 0.04);
}

/* Inset card — for nested content, less prominent */
.section-card--inset {
  background: rgba(0, 0, 0, 0.02);
  border: none;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
}
```

---

## Phase 3: Viewport & Layout Considerations

### Design Philosophy for Viewport
Each phase should feel like a complete, breathable moment. On mobile, users should see a full "thought" without needing to scroll to understand context. On desktop, related content should cluster naturally with generous margins.

### 3.1 Mobile-First Single-Focus Sections

Each major input or decision should occupy its own visual "breath" on mobile:

```css
/* Mobile: Each section is a full breath */
.breath-section {
  min-height: 65vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2rem 1.5rem;
}

/* Content within a breath */
.breath-content {
  max-width: 100%;
}

@media (min-width: 768px) {
  .breath-section {
    min-height: auto;
    padding: 3rem 2rem;
  }

  .breath-content {
    max-width: 560px;
    margin: 0 auto;
  }
}

@media (min-width: 1200px) {
  .breath-content {
    max-width: 640px;
  }
}
```

### 3.2 Section Dividers

Replace abrupt section breaks with gentle visual transitions:

```css
.section-divider {
  height: 1px;
  margin: 3rem 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--color-border-soft) 20%,
    var(--color-border-soft) 80%,
    transparent 100%
  );
  border: none;
}

/* Or use a centered dot pattern for ritual feel */
.section-divider--dots {
  height: auto;
  background: none;
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem 0;
}

.section-divider--dots::before,
.section-divider--dots::after,
.section-divider--dots span {
  content: '';
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-base-2);
}
```

### 3.3 Scroll Behavior

Add gentle scroll snapping on mobile for phase sections:

```css
@media (max-width: 767px) {
  .phase-container {
    scroll-snap-type: y proximity;
  }

  .breath-section {
    scroll-snap-align: start;
    scroll-snap-stop: normal;
  }
}
```

---

## Phase 4: Transitions & Motion

### Design Philosophy for Motion
Movement should mirror breath — slow inhales, gentle pauses, soft exhales. Never abrupt. The UI should feel like it's settling into place, not snapping.

### 4.1 Page Transitions

Implement cross-fade transitions between phases using Framer Motion:

```tsx
// Suggested motion variants for phase transitions
const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
    filter: 'blur(4px)'
  },
  enter: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    }
  },
  exit: {
    opacity: 0,
    y: -4,
    filter: 'blur(2px)',
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    }
  }
};

// Wrap page content in AnimatePresence + motion.div
```

### 4.2 Section Reveals

Stagger content appearance within a phase:

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 12
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};
```

### 4.3 Micro-Interactions

**Button hover**: Gentle lift with soft shadow bloom (already exists, refine timing)

**Input focus**: Organic glow expands from border

**Chip selection**: Soft scale (1.02) with color fill

**Save confirmation**: Gentle scale pulse (1 → 1.03 → 1) with fade in

**Card appearance**: Fade in from slight blur

### 4.4 Transition Timing Reference

| Element | Duration | Easing |
|---------|----------|--------|
| Page transition | 600ms | ease-out-expo |
| Section reveal | 500ms | ease-out |
| Button hover | 250ms | ease-out |
| Input focus | 300ms | ease-out |
| Chip selection | 200ms | ease |
| Card hover | 300ms | ease-out |
| Progress update | 400ms | ease-out |

---

## Phase 5: Progress Reporting

### Design Philosophy for Progress
Progress should feel like a gentle unfolding, not a task checklist. Users should sense they're moving through a ritual, not completing a form.

### 5.1 Step Tracker Redesign

Replace the current pill-badge row with a more organic visualization:

**Option A: Stepping Stones**
Circular nodes connected by a soft gradient line, nodes fill with organic color as completed:

```css
.step-tracker {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 1.5rem 1rem;
}

.step-node {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-base-1);
  border: 2px solid var(--color-base-2);
  position: relative;
  transition: all 0.4s ease;
}

.step-node--active {
  width: 16px;
  height: 16px;
  background: var(--color-accent-organic);
  border-color: var(--color-accent-organic);
  box-shadow: 0 0 0 4px var(--color-accent-organic-glow);
}

.step-node--completed {
  background: var(--color-accent-organic);
  border-color: var(--color-accent-organic);
}

.step-connector {
  width: 32px;
  height: 2px;
  background: var(--color-base-1);
  transition: background 0.4s ease;
}

.step-connector--completed {
  background: linear-gradient(90deg, var(--color-accent-organic), var(--color-accent-organic));
}
```

**Option B: Breath Marks**
Abstract marks that suggest breath counts, filling in sequence:

```css
.breath-tracker {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.breath-mark {
  width: 24px;
  height: 6px;
  border-radius: 3px;
  background: var(--color-base-1);
  transition: all 0.5s ease;
}

.breath-mark--current {
  background: var(--color-accent-organic);
  width: 32px;
}

.breath-mark--completed {
  background: var(--color-accent-organic);
  opacity: 0.6;
}
```

### 5.2 In-Phase Progress

For sections with multiple inputs (like Calibration's proof/rehearsal/stretch), show subtle progress within the card:

```css
.phase-progress {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.phase-progress-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-base-1);
  transition: all 0.3s ease;
}

.phase-progress-dot--filled {
  background: var(--color-accent-organic);
}

.phase-progress-dot--current {
  background: var(--color-accent-warm);
  box-shadow: 0 0 0 2px var(--color-accent-warm-glow);
}
```

### 5.3 Save Confirmation

Replace the banner with a gentler inline confirmation:

```css
.save-confirmation {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-accent-organic-soft);
  border-radius: 999px;
  color: var(--color-accent-organic);
  font-size: 0.875rem;
  animation: saveAppear 0.4s ease;
}

@keyframes saveAppear {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.save-confirmation-icon {
  width: 16px;
  height: 16px;
  color: var(--color-accent-organic);
}
```

---

## Phase 6: Immersive VOID Refinements

The VOID phase is the emotional center. Enhance its meditative quality.

### 6.1 Ambient Background

Add subtle, slow-moving organic gradients during the hold:

```css
.void-ambient {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(
      ellipse 80% 50% at 20% 30%,
      var(--color-accent-organic-glow) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse 60% 60% at 80% 70%,
      var(--color-accent-warm-glow) 0%,
      transparent 50%
    );
  animation: voidDrift 30s ease-in-out infinite alternate;
}

@keyframes voidDrift {
  0% {
    opacity: 0.3;
    transform: scale(1) rotate(0deg);
  }
  100% {
    opacity: 0.5;
    transform: scale(1.05) rotate(3deg);
  }
}
```

### 6.2 Timer Display

Make the timer feel less like a countdown and more like a gentle marker:

```css
.void-timer {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  font-weight: 300;
  letter-spacing: 0.1em;
  color: var(--color-text-secondary);
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

/* Pulse on minute boundaries */
.void-timer--pulse {
  animation: timerPulse 1s ease;
}

@keyframes timerPulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
```

### 6.3 Label Dissolution

Enhance the existing dissolution with more organic decay:

```css
.dissolve-word {
  transition:
    opacity 8s ease-in-out,
    filter 8s ease-in-out,
    transform 8s ease-in-out,
    letter-spacing 8s ease-in-out;
}

.dissolve-word--phase-2 {
  letter-spacing: 0.05em;
  transform: scale(1.02);
}

.dissolve-word--phase-3 {
  letter-spacing: 0.15em;
  filter: blur(8px);
  opacity: 0;
  transform: scale(1.05) translateY(-4px);
}
```

---

## Phase 7: Mobile-Specific Refinements

### 7.1 Touch Targets

Ensure all interactive elements meet 44px minimum:

```css
.chip, .btn-flow, .btn-quiet {
  min-height: 44px;
  min-width: 44px;
}

@media (max-width: 767px) {
  .chip {
    padding: 0.625rem 1.25rem;
  }
}
```

### 7.2 Bottom Safe Area Actions

Refine the mobile actions bar:

```css
.mobile-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem 1.5rem;
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(250, 250, 242, 0.9) 20%,
    rgba(250, 250, 242, 0.98) 100%
  );
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--color-border-soft);
  display: flex;
  gap: 1rem;
}
```

### 7.3 Scroll Indicators

Add subtle fade hints when content continues:

```css
.scroll-fade-bottom {
  position: relative;
}

.scroll-fade-bottom::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    var(--color-bg) 100%
  );
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.scroll-fade-bottom--active::after {
  opacity: 1;
}
```

---

## Implementation Order

### Batch 1: Foundation (Low Risk)
1. Add new CSS variables for expanded color palette
2. Update focus states to use organic accent
3. Soften existing shadows and borders
4. Add section dividers

### Batch 2: Components (Medium Risk)
5. Implement `.btn-flow` and `.btn-quiet` button tiers
6. Refine chip styles
7. Update card styles
8. Enhance input panel focus states

### Batch 3: Motion (Medium Risk)
9. Add page transition variants to App.tsx
10. Implement section reveal stagger
11. Refine micro-interactions timing

### Batch 4: Progress (Low Risk)
12. Redesign step tracker
13. Add in-phase progress indicators
14. Refine save confirmation

### Batch 5: Immersive (Low Risk)
15. Add VOID ambient background
16. Enhance dissolution animation
17. Refine timer display

### Batch 6: Polish (Low Risk)
18. Mobile touch target audit
19. Bottom action bar refinement
20. Scroll indicators
21. Cross-browser testing

---

## Testing Checklist

- [ ] All interactive elements have 44px+ touch targets on mobile
- [ ] Color contrast meets WCAG AA (4.5:1 for normal text)
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Focus states are clearly visible
- [ ] Page transitions don't cause layout shift
- [ ] Backdrop-filter fallbacks exist for unsupported browsers
- [ ] Performance: animations at 60fps on mid-range devices
- [ ] VOID ambient doesn't impact timer accuracy

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/styles/ui-kit.css` | New variables, button tiers, chip updates, card refinements |
| `src/styles/index.css` | Section dividers, scroll indicators, mobile actions |
| `src/App.tsx` | Page transition AnimatePresence wrapper |
| `src/components/ui/StackedButton.tsx` | Subtle breathing animation |
| `src/components/StepTracker.tsx` | Stepping stones redesign |
| `src/components/SaveBanner.tsx` | Inline confirmation style |
| `src/scenes/VOID.tsx` | Ambient background, enhanced dissolution |
| `src/components/ImmersiveHoldSpace.tsx` | Timer refinements |
| `src/components/MobileActions.tsx` | Gradient blur bar |

---

## Design Tokens Summary

```css
:root {
  /* Existing (keep) */
  --color-bg: #fafaf2;
  --color-base-1 through base-5: /* keep */

  /* New organic palette */
  --color-accent-organic: #7B9E87;
  --color-accent-organic-glow: rgba(123, 158, 135, 0.15);
  --color-accent-organic-soft: rgba(123, 158, 135, 0.08);
  --color-accent-warm: #C4A484;
  --color-accent-warm-glow: rgba(196, 164, 132, 0.15);
  --color-accent-soft: #4A7FD4;
  --color-accent-soft-glow: rgba(74, 127, 212, 0.12);
  --color-cream-warm: #F5F3E8;
  --color-cream-cool: #F8F9F5;
  --color-border-soft: rgba(175, 175, 167, 0.3);
  --color-border-focus: rgba(123, 158, 135, 0.4);

  /* Motion timing */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 200ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --duration-page: 600ms;
}
```

---

## Accessibility Notes

- Maintain all existing ARIA labels and roles
- Ensure new color combinations pass contrast requirements:
  - Organic accent on cream: 4.5:1+ for text
  - Warm accent for decorative use only (not critical information)
- All animations must have `prefers-reduced-motion` fallbacks
- Focus indicators must remain visible (2px minimum, high contrast)
- Touch targets: 44px minimum on mobile, 32px minimum on desktop
