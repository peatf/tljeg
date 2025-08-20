import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArtifactConnection } from '../../config/artifactFlow';
import { useMotionPrefs } from './useMotionPrefs';
import { trackArtifactMapNavigate } from '../../lib/analytics';
import { getNodeById } from '../../config/artifactFlow';

export interface Point {
  x: number;
  y: number;
}

function perpendicularOffset(a: Point, b: Point, center: Point, magnitude = 0.25): Point {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const len = Math.hypot(vx, vy) || 1;
  const px = -vy / len;
  const py = vx / len;
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const cx = mid.x - center.x;
  const cy = mid.y - center.y;
  const dot = px * cx + py * cy;
  const dir = dot < 0 ? -1 : 1;
  return { x: px * magnitude * len * dir, y: py * magnitude * len * dir };
}

export function pathFor(from: Point, to: Point, center: Point): string {
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const offset = perpendicularOffset(from, to, center, 0.2);
  const c1 = { 
    x: from.x + (mid.x - from.x) * 0.5 + offset.x, 
    y: from.y + (mid.y - from.y) * 0.5 + offset.y 
  };
  const c2 = { 
    x: to.x + (mid.x - to.x) * 0.5 + offset.x, 
    y: to.y + (mid.y - to.y) * 0.5 + offset.y 
  };
  return `M ${from.x},${from.y} C ${c1.x},${c1.y} ${c2.x},${c2.y} ${to.x},${to.y}`;
}

// Manhattan-style, stepped polyline path that avoids the center point
export function pathForPixel(
  from: Point,
  to: Point,
  center: Point,
  grid = 6,
  detour = 12
): Point[] {
  const q = (v: number) => Math.round(v / grid) * grid; // quantize to grid
  const fromQ: Point = { x: q(from.x), y: q(from.y) };
  const toQ: Point = { x: q(to.x), y: q(to.y) };

  const dx = toQ.x - fromQ.x;
  const dy = toQ.y - fromQ.y;
  const det = Math.max(grid, Math.round(detour / grid) * grid);

  // If straight orthogonal, add a jog away from center so the path remains visibly pixel-art
  if (dx === 0 || dy === 0) {
    const vm = { x: ((fromQ.x + toQ.x) / 2) - center.x, y: ((fromQ.y + toQ.y) / 2) - center.y };
    if (dx === 0) {
      const signX = vm.x >= 0 ? 1 : -1;
      const ex = fromQ.x + signX * det;
      return [fromQ, { x: ex, y: fromQ.y }, { x: ex, y: toQ.y }, toQ];
    } else {
      const signY = vm.y >= 0 ? 1 : -1;
      const ey = fromQ.y + signY * det;
      return [fromQ, { x: fromQ.x, y: ey }, { x: toQ.x, y: ey }, toQ];
    }
  }

  // General case: build both HV and VH candidates with bowed detour away from center
  const mid = { x: (fromQ.x + toQ.x) / 2, y: (fromQ.y + toQ.y) / 2 };
  const vm = { x: mid.x - center.x, y: mid.y - center.y };

  // HV: move to x=ex first (horizontal), then vertical to y2, then to end
  let ex = toQ.x + (vm.x >= 0 ? det : -det);
  // ensure the first horizontal segment is at least grid long
  if (Math.abs(ex - fromQ.x) < grid) ex = fromQ.x + (ex >= fromQ.x ? grid : -grid);
  const hv: Point[] = [fromQ, { x: ex, y: fromQ.y }, { x: ex, y: toQ.y }, toQ];
  const hvMid: Point = { x: ex, y: (fromQ.y + toQ.y) / 2 };

  // VH: move to y=ey first (vertical), then horizontal to x2, then to end
  let ey = toQ.y + (vm.y >= 0 ? det : -det);
  if (Math.abs(ey - fromQ.y) < grid) ey = fromQ.y + (ey >= fromQ.y ? grid : -grid);
  const vh: Point[] = [fromQ, { x: fromQ.x, y: ey }, { x: toQ.x, y: ey }, toQ];
  const vhMid: Point = { x: (fromQ.x + toQ.x) / 2, y: ey };

  const dist2 = (p: Point) => (p.x - center.x) ** 2 + (p.y - center.y) ** 2;
  const path = dist2(hvMid) >= dist2(vhMid) ? hv : vh;

  // Remove consecutive duplicates (could happen after snapping)
  return path.filter((p, i, arr) => i === 0 || p.x !== arr[i - 1].x || p.y !== arr[i - 1].y);
}

