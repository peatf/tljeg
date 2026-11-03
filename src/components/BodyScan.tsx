import { useEffect, useState } from 'react';
import Timer from './Timer';
import safetyArt from '../assets/safety.svg';

// Ordered to follow the scan down the body: head and breath, shoulders, feet, then the whole of you.
const SCAN_CUES = [
  "Notice your breath...",
  "Check in with your shoulders...",
  "Feel your feet on the ground...",
  "Sense the space around you...",
  "Listen to what your body needs..."
];

type Props = {
  onDone?: () => void;
};

/** The 30-second scan: a band of attention moves from head to feet, and what it has passed stays lit. */
export default function BodyScan({ onDone }: Props) {
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [run, setRun] = useState(0);
  const [cue, setCue] = useState(0);

  useEffect(() => {
    if (!started || done) return;
    const interval = setInterval(() => {
      setCue((prev) => (prev + 1) % SCAN_CUES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [started, done, run]);

  function start() {
    setCue(0);
    setDone(false);
    setStarted(true);
    setRun((n) => n + 1);
  }

  function finish() {
    setDone(true);
    onDone?.();
  }

  const scanning = started && !done;

  return (
    <>
      <div key={run} className={`scan-space ${scanning ? 'is-scanning' : ''} ${done ? 'is-done' : ''}`}>
        <div className="scan-figure" aria-hidden>
          <img src={safetyArt} alt="" className="scan-layer scan-layer--base" />
          <img src={safetyArt} alt="" className="scan-layer scan-layer--trail" />
          <img src={safetyArt} alt="" className="scan-layer scan-layer--band" />
        </div>
        {scanning && <Timer seconds={30} label="30 second scan" className="scan-time" onDone={finish} />}
        {scanning && (
          <p className="scan-cue" aria-live="polite">
            {SCAN_CUES[cue]}
          </p>
        )}
      </div>
      {!scanning && (
        <button
          className={`btn-flow ${done ? '' : 'btn-flow--primary'} justify-self-start`}
          onClick={start}
          aria-label="Start 30 second scan"
        >
          Start 30-second scan
        </button>
      )}
    </>
  );
}
