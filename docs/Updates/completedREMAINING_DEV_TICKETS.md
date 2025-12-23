# Remaining Dev Tickets - App Critique Implementation

**Status**: Outstanding features from App Critique & Implementation Feedback that require additional development.

**Overall Progress**: 75% Complete - Core UX overhaul implemented, remaining items are enhanced interactions and cross-scene integrations.

---

## CALIBRATION TICKETS

### Ticket CAL-1: Evidence Shelf Timestamps + Trait Tags
**Priority**: High
**Files**: `src/scenes/Calibration.tsx`, `src/storage/storage.ts`
**Description**: Saved proof items should display timestamp and associated trait tag.

**Tasks**:
- [ ] Update `addContext()` function to store trait information
- [ ] Modify Evidence Shelf display to show `created_at` timestamp 
- [ ] Add trait tag from latest selected trait in Clarity
- [ ] Style tags next to item text with visual distinction

**Acceptance**: Items show "2 hours ago • Calm" format with timestamp and trait tag.

### Ticket CAL-2: Proof Field Placeholder  
**Priority**: Low
**Files**: `src/scenes/Calibration.tsx`
**Description**: Update proof field placeholder text per feedback.

**Tasks**:
- [ ] Change placeholder from current text to: "Ex: I calmly answered an email while tired."

**Acceptance**: Placeholder text matches specification exactly.

### Ticket CAL-3: Pull Overlaps from Clarity
**Priority**: High  
**Files**: `src/scenes/Calibration.tsx`, `src/scenes/Clarity.tsx`, `src/storage/storage.ts`
**Description**: Preload overlaps discovered in Clarity into Calibration with expansion prompts.

**Tasks**:
- [ ] Update Clarity save function to store Step 1, Step 2, and Step 3 overlap data
- [ ] Create `listEntries('clarity')` call in Calibration to fetch latest overlaps
- [ ] Display preloaded overlaps with prompts:
  - "Earlier you noticed: '[overlap text]'"
  - "Where else are you already being this way?"
  - "How does this overlap prove that this identity is already alive in you?"
- [ ] Save expansions to Evidence Shelf as new entries

**Acceptance**: Overlaps from Clarity appear in Calibration and can be expanded into Evidence.

---

## IMPLEMENTATION (FORMERLY RUNTIME) TICKETS

### Ticket IMP-1: Inspiration Mechanics
**Priority**: Medium
**Files**: `src/scenes/Implementation.tsx`, `src/storage/export.ts` (new)
**Description**: Allow quick-save of notes or calendar events if inspiration arises later.

**Tasks**:
- [ ] Add "Save to Calendar" button that downloads ICS file
- [ ] Add "Save a Note" button that stores in release notes table  
- [ ] Add "I'll add this later" control that creates local reminder
- [ ] Implement ICS export helper function
- [ ] Store reminders in localStorage with notification system

**Acceptance**: Users can save notes, download ICS events, or store reminders for later.

### Ticket IMP-2: Specs Progress Dots
**Priority**: Medium
**Files**: `src/scenes/Implementation.tsx`, `src/storage/storage.ts`
**Description**: Show daily completion indicators (dots) for micro-acts in specs list.

**Tasks**:
- [ ] Add progress visualization to spec display
- [ ] Derive completion status from release notes  
- [ ] Show dots/indicators per micro-act completion
- [ ] Add visual feedback for completed vs pending micro-acts

**Acceptance**: Users see visual progress indicators for each micro-act in their specs.

### Ticket IMP-3: Repeat Spec Functionality
**Priority**: Medium
**Files**: `src/scenes/Implementation.tsx`, `src/storage/storage.ts`
**Description**: Add "Repeat" action to copy a prior spec into a new one.

**Tasks**:
- [ ] Add "Repeat" button to each spec in the specs list
- [ ] Implement clone functionality that copies micro-acts and principle
- [ ] Create new spec with cloned data and fresh timestamp
- [ ] Update specs list after repeat action

**Acceptance**: Users can tap "Repeat" to clone a prior spec into a new daily spec.

---

## VOID TICKETS

### Ticket VOID-1: Dissolve Animations
**Priority**: Low (Polish)
**Files**: `src/scenes/VOID.tsx`
**Description**: Add subtle fade/blur/scatter animation during dissolve with reduced motion support.

**Tasks**:
- [ ] Import `useReducedMotion` hook
- [ ] Add CSS transitions for label dissolution
- [ ] Implement fade/blur effects on stage transitions
- [ ] Add scatter/particle effect (optional, respect reduced motion)
- [ ] Ensure animations respect `prefers-reduced-motion`

