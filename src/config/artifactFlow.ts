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
  positions: BreakpointPositions;
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
    positions: {
      xs: { x: 50, y: 150 },
      md: { x: 80, y: 150 },
      lg: { x: 100, y: 150 },
      xl: { x: 120, y: 150 }
    }
  },
  {
    id: 'clarity',
    label: 'Clarity',
    to: '/artifact/clarity',
    stepIndex: 2,
    ariaLabel: 'Go to Clarity (Step 2)',
    imagePath: '/src/assets/clarity.svg',
    positions: {
      xs: { x: 150, y: 150 },
      md: { x: 200, y: 150 },
      lg: { x: 250, y: 150 },
      xl: { x: 300, y: 150 }
    }
  },
  {
    id: 'calibration',
    label: 'Calibration',
    to: '/artifact/calibration',
    stepIndex: 3,
    ariaLabel: 'Go to Calibration (Step 3)',
    imagePath: '/src/assets/calibration.svg',
    positions: {
      xs: { x: 250, y: 150 },
      md: { x: 320, y: 150 },
      lg: { x: 400, y: 150 },
      xl: { x: 480, y: 150 }
    }
  },
  {
    id: 'void',
    label: 'VOID',
    to: '/artifact/void',
    stepIndex: 4,
    ariaLabel: 'Go to VOID (Anchor Point)',
    isVoid: true,
    imagePath: '/src/assets/VOID_1.webp',
    positions: {
      xs: { x: 350, y: 150 },
      md: { x: 440, y: 150 },
      lg: { x: 550, y: 150 },
      xl: { x: 660, y: 150 }
    }
  },
  {
    id: 'implementation',
    label: 'Implementation',
    to: '/artifact/implementation',
    stepIndex: 5,
    ariaLabel: 'Go to Implementation (Step 5)',
    imagePath: '/src/assets/implementation.svg',
    positions: {
      xs: { x: 450, y: 150 },
      md: { x: 560, y: 150 },
      lg: { x: 700, y: 150 },
      xl: { x: 840, y: 150 }
    }
  },
  {
    id: 'resets',
    label: 'Resets',
    to: '/artifact/resets',
    stepIndex: 6,
    ariaLabel: 'Go to Resets (Step 6)',
    imagePath: '/src/assets/breathing.svg',
    positions: {
      xs: { x: 550, y: 150 },
      md: { x: 680, y: 150 },
      lg: { x: 850, y: 150 },
      xl: { x: 1020, y: 150 }
    }
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

export function getNodePosition(nodeId: string, breakpoint: keyof BreakpointPositions): NodePosition {
  const node = getNodeById(nodeId);
  if (!node) {
    throw new Error(`Node with id "${nodeId}" not found`);
  }
  return node.positions[breakpoint];
}

export function getConnectionsForBreakpoint(breakpoint: keyof BreakpointPositions): ArtifactConnection[] {
  return artifactConnections.filter(connection => connection.enabled[breakpoint]);
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