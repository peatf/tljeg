import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Timer from '../components/Timer';
import { motion, useReducedMotion } from 'framer-motion';
import { ChipList } from '../components/Chips';
import { addEntry, addTrait, listEntries, listTraits } from '../storage/storage';
import { getSuggestions, ingestUserText, type SuggestResult } from '../ml';

export default function Clarity() {
  const [searchParams] = useSearchParams();
  const gentleMode = searchParams.get('mode') === 'gentle';

  const [input, setInput] = useState('');
  const [selectedTrait, setSelectedTrait] = useState<string | null>(null);
  const [chips, setChips] = useState<{ id: string; text: string; source: 'seed' | 'user'; method?: 'embedding' | 'fuzzy' }[]>([]);
  const [isThrottled, setIsThrottled] = useState(false);
  const [rehearsing, setRehearsing] = useState(false);
  const [overlap, setOverlap] = useState('');
  const [overlapChips, setOverlapChips] = useState<{ id: string; text: string; source: 'seed' | 'user' }[]>([]);
  const [userTraitChips, setUserTraitChips] = useState<{ id: string; text: string; source: 'user' }[]>([]);
  const [relatedTraitChips, setRelatedTraitChips] = useState<{ id: string; text: string; source: 'user' }[]>([]);
  const [status, setStatus] = useState('');
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    // Debounce ML suggestions and merge with starter traits
    const timer = setTimeout(() => {
      getSuggestions('traits', input).then((result: SuggestResult) => {
        setIsThrottled(result.throttled || false);
        const mlChips = result.items;
        const starterTraits = gentleMode
          ? [
            { id: 'gentle-calm', text: 'A bit calmer', source: 'seed' as const },
            { id: 'gentle-kind', text: 'More kind', source: 'seed' as const },
            { id: 'gentle-patient', text: 'Slightly patient', source: 'seed' as const },
            { id: 'gentle-present', text: 'More present', source: 'seed' as const },
            { id: 'gentle-gentle', text: 'Gentler', source: 'seed' as const }
          ]
          : [
            { id: 'starter-calm', text: 'Calm', source: 'seed' as const },
            { id: 'starter-generous', text: 'Generous', source: 'seed' as const },
            { id: 'starter-brave', text: 'Brave', source: 'seed' as const },
            { id: 'starter-creative', text: 'Creative', source: 'seed' as const },
            { id: 'starter-precise', text: 'Precise', source: 'seed' as const }
          ];
        const finalChips = mlChips.length > 0 ? mlChips : starterTraits;
        setChips(finalChips);
      }).catch(() => {
        setIsThrottled(false);
        const starterTraits = gentleMode
          ? [
            { id: 'gentle-calm', text: 'A bit calmer', source: 'seed' as const },
            { id: 'gentle-kind', text: 'More kind', source: 'seed' as const },
            { id: 'gentle-patient', text: 'Slightly patient', source: 'seed' as const },
            { id: 'gentle-present', text: 'More present', source: 'seed' as const },
            { id: 'gentle-gentle', text: 'Gentler', source: 'seed' as const }
          ]
          : [
            { id: 'starter-calm', text: 'Calm', source: 'seed' as const },
            { id: 'starter-generous', text: 'Generous', source: 'seed' as const },
            { id: 'starter-brave', text: 'Brave', source: 'seed' as const },
            { id: 'starter-creative', text: 'Creative', source: 'seed' as const },
            { id: 'starter-precise', text: 'Precise', source: 'seed' as const }
          ];
        setChips(starterTraits);
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [input, gentleMode]);

  useEffect(() => {
    // surface past overlaps as chips (user source)
    listEntries('clarity').then((arr) => {
      const texts = Array.from(
        new Set(
          arr
            .map((e: any) => e.content?.overlap)
            .filter(Boolean)
        )
      ).slice(0, 12);
      setOverlapChips(texts.map((t) => ({ id: `overlap:${t}`, text: String(t), source: 'user' as const })));
    });
  }, []);

  // Related traits via simple co-occurrence with overlaps
  useEffect(() => {
    listEntries('clarity').then((arr) => {
      const norm = (s: string) => s.toLowerCase().trim();
      const q = norm(overlap);
      if (!q) {
        setRelatedTraitChips([]);
        return;
      }
      const matches = arr.filter((e: any) => typeof e.content?.overlap === 'string' && norm(e.content.overlap).includes(q));
      const counts: Record<string, number> = {};
      for (const m of matches) {
        const t = m.content?.selectedTrait;
        if (t && typeof t === 'string') counts[t] = (counts[t] || 0) + 1;
      }
      const ranked = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([t]) => ({ id: `rel:${t}`, text: t, source: 'user' as const }));
      setRelatedTraitChips(ranked);
    });
  }, [overlap]);

  useEffect(() => {
    listTraits().then((ts: any[]) => {
      const items = ts.slice(-10).map((t) => ({ id: `ut:${t.id}`, text: t.text, source: 'user' as const }));
      setUserTraitChips(items);
    });
  }, []);

  async function save() {
    if (selectedTrait) await addTrait(selectedTrait);
    await addEntry('clarity', { input, selectedTrait, overlap });

    // Ingest selected trait for future ML suggestions
    if (selectedTrait) {
      try {
        await ingestUserText('traits', selectedTrait);
      } catch (error) {
        console.error('Failed to ingest trait:', error);
      }
    }

    setStatus('Saved.');
    setTimeout(() => setStatus(''), 1500);
  }

  return (
    <section className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-2xl font-bold doto-base doto-700">Clarity{gentleMode ? ' (Gentle Mode)' : ''}</h1>
        <p className="text-ink-700 text-sm">Clarity means uncovering the identity shift that calls you. This can surface from desire, tension, or even envy.</p>
        <div className="section-card text-sm text-ink-700">
          Clarity points your compass. Without it, your mind runs on yesterday's autopilot. You are listening for what wants to emerge from you, reveal itself to you from your reality's mirror. Sometimes it comes through admiration. Sometimes through tension, even jealousy. Both are signals.
          {/* TODO: Reference path for future copy: docs/Updates/Explainers */}
        </div>
      </header>
      <div className="grid gap-4">
        <h2 className="font-semibold text-lg">Entry Points</h2>

        <details className="section-card group">
          <summary className="p-4 cursor-pointer flex items-center gap-2">
            <span className="text-ink-400 group-open:rotate-90 transition-transform">▶</span>
            <span className="font-medium">What inspires you?</span>
          </summary>
          <div className="px-4 pb-4 text-sm text-ink-700">
            <p className="mb-3">Think about people you admire, stories that move you, art that stops you in your tracks. What do they have that calls to you?</p>
            <div className="input-panel">
              <textarea
                id="insp"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="form-element w-full"
                rows={3}
                placeholder="Write about what inspires you..."
                aria-label="Inspiration input"
              />
            </div>
          </div>
        </details>

        <details className="section-card group">
          <summary className="p-4 cursor-pointer flex items-center gap-2">
            <span className="text-ink-400 group-open:rotate-90 transition-transform">▶</span>
            <span className="font-medium">What's working?</span>
          </summary>
          <div className="px-4 pb-4 text-sm text-ink-700">
            <p className="mb-3">Name one small thing that already feels aligned with who you're becoming.</p>
            <label htmlFor="working" className="sr-only">What's working</label>
            <div className="input-panel">
              <textarea
                id="working"
                className="form-element w-full"
                rows={3}
                placeholder="e.g., I noticed I spoke more slowly and felt grounded on my call today."
                aria-label="What's working"
              />
            </div>
          </div>
        </details>

        <details className="section-card group">
          <summary className="p-4 cursor-pointer flex items-center gap-2">
            <span className="text-ink-400 group-open:rotate-90 transition-transform">▶</span>
            <span className="font-medium">What recurring thought keeps showing up?</span>
          </summary>
          <div className="px-4 pb-4 text-sm text-ink-700">
            <p className="mb-3">What is the intention of this thought? At the end of the day, what is this thought trying to get you to feel more of in your reality?</p>
            <div className="input-panel">
              <textarea
                className="form-element w-full"
                rows={3}
                placeholder="Describe the recurring thought and what it's trying to show you..."
                aria-label="Recurring thought input"
              />
            </div>
          </div>
        </details>

        <details className="section-card group">
          <summary className="p-4 cursor-pointer flex items-center gap-2">
            <span className="text-ink-400 group-open:rotate-90 transition-transform">▶</span>
            <span className="font-medium">Who triggers a spark of jealousy?</span>
          </summary>
          <div className="px-4 pb-4 text-sm text-ink-700">
            <p className="mb-3">Jealousy is directional. What does that person have that reveals what you want?</p>
            <div className="input-panel">
              <textarea
                className="form-element w-full"
                rows={3}
                placeholder="Write about the jealousy and what it reveals..."
                aria-label="Jealousy insight input"
              />
            </div>
          </div>
        </details>
      </div>

      {/* Scroll indicator - signals more content below */}
      <div className="flex justify-center py-2 text-ink-400">
        <span className="text-sm animate-pulse">↓ Choose a trait below</span>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <p className="text-sm text-ink-600">Tap a trait chip to choose one.</p>
          {/* Only show "Based on what you wrote" if ML actually used embeddings to match */}
          {!isThrottled && input.trim() && chips.length > 0 && chips.some(c => c.method === 'embedding') && (
            <span className="chip chip-suggestion text-xs bg-green-100 text-green-700">
              Based on what you wrote
            </span>
          )}
          {isThrottled && (
            <span className="chip chip-suggestion text-xs bg-amber-100 text-amber-800">
              Showing recent suggestions
            </span>
          )}
        </div>
        <ChipList
          chips={chips}
          onSelect={(c) => setSelectedTrait((prev) => (prev === c.text ? null : c.text))}
        />
        {userTraitChips.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-ink-500">Traits you've saved before:</p>
            <ChipList chips={userTraitChips} onSelect={(c) => setSelectedTrait(c.text)} />
          </div>
        )}
        {selectedTrait && (
          <div className="mt-2 flex items-center gap-2">
            <p>
              Selected: <strong>{selectedTrait}</strong>
            </p>
            <button className="btn-quiet text-sm" onClick={() => setSelectedTrait(null)} aria-label="Clear selected trait">Clear</button>
          </div>
        )}
      </div>
      <div className="grid gap-3">
        {/* Orienting text - always visible */}
        <div className="section-card text-sm text-ink-700">
          <p className="font-medium mb-1">45-Second Embodiment Practice</p>
          <p>Once you've chosen a trait, take 45 seconds to sit with it. Let it settle in your body. Notice where you feel it.</p>
        </div>

        {/* Practice button - disabled until trait selected */}
        <button
          className={`btn-flow inline-flex items-center gap-2 transition-colors ${!selectedTrait ? 'bg-ink-200 text-ink-400 cursor-not-allowed' : ''}`}
          style={selectedTrait ? { background: 'var(--color-accent-organic)', color: 'white', borderColor: 'var(--color-accent-organic)' } : {}}
          onClick={() => selectedTrait && setRehearsing(true)}
          disabled={!selectedTrait}
          aria-label={selectedTrait ? 'Begin 45-second embodiment practice' : 'Select a trait first to begin practice'}
        >
          <span aria-hidden>▶</span>
          {selectedTrait
            ? `Sit with "${selectedTrait}" for 45 seconds`
            : 'Select a trait above to begin'}
        </button>

        {/* Active practice state */}
        {rehearsing && (
          <div className="grid gap-3 place-items-center section-card">
            <Timer seconds={45} label="Embodiment practice" onDone={() => setRehearsing(false)} />
            {prefersReduced ? (
              <div className="w-24 h-24 rounded-full border-2 border-ink-600" aria-hidden />
            ) : (
              <motion.div
                className="w-24 h-24 rounded-full border-2 border-ink-600"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ repeat: Infinity, duration: 2.2 }}
                aria-hidden
              />
            )}
            <p className="text-sm text-ink-600 text-center">
              Let "{selectedTrait}" land in your body.<br />
              Where do you feel it?
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-4">
        <h3 className="font-semibold">Where Are You Already This Way?</h3>

        <div className="grid gap-3">
          <div>
            <label className="text-sm font-medium">Step 1: Recall a recent moment</label>
            <p className="text-xs text-ink-600 mb-2">Where did you already act this way today or recently?</p>
            <div className="input-panel">
              <textarea
                className="form-element w-full text-sm"
                rows={2}
                placeholder="e.g., I stayed calm during that difficult phone call..."
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Step 2: What felt natural?</label>
            <p className="text-xs text-ink-600 mb-2">What about that moment felt effortless or authentic?</p>
            <div className="input-panel">
              <textarea
                className="form-element w-full text-sm"
                rows={2}
                placeholder="e.g., My breathing stayed steady, I listened without rushing to respond..."
              />
            </div>
          </div>

          <div>
            <label htmlFor="overlap" className="text-sm font-medium">Step 3: Name one connection</label>
            <p className="text-xs text-ink-600 mb-2">This is where your current self already meets who you're becoming.</p>
            <div className="input-panel">
              <input
                id="overlap"
                value={overlap}
                onChange={(e) => setOverlap(e.target.value)}
                className="form-element w-full"
                placeholder="e.g., I already have the calm presence I'm cultivating"
                aria-label="Connection point input"
              />
            </div>
            <div className="mt-2">
              <button className="btn-flow" onClick={save} aria-label="Save connection" style={{ background: 'var(--color-accent-organic)', color: 'white', borderColor: 'var(--color-accent-organic)' }}>Save</button>
            </div>
          </div>
        </div>

        {overlapChips.length > 0 && (
          <div>
            <p className="text-sm text-ink-600 mt-1">Evidence of Who You Already Are</p>
            <ChipList chips={overlapChips} onSelect={(c) => setOverlap(c.text)} />
          </div>
        )}
        {relatedTraitChips.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-ink-600">Related traits</p>
            <ChipList chips={relatedTraitChips} onSelect={(c) => setSelectedTrait(c.text)} />
          </div>
        )}
      </div>

      {/* FAQ-style reassurance */}
      <p className="text-sm text-ink-500 italic">There's no wrong way to do this. Follow what feels true.</p>

      {/* What's next guidance */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <p className="text-sm text-ink-600 mb-3">Ready to continue?</p>
        <div className="flex flex-wrap gap-3">
          <a href="/artifact/calibration" className="btn-flow inline-flex items-center gap-2" style={{ background: 'var(--color-accent-organic)', color: 'white', borderColor: 'var(--color-accent-organic)' }}>
            Continue to Grounding <span aria-hidden>→</span>
          </a>
          <a href="/artifact/void" className="btn-quiet">
            Take a pause in VOID
          </a>
        </div>
      </div>

      {status && <p className="text-sm text-ink-600" aria-live="polite">{status}</p>}
    </section>
  );
}

