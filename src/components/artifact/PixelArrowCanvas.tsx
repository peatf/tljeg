import { useEffect, useRef } from 'react';
import { Point } from './ArtifactArrow';

interface PixelArrowCanvasProps {
  width: number;
  height: number;
  arrows: Array<{
    pathData: string;
    fromPoint: Point;
    toPoint: Point;
  }>;
}

// 8-way direction labels
type Direction = 'right' | 'downRight' | 'down' | 'downLeft' | 'left' | 'upLeft' | 'up' | 'upRight';

function getDirectionFromAngle(angle: number): Direction {
  // Normalize angle to 0-360
  const normalizedAngle = ((angle % 360) + 360) % 360;
  
  if (normalizedAngle >= 337.5 || normalizedAngle < 22.5) return 'right';
  if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) return 'downRight';
  if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) return 'down';
  if (normalizedAngle >= 112.5 && normalizedAngle < 157.5) return 'downLeft';
  if (normalizedAngle >= 157.5 && normalizedAngle < 202.5) return 'left';
  if (normalizedAngle >= 202.5 && normalizedAngle < 247.5) return 'upLeft';
  if (normalizedAngle >= 247.5 && normalizedAngle < 292.5) return 'up';
  return 'upRight';
}

// Generate wedge/triangular pixel arrowhead offsets for 8 directions
// length: forward extent in pixels, base: width near the base (orthogonals), overlap: backward overlap to join line
function getArrowHeadOffsets(dir: Direction, length = 4, base = 3, overlap = 1): Array<[number, number]> {
  const offsets: Array<[number, number]> = [];

  const add = (dx: number, dy: number) => offsets.push([dx, dy]);

  // Helper for orthogonal heads - creates a proper triangular wedge
  function ortho(forward: [number, number], side: [number, number], back: [number, number]) {
    // backward overlap to ensure connection
    for (let o = 1; o <= overlap; o++) {
      add(back[0] * o, back[1] * o);
    }
    
    // Create triangular wedge by varying width as we go forward
    for (let t = 0; t < length; t++) {
      // Main spine pixel
      add(forward[0] * t, forward[1] * t);
      
      // Side pixels that get narrower as we go forward
      // At t=0 (base): full width, at t=length-1 (tip): no width
      const width = Math.floor(base * (length - 1 - t) / (length - 1));
      for (let s = 1; s <= width; s++) {
        add(forward[0] * t + side[0] * s, forward[1] * t + side[1] * s);
        add(forward[0] * t - side[0] * s, forward[1] * t - side[1] * s);
      }
    }
  }

  // Helper for diagonal heads - creates a proper diagonal triangular wedge
  function diag(step: [number, number]) {
    const sx = step[0], sy = step[1];
    
    // backward overlap along the diagonal direction
    for (let o = 1; o <= overlap; o++) {
      add(-sx * o, -sy * o);
    }
    
    // Create triangular wedge along diagonal
    for (let t = 0; t < length; t++) {
      // Main spine pixel
      add(sx * t, sy * t);
      
      // Side pixels that get narrower as we go forward
      // For diagonals, we add pixels orthogonal to the main direction
      const width = Math.floor(base * (length - 1 - t) / (length - 1));
      
      // Get orthogonal directions for the diagonal
      const ortho1 = [-sy, sx]; // perpendicular vector
      const ortho2 = [sy, -sx]; // opposite perpendicular vector
      
      for (let s = 1; s <= width; s++) {
        add(sx * t + ortho1[0] * s, sy * t + ortho1[1] * s);
        add(sx * t + ortho2[0] * s, sy * t + ortho2[1] * s);
      }
    }
  }

  switch (dir) {
    case 'right':      ortho([1, 0], [0, 1], [-1, 0]); break;
    case 'left':       ortho([-1, 0], [0, 1], [1, 0]); break;
    case 'down':       ortho([0, 1], [1, 0], [0, -1]); break;
    case 'up':         ortho([0, -1], [1, 0], [0, 1]); break;
    case 'downRight':  diag([1, 1]); break;
    case 'upRight':    diag([1, -1]); break;
    case 'downLeft':   diag([-1, 1]); break;
    case 'upLeft':     diag([-1, -1]); break;
  }

  return offsets;
}

function samplePathPoints(pathData: string, stepSize: number = 2): Point[] {
  // Create a temporary SVG path element to sample points
  const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  tempPath.setAttribute('d', pathData);
  tempSvg.appendChild(tempPath);
  document.body.appendChild(tempSvg);
  
  const totalLength = tempPath.getTotalLength();
  const points: Point[] = [];
  
  for (let distance = 0; distance <= totalLength; distance += stepSize) {
    const point = tempPath.getPointAtLength(distance);
    points.push({
      x: Math.round(point.x),
      y: Math.round(point.y)
    });
  }
  
  // Clean up
  document.body.removeChild(tempSvg);
  
  return points;
}

