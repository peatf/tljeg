# QA Checklist: Artifact Map

## Device & Browser Matrix
- [ ] Desktop Chrome (Latest)
- [ ] Desktop Safari (Latest)
- [ ] Desktop Firefox (Latest)
- [ ] iOS Safari (iPhone 13/14/15)
- [ ] Android Chrome (Pixel/Samsung)

## UI & Responsiveness
- [ ] **Breakpoints**: Verify layout at 320px, 768px, 1024px, 1440px. No node/arrow collisions.
- [ ] **Icon Scaling**: Icons should stay legible and proportionally sized across widths.
- [ ] **Themes**: Text and strokes have sufficient contrast on `bone-50` background.

## Interactions & Motion
- [ ] **Node Hover/Focus**: Scale up slightly (1.05x); shadow deepens.
- [ ] **Arrow Hover/Focus**: Stroke color darkens; stroke width increases; connected nodes show highlight ring.
- [ ] **Mount Animation**: Arrows draw on slowly when page loads.
- [ ] **Drift Animation**: Dash offset moves in direction of flow.
- [ ] **Active Node**: Breathing animation only on the current route node.
- [ ] **VOID Glow**: If enabled, Verify VOID node has pulse effect.
- [ ] **Reduced Motion**: Verify continuous animations (breathing, drift) stop when OS preference is active.

## Accessibility
- [ ] **Keyboard Nav**: Tab reaches all nodes AND all arrows.
- [ ] **Activation**: Enter/Space navigates to the target route.
- [ ] **Focus Rings**: Clearly visible on all interactive elements.
- [ ] **ARIA Labels**: Screen reader reads descriptive step names and directions.

## Analytics
- [ ] **Events**: Fire `artifact_map_navigate` on node click.
- [ ] **Events**: Fire `artifact_map_navigate` on arrow click.
- [ ] **Payload**: Verify `from`, `to`, `step_index`, and `source` values are correct.
