import { createContext, ReactNode, useEffect, useState } from 'react';
import { MotionPreferences } from './useMotionPrefs';

export const MotionPrefsContext = createContext<MotionPreferences | null>(null);

interface MotionPrefsProviderProps {
  children: ReactNode;
}

export function MotionPrefsProvider({ children }: MotionPrefsProviderProps) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mediaQuery.matches);
    
    const handleChange = () => setReduced(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const shouldAnimate = (kind: string) => {
    if (reduced) return false;
    
    // Define animation types that should respect reduced motion
    const animationTypes = ['breathing', 'glow', 'arrow', 'scale', 'opacity'];
    return animationTypes.includes(kind);
  };

  const value: MotionPreferences = {
    reduced,
    prefersReducedMotion: reduced,
    shouldAnimate,
  };

  return (
    <MotionPrefsContext.Provider value={value}>
      {children}
    </MotionPrefsContext.Provider>
  );
}