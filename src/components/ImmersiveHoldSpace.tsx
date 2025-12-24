import { useEffect, useState } from 'react';
import { useReducedMotionPref } from '../hooks/useReducedMotionPref';
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
  const [timerPulse, setTimerPulse] = useState(false);

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

  // Timer pulse when minute changes
  useEffect(() => {
    if (reducedMotion || isPaused) return;

    if (actualHoldTime > 0 && actualHoldTime % 60 === 0) {
      setTimerPulse(true);
      const timeout = setTimeout(() => setTimerPulse(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [actualHoldTime, reducedMotion, isPaused]);

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
        <div className="relative flex flex-col items-center justify-center gap-6">
          <div
            className="void-breath-circle"
            style={getBreathHaloStyle()}
          />
          {!reducedMotion && (
            <div className="void-breath-phase">
              {breathPhase}
            </div>
          )}
        </div>
      );
    }

    if (anchor.type === 'count_1234') {
      return (
        <div className="flex items-center gap-5">
          {[1, 2, 3, 4].map(num => (
            <div
              key={num}
              className={`void-count-dot ${!reducedMotion && countNumber === num ? 'void-count-dot--active' : ''}`}
            />
          ))}
        </div>
      );
    }

    if (anchor.type === 'stillness') {
      return (
        <div className={`void-stillness ${!reducedMotion ? 'void-stillness--active' : ''}`} />
      );
    }

    return (
      <div className="void-subheading text-lg">
        {anchor.custom}
      </div>
    );
  };

  return (
    <section className="void-immersive">
      {/* Void ambient background - subtle organic gradient overlay */}
      {!reducedMotion && <div className="void-ambient" />}

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
      <div className="grid gap-10">
        {/* Header */}
        <div className="grid gap-3">
          <h1 className="void-heading text-2xl sm:text-3xl">let yourself empty</h1>
          <div className="void-anchor-label">
            {getAnchorDisplay(anchor)}
          </div>
        </div>

        {/* Anchor visualization */}
        <div className="void-anchor-viz">
          {renderAnchorVisualization()}
        </div>

        {/* Timer */}
        <div className={`text-5xl sm:text-6xl void-timer ${timerPulse ? 'void-timer--pulse' : ''}`}>
          {Math.floor(actualHoldTime / 60)}:{(actualHoldTime % 60).toString().padStart(2, '0')}
        </div>

        {isPaused && <div className="void-paused">paused</div>}

        {/* Controls */}
        <div className="flex justify-center gap-3 mt-4">
          <button
            onClick={onTogglePause}
            className="void-btn"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={() => confirm('End VOID session early?') && onEndEarly()}
            className="void-btn-quiet"
          >
            End Early
          </button>
        </div>

        <div className="void-hint mt-2">
          <kbd>Space</kbd> pause/resume <span className="mx-2">·</span> <kbd>Esc</kbd> end early
        </div>

        {actualHoldTime >= holdSeconds && (
          <button
            onClick={onComplete}
            className="void-btn-primary mt-4"
          >
            Complete Hold
          </button>
        )}
      </div>
    </section>
  );
}