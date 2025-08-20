import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listEntries } from '../storage/storage';

const STRAIN_WORDS = ['stuck', 'hard', 'difficult', 'strain', 'tired', 'overwhelm'];

export default function Resets() {
  const [recentText, setRecentText] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    // look at latest 10 entries across scenes for strain words
    listEntries().then((arr) => {
      const last = arr.sort((a: any, b: any) => b.timestamp - a.timestamp).slice(0, 10);
      const combined = last
        .map((e: any) => JSON.stringify(e.content || ''))
        .join(' ') 
        .toLowerCase();
      setRecentText(combined);
    });
  }, []);

  const highlightHalve = useMemo(() => STRAIN_WORDS.some((w) => recentText.includes(w)), [recentText]);

  function navigateToClarity() {
    navigate('/artifact/clarity?mode=gentle');
  }

  function navigateToVOID() {
    navigate('/artifact/void?autostart=true');
  }

  function navigateToCalibration() {
    navigate('/artifact/calibration?focus=proof');
  }

  return (
    <section className="grid gap-6">
      <header className="grid gap-2">
  <h1 className="text-2xl font-bold doto-base doto-700">Resets</h1>
        <p className="text-ink-700 text-sm">When things feel off, Resets bring you back gently.</p>
        <div className="p-4 bg-bone-50 rounded-lg text-sm text-ink-700">
          Some days you'll drift. That's part of the rhythm. Resets don't erase progress, they re-align you with what's alive now. If something feels too far, shrink the step. If your system feels heavy, drop into VOID. If you're unsure, hold onto one small piece of proof and let it carry you forward.
          {/* TODO: Reference path for future copy: docs/Updates/Explainers */}
        </div>
      </header>
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
          {/* Halve the distance card */}
          <button
            onClick={navigateToClarity}
            className={`p-6 border-2 rounded-lg text-left hover:shadow-lg transition-all cursor-pointer ${
              highlightHalve 
                ? 'border-amber-400 bg-amber-50 shadow-md' 
                : 'border-slate-200 hover:border-slate-300'
            }`}
            aria-label="Go to Clarity with gentler trait suggestions"
          >
            <div className="grid gap-3">
              <h3 className="text-lg font-semibold text-ink-800">Halve the distance</h3>
              <p className="text-sm text-ink-600">
                Choose a version that feels 50% closer and rehearse for 30–60s.
              </p>
              <div className="text-xs text-purple-600 font-medium">
                → Opens Clarity with gentler suggestions
              </div>
            </div>
          </button>

          {/* Rest & VOID card */}
          <button
            onClick={navigateToVOID}
            className="p-6 border-2 border-slate-200 rounded-lg text-left hover:border-slate-300 hover:shadow-lg transition-all cursor-pointer"
            aria-label="Go to VOID with timer pre-started"
          >
            <div className="grid gap-3">
              <h3 className="text-lg font-semibold text-ink-800">Rest & VOID</h3>
              <p className="text-sm text-ink-600">
                Pause. Drop into VOID to neutral. Return when you feel spacious.
              </p>
              <div className="text-xs text-purple-600 font-medium">
                → Opens VOID with timer ready to start
              </div>
            </div>
          </button>

          {/* Stay with overlap card */}
          <button
            onClick={navigateToCalibration}
            className="p-6 border-2 border-slate-200 rounded-lg text-left hover:border-slate-300 hover:shadow-lg transition-all cursor-pointer"
            aria-label="Go to Calibration with proof field focused"
          >
            <div className="grid gap-3">
              <h3 className="text-lg font-semibold text-ink-800">Stay with overlap</h3>
              <p className="text-sm text-ink-600">
                Name one ordinary overlap. Let it feel mundane.
              </p>
              <div className="text-xs text-purple-600 font-medium">
                → Opens Calibration with proof field focused
              </div>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
