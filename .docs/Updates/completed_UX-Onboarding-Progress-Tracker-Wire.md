# Wireframe Notes — Stepper, Save Banner, Timer Button

Low‑fi description of immediate changes for reference during implementation.

1) StepTracker (top of scene)
- [✓] Safety  [●] Clarity  [○] Calibration  [○] VOID  [○] Implementation
- States: complete, active, pending. Clickable to navigate (optional).

2) SaveBanner (inline after Save)
- Icon ✓  “Saved. Ready for the next step?”
- Primary: “Continue to {NextScene}”  Secondary: “Stay here”
- Auto‑advance: off by default; if enabled, shows countdown “Continuing in 3s”.

3) TimerButton
- Primary button with label: “Start 30‑second scan”
- Subtext: “You can end early anytime.”
- After start: shows remaining time, Pause, End buttons; aria‑live updates.

