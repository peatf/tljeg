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

// Pre-built pixel arrowhead masks for 8 directions (small, clean arrow tips)
const ARROWHEAD_MASKS = {
  // Right (0°) - pointing right
  right: [
    [1, 0],
    [1, 1]
  ],
  // Down-right (45°)
  downRight: [
    [1, 0],
    [0, 1]
  ],
  // Down (90°) - pointing down
  down: [
    [1, 1],
    [0, 1]
  ],
  // Down-left (135°)
  downLeft: [
    [0, 1],
    [1, 0]
  ],
  // Left (180°) - pointing left
  left: [
    [0, 1],
    [1, 1]
  ],
  // Up-left (225°)
  upLeft: [
    [1, 0],
    [0, 1]
  ],
  // Up (270°) - pointing up
  up: [
    [0, 1],
    [1, 1]
  ],
  // Up-right (315°)
  upRight: [
    [0, 1],
    [1, 0]
  ]
};

function getDirectionFromAngle(angle: number): keyof typeof ARROWHEAD_MASKS {
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

function drawPixelArrowhead(ctx: CanvasRenderingContext2D, endPoint: Point, direction: Point) {
  // Calculate angle from direction vector
  const angle = Math.atan2(direction.y, direction.x) * (180 / Math.PI);
  const arrowDirection = getDirectionFromAngle(angle);
  const mask = ARROWHEAD_MASKS[arrowDirection];
  
  // Position arrowhead slightly ahead of the line end
  const length = Math.hypot(direction.x, direction.y) || 1;
  const normalizedDx = direction.x / length;
  const normalizedDy = direction.y / length;
  
  // Move the arrowhead 1 pixel forward in the direction of the line
  const arrowX = Math.round(endPoint.x + normalizedDx);
  const arrowY = Math.round(endPoint.y + normalizedDy);
  
  // Draw the 2x2 arrowhead mask
  for (let row = 0; row < mask.length; row++) {
    for (let col = 0; col < mask[row].length; col++) {
      if (mask[row][col] === 1) {
        const x = arrowX + col - 1; // Center the 2x2 mask
        const y = arrowY + row - 1;
        ctx.fillRect(x, y, 1, 1);
      }
    }
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
    
    // Set pixel color
    offscreenCtx.fillStyle = '#212121';
    
    // Draw each arrow
    arrows.forEach(arrow => {
      // Sample points along the curve
      const points = samplePathPoints(arrow.pathData, 2);
      
      // Scale points down for offscreen canvas
      const scaledPoints = points.map(p => ({
        x: Math.round(p.x / scaleFactor),
        y: Math.round(p.y / scaleFactor)
      }));
      
      if (scaledPoints.length >= 2) {
        // Draw the curve
        drawPixelCurve(offscreenCtx, scaledPoints);
        
        // Calculate direction for arrowhead from last two points
        const endPoint = scaledPoints[scaledPoints.length - 1];
        const prevPoint = scaledPoints[scaledPoints.length - 2];
        const direction = {
          x: endPoint.x - prevPoint.x,
          y: endPoint.y - prevPoint.y
        };
        
        // Draw arrowhead
        drawPixelArrowhead(offscreenCtx, endPoint, direction);
      }
    });
    
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