interface ArtifactArrowProps {
  connection: ArtifactConnection;
  pathData: string;
  className?: string;
  onNavigate?: (from: string, to: string) => void;
  pixel?: boolean;
  polyPoints?: Point[];
  usePolyline?: boolean;
}

export function ArtifactArrow({ 
  connection, 
  pathData, 
  className = '',
  onNavigate,
  pixel = false,
  polyPoints,
  usePolyline = false
}: ArtifactArrowProps) {
  const navigate = useNavigate();
  const motionPrefs = useMotionPrefs();

  const fromNode = getNodeById(connection.from);
  const toNode = getNodeById(connection.to);

  if (!fromNode || !toNode) return null;

  const handleClick = () => {
    onNavigate?.(connection.from, connection.to);
    
    trackArtifactMapNavigate({
      from: connection.from,
      to: connection.to,
      step_index: toNode.stepIndex,
      source: 'arrow'
    });

    navigate(toNode.to);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const isAnimated = motionPrefs.shouldAnimate('arrow');
  const arrowVariants = pixel
    ? {
        default: { pathLength: 1, strokeDashoffset: 0, strokeDasharray: '3 3' },
        animated: { pathLength: 1, strokeDashoffset: 0, strokeDasharray: '3 3' },
        hover: { stroke: '#212121', strokeWidth: 2 }
      }
    : {
        default: {
          pathLength: 1,
          strokeDasharray: '0, 100',
          strokeDashoffset: 0
        },
        animated: {
          pathLength: isAnimated ? [0, 1] : 1,
          strokeDasharray: isAnimated ? '5, 10' : '0, 100',
          strokeDashoffset: isAnimated ? [0, -15] : 0
        },
        hover: {
          stroke: '#1f2937',
          strokeWidth: 2.5
        }
      };

  const transition = {
    pathLength: { duration: 0.6, ease: 'easeInOut' },
    strokeDashoffset: { 
      duration: 2, 
      repeat: motionPrefs.shouldAnimate('arrow') ? Infinity : 0,
      ease: 'linear'
    }
  };

  const commonProps = {
    variants: arrowVariants,
    initial: 'default' as const,
    animate: 'animated' as const,
    whileHover: 'hover' as const,
    whileFocus: 'hover' as const,
    transition,
    stroke: pixel ? 'transparent' : '#64748b',
    strokeWidth: pixel ? 2.5 : 1.5,
    strokeDasharray: pixel ? undefined : undefined,
    fill: 'none',
    className: `cursor-pointer focus-visible:outline-none ${className}`,
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    tabIndex: 0,
    role: 'button' as const,
    'aria-label': `Navigate from ${fromNode.label} to ${toNode.label}`,
    style: pixel
      ? ({
          pointerEvents: 'stroke',
          strokeOpacity: 0
        } as CSSProperties)
      : undefined
  };

  return (
    <g className="focus-within:outline-none">
      {pixel && usePolyline && polyPoints && polyPoints.length >= 2 ? (
        <motion.polyline
          points={polyPoints.map((p) => `${p.x},${p.y}`).join(' ')}
          {...commonProps}
          // No SVG marker in pixel mode; heads are drawn on canvas
          markerEnd={undefined}
        />
      ) : (
        <motion.path
          d={pathData}
          {...commonProps}
          // When pixel mode is on, we draw heads on the canvas; hide SVG marker
          markerEnd={pixel ? undefined : "url(#arrowhead)"}
        />
      )}
    </g>
  );
}

// Shared arrowhead marker component for SVG defs
export function ArrowheadMarker() {
  return (
    <defs>
      <marker
        id="arrowhead"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <polygon
          points="0 0, 10 3.5, 0 7"
          fill="#212121"
          className="transition-colors duration-200"
        />
      </marker>
      <marker
        id="pixel-arrowhead"
        markerWidth="3"
        markerHeight="3"
        refX="3"
        refY="1.5"
        orient="auto"
        markerUnits="strokeWidth"
        viewBox="0 0 3 3"
      >
        <g fill="#212121" shapeRendering="crispEdges">
          {/* 3x3 blocky right-pointing arrowhead */}
          <rect x="2" y="1" width="1" height="1" />
          <rect x="1" y="0" width="1" height="3" />
          <rect x="0" y="1" width="1" height="1" />
        </g>
      </marker>
    </defs>
  );
}
