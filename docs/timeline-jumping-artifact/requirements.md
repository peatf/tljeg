# Requirements: Timeline Jumping Digital Artifact PWA

## Purpose & Scope

Create a privacy-first Progressive Web App that transforms the Timeline Jumping Embodiment Guide into an interactive, somatic practice tool. The app operates entirely offline, stores data locally, and uses on-device ML to provide personalized guidance without any external dependencies.

## User Stories

### US-001: Mode Selection
**AS** a user  
**I WANT** to choose between text-only and interactive modes  
**SO THAT** I can engage with the content at my preferred depth  

**Acceptance Criteria:**
- WHEN I first open the app THEN I see two clear options: "Text-Only Version" and "Digital Artifact"
- WHEN I select Text-Only THEN I can read all 12 pages in a calm, distraction-free interface
- WHEN I select Digital Artifact THEN I access the full 7-scene interactive experience
- WHEN I'm in either mode THEN I can return to mode selection from settings

### US-002: Somatic Safety Check
**AS** a practitioner  
**I WANT** to ensure I feel safe before beginning practice  
**SO THAT** I can engage authentically without forcing  

**Acceptance Criteria:**
- WHEN I enter Safety scene THEN I see optional environment setters (Do Not Disturb, Blanket, etc.)
- WHEN I complete 30-second somatic scan THEN I'm asked "Is it kind to proceed?"
- WHEN I select "Not yet" THEN I can reflect on what's needed with ML-suggested support
- WHEN a part says no THEN I can dialogue with and acknowledge that part

### US-003: Trait Extraction & Embodiment
**AS** a practitioner  
**I WANT** to identify and rehearse desired traits  
**SO THAT** I can embody my chosen self somatically  

**Acceptance Criteria:**
- WHEN I enter free text about heroes/envy THEN ML suggests relevant trait chips
- WHEN I select a trait THEN I receive 45-second guided posture/breath cues
- WHEN I complete rehearsal THEN I identify where this trait already exists in my life
- WHEN I'm a new user THEN cold-start ML provides suggestions from seed corpus

### US-004: Identity Normalization
**AS** a practitioner  
**I WANT** to make my chosen identity feel ordinary  
**SO THAT** it becomes sustainable to embody  

**Acceptance Criteria:**
- WHEN I enter Calibration THEN I record proof of chosen trait in daily life
- WHEN I select mundane context THEN I receive 60-second micro-act guidance
- WHEN I identify friction THEN ML suggests ways to reduce it tomorrow
- WHEN I have past data THEN ML surfaces my previous contexts and patterns

### US-005: VOID Navigation
**AS** a practitioner  
**I WANT** to release identity and enter neutrality  
**SO THAT** I can access timeline shifting potential  

**Acceptance Criteria:**
- WHEN I list self-labels THEN they're reframed into neutral language by ML
- WHEN I two-finger tap THEN 2-minute neutral hold begins with dimmed screen
- WHEN hold completes THEN I reflect on "What shifted without effort?"
- WHEN screen dims THEN rotating anchor words appear with sensory cues

### US-006: Operating Specification
**AS** a practitioner  
**I WANT** to define concrete actions from chosen identity  
**SO THAT** I can operate as my desired self  

**Acceptance Criteria:**
- WHEN I enter Runtime THEN I define label, principle, 2 micro-acts, 1 friction
- WHEN I log actions THEN they append to chronological Release Notes
- WHEN I need suggestions THEN ML offers acts from seed corpus or my history
- WHEN I review logs THEN I see clean timeline of all past operations

### US-007: Audio Integration
**AS** a practitioner  
**I WANT** to import and use guided audio  
**SO THAT** I can enhance practice with purchased content  

**Acceptance Criteria:**
- WHEN I see Import Audio slot THEN I can load any local MP3 file
- WHEN audio imports THEN it's cached offline for future use
- WHEN audio is cached THEN playback works without internet
- WHEN I want support clips THEN optional 20s clips can also be cached

### US-008: Data Privacy & Control
**AS** a privacy-conscious user  
**I WANT** complete control over my data  
**SO THAT** I trust the app with sensitive reflections  

**Acceptance Criteria:**
- WHEN I use the app THEN no data ever leaves my device
- WHEN I want to see my data THEN "Reveal Data" shows plaintext export
- WHEN I uninstall THEN all data is permanently removed
- WHEN app updates THEN my local data remains untouched

## Technical Requirements

### TR-001: Progressive Web App
- Must be installable to home screen on all platforms
- Must work identically online and offline
- Must cache all assets via Service Worker
- Must support gesture controls and haptic feedback

### TR-002: Offline ML Processing
- Must use transformers.js with quantized MiniLM models
- Must run ML in Web Worker to prevent UI blocking
- Must maintain two-layer system: seed corpus + personalization
- Must process text in <500ms on average devices

### TR-003: Local Storage
- Must use IndexedDB for all user data
- Must never transmit data externally
- Must provide plaintext export capability
- Must handle storage quota gracefully

### TR-004: Performance
- Must load initial scene in <2 seconds
- Must animate at 60fps with 150-200ms transitions
- Must respect prefers-reduced-motion
- Must work on devices with 2GB RAM

### TR-005: Accessibility
- Must support screen readers for text-only mode
- Must provide keyboard navigation alternatives
- Must maintain WCAG 2.1 AA contrast ratios
- Must offer haptic/audio alternatives for visual cues