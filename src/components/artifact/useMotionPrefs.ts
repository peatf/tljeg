import { useContext } from 'react';
import { MotionPrefsContext } from './MotionPrefsProvider';

export interface MotionPreferences {
  reduced: boolean;
  prefersReducedMotion: boolean;
  shouldAnimate: (kind: string) => boolean;
}

export function useMotionPrefs(): MotionPreferences {
  const context = useContext(MotionPrefsContext);
  if (!context) {
    throw new Error('useMotionPrefs must be used within a MotionPrefsProvider');
  }
  return context;
}