# AI Dev Prompt: Implement Radial Artifact Map with VOID as Central Anchor

## One-liner
Replace the current linear artifact map with a radial/orbital map where VOID is the centered anchor and all other nodes orbit around it with clear curved arrows that follow the sequence: Safety → Clarity → Calibration → VOID → Implementation → Resets.

## Plan (what I'll do next)
- Convert the map container to a square, responsive, relative-positioned layout.
- Compute node positions at runtime using trig and ResizeObserver.
- Generate cubic Bézier SVG arcs that curve outward from the center, compute control points to avoid the VOID collision, and use `marker-end` for arrowheads.
- Keep `ArtifactNode.tsx` behavior (animations, focus, navigation) and wire the new positions into `artifactFlow.ts` or compute them inside `ArtifactMap.tsx`.

## Requirements (extracted)
- VOID centered in container at all breakpoints
- Orbital positions for Safety, Clarity, Calibration, Implementation, Resets
- Curved arrows (Bézier/arcs) that follow sequence and avoid overlapping nodes
- Responsive layout (desktop/tablet/mobile) with icons sized via `clamp()`
- VOID ~1.5x larger than other nodes
- Preserve existing node behavior (Framer Motion, navigation, accessibility)

Keep this checklist visible while implementing and testing.

## Practical implementation details

### Container and positioning strategy
- Use a square container with `position: relative` and an aspect ratio of 1 so trig math stays simple and consistent across breakpoints.
- Place nodes using absolute positioning with transform centering: `left: xpx; top: ypx; transform: translate(-50%, -50%);`
- Suggest using ResizeObserver (or a small hook) to measure container size and recompute positions on resize/rotation.

Tailwind-friendly CSS (example utilities you can add in `src/styles/index.css` or as utility classes):

```css
.artifact-map-container {
  position: relative;
  width: 100%;
  max-width: 720px; /* adjust with breakpoints */
  aspect-ratio: 1 / 1;
  margin: 0 auto;
}

.artifact-node {
  position: absolute;
  transform: translate(-50%, -50%);
  /* pointer-events: auto - nodes remain interactive; arrows should be pointer-events:none */
}

.artifact-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* allow clicks through to nodes */
}
```

### Orbital coordinates (concrete angles)
Use degrees relative to 12:00 (0° at top) and convert to radians for Math.cos/sin which use 0° at positive x.

