# Tasks: Timeline Jumping Digital Artifact PWA

## Phase 1: Project Setup & Infrastructure

- [ ] Initialize React TypeScript project with Vite
  - Reference: TR-001 (PWA requirement)
  - Acceptance: Dev server runs, TypeScript configured

- [ ] Configure PWA manifest and icons
  - Reference: TR-001
  - Acceptance: Manifest valid, all icon sizes present

- [ ] Set up Workbox service worker
  - Reference: TR-001, Architecture Overview
  - Acceptance: Assets cached, offline mode works

- [ ] Configure IndexedDB with Dexie.js
  - Reference: TR-003, Data Models
  - Acceptance: Database schema created, CRUD operations work

- [ ] Set up CSS modules with design tokens
  - Reference: Visual Guidelines
  - Acceptance: Bone/ink/slate palette applied, typography system works

## Phase 2: Core Navigation & Modes

- [ ] Create mode selection screen
  - Reference: US-001
  - Acceptance: Two buttons, mode stored in session

- [ ] Implement text-only reader for 12 pages
  - Reference: US-001
  - Acceptance: All guide pages readable, clean typography

- [ ] Build Home/Flow Map with 7 scenes
  - Reference: Scene Manager interface
  - Acceptance: Visual flow diagram, current position indicator

- [ ] Implement scene navigation system
  - Reference: SceneManager interface
  - Acceptance: Navigate between scenes, progress tracked

- [ ] Add settings panel with mode switch
  - Reference: US-001
  - Acceptance: Can return to mode selection

## Phase 3: Safety Scene Implementation

- [ ] Create environment setter chips UI
  - Reference: US-002, Safety scene flow
  - Acceptance: Toggleable chips, state persisted

- [ ] Build 30-second somatic scan timer
  - Reference: US-002
  - Acceptance: Timer with breath cues, completion tracked

- [ ] Implement consent check with 3 paths
  - Reference: US-002
  - Acceptance: All paths functional, data saved

- [ ] Add "Not yet" reflection with free text
  - Reference: US-002, SceneData model
  - Acceptance: Text input saved, ML suggestions shown

- [ ] Create part dialogue interface
  - Reference: US-002
  - Acceptance: Can name and acknowledge parts

## Phase 4: Clarity Scene Implementation

- [ ] Build trait extraction prompts UI
  - Reference: US-003, Clarity flow
  - Acceptance: Guide prompts displayed, answers saved

- [ ] Create trait chip selection interface
  - Reference: US-003
  - Acceptance: Chips selectable, chosen trait highlighted

- [ ] Implement 45-second somatic rehearsal
  - Reference: US-003
  - Acceptance: Timer with posture/breath cues

- [ ] Add overlap identification interface
  - Reference: US-003
  - Acceptance: Can list where trait exists today

- [ ] Store clarity data in IndexedDB
  - Reference: SceneData model
  - Acceptance: All clarity data persisted

## Phase 5: Calibration Scene Implementation

- [ ] Create evidence shelf interface
  - Reference: US-004
  - Acceptance: Can add proof of trait, displayed cleanly

- [ ] Build context selector for normalization
  - Reference: US-004
  - Acceptance: Mundane contexts available, custom input works

- [ ] Implement 60-second rehearsal with pendulation
  - Reference: US-004
  - Acceptance: Guided micro-act with timing

- [ ] Add friction removal interface
  - Reference: US-004
  - Acceptance: Can identify and plan friction reduction

- [ ] Persist calibration data
  - Reference: SceneData model
  - Acceptance: All inputs saved to IndexedDB

## Phase 6: VOID Scene Implementation

- [ ] Create de-labeling interface
  - Reference: US-005
  - Acceptance: Can list 2-3 labels/judgments

- [ ] Implement two-finger tap gesture
  - Reference: US-005, GestureController
  - Acceptance: Gesture recognized, triggers neutral hold

- [ ] Build 2-minute neutral hold experience
  - Reference: US-005
  - Acceptance: Screen dims, anchor words rotate