**Acceptance**: Motion appears for users without reduced motion preference; others see instant transitions.

---

## RESETS TICKETS  

### Ticket RST-1: Interactive Reset Cards
**Priority**: High
**Files**: `src/scenes/Resets.tsx`, `src/scenes/Clarity.tsx`, `src/scenes/Calibration.tsx`, `src/scenes/VOID.tsx`
**Description**: Replace current reset list with interactive cards that deep-link into relevant scenes.

**Tasks**:
- [ ] Remove current list-based reset display
- [ ] Create three interactive cards:
  - **Halve the distance** → Navigate to Clarity with gentler trait suggestions preloaded
  - **Rest & VOID** → Navigate to VOID with timer pre-started  
  - **Stay with overlap** → Navigate to Calibration with "Proof" field focused
- [ ] Implement navigation with state pre-configuration
- [ ] Add focus management for accessibility
- [ ] Remove FAQ content (already moved to separate scene)

**Acceptance**: Tapping a card navigates to target scene with appropriate state/focus.

### Ticket RST-2: Deep Link State Management
**Priority**: Medium
**Files**: `src/scenes/Clarity.tsx`, `src/scenes/Calibration.tsx`, `src/scenes/VOID.tsx`  
**Description**: Support URL parameters or navigation state for reset deep links.

**Tasks**:
- [ ] Add URL parameter support or navigation state handling
- [ ] Clarity: Support `?mode=gentle` to show softer trait suggestions
- [ ] Calibration: Support `?focus=proof` to auto-focus proof field
- [ ] VOID: Support `?autostart=true` to begin timer immediately
- [ ] Preserve existing functionality when accessed normally

**Acceptance**: Reset cards can pre-configure target scenes appropriately.

---

## STORAGE TICKETS

### Ticket STG-1: Trait and Date Filters
**Priority**: Medium  
**Files**: `src/scenes/Storage.tsx`, `src/storage/db.ts`
**Description**: Implement filters by trait tag or date for viewing stored Evidence and specs.

**Tasks**:
- [ ] Add filter UI above the current storage lists
- [ ] Implement trait filter dropdown (populate from stored trait tags)
- [ ] Implement date range picker or date filter options
- [ ] Add live filtering functionality for Evidence (contexts) and specs
- [ ] Maintain export/import and counts functionality
- [ ] Update storage queries to support filtering

**Acceptance**: Users can filter storage view by trait tag and date; lists update in real-time.

### Ticket STG-2: Enhanced Storage Display
**Priority**: Low
**Files**: `src/scenes/Storage.tsx`  
**Description**: Update storage display to show trait tags and timestamps more prominently.

**Tasks**:
- [ ] Redesign storage item display to highlight trait associations
- [ ] Show clear timestamp formatting (e.g., "2 days ago")
- [ ] Group items by trait or date when filters are applied
- [ ] Add summary statistics (e.g., "12 items tagged 'Calm'")

**Acceptance**: Storage view clearly shows trait relationships and temporal patterns.

---

## CROSS-SECTION FLOW TICKETS

### Ticket FLOW-1: VOID → Implementation Inspiration Flow
**Priority**: Medium
**Files**: `src/scenes/VOID.tsx`, `src/scenes/Implementation.tsx`, `src/storage/storage.ts`
**Description**: After VOID, allow capturing inspiration that flows into Implementation as suggested micro-acts.

**Tasks**:
- [ ] Add optional "inspiration" field to VOID after reflection
- [ ] Store inspiration with timestamp and session ID
- [ ] Surface inspiration as micro-act suggestion in Implementation for same day
- [ ] Add clear visual indication that suggestion came from VOID session

**Acceptance**: Inspiration saved in VOID appears as micro-act suggestion in Implementation.

### Ticket FLOW-2: Enhanced Safety → Implementation Flow
**Priority**: Low (Already partially implemented)
**Files**: `src/scenes/Safety.tsx`, `src/scenes/Implementation.tsx`
**Description**: Enhance the existing Safety needs → Implementation frictions flow.

**Tasks**:
- [ ] Add visual indication in Implementation when frictions come from Safety
- [ ] Support multiple unmet needs (currently only takes latest needsText)
- [ ] Add timestamp/recency filtering for Safety-derived frictions

**Acceptance**: Enhanced visual feedback and support for multiple Safety-derived frictions.

