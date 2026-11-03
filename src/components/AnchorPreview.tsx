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
    
    let scale = 1;
    
    if (type === 'breath_2_2_4') {
      scale = breathPhase === 'inhale' ? 1.5 : breathPhase === 'hold' ? 1.5 : 0.8;
    } else if (type === 'breath_steady_4') {
      scale = breathPhase === 'inhale' ? 1.5 : 0.8;
    }
    
    return {
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
        <div className="flex flex-col items-center gap-2 w-20">
          <div
            className="anchor-mark anchor-mark--breath"
            style={getBreathCircleStyle()}
          />
          {previewActive && !reducedMotion && (
            <div className="anchor-phase">
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
              className={`anchor-mark anchor-mark--count ${previewActive && !reducedMotion && countNumber === num ? 'is-on' : ''}`}
            />
          ))}
        </div>
      );
    }

    if (type === 'stillness') {
      return (
        <div className={`anchor-mark anchor-mark--still ${previewActive ? 'is-on' : ''}`} />
      );
    }

    return <div className="anchor-mark anchor-mark--custom" />;
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHoverActive(true)}
      onMouseLeave={() => setHoverActive(false)}
      className={`anchor-card ${isSelected ? 'is-selected' : ''}`}
      aria-pressed={isSelected}
    >
      <div className="flex-1 min-w-0">
        <div className="anchor-card__label">{label}</div>
        <div className="anchor-card__desc">{description}</div>
        {previewActive && !reducedMotion && (
          <div className="anchor-card__detail">
            {type === 'breath_2_2_4' && '2s inhale · 2s hold · 4s exhale'}
            {type === 'breath_steady_4' && 'steady 4-count breathing'}
            {type === 'count_1234' && 'counting 1 · 2 · 3 · 4'}
            {type === 'stillness' && 'pure awareness, no technique'}
            {type === 'custom' && `${customValue || 'enter your anchor'}`}
          </div>
        )}
      </div>
      <div className="flex-shrink-0 grid place-items-center w-24 h-20">
        {renderPreview()}
      </div>
    </button>
  );
}
