import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Timer from '../components/Timer';
import { addContext, listContexts, deleteContext, listEntries } from '../storage/storage';
import { ingestUserText } from '../ml';
import StackedButton from '../components/ui/StackedButton';
import InputPanel from '../components/ui/InputPanel';

export default function Calibration() {
  const [searchParams] = useSearchParams();
  const focusProof = searchParams.get('focus') === 'proof';
  const proofTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [proof, setProof] = useState('');
  const [rehearsalContext, setRehearsalContext] = useState('');
  const [friction, setFriction] = useState('');
  const [proofEntries, setProofEntries] = useState<any[]>([]);
  const [rehearsalEntries, setRehearsalEntries] = useState<any[]>([]);
  const [frictionEntries, setFrictionEntries] = useState<any[]>([]);
  const [clarityOverlaps, setClarityOverlaps] = useState<{ id: string; text: string }[]>([]);
  const [overlapExpansions, setOverlapExpansions] = useState<Record<string, string>>({});
  const [latestTrait, setLatestTrait] = useState<string | null>(null);
  const [rehearse, setRehearse] = useState(false);
  const [status, setStatus] = useState('');
  const [hasProof, setHasProof] = useState(false);
  const [preloadedOverlap, setPreloadedOverlap] = useState<string | null>(null);

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
    } catch {}
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
    const frictions = allContexts.filter(c => c.type === 'friction');
    
    setProofEntries(proofs);
    setRehearsalEntries(rehearsals);
    setFrictionEntries(frictions);
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
    if (!rehearsalContext.trim() || !hasProof) return;
    
    await addContext(rehearsalContext, 'rehearsal', latestTrait ?? undefined);
    
    try {
      await ingestUserText('contexts', rehearsalContext);
    } catch (error) {
      console.error('Failed to ingest rehearsal:', error);
    }
    
    setRehearsalContext('');
    await loadEntries();
    setStatus('Saved rehearsal.');
    setTimeout(() => setStatus(''), 1500);
  }

  async function saveFriction() {
    if (!friction.trim() || !hasProof) return;
    
    await addContext(friction, 'friction', latestTrait ?? undefined);
    
    // Ingest friction for future ML suggestions
    try {
      await ingestUserText('frictions', friction);
    } catch (error) {
      console.error('Failed to ingest friction:', error);
    }
    
    setFriction('');
    await loadEntries();
    setStatus('Saved friction.');
    setTimeout(() => setStatus(''), 1500);
  }

  return (
    <section className="grid gap-6">
      {preloadedOverlap && (
        <div className="p-3 border rounded bg-bone-50 text-sm text-ink-800" aria-live="polite">
          From Clarity: “{preloadedOverlap}”
        </div>
      )}
      <header className="grid gap-2">
  <h1 className="text-2xl font-bold doto-base doto-700">Calibration</h1>
        <p className="text-ink-700 text-sm">Calibration grounds clarity in ordinary life. Proof keeps the shift believable.</p>
        <div className="p-4 bg-bone-50 rounded-lg text-sm text-ink-700">
          Clarity without evidence is fragile. Calibration is how you ground it into everyday life. Rather than using dramatic grand gestures, you calibrate to new ways of being through tiny signals: the way you answer an email, how you move in your kitchen, the choices you make mid-commute.
          {/* TODO: Reference path for future copy: docs/Updates/Explainers */}
        </div>
      </header>

      {/* Preloaded overlaps from Clarity (CAL-3) */}
      {clarityOverlaps.length > 0 && (
        <div className="grid gap-3 p-4 border rounded-lg bg-bone-50/50">
          <h2 className="font-semibold text-lg">From Clarity</h2>
          {clarityOverlaps.map((o) => (
            <div key={o.id} className="grid gap-2 p-3 rounded border bg-white">
              <p className="text-sm text-ink-700">Earlier you noticed: "{o.text}"</p>
              <p className="text-sm">Where else are you already being this way?</p>
              <textarea
                value={overlapExpansions[o.id] ?? ''}
                onChange={(e) => setOverlapExpansions((prev) => ({ ...prev, [o.id]: e.target.value }))}
                className="border p-2 rounded min-h-[60px]"
                placeholder="Name one ordinary place this already shows up..."
                aria-label="Overlap expansion input"
              />
              <p className="text-sm">How does this overlap prove that this identity is already alive in you?</p>
              <button
                className="px-3 py-1.5 bg-ink-900 text-bone-50 rounded hover:bg-ink-800 justify-self-start"
                onClick={async () => {
                  const text = overlapExpansions[o.id]?.trim();
                  if (!text) return;
                  await addContext(text, 'proof', latestTrait ?? undefined);
                  try { await ingestUserText('contexts', text); } catch {}
                  setOverlapExpansions((prev) => ({ ...prev, [o.id]: '' }));
                  await loadEntries();
                  setStatus('Saved to Evidence.');
                  setTimeout(() => setStatus(''), 1500);
                }}
                disabled={!overlapExpansions[o.id]?.trim()}
                aria-label="Save overlap expansion as evidence"
              >
                Save to Evidence
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Section 1: Spot Your Proof */}
      <div className="grid gap-3 p-4 border rounded-lg">
        <div>
          <h2 className="font-semibold text-lg">Proof that it's already you</h2>
          <p className="text-sm text-ink-600">Capture one small way you already lived this trait today.</p>
        </div>
        <InputPanel
          as="textarea"
          label="PROOF"
          ref={proofTextareaRef as any}
          value={proof}
          onChange={(e) => setProof((e.target as HTMLTextAreaElement).value)}
          placeholder="Ex: I calmly answered an email while tired."
          aria-label="Proof input"
        />
        <StackedButton 
          className="rect-btn--sm"
          onClick={saveProof}
          disabled={!proof.trim()}
          aria-label="Save proof"
        >
          SAVE PROOF
        </StackedButton>
        {proofEntries.length > 0 && (
          <div className="mt-2">
            <h3 className="text-sm text-ink-600 mb-2">Saved Proofs</h3>
            <ul className="space-y-1">
              {proofEntries.map((p: any) => (
                <li key={p.id} className="flex items-start gap-2 p-2 bg-bone-50 rounded">
                  <div className="flex-1">
                    <div className="text-sm flex items-center gap-2">
                      <span>{p.label}</span>
                      {p.trait && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px]">{p.trait}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-ink-500 mt-0.5">{p.created_at ? timeAgo(p.created_at) : ''}{p.trait ? ` • ${p.trait}` : ''}</div>
                  </div>
                  <button className="text-xs text-ink-500 hover:text-ink-700" onClick={async () => { await deleteContext(p.id); await loadEntries(); }}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Section 2: Practice in Daily Life */}
      <div className={`grid gap-3 p-4 border rounded-lg ${!hasProof ? 'opacity-50' : ''}`}>
        <div>
          <h2 className="font-semibold text-lg">Rehearse your trait in ordinary life</h2>
          <p className="text-sm text-ink-600">Pick a tiny moment (kitchen, inbox, commute). Practice embodying it for 60 seconds.</p>
        </div>
        <select
          value={rehearsalContext}
          onChange={(e) => setRehearsalContext(e.target.value)}
          className="border p-3 rounded"
          disabled={!hasProof}
          aria-label="Daily context selection"
        >
          <option value="">Choose a context...</option>
          <option value="kitchen">Kitchen</option>
          <option value="commute">Commute</option>
          <option value="email">Email</option>
          <option value="bedtime">Bedtime</option>
          <option value="custom">Custom</option>
        </select>
        {rehearsalContext === 'custom' && (
          <InputPanel
            label="CUSTOM CONTEXT"
            placeholder="Describe your custom context..."
            onChange={(e) => setRehearsalContext((e.target as HTMLInputElement).value)}
            aria-label="Custom context input"
          />
        )}
        <div className="flex gap-2">
          <StackedButton
            className="rect-btn--sm"
            onClick={saveRehearsal}
            disabled={!hasProof || !rehearsalContext.trim()}
            aria-label="Save rehearsal"
          >
            SAVE REHEARSAL
          </StackedButton>
          <button 
            className="px-4 py-2 border rounded" 
            onClick={() => setRehearse(true)}
            disabled={!hasProof || !rehearsalContext.trim()}
            aria-label="Start 60 second rehearsal"
          >
            Start 60s
          </button>
        </div>
        {rehearse && <Timer seconds={60} label="60 second rehearsal" onDone={() => setRehearse(false)} />}
        {rehearsalEntries.length > 0 && (
          <div className="mt-2">
            <h3 className="text-sm text-ink-600 mb-2">Saved Rehearsals</h3>
            <ul className="space-y-1">
              {rehearsalEntries.map((r: any) => (
                <li key={r.id} className="flex items-start gap-2 p-2 bg-bone-50 rounded">
                  <div className="flex-1">
                    <div className="text-sm flex items-center gap-2">
                      <span>{r.label}</span>
                      {r.trait && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px]">{r.trait}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-ink-500 mt-0.5">{r.created_at ? timeAgo(r.created_at) : ''}{r.trait ? ` • ${r.trait}` : ''}</div>
                  </div>
                  <button className="text-xs text-ink-500 hover:text-ink-700" onClick={async () => { await deleteContext(r.id); await loadEntries(); }}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Section 3: Clear Tomorrow's Friction */}
      <div className={`grid gap-3 p-4 border rounded-lg ${!hasProof ? 'opacity-50' : ''}`}>
        <div>
          <h2 className="font-semibold text-lg">Make it easier</h2>
          <p className="text-sm text-ink-600">Name one obstacle you can remove tomorrow so this identity feels natural.</p>
        </div>
        <InputPanel
          label="FRICTION"
          value={friction}
          onChange={(e) => setFriction((e.target as HTMLInputElement).value)}
          placeholder="Ex: put phone in another room before bed."
          aria-label="Friction input"
        />
        <StackedButton 
          className="rect-btn--sm"
          onClick={saveFriction}
          disabled={!hasProof || !friction.trim()}
          aria-label="Save friction"
        >
          SAVE FRICTION
        </StackedButton>
        {frictionEntries.length > 0 && (
          <div className="mt-2">
            <h3 className="text-sm text-ink-600 mb-2">Saved Frictions</h3>
            <ul className="space-y-1">
              {frictionEntries.map((f: any) => (
                <li key={f.id} className="flex items-start gap-2 p-2 bg-bone-50 rounded">
                  <div className="flex-1">
                    <div className="text-sm flex items-center gap-2">
                      <span>{f.label}</span>
                      {f.trait && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px]">{f.trait}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-ink-500 mt-0.5">{f.created_at ? timeAgo(f.created_at) : ''}{f.trait ? ` • ${f.trait}` : ''}</div>
                  </div>
                  <button className="text-xs text-ink-500 hover:text-ink-700" onClick={async () => { await deleteContext(f.id); await loadEntries(); }}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {status && <p className="text-sm text-ink-600" aria-live="polite">{status}</p>}
    </section>
  );
}
