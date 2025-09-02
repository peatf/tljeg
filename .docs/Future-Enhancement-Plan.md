# Future Enhancement Plan — Audio & Haptics (Not Immediate)

Purpose: Track sensory depth features to enhance immersion. Implement only after core UX, accessibility, and onboarding improvements ship.

## Features
- Ambient Audio
  - Gentle looping soundscapes with volume control.
  - Offline caching of tracks; opt‑in on first use.

- Breathing Metronome
  - Soft tone cues for inhale/hold/exhale patterns (e.g., 2‑2‑4; 4‑4‑4‑4).
  - Sync with on‑screen stages and timers.

- Audio Guidance
  - Short voice prompts to orient the user in each scene.
  - Optional transcript and captions; toggle per scene.

- Haptic Feedback
  - Discrete taps for stage transitions; gentle pulses for holds.
  - Intensity presets; device capability detection and graceful fallback.

## Technical Approach
- Web Audio API for precise timing; pre‑decode buffers to prevent pops.
- Service Worker prefetch for audio assets; streaming fallback when online.
- Vibration API for haptics (aware of iOS/Safari limitations). Consider device‑specific patterns and opt‑out.
- Global `SensoryController` to coordinate audio/haptics with timers.

## UX & Accessibility
- Default off; explicit opt‑in with clear controls and quick mute.
- Respect `prefers-reduced-motion` and reduced sensory preference; master “Low stimulation” mode disables all cues.
- Provide visual equivalents and captions for guidance.

## Risks & Mitigations
- Browser limitations: test across iOS/Android; provide no‑op fallbacks.
- Distraction risk: keep volume low; minimalistic tones; easy mute.
- Asset size: compress audio; lazy load; allow user to download for offline.

## Acceptance Criteria (per feature)
- Toggle in Settings; persists across sessions.
- Works offline once enabled; no crashes or timing drift beyond 100ms.
- Can be disabled quickly from any timer screen.

## Not in Scope Now
- Multi‑voice guidance, complex sound mixing, spatial audio.

