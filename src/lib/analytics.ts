// Analytics event schema
export interface ArtifactMapNavigateEvent {
  from: string | null;
  to: string;
  step_index: number;
  source: 'node' | 'arrow';
}

// Generic analytics event interface
export interface AnalyticsEvent {
  event: string;
  payload: Record<string, any>;
}

// Validation schemas
const artifactMapNavigateSchema = {
  from: (value: any) => value === null || typeof value === 'string',
  to: (value: any) => typeof value === 'string' && value.length > 0,
  step_index: (value: any) => typeof value === 'number' && value > 0,
  source: (value: any) => value === 'node' || value === 'arrow'
};

function validatePayload(payload: any, schema: Record<string, (value: any) => boolean>): boolean {
  for (const [key, validator] of Object.entries(schema)) {
    if (!validator(payload[key])) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Analytics validation failed for field "${key}":`, payload[key]);
      }
      return false;
    }
  }
  return true;
}

function isTestEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    typeof window === 'undefined' ||
    (window as any).__vitest__ !== undefined
  );
}

export function track(event: string, payload: Record<string, any>): void {
  // Suppress analytics in test environment
  if (isTestEnvironment()) {
    return;
  }

  try {
    let isValid = false;

    // Validate based on event type
    switch (event) {
      case 'artifact_map_navigate':
        isValid = validatePayload(payload, artifactMapNavigateSchema);
        break;
      default:
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Unknown analytics event type: ${event}`);
        }
        return;
    }

    if (!isValid) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Analytics validation failed for event "${event}":`, payload);
      }
      return;
    }

    // Log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', { event, payload });
    }

    // In production, this would integrate with your analytics service
    // Example: window.gtag?.('event', event, payload);
    // Example: window.analytics?.track(event, payload);
    
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Analytics tracking error:', error);
    }
  }
}

// Convenience function for artifact map navigation events
export function trackArtifactMapNavigate(data: ArtifactMapNavigateEvent): void {
  track('artifact_map_navigate', data);
}