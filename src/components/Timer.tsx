import { useEffect, useRef, useState } from 'react';

type Props = {
  seconds: number;
  onDone?: () => void;
  label?: string;
};

export default function Timer({ seconds, onDone, label }: Props) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          onDone?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [onDone]);

  const m = Math.floor(remaining / 60)
    .toString()
    .padStart(2, '0');
  const s = (remaining % 60).toString().padStart(2, '0');

  return (
    <div className="font-mono text-2xl text-center" aria-live="polite" aria-label={label || 'Timer'}>
      {m}:{s}
    </div>
  );
}

