import { useEffect, useMemo, useState } from 'react';
import { useReducedMotionPref } from '../hooks/useReducedMotionPref';

export default function DissolveWord({ text, delay = 0 }: { text: string; delay?: number }) {
  const reduced = useReducedMotionPref();
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);
  const jitter = useMemo(() => ({
    dx: (Math.random() - 0.5) * 10,
    dy: (Math.random() - 0.5) * 10
  }), []);

  useEffect(() => {
    if (reduced) return; // no animation
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setPhase(1), delay)); // appear/soften - 30s
    timers.push(window.setTimeout(() => setPhase(2), delay + 30000)); // blur - 30s
    timers.push(window.setTimeout(() => setPhase(3), delay + 60000)); // fade - 30s
    return () => timers.forEach(clearTimeout);
  }, [delay, reduced]);

  const style = useMemo(() => {
    if (reduced) return {} as React.CSSProperties;
    const base: React.CSSProperties = {
      transition: 'opacity 300ms ease, filter 300ms ease, transform 500ms ease',
      willChange: 'opacity, filter, transform'
    };
    if (phase === 0) return { ...base, opacity: 0.2, filter: 'blur(1px)' };
    if (phase === 1) return { ...base, opacity: 1, filter: 'blur(0px)' };
    if (phase === 2) return { ...base, opacity: 0.9, transform: `translate(${jitter.dx}px, ${jitter.dy}px)` };
    // phase 3
    return { ...base, opacity: 0, filter: 'blur(3px)' };
  }, [phase, reduced]);

  return <div style={style} className="text-lg text-ink-700">{text}</div>;
}
