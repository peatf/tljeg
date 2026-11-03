import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { artifactNodes, type ArtifactNode } from '../../config/artifactFlow';
import { trackArtifactMapNavigate } from '../../lib/analytics';

import safetySvg from '../../assets/safety.svg';
import claritySvg from '../../assets/clarity.svg';
import calibrationSvg from '../../assets/calibration.svg';
import implementationSvg from '../../assets/implementation.svg';
import breathingSvg from '../../assets/breathing.svg';
import voidImage from '../../assets/VOID_1.webp';

export interface Point {
  x: number;
  y: number;
}

const art: Record<string, string> = {
  safety: safetySvg,
  clarity: claritySvg,
  calibration: calibrationSvg,
  implementation: implementationSvg,
  resets: breathingSvg,
  void: voidImage
};

// Drawing space for the loop. Nodes are placed in percent of the same box.
const SIZE = 1000;
const C = SIZE / 2;
const R = 360;

export function polarToCartesian(cx: number, cy: number, radius: number, deg: number): Point {
  const rad = ((deg - 90) * Math.PI) / 180; // 0° is at the top
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function at(node: ArtifactNode): Point {
  return node.isVoid || node.angle === undefined ? { x: C, y: C } : polarToCartesian(C, C, R, node.angle);
}

function arc(fromDeg: number, toDeg: number): string {
  const a = polarToCartesian(C, C, R, fromDeg);
  const b = polarToCartesian(C, C, R, toDeg);
  return `M ${a.x} ${a.y} A ${R} ${R} 0 0 1 ${b.x} ${b.y}`;
}

function line(a: Point, b: Point): string {
  return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
}

const byId = Object.fromEntries(artifactNodes.map((n) => [n.id, n])) as Record<string, ArtifactNode>;

// The one path a person walks, drawn in the direction of travel so the stitches drift forward.
const route = [
  arc(0, 72),
  arc(72, 144),
  line(at(byId.calibration), at(byId.void)),
  line(at(byId.void), at(byId.implementation)),
  arc(216, 288),
  arc(288, 360)
];

// VOID can be entered from anywhere: faint spokes from the steps the route doesn't already join.
const spokes = ['safety', 'clarity', 'resets'].map((id) => line(at(byId[id]), at(byId.void)));

function index(n: ArtifactNode) {
  return String(n.stepIndex).padStart(2, '0');
}

interface ArtifactMapProps {
  className?: string;
}

export function ArtifactMap({ className = '' }: ArtifactMapProps) {
  const location = useLocation();
  const [focusId, setFocusId] = useState('safety');
  const focus = byId[focusId];

  const go = (node: ArtifactNode) => {
    const from = location.pathname.split('/').pop() || null;
    trackArtifactMapNavigate({ from, to: node.id, step_index: node.stepIndex, source: 'node' });
  };

  return (
    <div className={`flow-map ${className}`}>
      <p className="scene-explainer text-center mx-auto">
        This is your process map. Start with Safety, flow step by step, and return to VOID anytime you want to reset.
      </p>

      <div className="map-jump">
        <p className="kicker">One sitting · about ten minutes</p>
        <Link to="/jump" className="btn-flow btn-flow--primary">Begin a Timeline Jump</Link>
      </div>

      {/* Wide screens: the loop beside a preview of the step under your hand */}
      <div className="flow-map__wide">
        <div className="flow-orbit">
          <svg className="flow-orbit__lines" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
            <circle cx={C} cy={C} r={R} className="flow-orbit__ring" />
            {spokes.map((d) => <path key={d} d={d} className="flow-orbit__spoke" />)}
            {route.map((d) => <path key={d} d={d} className="flow-orbit__route" />)}
          </svg>

          {artifactNodes.map((node) => {
            const p = at(node);
            return (
              <Link
                key={node.id}
                to={node.to}
                aria-label={node.ariaLabel}
                className={`orbit-node ${node.isVoid ? 'orbit-node--void' : ''} ${focusId === node.id ? 'is-focus' : ''}`}
                style={{ left: `${(p.x / SIZE) * 100}%`, top: `${(p.y / SIZE) * 100}%` }}
                onMouseEnter={() => setFocusId(node.id)}
                onFocus={() => setFocusId(node.id)}
                onClick={() => go(node)}
              >
                <span className="orbit-node__plate">
                  <img src={art[node.id]} alt="" />
                </span>
                <span className="orbit-node__label">
                  <span className="orbit-node__index">{index(node)}</span>
                  {node.label}
                </span>
              </Link>
            );
          })}
        </div>

        <aside className="flow-preview" aria-live="polite">
          <p className="kicker"><span className="kicker__index">{index(focus)}</span>/ 06</p>
          <h2 className="scene-title flow-preview__title">{focus.label}</h2>
          <p className="flow-preview__lead">{focus.lead}</p>
          <Link to={focus.to} className="btn-flow btn-flow--primary justify-self-start" onClick={() => go(focus)}>
            Open {focus.label}
          </Link>
          {focus.id === 'safety' && <p className="map-hint">Start here</p>}
        </aside>
      </div>

      {/* Phones: the same route as a path you scroll down */}
      <ol className="flow-path">
        {artifactNodes.map((node) => (
          <li key={node.id} className={node.isVoid ? 'is-void' : ''}>
            <Link to={node.to} aria-label={node.ariaLabel} className="flow-path__row" onClick={() => go(node)}>
              <span className="flow-path__plate">
                <img src={art[node.id]} alt="" />
              </span>
              <span className="grid gap-1">
                <span className="orbit-node__label">
                  <span className="orbit-node__index">{index(node)}</span>
                  {node.label}
                  {node.id === 'safety' && <span className="map-hint">Start here</span>}
                </span>
                <span className="flow-path__lead">{node.lead}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <p className="field-hint text-center">Tap any node to navigate. VOID anchors the flow.</p>
    </div>
  );
}
