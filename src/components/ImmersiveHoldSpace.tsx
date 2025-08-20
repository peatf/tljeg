import { useEffect, useState } from 'react';
import { useReducedMotionPref } from '../hooks/useReducedMotionPref';
import voidWebp from '../assets/VOID_1.webp';
import VoidLabel from './VoidLabel';

interface ImmersiveHoldSpaceProps {
  anchor: {
    type: 'breath_2_2_4' | 'breath_steady_4' | 'count_1234' | 'stillness' | 'custom';
    custom?: string;
  };
  labels: string[];
  actualHoldTime: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onEndEarly: () => void;
  onComplete: () => void;
  holdSeconds: number;
}

export default function ImmersiveHoldSpace({
  anchor,
  labels,
  actualHoldTime,
  isPaused,
  onTogglePause,
  onEndEarly,
  onComplete,
  holdSeconds
}: ImmersiveHoldSpaceProps) {
  const reducedMotion = useReducedMotionPref();
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [countNumber, setCountNumber] = useState(1);
  const [labelDissolvePhase, setLabelDissolvePhase] = useState(0);
  const [ambientOpacity, setAmbientOpacity] = useState(0.3);

  const getAnchorDisplay = (anchor: ImmersiveHoldSpaceProps['anchor']): string => {
    switch (anchor.type) {
      case 'breath_2_2_4': return 'Breath 2-2-4';
      case 'breath_steady_4': return 'Breath steady 4';
      case 'count_1234': return 'Count 1-2-3-4';
      case 'stillness': return 'Stillness';
      case 'custom': return anchor.custom || 'Custom';
    }
  };

  // Anchor animation effects
  useEffect(() => {
    if (isPaused || reducedMotion) return;
    
    let interval: NodeJS.Timeout;
    
    if (anchor.type === 'breath_2_2_4') {
      const cycle = () => {
        setBreathPhase('inhale');
        setTimeout(() => setBreathPhase('hold'), 2000);
        setTimeout(() => setBreathPhase('exhale'), 4000);
      };
      cycle();
      interval = setInterval(cycle, 8000);
    } else if (anchor.type === 'breath_steady_4') {
      const cycle = () => {
        setBreathPhase('inhale');
        setTimeout(() => setBreathPhase('exhale'), 4000);
      };
      cycle();
      interval = setInterval(cycle, 8000);
    } else if (anchor.type === 'count_1234') {
      interval = setInterval(() => {
        setCountNumber(prev => prev === 4 ? 1 : prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [anchor.type, isPaused, reducedMotion]);

  // Ambient atmosphere changes
  useEffect(() => {
    if (reducedMotion) return;
    
    const progress = actualHoldTime / holdSeconds;
    setAmbientOpacity(0.3 + progress * 0.4); // Gradually deepen the void
    
    // Start label dissolving midway through
    if (progress > 0.5 && labelDissolvePhase === 0) {
      setLabelDissolvePhase(1);
    }
  }, [actualHoldTime, holdSeconds, reducedMotion, labelDissolvePhase]);

  const getBreathHaloStyle = () => {
    if (reducedMotion || anchor.type === 'stillness') return {};
    
    let scale = 1;
    let opacity = 0.6;
    
    if (anchor.type === 'breath_2_2_4') {
      scale = breathPhase === 'inhale' ? 1.8 : breathPhase === 'hold' ? 1.8 : 1.0;
      opacity = breathPhase === 'hold' ? 0.8 : 0.6;
    } else if (anchor.type === 'breath_steady_4') {
      scale = breathPhase === 'inhale' ? 1.6 : 1.0;
    }
    
    return {
      transform: `scale(${scale})`,
      opacity,
      transition: anchor.type === 'breath_2_2_4' 
        ? (breathPhase === 'inhale' ? 'all 2s ease-in' : 
           breathPhase === 'hold' ? 'all 0.2s ease' : 
           'all 4s ease-out')
        : 'all 4s ease-in-out'
    };
  };

  const renderAnchorVisualization = () => {
    if (anchor.type === 'breath_2_2_4' || anchor.type === 'breath_steady_4') {
      return (
        <div className="relative flex items-center justify-center">
          <div 
            className="absolute w-32 h-32 rounded-full border-2 border-white border-opacity-30 bg-white bg-opacity-10 backdrop-blur-sm"
            style={getBreathHaloStyle()}
          />
          <div className="relative z-10 text-white text-lg font-mono tracking-widest opacity-80">
            {!reducedMotion && (
              <div className="text-center">
                <div>{breathPhase === 'inhale' ? 'inhale' : 
                       breathPhase === 'hold' ? 'hold' : 'exhale'}</div>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    if (anchor.type === 'count_1234') {
      return (
        <div className="flex items-center gap-4">
          {[1, 2, 3, 4].map(num => (
            <div 
              key={num}
              className={`w-6 h-6 border-2 border-white transition-all duration-200 ${
                !reducedMotion && countNumber === num 
                  ? 'bg-white scale-150 shadow-lg' 
                  : 'bg-white bg-opacity-20 opacity-50'
              }`}
            />
          ))}
          {!reducedMotion && (
            <div className="ml-4 text-white text-2xl font-mono tracking-widest opacity-80">
              {countNumber}
            </div>
          )}
        </div>
      );
    }
    
    if (anchor.type === 'stillness') {
      return (
        <div className={`w-24 h-24 border-2 border-dashed border-white border-opacity-30 transition-all duration-3000 ${
          !reducedMotion ? 'bg-white bg-opacity-5 opacity-60' : 'bg-white bg-opacity-10 opacity-30'
        }`} />
      );
    }
    
    return (
      <div className="text-white text-lg">
        {anchor.custom}
      </div>
    );
  };

  return (
    <section 
      className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden"
      style={{
        backgroundImage: `url(${voidWebp})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      
      {/* Floating labels that appear and dissolve */}
      {labelDissolvePhase > 0 && labels.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {labels.map((label, index) => (
            <div
              key={index}
              className="absolute"
              style={{
                top: `${20 + (index * 15) % 60}%`,
                left: `${10 + (index * 25) % 80}%`,
              }}
            >
              <VoidLabel
                text={label}
                variant={['orb', 'fragment', 'glitch'][index % 3] as any}
                isDissolving={true}
                dissolveDelay={index * 200}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Main content */}
      <div className="relative z-10 grid gap-8">
        <div className="grid gap-4">
          <h1 className="text-3xl font-bold text-white opacity-90">let yourself empty</h1>
          <div className="text-lg text-white opacity-75">
            Anchor: {getAnchorDisplay(anchor)}
          </div>
        </div>

        {/* Anchor visualization */}
        <div className="flex justify-center py-8">
          {renderAnchorVisualization()}
        </div>
        
        {/* Timer */}
        <div className="text-6xl font-mono text-white">
          {Math.floor(actualHoldTime / 60)}:{(actualHoldTime % 60).toString().padStart(2, '0')}
        </div>
        
        {isPaused && <div className="text-yellow-400 text-xl">PAUSED</div>}
        
        {/* Controls */}
        <div className="flex justify-center gap-4 mt-8">
          <button 
            onClick={onTogglePause}
            className="px-6 py-3 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-all"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button 
            onClick={() => confirm('End VOID session early?') && onEndEarly()}
            className="px-6 py-3 bg-red-500 bg-opacity-30 text-white rounded-lg hover:bg-opacity-50 transition-all"
          >
            End Early
          </button>
        </div>
        
        <div className="text-sm text-white opacity-60 mt-4">
          Space to pause/resume • Esc to end early
        </div>
        
        {actualHoldTime >= holdSeconds && (
          <button 
            onClick={onComplete}
            className="px-8 py-4 bg-purple-600 bg-opacity-80 text-white rounded-lg text-xl hover:bg-opacity-100 transition-all animate-pulse"
          >
            Complete Hold
          </button>
        )}
      </div>
    </section>
  );
}