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
  const [previewActive, setPreviewActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [countNumber, setCountNumber] = useState(1);

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
            className="border-2 border-stone-300 rounded-full bg-stone-50"
            style={getBreathCircleStyle()}
          />
          {previewActive && !reducedMotion && (
            <div className="text-xs text-stone-600 font-mono tracking-wider">
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
              className={`w-3 h-3 border border-stone-300 transition-all duration-200 ${
                previewActive && !reducedMotion && countNumber === num 
                  ? 'bg-stone-700 scale-125' 
                  : 'bg-stone-100'
              }`}
            />
          ))}
        </div>
      );
    }
    
    if (type === 'stillness') {
      return (
        <div className={`w-16 h-16 border-2 border-dashed border-stone-300 transition-all duration-2000 ${
          previewActive ? 'bg-stone-50 opacity-60' : 'bg-transparent opacity-20'
        }`} />
      );
    }
    
    return (
      <div className="w-16 h-4 bg-gray-200 rounded-full" />
    );
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setPreviewActive(true)}
      onMouseLeave={() => setPreviewActive(false)}
      className={`
        p-6 border rounded-sm text-left transition-all duration-300 ease-out
        hover:shadow-md hover:-translate-y-1
        ${isSelected ? 'border-stone-400 bg-stone-50 shadow-sm' : 'border-stone-200 hover:border-stone-300 hover:bg-stone-25'}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-medium text-lg text-stone-800">{label}</div>
          <div className="text-sm text-stone-600">{description}</div>
        </div>
        <div className="ml-4">
          {renderPreview()}
        </div>
      </div>
      
      {previewActive && !reducedMotion && (
        <div className="text-xs text-stone-500 mt-2 opacity-75 font-mono tracking-wide">
          {type === 'breath_2_2_4' && '2s inhale, 2s hold, 4s exhale'}
          {type === 'breath_steady_4' && 'steady 4-count breathing'}
          {type === 'count_1234' && 'counting 1-2-3-4 pattern'}
          {type === 'stillness' && 'pure awareness, no technique'}
          {type === 'custom' && `${customValue || 'enter your anchor'}`}
        </div>
      )}
    </button>
  );
}