---

## TESTING TICKETS

### Ticket TEST-1: Update Tests for New Features
**Priority**: High
**Files**: `src/__tests__/`, various test files
**Description**: Add test coverage for new multi-label VOID, Clarity entry points, and cross-scene flows.

**Tasks**:
- [ ] Add tests for VOID multiple label dissolution
- [ ] Test Clarity expandable entry points
- [ ] Test Safety → Implementation friction flow
- [ ] Test Clarity → Calibration overlap flow (when implemented)
- [ ] Update existing tests that may be affected by UI changes

**Acceptance**: Test suite passes with good coverage of new features.

---

## POLISH TICKETS

### Ticket POL-1: Accessibility Audit
**Priority**: Medium
**Files**: All scene files
**Description**: Comprehensive accessibility review of new features.

**Tasks**:
- [ ] Audit expandable details elements in Clarity for screen reader support
- [ ] Review ARIA labels for multi-label VOID interface  
- [ ] Test keyboard navigation for new interactive elements
- [ ] Verify focus management in deep-linked reset flows
- [ ] Add missing `aria-describedby` relationships

**Acceptance**: All new features meet WCAG 2.1 AA accessibility standards.

### Ticket POL-2: Performance Optimization
**Priority**: Low
**Files**: Various
**Description**: Optimize performance for new features.

**Tasks**:
- [ ] Debounce ML trait suggestions in Clarity
- [ ] Optimize re-renders in VOID label dissolution
- [ ] Review bundle size impact of new features
- [ ] Add loading states for async operations

**Acceptance**: New features maintain app performance standards.

---

## IMPLEMENTATION NOTES

**Total Estimated Dev Time**: 3-4 weeks for complete implementation

**Priority Order**:
1. **High Priority**: CAL-1, CAL-3, RST-1, STG-1, TEST-1 (Core functionality)
2. **Medium Priority**: IMP-1, IMP-2, IMP-3, RST-2, FLOW-1, POL-1 (Enhanced interactions) 
3. **Low Priority**: CAL-2, VOID-1, STG-2, FLOW-2, POL-2 (Polish and optimization)

**Dependencies**:
- CAL-3 depends on enhanced Clarity save functionality
- RST-2 depends on RST-1 completion
- FLOW-1 requires VOID reflection enhancement
- TEST-1 should be done incrementally with each feature

**Architecture Notes**:
- Consider adding a shared state management solution if cross-scene flows become complex
- URL parameters for deep linking may require router configuration updates
- ICS export functionality should be thoroughly tested across different calendar applications
CALIBRATION TICKETS

Ticket CAL-4: Calibration Flow Restructure

Priority: High
Files: src/scenes/Calibration.tsx, src/storage/storage.ts

Purpose: Current Calibration feels like scattered widgets. Needs to match explainer: proof → rehearsal → friction.

UI Flow (in order):
	1.	Section 1: Spot Your Proof
	•	Label: “Proof that it’s already you”
	•	Helper: “Capture one small way you already lived this trait today.”
	•	Input type: multi-line text.
	•	Placeholder: "Ex: I spoke calmly in a tense meeting."
	•	Save button: “Save Proof”
	2.	Section 2: Practice in Daily Life
	•	Label: “Rehearse your trait in ordinary life”
	•	Helper: “Pick a tiny moment (kitchen, inbox, commute). Practice embodying it for 60 seconds.”
	•	Input: dropdown of daily contexts (kitchen, commute, email, bedtime, custom).
	•	Save button: “Save Rehearsal”
	3.	Section 3: Clear Tomorrow’s Friction
	•	Label: “Make it easier”
	•	Helper: “Name one obstacle you can remove tomorrow so this identity feels natural.”
	•	Input: single-line text.
	•	Placeholder: "Ex: put phone in another room before bed."
	•	Save button: “Save Friction”

Storage Behavior:
	•	Save entries as { type: 'proof' | 'rehearsal' | 'friction', text: string, trait: currentTrait, created_at: timestamp }.
	•	Frictions get routed to Implementation scene (see FLOW tickets).

State Handling:
	•	At least one proof required before allowing rehearsal/friction saves.
	•	Multiple entries per type allowed.

Acceptance: User sees clear 3-step arc. Entries save with correct type + trait. Frictions appear in Implementation next day.

⸻

VOID TICKETS

Ticket VOID-2: VOID Ritual State Machine

Priority: High
Files: src/scenes/VOID.tsx, src/state/session.ts, src/storage/storage.ts

