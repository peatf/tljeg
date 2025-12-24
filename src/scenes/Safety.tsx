import { useEffect, useRef, useState } from 'react';
import Timer from '../components/Timer';
import SafetyIllustration from '../assets/safety.svg?react';
import { ChipList } from '../components/Chips';
import { addEntry } from '../storage/storage';
import { getSuggestions } from '../ml';

export default function Safety() {
  const [consent, setConsent] = useState('');
  const [needsText, setNeedsText] = useState('');
  const [chips, setChips] = useState<{ id: string; text: string; source: 'seed' | 'user' }[]>([]);
  const [scanStarted, setScanStarted] = useState(false);
  const doneRef = useRef(false);
  const [env, setEnv] = useState<string[]>([]);
  const [partName, setPartName] = useState('');
  const [partNeed, setPartNeed] = useState('');
  const [status, setStatus] = useState('');
  const [bodyReflection, setBodyReflection] = useState('');
  const [customEnv, setCustomEnv] = useState('');
  const [currentScanCue, setCurrentScanCue] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (consent === 'not yet') {
      getSuggestions('needs', needsText).then(result => setChips(result.items)).catch(() => setChips([]));
    }
  }, [needsText, consent]);

  // Rotating scan cues during 30s timer
  useEffect(() => {
    if (!scanStarted) return;
    const cues = [
      "Notice your breath...",
      "Feel your feet on the ground...",
      "Check in with your shoulders...",
      "Sense the space around you...",
      "Listen to what your body needs..."
    ];
    const interval = setInterval(() => {
      setCurrentScanCue(prev => (prev + 1) % cues.length);
    }, 6000); // Change every 6 seconds during 30s scan
    return () => clearInterval(interval);
  }, [scanStarted]);

  async function save() {
    setLoading(true);
    try {
      await addEntry('safety', { consent, needsText, env, partName, partNeed, bodyReflection });
      // Route unmet needs as frictions tagged 'safety' into contexts for cross-scene flow
      const needs: string[] = [];
      const split = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
      if (needsText) needs.push(...split(needsText));
      if (partNeed) needs.push(...split(partNeed));
      if (needs.length) {
        const { addContext } = await import('../storage/storage');
        for (const n of Array.from(new Set(needs))) {
          await addContext(n, 'friction', 'safety');
        }
      }
      setStatus('Saved.');
      setTimeout(() => setStatus(''), 1500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-2xl font-bold doto-base doto-700">Safety</h1>
        <p className="text-ink-700 text-sm">Shifts only land if they feel safe. Begin by grounding in internal safety.</p>
        <div className="mx-auto" role="img" aria-label="Safety illustration" title="Safety illustration">
          <SafetyIllustration />
        </div>
        <div className="section-card text-sm text-ink-700">
          Change only roots when your system feels safe enough to let it land. If you try to push transformation from a body still vibrating with stress, it's like planting seeds in pebbles: nothing takes. This stage is where you check your environment, name what you need, and give yourself permission to open.
        </div>
      </header>
      <p className="text-ink-700 max-w-prose">Get comfortable first, then check in with yourself. If you're ready, run a gentle 30-second scan.</p>

      {/* Section 1: Prepare Your Space (first in new order) */}
      <div className="grid gap-2">
        <p className="text-sm font-medium text-ink-800">Your environment</p>
        <p className="text-sm text-ink-600">Prepare your space before you begin.</p>
        <div className="flex flex-wrap gap-2" aria-live="polite">
          {['Door locked', 'Water nearby', 'Warmth', 'Low light', 'Phone silent'].map((e) => {
            const active = env.includes(e);
            return (
              <button
                key={e}
                className={`chip ${active ? 'chip-interactive' : 'chip-suggestion'}`}
                onClick={() => {
                  setEnv((cur) => (cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]));
                }}
                aria-pressed={active}
                aria-label={`Environment option: ${e}`}
              >
                {active ? '✔ ' : ''}{e}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 items-center mt-2">
          <div className="input-panel flex-1">
            <input
              type="text"
              value={customEnv}
              onChange={(e) => setCustomEnv(e.target.value)}
              placeholder="Add your own..."
              className="form-element"
              aria-label="Add custom comfort item"
            />
          </div>
          <button
            onClick={() => {
              if (customEnv.trim()) {
                setEnv(cur => [...cur, customEnv.trim()]);
                setCustomEnv('');
              }
            }}
            disabled={!customEnv.trim()}
            className="btn-flow"
            aria-label="Add custom item"
          >
            Add
          </button>
        </div>
      </div>

      {/* Section 2: Consent check-in (after preparing space) */}
      <div className="grid gap-3">
        <fieldset>
          <legend className="text-sm font-medium">Consent check-in</legend>
          <p className="text-xs text-ink-600 mb-2">Now that you're settled, are you ready to continue?</p>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="consent"
                value="yes"
                checked={consent === 'yes'}
                onChange={(e) => setConsent(e.target.value)}
                aria-describedby="consent-hint"
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="consent"
                value="not yet"
                checked={consent === 'not yet'}
                onChange={(e) => setConsent(e.target.value)}
                aria-describedby="consent-hint"
              />
              <span>Not yet</span>
            </label>
          </div>
        </fieldset>
      </div>

      {/* Section 3: Name what you need (only if "Not yet" selected) */}
      {consent === 'not yet' && (
        <div className="grid gap-3 p-4 border rounded-lg border-amber-200 bg-amber-50/30">
          <div className="grid gap-2">
            <p className="text-sm font-medium text-ink-800">Your inner state</p>
            <label className="text-sm text-ink-600" htmlFor="needs">Name what you need before moving forward</label>
            <input
              id="needs"
              value={needsText}
              onChange={(e) => setNeedsText(e.target.value)}
              placeholder="e.g., rest, warmth, quiet (comma to add multiple)"
              className="border border-slate-300 rounded p-2"
              aria-label="Needs input"
              aria-describedby="needs-hint"
            />
            <p id="needs-hint" className="text-xs text-ink-600">Suggestions are optional. Choose only what feels kind.</p>
            <ChipList chips={chips} onSelect={(c) => setNeedsText(c.text)} />
          </div>

          <div className="grid gap-2">
            <p className="text-sm text-ink-600">If a part says "not yet," name it and its need:</p>
            <label htmlFor="part-name" className="text-sm">Part name</label>
            <input id="part-name" value={partName} onChange={(e) => setPartName(e.target.value)} className="border p-2 rounded" aria-label="Part name" />
            <label htmlFor="part-need" className="text-sm">What does it need?</label>
            <input id="part-need" value={partNeed} onChange={(e) => setPartNeed(e.target.value)} className="border p-2 rounded" aria-label="Part need" />
          </div>
        </div>
      )}

      {/* Section 4: Body scan (only visible after consent is "yes" or after acknowledging "not yet") */}
      {consent && (
        <div className="grid gap-3">
          <p className="text-sm text-ink-600">Close your eyes and notice how your body feels right now.</p>
          <button
            className="btn-flow inline-flex items-center gap-2"
            onClick={() => setScanStarted(true)}
            aria-label="Start 30 second scan"
          >
            <span aria-hidden>▶</span> Start 30-second scan
          </button>
          {scanStarted && (
            <div className="grid gap-3">
              <Timer
                seconds={30}
                label="30 second scan"
                onDone={() => {
                  if (!doneRef.current) {
                    doneRef.current = true;
                  }
                }}
              />
              <div className="text-center p-3 bg-blue-50 rounded-lg text-blue-800 text-sm italic" aria-live="polite">
                {["Notice your breath...", "Feel your feet on the ground...", "Check in with your shoulders...", "Sense the space around you...", "Listen to what your body needs..."][currentScanCue]}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section 5: Body reflection (after scan) */}
      {consent && (
        <div className="grid gap-3">
          <div className="grid gap-2">
            <label htmlFor="body-reflection" className="text-sm">Where in your body do you feel ready/not ready?</label>
            <textarea id="body-reflection" value={bodyReflection} onChange={(e) => setBodyReflection(e.target.value)} className="border p-2 rounded min-h-[80px]" aria-label="Body readiness reflection" />
          </div>
          <div className="flex gap-3">
            <button className="btn-flow disabled:opacity-50" onClick={save} disabled={loading} aria-label="Save safety note" style={{ background: 'var(--color-accent-organic)', color: 'white', borderColor: 'var(--color-accent-organic)' }}>
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* FAQ-style reassurance */}
      <p className="text-sm text-ink-500 italic">You can't mess this up. If something feels off, you can always come back.</p>

      {/* What's next guidance */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <p className="text-sm text-ink-600 mb-3">Ready to continue?</p>
        <div className="flex flex-wrap gap-3">
          <a href="/artifact/clarity" className="btn-flow inline-flex items-center gap-2" style={{ background: 'var(--color-accent-organic)', color: 'white', borderColor: 'var(--color-accent-organic)' }}>
            Continue to Clarity <span aria-hidden>→</span>
          </a>
          <a href="/artifact/void" className="btn-quiet inline-flex items-center">
            Drop into VOID first
          </a>
        </div>
      </div>

      {status && <p className="text-sm text-ink-600" aria-live="polite">{status}</p>}
    </section>
  );
}