Suggested fixed angles (clock-face mapping):
- Safety: 300° (≈ 10 o'clock / -60°)
- Clarity: 30° (≈ 1:30 o'clock)
- Calibration: 240° (≈ 8 o'clock)
- Implementation: 120° (≈ 4 o'clock mirrored across center)
- Resets: 180° (6 o'clock)

Example position code (TypeScript):

```typescript
function deg2rad(deg: number) { return (deg * Math.PI) / 180; }

function polarToCartesian(cx: number, cy: number, radius: number, deg: number) {
  const rad = deg2rad(deg - 90); // shift so 0° is at top
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

// Use percentages of container to remain responsive
const radius = Math.min(width, height) * 0.35; // tweak per breakpoint
const center = { x: width / 2, y: height / 2 };
const positions = {
  safety: polarToCartesian(center.x, center.y, radius, 300),
  clarity: polarToCartesian(center.x, center.y, radius, 30),
  calibration: polarToCartesian(center.x, center.y, radius, 240),
  implementation: polarToCartesian(center.x, center.y, radius, 120),
  resets: polarToCartesian(center.x, center.y, radius, 180),
  void: center
};
```

Notes: use different `radius` per breakpoint. On small screens reduce the radius or switch to collapsed (vertical) layout.

### Arrows: cubic Bézier curves that arc outward
High-level approach:
- For arrow between A -> B compute midpoint M.
- Compute a perpendicular offset vector at M that points away from center to 'bulge' the curve outward.
- Set cubic Bézier control points C1 and C2 using offsets from A and B toward M + perpOffset.
- Render an SVG <path> with a single cubic Bézier `M A.x A.y C1.x C1.y C2.x C2.y B.x B.y`.
- Use `marker-end` on the path to draw the arrowhead; do not use `marker-mid` or `marker-start`.

Concrete path generator (simplified):

```typescript
function perpendicularOffset(a: Point, b: Point, center: Point, magnitude = 0.25) {
  // vector from a -> b
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  // normalized perpendicular
  const len = Math.hypot(vx, vy) || 1;
  const px = -vy / len;
  const py = vx / len;
  // decide direction: dot product with vector from center->mid
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const cx = mid.x - center.x;
  const cy = mid.y - center.y;
  const dot = px * cx + py * cy;
  const dir = dot < 0 ? -1 : 1; // push away from center
  return { x: px * magnitude * len * dir, y: py * magnitude * len * dir };
}

function generateCubicPath(a: Point, b: Point, center: Point) {
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const offset = perpendicularOffset(a, b, center, 0.2);
  const c1 = { x: a.x + (mid.x - a.x) * 0.5 + offset.x, y: a.y + (mid.y - a.y) * 0.5 + offset.y };
  const c2 = { x: b.x + (mid.x - b.x) * 0.5 + offset.x, y: b.y + (mid.y - b.y) * 0.5 + offset.y };
  return `M ${a.x},${a.y} C ${c1.x},${c1.y} ${c2.x},${c2.y} ${b.x},${b.y}`;
}
```

Tips:
- Make arrows `pointer-events: none` (svg container), nodes interactive.
- Use subtle stroke width and low opacity to avoid visual clutter.
- If an arrow would intersect a node, increase the perpendicular magnitude or route it via an intermediate waypoint.

### Arrowheads and markers
- Define a single `<marker>` in the SVG defs and reference it with `marker-end="url(#arrowHead)"`.
- Make sure path directions go from source to target so `marker-end` is always correct.

### Avoiding overlaps & collision detection
- Measure node radii (icon size + padding) and if a path's bounding box intersects a node's bbox, nudge the curve magnitude.
- A simple heuristic: for each arrow compute distance from center to the path's midpoint; if that distance < (node padding + centerPadding), increase offset to push arc outward.

### Responsive behavior
- Desktop: radius = min(width, height) * 0.35–0.42
- Tablet: radius = min(width, height) * 0.28–0.34
- Mobile: radius = min(width, height) * 0.18–0.28 or collapse into a vertical stack
- Use CSS clamp for icon sizes: `width: clamp(40px, 5vw, 72px)` and scale VOID by 1.5x.

### Accessibility and keyboard nav
- Keep nodes in DOM order matching logical flow and add `tabIndex={0}` to node wrappers so keyboard users can tab through the sequence.
- When a node receives focus, consider subtle motion (scale + aria-live description) but avoid dramatic layout shifts.

### Framer Motion and layout transitions
- Use `layout` or `layoutId` props on `ArtifactNode` components to animate position changes smoothly across breakpoints.
- Keep breathing/glow as an overlay that does not affect layout (use transform/box-shadow only).

## Files to edit (concrete tasks)
1. `src/config/artifactFlow.ts` — keep static node metadata (id, label, route, image). Optionally expose desired angle for each node but do not hardcode pixel coordinates.
2. `src/components/artifact/ArtifactMap.tsx` — implement container, ResizeObserver, compute positions, place <ArtifactNode> components absolutely, render an SVG layer for arrows.
3. `src/components/artifact/ArtifactArrow.tsx` — move cubic path generation here and export a pure function `pathFor(from, to, center)` so it can be unit-tested.
4. `src/styles/index.css` — add utility classes for the square container, svg layer, and node centering.

Small, safe API contract suggestions:
- Input: node: { id, angle? (deg), label, imagePath, route } and center/size from map.
- Output: Node renders at computed left/top in px, nodes emit focus/click events.

## Testing and verification checklist
- [ ] VOID is centered visually at breakpoints (320, 768, 1024, 1440+)
- [ ] Nodes follow suggested clock-face positions and maintain even spacing
- [ ] All arrows point in intended direction (manual visual + quick DOM test for marker usage)
- [ ] Arrow paths avoid crossing through VOID; if they approach, they arc outward instead
- [ ] Mobile: either maintain orbital layout with reduced radius or switch to stacked layout
- [ ] Animations (breathing/glow) do not cause layout shifts (use transform-only animations)
- [ ] Tab order matches logical node sequence and keyboard activation navigates to target routes
- [ ] Unit tests for `generateCubicPath`/`pathFor` produce stable strings for snapshot testing

## Suggested small tests (Vitest/Jest)
- snapshot `pathFor(a,b,center)` for standard angles
- assert `polarToCartesian(center, radius, 300)` returns expected approximate values

## Notes / Edge cases
- If the map container becomes extremely narrow (portrait phones), collapse into a linear column: `Safety → Clarity → Calibration → VOID → Implementation → Resets`.
- If new nodes are added, allow per-node `angle` override; otherwise fall back to the default sequence mapping.
- Keep arrow rendering performant: avoid re-rendering all paths every animation frame — recompute only on resize or when nodes move.

## Requirements coverage (this prompt)
- VOID centered: described + runtime computation (Done in spec)
- Orbital distribution: concrete angles provided (Done)
- Curved arrows and collision avoidance: generator + heuristics provided (Done)
- Responsive sizes and clamp example: provided (Done)
- Preserve node behavior: noted and recommended (Done)

---

If you want, I can implement a working prototype in the repository now: compute positions in `ArtifactMap.tsx`, add the SVG arrow layer, and add unit tests for the path generator. Tell me whether to:

- implement prototype in-place (edit the three files listed), or
- generate an isolated proof-of-concept component first and share screenshots and tests.