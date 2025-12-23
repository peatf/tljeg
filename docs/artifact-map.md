# Artifact Map Architecture

The Artifact Map is the central navigation hub for the TLJE practice. It provides a visual, radial representation of the guided flow across practice nodes.

## Components

### [ArtifactMap](file:///Users/Aleshalegair/Developer/TJEGuide/src/components/artifact/ArtifactMap.tsx)
- **Purpose**: Parent container that manages the radial layout, responsive breakpoints, and interaction state.
- **Key Logic**: 
  - Calculates node positions using polar-to-cartesian coordinates.
  - Manages `hoveredConnection` state to highlight source/destination nodes when an arrow is interacted with.
  - Scales icon sizes dynamically based on container width.

### [ArtifactNode](file:///Users/Aleshalegair/Developer/TJEGuide/src/components/artifact/ArtifactNode.tsx)
- **Purpose**: Individual practice step button.
- **Interactions**:
  - `isActive`: Current route matches node. Triggers breathing animation.
  - `isHighlighted`: Connected arrow is hovered/focused. Triggers a visual ring.
  - `isVoid`: Specialized styling for the central anchor node.
- **Motion Styles**: Supports `node_breath` and `void_glow` via `SITE_MOTION_STYLE` env var.

### [ArtifactArrow](file:///Users/Aleshalegair/Developer/TJEGuide/src/components/artifact/ArtifactArrow.tsx)
- **Purpose**: Directional flow indicator and interactive navigation link.
- **Visuals**:
  - Uses an interactive invisible SVG path for hit-testing.
  - Implements a "drift" animation (dash-offset) to imply flow direction.
  - Mount animation draws the path from start to end.

## Configuration

The flow is defined in [src/config/artifactFlow.ts](file:///Users/Aleshalegair/Developer/TJEGuide/src/config/artifactFlow.ts).

- `artifactNodes`: List of nodes with metadata (id, label, route, step index, positions).
- `artifactConnections`: List of flow arrows (from, to, enabled-per-breakpoint).

## Accessibility

- All nodes and arrows are keyboard reachable ([tabIndex={0}]).
- Activated via [Enter] or [Space].
- `aria-label` includes step descriptions (e.g., "Go to Safety (Step 1)").
- Focus states meet WCAG AA contrast requirements with `focus-visible:ring-offset-4`.
- Respects `prefers-reduced-motion` via [MotionPrefsProvider](file:///Users/Aleshalegair/Developer/TJEGuide/src/components/artifact/MotionPrefsProvider.tsx).

## Analytics

Navigation events are tracked via `trackArtifactMapNavigate` in [src/lib/analytics.ts](file:///Users/Aleshalegair/Developer/TJEGuide/src/lib/analytics.ts).
- Event: `artifact_map_navigate`
- Payload: `{ from, to, step_index, source }`
