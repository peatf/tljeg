export interface ArtifactNode {
  id: string;
  label: string;
  to: string;
  stepIndex: number;
  ariaLabel: string;
  /** Position on the loop, degrees clockwise from the top. VOID sits at the center instead. */
  angle?: number;
  isVoid?: boolean;
  /** The scene's own opening line, shown when a step is previewed on the map. */
  lead: string;
}

// The loop runs clockwise: Safety, Clarity, Calibration, then down into VOID at the center,
// back out to Implementation and Resets, and round to Safety again.
export const artifactNodes: ArtifactNode[] = [
  {
    id: 'safety',
    label: 'Safety',
    to: '/artifact/safety',
    stepIndex: 1,
    ariaLabel: 'Go to Safety (Step 1)',
    angle: 0,
    lead: 'Shifts only land if they feel safe. Begin by grounding in internal safety.'
  },
  {
    id: 'clarity',
    label: 'Clarity',
    to: '/artifact/clarity',
    stepIndex: 2,
    ariaLabel: 'Go to Clarity (Step 2)',
    angle: 72,
    lead: 'Clarity means uncovering the identity shift that calls you. This can surface from desire, tension, or even envy.'
  },
  {
    id: 'calibration',
    label: 'Calibration',
    to: '/artifact/calibration',
    stepIndex: 3,
    ariaLabel: 'Go to Calibration (Step 3)',
    angle: 144,
    lead: 'Making clarity real in everyday life. Proof keeps the shift believable.'
  },
  {
    id: 'void',
    label: 'VOID',
    to: '/artifact/void',
    stepIndex: 4,
    ariaLabel: 'Go to VOID (Anchor Point)',
    isVoid: true,
    lead: 'VOID is a shower. VOID is the dissolve. Labels melt here, good or bad, success or failure, they soften until they disappear.'
  },
  {
    id: 'implementation',
    label: 'Implementation',
    to: '/artifact/implementation',
    stepIndex: 5,
    ariaLabel: 'Go to Implementation (Step 5)',
    angle: 216,
    lead: 'The actions you take are reflection of who you are.'
  },
  {
    id: 'resets',
    label: 'Resets',
    to: '/artifact/resets',
    stepIndex: 6,
    ariaLabel: 'Go to Resets (Step 6)',
    angle: 288,
    lead: 'When things feel off, Resets bring you back gently.'
  }
];

export function getNodeById(id: string): ArtifactNode | undefined {
  return artifactNodes.find(node => node.id === id);
}
