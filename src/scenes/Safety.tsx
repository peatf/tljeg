import { useEffect, useRef, useState } from 'react';
import Timer from '../components/Timer';
import SafetyIllustration from '../assets/safety.svg?react';
import avatarWebp from '../assets/avatar.webp';
import { ChipList } from '../components/Chips';
import { addEntry } from '../storage/storage';
import { getSuggestions } from '../ml';
import StackedButton from '../components/ui/StackedButton';
import InputPanel from '../components/ui/InputPanel';

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
  const hasBodyRead = (bodyReflection || '').trim().length > 0;
  const hasNeedWhenNotYet = consent !== 'not yet' || (needsText.trim().length > 0 || partNeed.trim().length > 0);

  useEffect(() => {
    getSuggestions('needs', needsText).then(result => setChips(result.items)).catch(() => setChips([]));
  }, [needsText]);

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
        <div className="p-4 bg-bone-50 rounded-lg text-sm text-ink-700">
          Change only roots when your system feels safe enough to let it land. If you try to push transformation from a body still vibrating with stress, it's like planting seeds in pebbles, nothing takes. This stage is where you check your environment, name what you need, and give yourself permission to open.
          {/* TODO: Reference path for future copy: docs/Updates/Explainers */}
        </div>
      </header>
      {/* SAF-1: Body awareness comes first and is required */}
      <div className="grid gap-2">
        <label htmlFor="body-reflection" className="text-sm font-medium">Where in your body do you feel ready/not ready?</label>
        <InputPanel
          as="textarea"
          label="BODY READINESS"
          id="body-reflection"
          value={bodyReflection}
          onChange={(e) => setBodyReflection((e.target as HTMLTextAreaElement).value)}
          aria-label="Body readiness reflection"
          placeholder="e.g., Jaw is tight, chest feels open, belly needs softness…"
          helperText="Required before moving on. A brief body read helps set a safe pace."
        />
      </div>
      <p className="text-ink-700 max-w-prose">After a quick body read, continue below. If any part says “not yet,” name its need.</p>

      {/* The rest of the flow is gated until a body read exists */}
      <div className={`${hasBodyRead ? '' : 'opacity-60 pointer-events-none select-none'} grid gap-3`} aria-disabled={!hasBodyRead}>
        <div className="grid gap-3">
          <fieldset>
            <legend className="text-sm font-medium">Consent check-in</legend>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="consent"
                  value="yes"
                  checked={consent === 'yes'}
                onChange={(e) => setConsent(e.target.value)}
                  aria-describedby="consent-hint"
                  disabled={!hasBodyRead}
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
                  disabled={!hasBodyRead}
                />
                <span>Not yet</span>
              </label>
            </div>
          </fieldset>
          {consent === 'not yet' && (
            <div className="grid gap-2 mt-2">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                Pause. Name what would help you feel safer before moving on.
              </div>
              <InputPanel
                label="WHY NOT YET?"
                id="consent-reason"
                value={needsText}
                onChange={(e) => setNeedsText((e.target as HTMLInputElement).value)}
                placeholder="What is needed before proceeding?"
                aria-label="Consent reason"
                disabled={!hasBodyRead}
                autoFocus
              />
            </div>
          )}
          <p id="consent-hint" className="text-xs text-ink-600">If "not yet," consider what is needed before proceeding.</p>
        </div>
        <div className="grid gap-3">
          <button
            className="px-4 py-2 border border-bone-500 rounded"
          onClick={() => setScanStarted(true)}
            aria-label="Start 30 second scan"
            disabled={!hasBodyRead}
          >
            Start 30s scan
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

        <div className="grid gap-2">
          <p className="text-sm text-ink-600">Supportive Environment</p>
          <p className="text-xs text-ink-600">Optional: Add anything that makes this space feel better for you (e.g., blanket, open window).</p>
          <div className="flex flex-wrap gap-2" aria-live="polite">
            {['Door locked', 'Water nearby', 'Warmth', 'Low light', 'Phone silent'].map((e) => {
              const active = env.includes(e);
              return (
                <button
                  key={e}
                  className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                    active 
                      ? 'bg-green-50 border-green-300 text-green-800' 
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  onClick={() => {
                    setEnv((cur) => (cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]));
                  }}
                  aria-pressed={active}
                  aria-label={`Environment setter: ${e}`}
                  disabled={!hasBodyRead}
                >
                  {active ? '✔ ' : ''}{e}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 items-center mt-2">
            <InputPanel
              label="SUPPORTIVE ENVIRONMENT"
              value={customEnv}
              onChange={(e) => setCustomEnv((e.target as HTMLInputElement).value)}
              placeholder="Custom supportive environment..."
              aria-label="Custom supportive environment"
              className="flex-1"
              disabled={!hasBodyRead}
            />
            <button
              onClick={() => {
                if (customEnv.trim()) {
                  setEnv(cur => [...cur, customEnv.trim()]);
                  setCustomEnv('');
                }
              }}
            disabled={!customEnv.trim() || !hasBodyRead}
              className="px-3 py-2 border border-slate-300 rounded disabled:opacity-50"
              aria-label="Add custom supportive environment"
            >
              Add
            </button>
          </div>
        </div>

        <div className="grid gap-2">
          <InputPanel
            label="NEEDS"
            id="needs"
            value={needsText}
            onChange={(e) => setNeedsText((e.target as HTMLInputElement).value)}
            placeholder="e.g., rest, warmth, quiet (comma to add multiple)"
            aria-label="Needs input"
            disabled={!hasBodyRead}
          />
          <p id="needs-hint" className="text-xs text-ink-600">Suggestions are optional. Choose only what feels kind.</p>
          <ChipList chips={chips} onSelect={(c) => hasBodyRead && setNeedsText(c.text)} />
        </div>

        {(consent.toLowerCase().includes('not yet') || needsText) && (
          <div className="grid gap-2">
            <p className="text-sm text-ink-600">If a part says “not yet,” name it and its need:</p>
            <InputPanel label="PART NAME" id="part-name" value={partName} onChange={(e) => setPartName((e.target as HTMLInputElement).value)} aria-label="Part name" disabled={!hasBodyRead} />
            <InputPanel label="PART NEED" id="part-need" value={partNeed} onChange={(e) => setPartNeed((e.target as HTMLInputElement).value)} aria-label="Part need" disabled={!hasBodyRead} />
          </div>
        )}
      </div>
      {/* Save remains at the bottom; disabled until body read is entered */}
      <div className="flex gap-3">
        <StackedButton className="rect-btn--sm" onClick={save} disabled={loading || !hasBodyRead || !hasNeedWhenNotYet} aria-label="Save safety note">
          {loading ? 'SAVING…' : 'SAVE'}
        </StackedButton>
      </div>
      {status && <p className="text-sm text-ink-600" aria-live="polite">{status}</p>}
    </section>
  );
}
