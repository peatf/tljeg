import { useEffect, useState } from 'react';
import Timer from './Timer';

const SECONDS = 45;
// One breath: four counts in, six counts out.
const IN_MS = 4000;
const OUT_MS = 6000;

type Props = {
  word: string;
  onDone?: () => void;
};

/** The chosen word sits in the well. While it runs, it widens on the in-breath and
    settles on the out-breath, and fills with ink from the bottom as the 45 seconds pass. */
export default function EmbodyWord({ word, onDone }: Props) {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [run, setRun] = useState(0);
  const [breath, setBreath] = useState<'in' | 'out'>('out');

  useEffect(() => {
    if (!running) return;
    let timer: number;
    const breatheIn = () => {
      setBreath('in');
      timer = window.setTimeout(breatheOut, IN_MS);
    };
    const breatheOut = () => {
      setBreath('out');
      timer = window.setTimeout(breatheIn, OUT_MS);
    };
    // Let the word settle onto the page before the first breath.
    timer = window.setTimeout(breatheIn, 400);
    return () => window.clearTimeout(timer);
  }, [running, run]);

  function start() {
    setDone(false);
    setBreath('out');
    setRunning(true);
    setRun((n) => n + 1);
  }

  function finish() {
    setRunning(false);
    setDone(true);
    setBreath('out');
    onDone?.();
  }

  return (
    <>
      <div key={run} className={`scan-space jump-embody ${running ? 'is-running' : ''} ${done ? 'is-done' : ''}`}>
        <p className={`jump-word ${running && breath === 'in' ? 'is-in' : ''}`} aria-hidden>
          {word}
        </p>
        {running && <Timer seconds={SECONDS} label="Embodiment practice" className="scan-time jump-embody__time" onDone={finish} />}
        {running && (
          <p className="scan-cue" aria-live="polite">
            {breath === 'in' ? 'Breathe in' : 'Breathe out'}
          </p>
        )}
      </div>
      {!running && (
        <button className={`btn-flow ${done ? '' : 'btn-flow--primary'} justify-self-start`} onClick={start}>
          {done ? 'Sit again' : `Begin ${SECONDS} seconds`}
        </button>
      )}
    </>
  );
}
