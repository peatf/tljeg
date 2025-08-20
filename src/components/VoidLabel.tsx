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

  const getVariantClasses = () => {
    switch (variant) {
      case 'orb':
        return 'bg-stone-100 border border-stone-200 rounded-full px-5 py-2 shadow-sm backdrop-blur-sm';
      case 'fragment':
        return 'bg-zinc-50 border-l-4 border-l-stone-400 px-4 py-2 shadow-sm transform -skew-x-1';
      case 'glitch':
        return 'bg-neutral-100 border border-dashed border-stone-300 px-4 py-2 font-mono tracking-wide';
      default:
        return 'bg-stone-50 border border-stone-200 rounded-sm px-3 py-2';
    }
  };

  return (
    <div
        style={getStyles()}
        className={`
          relative inline-flex items-center gap-2 text-sm font-medium cursor-pointer
          hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-out
          ${getVariantClasses()}
          ${isDissolving ? 'pointer-events-none' : ''}
        `}
      >
        <span className="text-stone-700 select-none">{text}</span>
        {onRemove && !isDissolving && (
          <button 
            onClick={onRemove}
            className="text-stone-500 hover:text-stone-700 text-lg leading-none ml-1"
            aria-label={`Remove ${text}`}
          >
            ×
          </button>
        )}
      </div>
  );
}