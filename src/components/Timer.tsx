import { useEffect, useRef, useState } from 'react';

type Props = {
  seconds: number;
  onDone?: () => void;
  label?: string;
  className?: string;
};

export default function Timer({ seconds, onDone, label, className = 'timer-face' }: Props) {
  const [remaining, setRemaining] = useState(seconds);
  // Keep the latest callback without restarting the tick on every parent render.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (remaining === 0) onDoneRef.current?.();
  }, [remaining]);

  const m = Math.floor(remaining / 60)
    .toString()
    .padStart(2, '0');
  const s = (remaining % 60).toString().padStart(2, '0');

  return (
    <div className={className} aria-live="polite" aria-label={label || 'Timer'}>
      {m}:{s}
    </div>
  );
}

