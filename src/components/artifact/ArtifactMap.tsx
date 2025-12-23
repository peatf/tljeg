import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArtifactNode } from './ArtifactNode';
import { ArtifactArrow, ArrowheadMarker, pathFor, Point } from './ArtifactArrow';
import { PixelArrowCanvas } from './PixelArrowCanvas';
import { MotionPrefsProvider } from './MotionPrefsProvider';
import {
  artifactNodes,
  artifactConnections
} from '../../config/artifactFlow';

type Breakpoint = 'xs' | 'md' | 'lg' | 'xl';

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
  const [size, setSize] = useState({ width: 600, height: 600 });

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return { ...size, containerRef };
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

  const [hoveredConnection, setHoveredConnection] = useState<{ from: string; to: string } | null>(null);

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

  // Calculate node positions
  const nodePositions: Record<string, Point> = {};
  artifactNodes.forEach(node => {
    if (node.isVoid) {
      nodePositions[node.id] = center;
    } else if (node.angle !== undefined) {
      nodePositions[node.id] = polarToCartesian(center.x, center.y, radius, node.angle);
    }
  });

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
        <div className="text-center text-sm text-ink-600 mb-4">
          This is your process map. Start with Safety, flow step by step, and return to VOID anytime you want to reset.
        </div>

        {/* Radial Map Container */}
        <div
          ref={containerRef}
          className="artifact-map-container"
          style={
            {
              // Scale icon sizes with container width for broad browser compatibility
              ['--artifact-node-size' as any]: `${Math.round(Math.max(72, Math.min(160, width * 0.20)))}px`,
              ['--artifact-void-size' as any]: `${Math.round(Math.max(72, Math.min(160, width * 0.20)) * 1.8)}px`,
            } as React.CSSProperties
          }
        >

          {/* Nodes */}
          {artifactNodes.map((node) => {
            const isActive = activeNodeId === node.id;
            const isHighlighted = hoveredConnection && (hoveredConnection.from === node.id || hoveredConnection.to === node.id);
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
                  isHighlighted={!!isHighlighted}
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
                    onMouseEnter={() => setHoveredConnection({ from: connection.from, to: connection.to })}
                    onMouseLeave={() => setHoveredConnection(null)}
                  />
                );
              })}
          </svg>
        </div>

        {/* Flow Legend */}
        <div className="text-center text-ink-600 text-sm mt-6">
          <p className="mb-3">Tap any node to navigate. VOID anchors the flow.</p>
          <div className="flex justify-center items-center gap-1 text-xs flex-wrap">
            <span className="bg-slate-100 px-2 py-1 rounded">1. Safety</span>
            <span className="text-slate-400">→</span>
            <span className="bg-slate-100 px-2 py-1 rounded">2. Clarity</span>
            <span className="text-slate-400">→</span>
            <span className="bg-slate-100 px-2 py-1 rounded">3. Calibration</span>
            <span className="text-slate-400">→</span>
            <span className="bg-slate-100 px-2 py-1 rounded">4. VOID</span>
            <span className="text-slate-400">→</span>
            <span className="bg-slate-100 px-2 py-1 rounded">5. Implementation</span>
            <span className="text-slate-400">→</span>
            <span className="bg-slate-100 px-2 py-1 rounded">6. Resets</span>
          </div>
        </div>
      </div>
    </MotionPrefsProvider>
  );
}
