export interface NodePosition {
  x: number;
  y: number;
}

export interface BreakpointPositions {
  xs: NodePosition;
  md: NodePosition;
  lg: NodePosition;
  xl: NodePosition;
}

export interface ArtifactNode {
  id: string;
  label: string;
  to: string;
  stepIndex: number;
  ariaLabel: string;
  angle?: number; // degrees (0 at top, clockwise)
  isVoid?: boolean;
  imagePath?: string;
}

export interface ArtifactConnection {
  from: string;
  to: string;
  enabled: {
    xs: boolean;
    md: boolean;
    lg: boolean;
    xl: boolean;
  };
}

// Simple linear flow configuration
export const artifactNodes: ArtifactNode[] = [
  {
    id: 'safety',
    label: 'Safety',
    to: '/artifact/safety',
    stepIndex: 1,
    ariaLabel: 'Go to Safety (Step 1)',
    imagePath: '/src/assets/safety.svg',
    angle: 300
  },
  {
    id: 'clarity',
    label: 'Clarity',
    to: '/artifact/clarity',
    stepIndex: 2,
    ariaLabel: 'Go to Clarity (Step 2)',
    imagePath: '/src/assets/clarity.svg',
    angle: 30
  },
  {
    id: 'calibration',
    label: 'Calibration',
    to: '/artifact/calibration',
    stepIndex: 3,
    ariaLabel: 'Go to Calibration (Step 3)',
    imagePath: '/src/assets/calibration.svg',
    angle: 240
  },
  {
    id: 'void',
    label: 'VOID',
    to: '/artifact/void',
    stepIndex: 4,
    ariaLabel: 'Go to VOID (Anchor Point)',
    isVoid: true,
    imagePath: '/src/assets/VOID_1.webp'
  },
  {
    id: 'implementation',
    label: 'Implementation',
    to: '/artifact/implementation',
    stepIndex: 5,
    ariaLabel: 'Go to Implementation (Step 5)',
    imagePath: '/src/assets/implementation.svg',
    angle: 120
  },
  {
    id: 'resets',
    label: 'Resets',
    to: '/artifact/resets',
    stepIndex: 6,
    ariaLabel: 'Go to Resets (Step 6)',
    imagePath: '/src/assets/breathing.svg',
    angle: 180
  }
];

// Define the flow connections between nodes
export const artifactConnections: ArtifactConnection[] = [
  {
    from: 'safety',
    to: 'clarity',
    enabled: { xs: true, md: true, lg: true, xl: true }
  },
  {
    from: 'clarity',
    to: 'calibration',
    enabled: { xs: true, md: true, lg: true, xl: true }
  },
  {
    from: 'calibration',
    to: 'void',
    enabled: { xs: true, md: true, lg: true, xl: true }
  },
  {
    from: 'void',
    to: 'implementation',
    enabled: { xs: true, md: true, lg: true, xl: true }
  },
  {
    from: 'implementation',
    to: 'resets',
    enabled: { xs: true, md: true, lg: true, xl: true }
  },
  {
    from: 'resets',
    to: 'safety',
    enabled: { xs: false, md: false, lg: true, xl: true }
  }
];

// Utility functions
export function getNodeById(id: string): ArtifactNode | undefined {
  return artifactNodes.find(node => node.id === id);
}

export function getConnectionsForBreakpoint(): ArtifactConnection[] {
  return artifactConnections;
}

export function getNextNode(currentNodeId: string): ArtifactNode | undefined {
  const currentNode = getNodeById(currentNodeId);
  if (!currentNode) return undefined;

  const connection = artifactConnections.find(conn => conn.from === currentNodeId);
  return connection ? getNodeById(connection.to) : undefined;
}

export function getPreviousNode(currentNodeId: string): ArtifactNode | undefined {
  const connection = artifactConnections.find(conn => conn.to === currentNodeId);
  return connection ? getNodeById(connection.from) : undefined;
}