- [ ] Add post-void reflection input
  - Reference: US-005
  - Acceptance: Reflection saved, timestamp recorded

- [ ] Create sensory cue system
  - Reference: US-005
  - Acceptance: Light haptics or tones during hold

## Phase 7: Runtime Scene Implementation

- [ ] Build operating spec form
  - Reference: US-006
  - Acceptance: All fields (label, principle, acts, friction) work

- [ ] Create Release Notes timeline UI
  - Reference: US-006
  - Acceptance: Chronological log display, clean formatting

- [ ] Implement quick log interface
  - Reference: US-006
  - Acceptance: Can add actions with context

- [ ] Add log entry persistence
  - Reference: SceneData model
  - Acceptance: All logs saved, exportable

- [ ] Limit log history to 100 entries
  - Reference: Performance Optimizations
  - Acceptance: Old entries archived/removed

## Phase 8: ML Integration Setup

- [ ] Set up Web Worker for ML processing
  - Reference: TR-002, ML Service interface
  - Acceptance: Worker loads, communicates with main thread

- [ ] Integrate transformers.js library
  - Reference: TR-002, Tech Stack
  - Acceptance: Library loads in worker

- [ ] Load quantized MiniLM model
  - Reference: TR-002
  - Acceptance: Model loads, inference works

- [ ] Create seed corpus data structure
  - Reference: ML Seed Corpus model
  - Acceptance: Corpus loaded, accessible to ML

- [ ] Implement cold start trait suggestions
  - Reference: US-003, MLService interface
  - Acceptance: Returns suggestions without user data

## Phase 9: ML Feature Implementation

- [ ] Build trait extraction from free text
  - Reference: US-003, MLService
  - Acceptance: Text analyzed, relevant traits suggested

- [ ] Implement neutral language reframing
  - Reference: US-005, MLService
  - Acceptance: Labels converted to neutral observations

- [ ] Create context/friction suggestions
  - Reference: US-004, US-006
  - Acceptance: Relevant suggestions from seed corpus

- [ ] Add personalization layer
  - Reference: MLService personalized methods
  - Acceptance: Past user data influences suggestions

- [ ] Implement ML request rate limiting
  - Reference: Security Considerations
  - Acceptance: Max 10 requests per minute enforced

## Phase 10: Audio Integration

- [ ] Create audio import UI slot
  - Reference: US-007
  - Acceptance: File picker works, shows supported formats

- [ ] Implement audio file validation
  - Reference: US-007, Security
  - Acceptance: Only MP3/audio files accepted

- [ ] Build audio caching system
  - Reference: US-007, AudioManager
  - Acceptance: Audio stored in IndexedDB/Cache API

- [ ] Add audio playback controls
  - Reference: AudioManager interface
  - Acceptance: Play/pause/seek work offline

- [ ] Implement optional support clips
  - Reference: US-007
  - Acceptance: 20s clips can be cached and played

## Phase 11: Gesture & Tactile Features

- [ ] Implement gesture recognition system
  - Reference: GestureController interface
  - Acceptance: Gestures detected accurately

- [ ] Add haptic feedback API integration
  - Reference: TR-001, GestureController
  - Acceptance: Vibration on supported devices

- [ ] Create fallback for non-haptic devices
  - Reference: Design/Accessibility
  - Acceptance: Visual/audio alternatives work

- [ ] Map gestures to scenes
  - Reference: Scene-specific requirements
  - Acceptance: Each scene has primary gesture

- [ ] Add gesture tutorial/onboarding
  - Reference: User experience
  - Acceptance: First-time users learn gestures

## Phase 12: Data Privacy & Export

- [ ] Implement "Reveal Data" feature
  - Reference: US-008
  - Acceptance: Shows all data in plaintext

- [ ] Create data export to JSON
  - Reference: US-008, TR-003
  - Acceptance: Download complete data backup

- [ ] Add data clear functionality
  - Reference: US-008
  - Acceptance: Can delete all local data