Purpose: Replace filler VOID flow with structured ritual.

State Machine:
	1.	enter_labels → User inputs labels.
	•	Label input field: “What labels feel heavy right now?”
	•	Multi-tag input, placeholder: "failure, tired, too much…".
	2.	choose_anchor → User selects an anchor.
	•	Options: Breath 2-2-4, Breath steady 4, Count 1-2-3-4, Stillness, Custom.
	3.	hold → Timer runs.
	•	Default 90s.
	•	Shows anchor.
	•	Controls: Pause/Resume, End early.
	•	Keyboard: Space toggles pause, Esc ends with confirm.
	4.	release → Labels dissolve animation (fade/blur/scatter, staggered by 300ms).
	5.	integration → Reflection & possibility.
	•	Field 1: “What feels different now?”
	•	Placeholder: "Ex: chest softer, face relaxed."
	•	Field 2: “What feels possible now?”
	•	Placeholder: "Ex: send the email."
	•	Save button: “Save VOID session”.

Storage Behavior:
	•	VoidSession object:

{
  id: string,
  created_at: string,
  labels: string[],
  anchor: { type: string, custom?: string },
  hold_seconds: number,
  reflection: string,
  possibility: string
}

	•	Route reflection to Evidence Shelf tagged void.
	•	Route possibility to Implementation as suggested micro-act.

Acceptance: User can move linearly through VOID ritual. Session saved with all fields. Inspiration surfaces in Implementation.

⸻

Ticket VOID-3: Dissolve Animations

Priority: Medium
Files: src/components/DissolveWord.tsx

Behavior:
	•	Each label dissolves in 3 phases (soften → blur → fade).
	•	Timing: 30s soften, 30s blur, 30s fade.
	•	Stagger start per label by 300ms.
	•	Reduced-motion users: fade only.

Acceptance: Labels visibly dissolve. Reduced-motion path works.

⸻

CLARITY TICKETS

Ticket CLA-1: Integrated Overlap Flow

Priority: High
Files: src/scenes/Clarity.tsx, src/storage/storage.ts

Purpose: “Find your overlap” currently feels bolted on. Needs integration.

UI Flow:
Correct subtitle: “Clarity means uncovering the identity shift that calls you. This can surface from desire, tension, or even envy.”


	•	After user chooses trait, display transition text:
“Now, notice where this trait is already alive in you. This overlap turns clarity into proof.”
	•	Field: multi-line input. Placeholder: "Ex: I already feel calm when cooking dinner."
	•	Save button: “Save Overlap”.

Storage Behavior:
	•	Save overlap as { type: 'overlap', text, trait, created_at }.
	•	Route overlaps to Calibration as preloaded proofs.

Acceptance: User sees natural bridge from trait → overlap. Saved overlaps appear in Calibration.

⸻

SAFETY TICKETS

Ticket SAF-1: Expanded Safety Awareness

Priority: Medium
Files: src/scenes/Safety.tsx, src/storage/storage.ts

Purpose: Current flow is too thin. Needs depth to actually ground user.

UI Flow:
	1.	Consent Check: “Do I feel safe enough to begin?” (Yes / Not yet).
	•	If “Not yet” → prompt: “What would help me feel safer?” (text input).
	2.	Body Scan:
	•	Button: “Start 30s scan”.
	•	During timer: show rotating cues: “Notice your breath. Notice tension. Notice weight of your body.”
	3.	Reflection:
	•	Field: “Where in your body do you feel ready/not ready?” (multi-line).
	4.	Environment Anchors:
	•	Options: Phone silent, Door closed, Water nearby, Warmth, Custom.

Storage Behavior:
	•	Save unmet needs as { type: 'friction', source: 'safety', text, created_at }.
	•	Save reflections tagged safety.

Acceptance: Safety guides user into awareness. Multiple unmet needs possible. Frictions appear in Implementation.

⸻

FLOW TICKETS

Ticket FLOW-3: Cross-Scene Data Routing

Priority: High
Files: src/storage/storage.ts, src/scenes/*

Purpose: Make sections feel connected instead of siloed.

Rules:
	•	Safety unmet needs → Implementation frictions.
	•	Clarity overlaps → Calibration preloaded proofs.
	•	Calibration frictions → Implementation frictions.
	•	VOID reflections → Evidence Shelf (void).
	•	VOID possibility → Implementation suggested micro-act.

Acceptance: User journey feels continuous. Saved data auto-flows into next scene.