function drawPixelLine(ctx: CanvasRenderingContext2D, from: Point, to: Point) {
  // Simple Bresenham-like line algorithm for pixel-perfect lines
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  const sx = from.x < to.x ? 1 : -1;
  const sy = from.y < to.y ? 1 : -1;
  let err = dx - dy;
  
  let x = from.x;
  let y = from.y;
  
  while (true) {
    ctx.fillRect(x, y, 1, 1);
    
    if (x === to.x && y === to.y) break;
    
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

function drawPixelCurve(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length < 2) return;
  
  // Draw lines between consecutive points
  for (let i = 0; i < points.length - 1; i++) {
    drawPixelLine(ctx, points[i], points[i + 1]);
  }
}

function drawPixelArrowhead(ctx: CanvasRenderingContext2D, endPoint: Point, direction: Point, length = 5, base = 4, overlap = 1) {
  // Skip if no valid direction
  if (direction.x === 0 && direction.y === 0) {
    // Fallback: small right-pointing wedge with overlap
    const fallbackOffsets = getArrowHeadOffsets('right', length, base, overlap);
    for (const [dx, dy] of fallbackOffsets) {
      ctx.fillRect(endPoint.x + dx, endPoint.y + dy, 1, 1);
    }
    return;
  }
  
  // Calculate angle from direction vector
  const angle = Math.atan2(direction.y, direction.x) * (180 / Math.PI);
  const arrowDirection = getDirectionFromAngle(angle);
  const offsets = getArrowHeadOffsets(arrowDirection, length, base, overlap);

  // Anchor at the true endPoint so the head joins the line
  const baseX = endPoint.x;
  const baseY = endPoint.y;

  for (const [dx, dy] of offsets) {
    const x = baseX + dx;
    const y = baseY + dy;
    ctx.fillRect(x, y, 1, 1);
  }
}

export function PixelArrowCanvas({ width, height, arrows }: PixelArrowCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Scale factor for pixelation effect
    const scaleFactor = 3;
    const offscreenWidth = Math.ceil(width / scaleFactor);
    const offscreenHeight = Math.ceil(height / scaleFactor);
    
    // Create or reuse offscreen canvas
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    
    const offscreenCanvas = offscreenCanvasRef.current;
    offscreenCanvas.width = offscreenWidth;
    offscreenCanvas.height = offscreenHeight;
    
    const offscreenCtx = offscreenCanvas.getContext('2d');
    if (!offscreenCtx) return;
    
    // Disable anti-aliasing
    offscreenCtx.imageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
    
    // Clear both canvases
    offscreenCtx.clearRect(0, 0, offscreenWidth, offscreenHeight);
    ctx.clearRect(0, 0, width, height);
    
    // Prepare processed arrows: trimmed curve + head data
    type Processed = { curvePoints: Point[]; headEnd: Point; headDir: Point; headLength: number; headBase: number; overlap: number };
    const processed: Processed[] = [];

    arrows.forEach(arrow => {
      const points = samplePathPoints(arrow.pathData, 2);
      const scaledPoints = points.map(p => ({
        x: Math.round(p.x / scaleFactor),
        y: Math.round(p.y / scaleFactor)
      }));

      if (scaledPoints.length < 2) return;

      // Deduplicate consecutive identical points (post-quantization)
      const deduped: Point[] = [];
      for (let i = 0; i < scaledPoints.length; i++) {
        const p = scaledPoints[i];
        if (i === 0 || p.x !== scaledPoints[i - 1].x || p.y !== scaledPoints[i - 1].y) deduped.push(p);
      }
      if (deduped.length < 2) return;

      // Direction from last two distinct points (search backward if needed)
      const endPoint = deduped[deduped.length - 1];
      let prevIdx = deduped.length - 2;
      while (prevIdx >= 0 && deduped[prevIdx].x === endPoint.x && deduped[prevIdx].y === endPoint.y) prevIdx--;
      const prevPoint = prevIdx >= 0 ? deduped[prevIdx] : deduped[Math.max(0, deduped.length - 2)];
      const headDir = { x: endPoint.x - prevPoint.x, y: endPoint.y - prevPoint.y };

      // Head parameters in offscreen pixel units
      const headLength = 5; // forward extent
      const headBase = 4;   // base width
      const overlap = 3;    // backward overlap for attachment (increased to close gap)
      const trimTail = headLength - overlap; // ensure line ends before head (2 pixels)
      const trimStart = 2; // trim start 2px to avoid intersecting incoming heads

      // Apply trimming to curve points; ensure at least 2 points remain
      const startIdx = Math.min(trimStart, Math.max(0, deduped.length - 3));
      const endIdxExclusive = Math.max(startIdx + 2, deduped.length - trimTail);
      const curvePoints = deduped.slice(startIdx, endIdxExclusive);
      if (curvePoints.length < 2) {
        // If too short to draw curve, still queue head
        processed.push({ curvePoints: [], headEnd: endPoint, headDir, headLength, headBase, overlap });
        return;
      }

      processed.push({ curvePoints, headEnd: endPoint, headDir, headLength, headBase, overlap });
    });

    // Pass 1: draw all curves in blue
    offscreenCtx.fillStyle = '#0b4596';
    for (const a of processed) {
      if (a.curvePoints.length >= 2) drawPixelCurve(offscreenCtx, a.curvePoints);
    }

    // Pass 2: draw all heads on top in blue (same color for consistency)
    offscreenCtx.fillStyle = '#0b4596';
    for (const a of processed) {
      drawPixelArrowhead(offscreenCtx, a.headEnd, a.headDir, a.headLength, a.headBase, a.overlap);
    }
    
    // Scale up to main canvas with nearest neighbor
    ctx.drawImage(
      offscreenCanvas,
      0, 0, offscreenWidth, offscreenHeight,
      0, 0, width, height
    );
    
  }, [width, height, arrows]);
  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="pixel-arrow-canvas"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        imageRendering: 'pixelated'
      }}
    />
  );
}
