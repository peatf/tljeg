import { useEffect, useState } from 'react';
import { useReducedMotionPref } from '../hooks/useReducedMotionPref';

interface AnchorPreviewProps {
  type: 'breath_2_2_4' | 'breath_steady_4' | 'count_1234' | 'stillness' | 'custom';
  isSelected: boolean;
  onClick: () => void;
  label: string;
  description: string;
  customValue?: string;
}

export default function AnchorPreview({
  type,
  isSelected,
  onClick,
  label,
  description,
  customValue
}: AnchorPreviewProps) {
  const reducedMotion = useReducedMotionPref();
  const [hoverActive, setHoverActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [countNumber, setCountNumber] = useState(1);

  // Preview is active when hovered OR when selected (for mobile/touch)
  const previewActive = hoverActive || isSelected;

  useEffect(() => {
    if (!previewActive || reducedMotion) return;
    
    let interval: NodeJS.Timeout;
    
    if (type === 'breath_2_2_4') {
      const cycle = () => {
        setBreathPhase('inhale');
        setTimeout(() => setBreathPhase('hold'), 2000);
        setTimeout(() => setBreathPhase('exhale'), 4000);
        setTimeout(() => setBreathPhase('inhale'), 8000);
      };
      cycle();
      interval = setInterval(cycle, 8000);
    } else if (type === 'breath_steady_4') {
      const cycle = () => {
        setBreathPhase('inhale');
        setTimeout(() => setBreathPhase('exhale'), 4000);
      };
      cycle();
      interval = setInterval(cycle, 8000);
    } else if (type === 'count_1234') {
      interval = setInterval(() => {
        setCountNumber(prev => prev === 4 ? 1 : prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [previewActive, type, reducedMotion]);

  const getBreathCircleStyle = () => {
    if (reducedMotion || !previewActive) return {};
    
    const baseSize = 60;
    let scale = 1;
    
    if (type === 'breath_2_2_4') {
      scale = breathPhase === 'inhale' ? 1.5 : breathPhase === 'hold' ? 1.5 : 0.8;
    } else if (type === 'breath_steady_4') {
      scale = breathPhase === 'inhale' ? 1.5 : 0.8;
    }
    
    return {
      width: baseSize,
      height: baseSize,
      transform: `scale(${scale})`,
      transition: type === 'breath_2_2_4' 
        ? (breathPhase === 'inhale' ? 'transform 2s ease-in' : 
           breathPhase === 'hold' ? 'transform 0.2s ease' : 
           'transform 4s ease-out')
        : 'transform 4s ease-in-out'
    };
  };

  const renderPreview = () => {
    if (type === 'breath_2_2_4' || type === 'breath_steady_4') {
      return (
        <div className="flex flex-col items-center gap-2">
          <div
            className="rounded-full"
            style={{
              ...getBreathCircleStyle(),
              background: 'linear-gradient(135deg, var(--color-accent-organic-glow) 0%, var(--color-accent-organic) 100%)',
              border: '2px solid var(--color-accent-organic)',
              boxShadow: previewActive ? '0 0 20px var(--color-accent-organic-glow)' : 'none'
            }}
          />
          {previewActive && !reducedMotion && (
            <div className="text-xs font-mono tracking-wider" style={{ color: 'var(--color-accent-organic)' }}>
              {breathPhase === 'inhale' ? 'inhale' :
                breathPhase === 'hold' ? 'hold' : 'exhale'}
            </div>
          )}
        </div>
      );
    }

    if (type === 'count_1234') {
      return (
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(num => (
            <div
              key={num}
              className="w-3 h-3 rounded-sm transition-all duration-200"
              style={{
                background: previewActive && !reducedMotion && countNumber === num
                  ? 'var(--color-accent-organic)'
                  : 'var(--color-accent-organic-glow)',
                border: '1px solid var(--color-accent-organic)',
                transform: previewActive && !reducedMotion && countNumber === num ? 'scale(1.3)' : 'scale(1)',
                boxShadow: previewActive && !reducedMotion && countNumber === num
                  ? '0 0 8px var(--color-accent-organic-glow)'
                  : 'none'
              }}
            />
          ))}
        </div>
      );
    }

    if (type === 'stillness') {
      return (
        <div
          className="w-14 h-14 rounded-sm transition-all duration-1000"
          style={{
            border: '2px dashed var(--color-accent-organic)',
            background: previewActive ? 'var(--color-accent-organic-soft)' : 'transparent',
            opacity: previewActive ? 0.8 : 0.4
          }}
        />
      );
    }

    return (
      <div
        className="w-14 h-3 rounded-full"
        style={{ background: 'var(--color-accent-warm-glow)', border: '1px solid var(--color-accent-warm)' }}
      />
    );
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHoverActive(true)}
      onMouseLeave={() => setHoverActive(false)}
      className="section-card text-left transition-all duration-300 ease-out"
      style={{
        padding: '1.25rem 1.5rem',
        borderColor: isSelected ? 'var(--color-accent-organic)' : undefined,
        boxShadow: isSelected
          ? '0 0 0 2px var(--color-accent-organic-glow), 0 4px 16px rgba(123, 158, 135, 0.12)'
          : undefined,
        transform: hoverActive && !isSelected ? 'translateY(-2px)' : undefined
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium text-base" style={{ color: 'var(--color-text-primary)' }}>{label}</div>
          <div className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{description}</div>
          {previewActive && !reducedMotion && (
            <div className="text-xs mt-2 font-mono tracking-wide" style={{ color: 'var(--color-accent-organic)', opacity: 0.8 }}>
              {type === 'breath_2_2_4' && '2s inhale · 2s hold · 4s exhale'}
              {type === 'breath_steady_4' && 'steady 4-count breathing'}
              {type === 'count_1234' && 'counting 1 · 2 · 3 · 4'}
              {type === 'stillness' && 'pure awareness, no technique'}
              {type === 'custom' && `${customValue || 'enter your anchor'}`}
            </div>
          )}
        </div>
        <div className="ml-4 flex-shrink-0">
          {renderPreview()}
        </div>
      </div>
    </button>
  );
}