- [ ] Implement session auto-save
  - Reference: Error Handling
  - Acceptance: Saves every 30 seconds

- [ ] Build data migration system
  - Reference: Error Handling
  - Acceptance: Handles schema updates gracefully

## Phase 13: Performance Optimization

- [ ] Implement code splitting for scenes
  - Reference: Performance Optimizations
  - Acceptance: Each scene lazy loaded

- [ ] Add virtual scrolling for logs
  - Reference: Performance Optimizations
  - Acceptance: Long lists perform smoothly

- [ ] Optimize initial load time
  - Reference: TR-004
  - Acceptance: TTI < 2 seconds

- [ ] Configure animation performance
  - Reference: TR-004
  - Acceptance: 60fps, respects reduced-motion

- [ ] Implement memory cleanup
  - Reference: Performance Optimizations
  - Acceptance: Unused data freed, <150MB usage

## Phase 14: Accessibility & Polish

- [ ] Add keyboard navigation
  - Reference: TR-005
  - Acceptance: All features keyboard accessible

- [ ] Implement screen reader support
  - Reference: TR-005
  - Acceptance: Text-only mode fully accessible

- [ ] Verify WCAG contrast ratios
  - Reference: TR-005
  - Acceptance: AA compliance confirmed

- [ ] Add loading states and skeletons
  - Reference: User experience
  - Acceptance: No jarring layout shifts

- [ ] Create error boundaries
  - Reference: Error Handling
  - Acceptance: Graceful error recovery

## Phase 15: Testing & Quality Assurance

- [ ] Write unit tests for components
  - Reference: Testing Strategies
  - Acceptance: 80% coverage

- [ ] Create integration tests for flows
  - Reference: Testing Strategies
  - Acceptance: All user stories tested

- [ ] Perform offline testing
  - Reference: Testing Strategies
  - Acceptance: Full functionality without network

- [ ] Test on low-end devices
  - Reference: TR-004
  - Acceptance: Works on 2GB RAM devices

- [ ] Validate ML performance
  - Reference: TR-002
  - Acceptance: <500ms inference time

## Phase 16: Reset/FAQ Scene

- [ ] Create expandable FAQ interface
  - Reference: Scene 7 requirements
  - Acceptance: Three options expand/collapse

- [ ] Implement "Halve the distance" logic
  - Reference: Reset scene flow
  - Acceptance: Highlights based on strain detection

- [ ] Add rest & re-enter flow
  - Reference: Reset scene
  - Acceptance: Guides back through VOID

- [ ] Build "Stay with overlap" guidance
  - Reference: Reset scene
  - Acceptance: Returns to Clarity overlaps

- [ ] Connect to ML strain detection
  - Reference: MLService
  - Acceptance: Detects "stuck", "forcing" keywords

## Phase 17: Deployment Preparation

- [ ] Configure CSP headers
  - Reference: Security Considerations
  - Acceptance: CSP properly restrictive

- [ ] Set up Brotli compression
  - Reference: Tech Stack
  - Acceptance: Assets compressed efficiently

- [ ] Create production build
  - Reference: Build configuration
  - Acceptance: Optimized bundle size

- [ ] Generate PWA assets
  - Reference: TR-001
  - Acceptance: All PWA requirements met

- [ ] Prepare deployment documentation
  - Reference: Project completion
  - Acceptance: Clear deployment instructions

## Phase 18: Final Validation

- [ ] Verify all user stories
  - Reference: All US-XXX requirements
  - Acceptance: Every story fully implemented

- [ ] Confirm technical requirements
  - Reference: All TR-XXX requirements
  - Acceptance: All technical specs met

- [ ] Validate offline functionality
  - Reference: Core requirement
  - Acceptance: 100% offline capable

- [ ] Test data privacy
  - Reference: US-008, privacy requirements
  - Acceptance: No external data transmission

- [ ] Complete accessibility audit
  - Reference: TR-005
  - Acceptance: WCAG 2.1 AA compliant