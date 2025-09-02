import { useEffect, useRef, useState } from 'react';

type Props = {
  duration: number; // seconds
  label: string;
  onDone?: () => void;
  onStart?: () => void;
};

export default function TimerButton({ duration, label, onDone, onStart }: Props) {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [remaining, setRemaining] = useState(duration);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (running && !paused) {
      intervalRef.current = window.setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            if (intervalRef.current) window.clearInterval(intervalRef.current);
            setRunning(false);
            setPaused(false);
            onDone?.();
            return 0;
          }
          return r - 1;
        });
      }, 1000);
      return () => {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
      };
    }
  }, [running, paused, onDone]);

  function start() {
    setRemaining(duration);
    setRunning(true);
    setPaused(false);
    onStart?.();
  }
  function togglePause() {
    setPaused((p) => !p);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
  }
  function cancel() {
    setRunning(false);
    setPaused(false);
    setRemaining(duration);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
  }

  const mm = Math.floor(remaining / 60).toString().padStart(2, '0');
  const ss = (remaining % 60).toString().padStart(2, '0');

  if (!running) {
    return (
      <div className="grid gap-2 place-items-center">
        <button className="px-4 py-2 border rounded touch-target" onClick={start} aria-label={`Start ${label}`}>
          {label}
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-2 place-items-center">
      <div className="font-mono text-2xl text-center" aria-live="polite" aria-label={label}>
        {mm}:{ss}
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-1.5 border rounded" onClick={togglePause} aria-label={paused ? 'Resume' : 'Pause'}>
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button className="px-3 py-1.5 border rounded" onClick={cancel} aria-label="End">
          End
        </button>
      </div>
    </div>
  );
}
