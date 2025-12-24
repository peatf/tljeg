import { useEffect, useMemo, useState } from 'react';
import { useReducedMotionPref } from '../hooks/useReducedMotionPref';

export default function DissolveWord({ text, delay = 0 }: { text: string; delay?: number }) {
  const reduced = useReducedMotionPref();
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => {
    if (reduced) return; // no animation
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setPhase(1), delay)); // appear/soften - 30s
    timers.push(window.setTimeout(() => setPhase(2), delay + 30000)); // intermediate dissolution - 30s
    timers.push(window.setTimeout(() => setPhase(3), delay + 60000)); // full dissolution - 30s
    return () => timers.forEach(clearTimeout);
  }, [delay, reduced]);

  // Use enhanced CSS classes for dissolution
  const className = useMemo(() => {
    const classes = ['text-lg', 'text-ink-700'];

    if (!reduced) {
      classes.push('dissolve-word');
      if (phase === 2) classes.push('dissolve-word--phase-2');
      if (phase === 3) classes.push('dissolve-word--phase-3');
    }

    return classes.join(' ');
  }, [phase, reduced]);

  const style = useMemo(() => {
    if (reduced) return {} as React.CSSProperties;

    // Base visibility for phase 0 and 1
    if (phase === 0) return { opacity: 0.2, filter: 'blur(1px)' };
    if (phase === 1) return { opacity: 1, filter: 'blur(0px)' };

    // Phases 2 and 3 handled by CSS classes
    return {};
  }, [phase, reduced]);

  return <div style={style} className={className}>{text}</div>;
}
