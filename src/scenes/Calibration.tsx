import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Timer from '../components/Timer';
import { addContext, listContexts, deleteContext, listEntries } from '../storage/storage';
import { ingestUserText } from '../ml';
import { ScenePlate, SceneNext } from '../components/ScenePlate';
import CalibrationIllustration from '../assets/calibration.svg?react';

// Evocative context options for rehearsal
const REHEARSAL_CONTEXTS = [
  'Morning coffee',
  'Kitchen',
  'Commute',
  'Waiting in line',
  'Before opening email',
  'Walking to the car',
  'Bedtime',
];

export default function Grounding() {
  const [searchParams] = useSearchParams();
  const focusProof = searchParams.get('focus') === 'proof';
  const proofTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [proof, setProof] = useState('');
  const [rehearsalContext, setRehearsalContext] = useState('');
  const [customContext, setCustomContext] = useState('');
  const [stretch, setStretch] = useState('');
  const [proofEntries, setProofEntries] = useState<any[]>([]);
  const [rehearsalEntries, setRehearsalEntries] = useState<any[]>([]);
  const [stretchEntries, setStretchEntries] = useState<any[]>([]);
  const [clarityOverlaps, setClarityOverlaps] = useState<{ id: string; text: string }[]>([]);
  const [overlapExpansions, setOverlapExpansions] = useState<Record<string, string>>({});
  const [latestTrait, setLatestTrait] = useState<string | null>(null);
  const [rehearse, setRehearse] = useState(false);
  const [rehearsalComplete, setRehearsalComplete] = useState(false);
  const [status, setStatus] = useState('');
  const [hasProof, setHasProof] = useState(false);
  const [preloadedOverlap, setPreloadedOverlap] = useState<string | null>(null);

  // Progress tracking
  const proofComplete = proofEntries.length > 0;
  const rehearsalSaved = rehearsalEntries.length > 0;
  const stretchSaved = stretchEntries.length > 0;
  const sectionsComplete = [proofComplete, rehearsalSaved, stretchSaved].filter(Boolean).length;

  useEffect(() => {
    loadEntries();
    loadClarityOverlapsAndTrait();
    // Load overlap preload from localStorage (CAL-3 deep link)
    try {
      const raw = localStorage.getItem('tja-overlap-preload');
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && typeof obj.text === 'string') setPreloadedOverlap(obj.text);
      }
    } catch { }
  }, []);

  // Auto-focus proof field when focus=proof parameter is present
  useEffect(() => {
    if (focusProof && proofTextareaRef.current) {
      setTimeout(() => {
        proofTextareaRef.current?.focus();
      }, 100);
    }
  }, [focusProof]);

  async function loadEntries() {
    const allContexts = await listContexts();
    const proofs = allContexts.filter(c => c.type === 'proof' || c.type === 'ordinary');
    const rehearsals = allContexts.filter(c => c.type === 'rehearsal');
    const stretches = allContexts.filter(c => c.type === 'friction');

    setProofEntries(proofs);
    setRehearsalEntries(rehearsals);
    setStretchEntries(stretches);
    setHasProof(proofs.length > 0);
  }

  async function loadClarityOverlapsAndTrait() {
    // Load latest overlaps from Clarity and infer the most recent selected trait
    const clarity = await listEntries('clarity');
    const withOverlap = clarity
      .filter((e: any) => typeof e.content?.overlap === 'string' && e.content.overlap.trim())
      .sort((a: any, b: any) => a.timestamp - b.timestamp);
    const latest = withOverlap.slice(-3).reverse();
    setClarityOverlaps(latest.map((e: any) => ({ id: e.id, text: String(e.content.overlap) })));

    // Find the most recent selectedTrait
    for (let i = clarity.length - 1; i >= 0; i--) {
      const t = clarity[i]?.content?.selectedTrait;
      if (t && typeof t === 'string') {
        setLatestTrait(t);
        break;
      }
    }
  }

  function timeAgo(ts: number) {
    const diff = Date.now() - ts;
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }


  async function saveProof() {
    if (!proof.trim()) return;

    await addContext(proof, 'proof', latestTrait ?? undefined);

    // Ingest context for future ML suggestions
    try {
      await ingestUserText('contexts', proof);
    } catch (error) {
      console.error('Failed to ingest context:', error);
    }

    setProof('');
    await loadEntries();
    setStatus('Saved proof.');
    setTimeout(() => setStatus(''), 1500);
  }

  async function saveRehearsal() {
    const contextToSave = rehearsalContext === 'custom' ? customContext : rehearsalContext;
    if (!contextToSave.trim() || !hasProof) return;

    await addContext(contextToSave, 'rehearsal', latestTrait ?? undefined);

    try {
      await ingestUserText('contexts', contextToSave);
    } catch (error) {
      console.error('Failed to ingest rehearsal:', error);
    }

    setRehearsalContext('');
    setCustomContext('');
    setRehearsalComplete(false);
    await loadEntries();
    setStatus('Saved rehearsal.');
    setTimeout(() => setStatus(''), 1500);
  }

  async function saveStretch() {
    if (!stretch.trim() || !hasProof) return;

    await addContext(stretch, 'friction', latestTrait ?? undefined);

    // Ingest stretch for future ML suggestions
    try {
      await ingestUserText('frictions', stretch);
    } catch (error) {
      console.error('Failed to ingest stretch:', error);
    }

    setStretch('');
    await loadEntries();
    setStatus('Saved stretch.');
    setTimeout(() => setStatus(''), 1500);
  }

  const selectedContext = rehearsalContext === 'custom' ? customContext : rehearsalContext;

  return (
    <section className="scene">
      {preloadedOverlap && (
        <div className="cue text-left" aria-live="polite">
          From Clarity: "{preloadedOverlap}"
        </div>
      )}
      <ScenePlate
        index="03"
        kicker={`/ 06 · ${sectionsComplete} of 3 complete`}
        title="Grounding"
        lead="Making clarity real in everyday life. Proof keeps the shift believable."
        art={<CalibrationIllustration />}
        artLabel="Grounding illustration"
      >
        Clarity without evidence is fragile. Grounding is how you anchor it into everyday life. Rather than dramatic grand gestures, you calibrate to new ways of being through tiny signals: the way you answer an email, how you move in your kitchen, the choices you make mid-commute.
      </ScenePlate>

      {/* Preloaded overlaps from Clarity (CAL-3) */}
      {clarityOverlaps.length > 0 && (
        <div className="panel panel--quiet">
          <h2 className="panel-title">From Clarity</h2>
          {clarityOverlaps.map((o) => (
            <div key={o.id} className="grid gap-2 pt-3 border-t border-ink-200 first-of-type:border-t-0 first-of-type:pt-0">
              <p className="panel-text">Earlier you noticed: "{o.text}"</p>
              <p className="field-label">Where else are you already being this way?</p>
              <div className="input-panel">
                <textarea
                  value={overlapExpansions[o.id] ?? ''}
                  onChange={(e) => setOverlapExpansions((prev) => ({ ...prev, [o.id]: e.target.value }))}
                  className="form-element min-h-[60px]"
                  placeholder="Name one ordinary place this already shows up..."
                  aria-label="Connection expansion input"
                />
              </div>
              <p className="field-hint">How does this connection prove that this identity is already alive in you?</p>
              <button
                className="btn-flow btn-flow--primary justify-self-start"
                onClick={async () => {
                  const text = overlapExpansions[o.id]?.trim();
                  if (!text) return;
                  await addContext(text, 'proof', latestTrait ?? undefined);
                  try { await ingestUserText('contexts', text); } catch { }
                  setOverlapExpansions((prev) => ({ ...prev, [o.id]: '' }));
                  await loadEntries();
                  setStatus('Saved to Evidence.');
                  setTimeout(() => setStatus(''), 1500);
                }}
                disabled={!overlapExpansions[o.id]?.trim()}
                aria-label="Save connection as evidence"
              >
                Save to Evidence
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Section 1: Spot Your Proof */}
      <div className="panel">
        <div className="panel-head">
          <h2 className="panel-title">
            <span className="step-num">01</span>Proof that it's already you
            {proofComplete && <span className="done-mark">✓ saved</span>}
          </h2>
          {latestTrait ? (
            <p className="panel-text">You're grounding <strong className="font-medium text-cobalt-500">{latestTrait}</strong>. Capture one small way you already lived this trait today.</p>
          ) : (
            <p className="panel-text">Capture one small way you already lived this trait today.</p>
          )}
        </div>
        <div className={`input-panel ${focusProof ? 'border-cobalt-500' : ''}`}>
          <textarea
            ref={proofTextareaRef}
            value={proof}
            onChange={(e) => setProof(e.target.value)}
            className="form-element min-h-[88px]"
            placeholder="Ex: I calmly answered an email while tired."
            aria-label="Proof input"
          />
        </div>
        <button
          className="btn-flow btn-flow--primary justify-self-start"
          onClick={saveProof}
          disabled={!proof.trim()}
          aria-label="Save proof"
        >
          Save Proof
        </button>
        {proofEntries.length > 0 && (
          <div className="grid gap-2">
            <h3 className="kicker">Saved Proofs</h3>
            <ul className="saved-list">
              {proofEntries.map((p: any) => (
                <li key={p.id}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>{p.label}</span>
                      {p.trait && (
                        <span className="tag">{p.trait}</span>
                      )}
                    </div>
                    <div className="saved-meta">{p.created_at ? timeAgo(p.created_at) : ''}{p.trait ? ` • ${p.trait}` : ''}</div>
                  </div>
                  <button className="btn-quiet text-xs" onClick={async () => { await deleteContext(p.id); await loadEntries(); }}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Section 2: Practice in Daily Life */}
      <div className={`panel ${!hasProof ? 'panel--locked' : ''}`}>
        <div className="panel-head">
          <h2 className="panel-title">
            <span className="step-num">02</span>Rehearse your trait in ordinary life
            {rehearsalSaved && <span className="done-mark">✓ saved</span>}
          </h2>
          <p className="panel-text">Pick a tiny, ordinary moment. This is where your new self comes alive.</p>
        </div>

        {/* Chip-based context selection */}
        <div className="flex flex-wrap gap-2">
          {REHEARSAL_CONTEXTS.map((ctx) => {
            const active = rehearsalContext === ctx;
            return (
              <button
                key={ctx}
                className={active ? 'chip chip-interactive' : 'chip chip-suggestion'}
                onClick={() => setRehearsalContext(active ? '' : ctx)}
                disabled={!hasProof}
                aria-pressed={active}
                aria-label={`Context: ${ctx}`}
              >
                {active ? '✔ ' : ''}{ctx}
              </button>
            );
          })}
          <button
            className={rehearsalContext === 'custom' ? 'chip chip-interactive' : 'chip chip-suggestion'}
            onClick={() => setRehearsalContext(rehearsalContext === 'custom' ? '' : 'custom')}
            disabled={!hasProof}
            aria-pressed={rehearsalContext === 'custom'}
          >
            {rehearsalContext === 'custom' ? '✔ ' : ''}Custom
          </button>
        </div>

        {rehearsalContext === 'custom' && (
          <div className="input-panel">
            <input
              type="text"
              placeholder="Describe your moment..."
              value={customContext}
              className="form-element"
              onChange={(e) => setCustomContext(e.target.value)}
              aria-label="Custom context input"
            />
          </div>
        )}

        <div className="flex gap-3 flex-wrap items-center">
          <button
            className="btn-flow btn-flow--primary"
            onClick={() => setRehearse(true)}
            disabled={!hasProof || !selectedContext.trim() || rehearse}
            aria-label="Start 60 second rehearsal"
          >
            Start 60-second practice
          </button>
          {rehearsalComplete && (
            <button
              className="btn-flow"
              onClick={saveRehearsal}
              disabled={!hasProof || !selectedContext.trim()}
              aria-label="Save rehearsal"
            >
              Save Rehearsal
            </button>
          )}
        </div>

        {rehearse && (
          <Timer
            seconds={60}
            label="60 second rehearsal"
            onDone={() => {
              setRehearse(false);
              setRehearsalComplete(true);
            }}
          />
        )}

        {rehearsalEntries.length > 0 && (
          <div className="grid gap-2">
            <h3 className="kicker">Saved Rehearsals</h3>
            <ul className="saved-list">
              {rehearsalEntries.map((r: any) => (
                <li key={r.id}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>{r.label}</span>
                      {r.trait && (
                        <span className="tag">{r.trait}</span>
                      )}
                    </div>
                    <div className="saved-meta">{r.created_at ? timeAgo(r.created_at) : ''}{r.trait ? ` • ${r.trait}` : ''}</div>
                  </div>
                  <button className="btn-quiet text-xs" onClick={async () => { await deleteContext(r.id); await loadEntries(); }}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Section 3: Where Are You Being Stretched? (philosophical reframe) */}
      <div className={`panel ${!hasProof ? 'panel--locked' : ''}`}>
        <div className="panel-head">
          <h2 className="panel-title">
            <span className="step-num">03</span>Where Are You Being Stretched?
            {stretchSaved && <span className="done-mark">✓ saved</span>}
          </h2>
          <p className="panel-text">
            Do you feel drawn toward a choice or action that also brings up some tension? This edge is where growth lives. You don't have to force anything - just notice if something is calling you forward.
          </p>
        </div>
        <div className="input-panel">
          <input
            type="text"
            value={stretch}
            onChange={(e) => setStretch(e.target.value)}
            className="form-element"
            placeholder="Ex: I feel pulled to pay my assistant more. It's a stretch, but it feels aligned."
            disabled={!hasProof}
            aria-label="Stretch input"
          />
        </div>
        <button
          className="btn-flow btn-flow--primary justify-self-start"
          onClick={saveStretch}
          disabled={!hasProof || !stretch.trim()}
          aria-label="Save stretch"
        >
          Save This Edge
        </button>
        {stretchEntries.length > 0 && (
          <div className="grid gap-2">
            <h3 className="kicker">Saved Edges</h3>
            <ul className="saved-list">
              {stretchEntries.map((f: any) => (
                <li key={f.id}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>{f.label}</span>
                      {f.trait && (
                        <span className="tag">{f.trait}</span>
                      )}
                    </div>
                    <div className="saved-meta">{f.created_at ? timeAgo(f.created_at) : ''}{f.trait ? ` • ${f.trait}` : ''}</div>
                  </div>
                  <button className="btn-quiet text-xs" onClick={async () => { await deleteContext(f.id); await loadEntries(); }}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {status && <p className="status-line" aria-live="polite">{status}</p>}

      <SceneNext
        links={[
          { to: '/artifact/void', label: 'Continue to VOID', primary: true },
          { to: '/artifact/resets', label: 'Resets' },
        ]}
      />
    </section>
  );
}
