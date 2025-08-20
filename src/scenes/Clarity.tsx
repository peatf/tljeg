import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Timer from '../components/Timer';
import { motion, useReducedMotion } from 'framer-motion';
import { ChipList } from '../components/Chips';
import { addEntry, addTrait, listEntries, listTraits } from '../storage/storage';
import { getSuggestions, ingestUserText, type SuggestResult } from '../ml';
import StackedButton from '../components/ui/StackedButton';
import InputPanel from '../components/ui/InputPanel';

export default function Clarity() {
  const [searchParams] = useSearchParams();
  const gentleMode = searchParams.get('mode') === 'gentle';
  
  const [input, setInput] = useState('');
  const [selectedTrait, setSelectedTrait] = useState<string | null>(null);
  const [chips, setChips] = useState<{ id: string; text: string; source: 'seed' | 'user' }[]>([]);
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
        <div className="p-4 bg-bone-50 rounded-lg text-sm text-ink-700">
          Clarity points your compass. Without it, your mind runs on yesterday's autopilot. You are listening for what wants to emerge from you, reveal itself to you from your reality's mirror. Sometimes it comes through admiration. Sometimes through tension, even jealousy. Both are signals.
          {/* TODO: Reference path for future copy: docs/Updates/Explainers */}
        </div>
      </header>
      <div className="grid gap-4">
        <h2 className="font-semibold text-lg">Entry Points</h2>
        
        <details className="border rounded-lg">
          <summary className="p-3 cursor-pointer hover:bg-bone-50">
            <span className="font-medium">What inspires you?</span>
          </summary>
          <div className="p-3 pt-0 text-sm text-ink-700">
            <p className="mb-2">Think about people you admire, stories that move you, art that stops you in your tracks. What do they have that calls to you?</p>
            <InputPanel
              as="textarea"
              label="WHAT INSPIRES YOU?"
              id="insp"
              value={input}
              onChange={(e) => setInput((e.target as HTMLTextAreaElement).value)}
              placeholder="Write about what inspires you..."
              aria-label="Inspiration input"
            />
          </div>
        </details>

        <details className="border rounded-lg">
          <summary className="p-3 cursor-pointer hover:bg-bone-50">
            <span className="font-medium">What's working?</span>
          </summary>
          <div className="p-3 pt-0 text-sm text-ink-700">
            <p className="mb-2">Name one small thing that already feels aligned with who you're becoming.</p>
            <InputPanel
              as="textarea"
              label="WHAT'S WORKING?"
              id="working"
              placeholder="e.g., I noticed I spoke more slowly and felt grounded on my call today."
              aria-label="What's working"
            />
          </div>
        </details>

        <details className="border rounded-lg">
          <summary className="p-3 cursor-pointer hover:bg-bone-50">
            <span className="font-medium">What recurring thought keeps showing up?</span>
          </summary>
          <div className="p-3 pt-0 text-sm text-ink-700">
            <p className="mb-2">What is the intention of this thought? At the end of the day, what is this thought trying to get you to feel more of in your reality?</p>
            <InputPanel
              as="textarea"
              label="RECURRING THOUGHT"
              placeholder="Describe the recurring thought and what it's trying to show you..."
              aria-label="Recurring thought input"
            />
          </div>
        </details>

        <details className="border rounded-lg">
          <summary className="p-3 cursor-pointer hover:bg-bone-50">
            <span className="font-medium">Who triggers a spark of jealousy?</span>
          </summary>
          <div className="p-3 pt-0 text-sm text-ink-700">
            <p className="mb-2">Jealousy is directional. What does that person have that reveals what you want?</p>
            <InputPanel
              as="textarea"
              label="JEALOUSY SIGNAL"
              placeholder="Write about the jealousy and what it reveals..."
              aria-label="Jealousy insight input"
            />
          </div>
        </details>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm text-ink-600">Tap a trait chip to choose one.</p>
          {isThrottled && (
            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
              Throttled - showing recent suggestions
            </span>
          )}
        </div>
        <ChipList
          chips={chips}
          onSelect={(c) => setSelectedTrait((prev) => (prev === c.text ? null : c.text))}
        />
        {userTraitChips.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-ink-600">From you</p>
            <ChipList chips={userTraitChips} onSelect={(c) => setSelectedTrait(c.text)} />
          </div>
        )}
        {selectedTrait && (
          <div className="mt-2 flex items-center gap-2">
            <p>
              Selected: <strong>{selectedTrait}</strong>
            </p>
            <button className="px-2 py-1 border rounded text-sm" onClick={() => setSelectedTrait(null)} aria-label="Clear selected trait">Clear</button>
          </div>
        )}
      </div>
      <div className="grid gap-2">
        {selectedTrait && (
          <div className="p-3 bg-bone-50 rounded text-sm text-ink-700">
            Now, notice where this trait is already alive in you. This overlap turns clarity into proof.
          </div>
        )}
        <button
          className="px-4 py-2 border rounded"
          onClick={() => setRehearsing(true)}
          aria-label="Start 45 second rehearsal"
        >
          Start 45s rehearsal
        </button>
        {rehearsing && (
          <div className="grid gap-3 place-items-center">
            <Timer seconds={45} label="45 second rehearsal" onDone={() => setRehearsing(false)} />
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
            <p className="text-sm text-ink-600">Let the trait land in your body.</p>
          </div>
        )}
      </div>

      <div className="grid gap-4">
        <h3 className="font-semibold">Find Your Overlap</h3>
        
        <div className="grid gap-3">
          <div>
            <label className="text-sm font-medium">Step 1: Recall a recent moment</label>
            <p className="text-xs text-ink-600 mb-2">Where did you already act this way today or recently?</p>
            <InputPanel
              as="textarea"
              label="RECENT MOMENT"
              placeholder="e.g., I stayed calm during that difficult phone call..."
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Step 2: What felt natural?</label>
            <p className="text-xs text-ink-600 mb-2">What about that moment felt effortless or authentic?</p>
            <InputPanel
              as="textarea"
              label="WHAT FELT NATURAL?"
              placeholder="e.g., My breathing stayed steady, I listened without rushing to respond..."
            />
          </div>
          
          <div>
            <label htmlFor="overlap" className="text-sm font-medium">Step 3: Name one overlap</label>
            <p className="text-xs text-ink-600 mb-2">Where does your new identity already meet your current self?</p>
            <InputPanel
              id="overlap"
              label="OVERLAP"
              value={overlap}
              onChange={(e) => setOverlap((e.target as HTMLInputElement).value)}
              placeholder="e.g., I already have the calm presence I'm cultivating"
              aria-label="Overlap input"
            />
            <div className="mt-2">
              <StackedButton className="rect-btn--sm" onClick={save} aria-label="Save Overlap">SAVE OVERLAP</StackedButton>
            </div>
          </div>
        </div>
        
        {overlapChips.length > 0 && (
          <div>
            <p className="text-sm text-ink-600 mt-1">Past overlaps</p>
            <ChipList chips={overlapChips} onSelect={(c) => setOverlap(c.text)} />
          </div>
        )}
        {relatedTraitChips.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-ink-600">Related traits (from overlaps)</p>
            <ChipList chips={relatedTraitChips} onSelect={(c) => setSelectedTrait(c.text)} />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <StackedButton className="rect-btn--sm" onClick={save} aria-label="Save clarity note">SAVE</StackedButton>
      </div>
      {status && <p className="text-sm text-ink-600" aria-live="polite">{status}</p>}
    </section>
  );
}
