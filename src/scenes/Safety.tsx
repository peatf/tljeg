import { useEffect, useState } from 'react';
import SafetyIllustration from '../assets/safety.svg?react';
import BodyScan from '../components/BodyScan';
import { ChipList } from '../components/Chips';
import { addEntry } from '../storage/storage';
import { getSuggestions } from '../ml';
import { ScenePlate, SceneNext } from '../components/ScenePlate';

export default function Safety() {
  const [consent, setConsent] = useState('');
  const [needsText, setNeedsText] = useState('');
  const [chips, setChips] = useState<{ id: string; text: string; source: 'seed' | 'user' }[]>([]);
  const [env, setEnv] = useState<string[]>([]);
  const [partName, setPartName] = useState('');
  const [partNeed, setPartNeed] = useState('');
  const [status, setStatus] = useState('');
  const [bodyReflection, setBodyReflection] = useState('');
  const [customEnv, setCustomEnv] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (consent === 'not yet') {
      getSuggestions('needs', needsText).then(result => setChips(result.items)).catch(() => setChips([]));
    }
  }, [needsText, consent]);

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
    <section className="scene">
      <ScenePlate
        index="01"
        kicker="/ 06"
        title="Safety"
        lead="Shifts only land if they feel safe. Begin by grounding in internal safety."
        art={<SafetyIllustration />}
        artLabel="Safety illustration"
      >
        Change only roots when your system feels safe enough to let it land. If you try to push transformation from a body still vibrating with stress, it's like planting seeds in pebbles: nothing takes. This stage is where you check your environment, name what you need, and give yourself permission to open.
      </ScenePlate>

      <p className="scene-lead">Get comfortable first, then check in with yourself. If you're ready, run a gentle 30-second scan.</p>

      {/* Section 1: Prepare Your Space (first in new order) */}
      <div className="panel">
        <div className="panel-head">
          <p className="panel-title"><span className="step-num">01</span>Your environment</p>
          <p className="panel-text">Prepare your space before you begin.</p>
        </div>
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
          {env.filter((e) => !['Door locked', 'Water nearby', 'Warmth', 'Low light', 'Phone silent'].includes(e)).map((e) => (
            <button
              key={e}
              className="chip chip-interactive"
              onClick={() => setEnv((cur) => cur.filter((x) => x !== e))}
              aria-pressed={true}
              aria-label={`Environment option: ${e}`}
            >
              ✔ {e}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-stretch">
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
      <div className="panel">
        <fieldset className="grid gap-3">
          <legend className="panel-title"><span className="step-num">02</span>Consent check-in</legend>
          <p className="panel-text">Now that you're settled, are you ready to continue?</p>
          <div className="choice-row">
            <label className="choice">
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
            <label className="choice">
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

        {/* Section 3: Name what you need (only if "Not yet" selected) */}
        {consent === 'not yet' && (
          <div className="grid gap-4 pt-4 border-t border-ink-200">
            <div className="grid gap-2">
              <p className="field-label">Your inner state</p>
              <label className="field-hint" htmlFor="needs">Name what you need before moving forward</label>
              <div className="input-panel">
                <input
                  id="needs"
                  value={needsText}
                  onChange={(e) => setNeedsText(e.target.value)}
                  placeholder="e.g., rest, warmth, quiet (comma to add multiple)"
                  className="form-element"
                  aria-label="Needs input"
                  aria-describedby="needs-hint"
                />
              </div>
              <p id="needs-hint" className="field-hint">Suggestions are optional. Choose only what feels kind.</p>
              <ChipList chips={chips} onSelect={(c) => setNeedsText(c.text)} />
            </div>

            <div className="grid gap-2">
              <p className="field-hint">If a part says "not yet," name it and its need:</p>
              <label htmlFor="part-name" className="field-label">Part name</label>
              <div className="input-panel">
                <input id="part-name" value={partName} onChange={(e) => setPartName(e.target.value)} className="form-element" aria-label="Part name" />
              </div>
              <label htmlFor="part-need" className="field-label">What does it need?</label>
              <div className="input-panel">
                <input id="part-need" value={partNeed} onChange={(e) => setPartNeed(e.target.value)} className="form-element" aria-label="Part need" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Body scan (only visible after consent is "yes" or after acknowledging "not yet") */}
      {consent && (
        <div className="panel">
          <div className="panel-head">
            <p className="panel-title"><span className="step-num">03</span>Body scan</p>
            <p className="panel-text">Close your eyes and notice how your body feels right now.</p>
          </div>
          <BodyScan />

          {/* Section 5: Body reflection (after scan) */}
          <div className="grid gap-2 pt-2">
            <label htmlFor="body-reflection" className="field-label">Where in your body do you feel ready/not ready?</label>
            <div className="input-panel">
              <textarea id="body-reflection" value={bodyReflection} onChange={(e) => setBodyReflection(e.target.value)} className="form-element min-h-[96px]" aria-label="Body readiness reflection" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-flow btn-flow--primary" onClick={save} disabled={loading} aria-label="Save safety note">
              {loading ? 'Saving…' : 'Save'}
            </button>
            {status && <p className="status-line" aria-live="polite">{status}</p>}
          </div>
        </div>
      )}

      {/* FAQ-style reassurance */}
      <p className="note">You can't mess this up. If something feels off, you can always come back.</p>

      {/* What's next guidance */}
      <SceneNext
        links={[
          { to: '/artifact/clarity', label: 'Continue to Clarity', primary: true },
          { to: '/artifact/void', label: 'Drop into VOID first' },
        ]}
      />
    </section>
  );
}
