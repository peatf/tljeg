import { useEffect, useMemo, useState } from 'react';
import { useReducedMotionPref } from '../hooks/useReducedMotionPref';

interface VoidLabelProps {
  text: string;
  onRemove?: () => void;
  variant?: 'orb' | 'fragment' | 'glitch';
  isDissolving?: boolean;
  dissolveDelay?: number;
}

export default function VoidLabel({ 
  text, 
  onRemove, 
  variant = 'orb', 
  isDissolving = false,
  dissolveDelay = 0 
}: VoidLabelProps) {
  const reducedMotion = useReducedMotionPref();
  const [dissolvePhase, setDissolvePhase] = useState<0 | 1 | 2 | 3>(0);
  
  const position = useMemo(() => ({
    x: Math.random() * 20 - 10,
    y: Math.random() * 20 - 10,
    rotation: Math.random() * 10 - 5,
    scale: 0.9 + Math.random() * 0.2
  }), []);

  useEffect(() => {
    if (!isDissolving || reducedMotion) return;
    
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setDissolvePhase(1), dissolveDelay)); // shake/glitch
    timers.push(window.setTimeout(() => setDissolvePhase(2), dissolveDelay + 1000)); // fragment
    timers.push(window.setTimeout(() => setDissolvePhase(3), dissolveDelay + 2000)); // fade out
    
    return () => timers.forEach(clearTimeout);
  }, [isDissolving, dissolveDelay, reducedMotion]);

  const getStyles = () => {
    const base: React.CSSProperties = {
      transform: `translate(${position.x}px, ${position.y}px) rotate(${position.rotation}deg) scale(${position.scale})`,
      transition: 'all 0.3s ease-out',
      willChange: 'transform, opacity, filter'
    };

    if (isDissolving && !reducedMotion) {
      if (dissolvePhase === 0) return base;
      if (dissolvePhase === 1) return {
        ...base,
        transform: `${base.transform} scale(${position.scale * 1.1})`,
        filter: 'blur(1px)'
      };
      if (dissolvePhase === 2) return {
        ...base,
        transform: `${base.transform} scale(${position.scale * 0.8})`,
        filter: 'blur(2px)',
        opacity: 0.7
      };
      if (dissolvePhase === 3) return {
        ...base,
        transform: `${base.transform} scale(0.5)`,
        filter: 'blur(5px)',
        opacity: 0
      };
    }

    return base;
  };

  return (
    <div
        style={getStyles()}
        className={`void-label void-label--${variant} ${isDissolving ? 'pointer-events-none' : ''}`}
      >
        <span className="select-none">{text}</span>
        {onRemove && !isDissolving && (
          <button
            onClick={onRemove}
            className="void-label__remove"
            aria-label={`Remove ${text}`}
          >
            ×
          </button>
        )}
      </div>
  );
}
