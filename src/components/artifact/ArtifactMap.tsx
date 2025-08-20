import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArtifactNode } from './ArtifactNode';
import { ArtifactArrow, ArrowheadMarker, pathFor, Point } from './ArtifactArrow';
import { PixelArrowCanvas } from './PixelArrowCanvas';
import { MotionPrefsProvider } from './MotionPrefsProvider';
import { 
  artifactNodes,
  artifactConnections,
  type BreakpointPositions 
} from '../../config/artifactFlow';

type Breakpoint = keyof BreakpointPositions;

function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg');

  useEffect(() => {
    const updateBreakpoint = () => {
      if (window.innerWidth < 768) setBreakpoint('xs');
      else if (window.innerWidth < 1024) setBreakpoint('md');
      else if (window.innerWidth < 1440) setBreakpoint('lg');
      else setBreakpoint('xl');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

interface ContainerSize {
  width: number;
  height: number;
  containerRef: React.RefObject<HTMLDivElement>;
}

function deg2rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function polarToCartesian(cx: number, cy: number, radius: number, deg: number): Point {
  const rad = deg2rad(deg - 90); // shift so 0° is at top
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function useContainerSize(): ContainerSize {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use a fixed size that matches our CSS clamp() values
  // This prevents any JavaScript-driven size changes
  const getFixedSize = () => {
    const viewportWidth = window.innerWidth;
    const isMobile = viewportWidth < 768; // xs breakpoint
    
    // Match the CSS clamp values exactly
    const width = Math.min(Math.max(320, viewportWidth * 0.85), 720);
    
    if (isMobile) {
      // Mobile: zigzag 2-column layout
      // Match CSS: height: clamp(500px, 80vh, 700px)
      const viewportHeight = window.innerHeight;
      const height = Math.min(Math.max(500, viewportHeight * 0.8), 700);
      // Narrower width for mobile: clamp(320px, 85vw, 500px)
      const mobileWidth = Math.min(Math.max(320, viewportWidth * 0.85), 500);
      return { width: mobileWidth, height };
    } else {
      // Desktop: square container
      // Match CSS: height: clamp(320px, 85vw, 720px)
      const height = Math.min(Math.max(320, viewportWidth * 0.85), 720);
      return { width, height };
    }
  };
  
  const [size] = useState(getFixedSize);

  // No useEffect, no ResizeObserver - completely static sizing
  return { ...size, containerRef };
}

// Calculate zigzag positions for mobile layout (2-column S-curve)
function calculateZigzagPositions(containerWidth: number, containerHeight: number): Record<string, Point> {
  const positions: Record<string, Point> = {};
  
  // Define spacing and columns
  const topMargin = containerHeight * 0.08; // 8% from top
  const bottomMargin = containerHeight * 0.08; // 8% from bottom  
  const availableHeight = containerHeight - topMargin - bottomMargin;
  
  // Two columns with generous spacing
  const leftX = containerWidth * 0.25;  // 25% from left edge
  const rightX = containerWidth * 0.75; // 75% from left edge
  
  // Calculate Y positions - 3 rows for 6 nodes
  const rowCount = Math.ceil(artifactNodes.length / 2);
  const rowSpacing = availableHeight / (rowCount - 1);
  
  artifactNodes.forEach((node, index) => {
    const row = Math.floor(index / 2);
    const isLeftColumn = index % 2 === 0;
    
    const x = isLeftColumn ? leftX : rightX;
    const y = topMargin + (row * rowSpacing);
    
    positions[node.id] = { x, y };
  });
  
  return positions;
}

interface ArtifactMapProps {
  className?: string;
}

export function ArtifactMap({ className = '' }: ArtifactMapProps) {
  const location = useLocation();
  const breakpoint = useBreakpoint();
  const { width, height, containerRef } = useContainerSize();
  
  // Determine active node from current route
  const currentPath = location.pathname;
  const activeNodeId = currentPath.startsWith('/artifact/') 
    ? currentPath.split('/').pop() || 'safety'
    : 'safety';

  // Node angles (clock-face mapping as specified) - only used for non-mobile layouts
  const nodeAngles: Record<string, number> = {
    safety: 300,      // 10 o'clock
    clarity: 30,      // 1:30 o'clock
    calibration: 240, // 8 o'clock
    implementation: 120, // 4 o'clock
    resets: 180,      // 6 o'clock
    void: 0           // center (not used for polar calculation)
  };

  // Calculate responsive radius based on container size and breakpoint
  const getRadius = () => {
    const minDimension = Math.min(width, height);
    switch (breakpoint) {
      case 'xs': return minDimension * 0.30; // mobile: adjusted for larger icons
      case 'md': return minDimension * 0.34;
      case 'lg': return minDimension * 0.40;
      case 'xl': return minDimension * 0.42;
      default: return minDimension * 0.35;
    }
  };

  const radius = getRadius();
  const center = { x: width / 2, y: height / 2 };

  // Calculate node positions based on breakpoint
  const nodePositions: Record<string, Point> = breakpoint === 'xs' 
    ? calculateZigzagPositions(width, height)
    : (() => {
        const positions: Record<string, Point> = {};
        artifactNodes.forEach(node => {
          if (node.id === 'void') {
            positions[node.id] = center;
          } else {
            positions[node.id] = polarToCartesian(center.x, center.y, radius, nodeAngles[node.id]);
          }
        });
        return positions;
      })();

  // Prepare arrow data for canvas rendering
  const canvasArrows = artifactConnections
    .filter(conn => conn.enabled[breakpoint])
    .map((connection) => {
      const fromPos = nodePositions[connection.from];
      const toPos = nodePositions[connection.to];
      if (!fromPos || !toPos) return null;
      
      const pathData = pathFor(fromPos, toPos, center);
      return {
        pathData,
        fromPoint: fromPos,
        toPoint: toPos
      };
    })
    .filter(Boolean) as Array<{
      pathData: string;
      fromPoint: Point;
      toPoint: Point;
    }>;

  return (
    <MotionPrefsProvider>
      <div className={`relative mx-auto ${className}`}>
        
        {/* Help Text */}
        <div className="text-center text-ink-600 text-sm mb-4">
          <p className="mb-3">Tap any node to navigate. VOID anchors the flow.</p>
          <div className="flex justify-center items-center gap-1 text-xs flex-wrap">
            <span>1. Safety</span>
            <span className="text-slate-400">→</span>
            <span>2. Clarity</span>
            <span className="text-slate-400">→</span>
            <span>3. Calibration</span>
            <span className="text-slate-400">→</span>
            <span>4. VOID</span>
            <span className="text-slate-400">→</span>
            <span>5. Implementation</span>
            <span className="text-slate-400">→</span>
            <span>6. Resets (when needed)</span>
          </div>
        </div>
        
        {/* Map Container */}
        <div
          ref={containerRef}
          className={`${breakpoint === 'xs' ? 'artifact-map-container-mobile' : 'artifact-map-container'}`}
          style={{
            '--artifact-node-size': breakpoint === 'xs' 
              ? `${Math.round(Math.max(160, Math.min(240, width * 0.45)))}px`
              : `${Math.round(Math.max(72, Math.min(160, width * 0.20)))}px`,
            '--artifact-void-size': breakpoint === 'xs'
              ? `${Math.round(Math.max(160, Math.min(240, width * 0.45)) * 1.8)}px`
              : `${Math.round(Math.max(72, Math.min(160, width * 0.20)) * 1.8)}px`,
          } as React.CSSProperties}
        >
          
          {/* Nodes */}
          {artifactNodes.map((node) => {
            const isActive = activeNodeId === node.id;
            const position = nodePositions[node.id];
            
            return (
              <div
                key={node.id}
                className="artifact-node"
                data-id={node.id}
                style={{ left: position.x, top: position.y }}
              >
                <ArtifactNode
                  node={node}
                  isActive={isActive}
                />
              </div>
            );
          })}

          {/* Canvas Overlay for Pixelated Arrows */}
          <PixelArrowCanvas
            width={width}
            height={height}
            arrows={canvasArrows}
          />

          {/* SVG Arrows (invisible but interactive) */}
          <svg className="artifact-svg">
            <ArrowheadMarker />
            {artifactConnections
              .filter(conn => conn.enabled[breakpoint])
              .map((connection) => {
                const fromPos = nodePositions[connection.from];
                const toPos = nodePositions[connection.to];
                if (!fromPos || !toPos) return null;
                
                const pathData = pathFor(fromPos, toPos, center);
                
                return (
                  <ArtifactArrow
                    key={`${connection.from}-${connection.to}`}
                    connection={connection}
                    pathData={pathData}
                    pixel={true}
                  />
                );
              })}
          </svg>
        </div>
      </div>
    </MotionPrefsProvider>
  );
}
