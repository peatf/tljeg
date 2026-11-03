import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Timer from '../components/Timer';
import { motion, useReducedMotion } from 'framer-motion';
import { ChipList } from '../components/Chips';
import { addEntry, addTrait, listEntries, listTraits } from '../storage/storage';
import { getSuggestions, ingestUserText, type SuggestResult } from '../ml';
import { ScenePlate, SceneNext } from '../components/ScenePlate';
import ClarityIllustration from '../assets/clarity.svg?react';

const STARTER_TRAITS = [
  { id: 'starter-calm', text: 'Calm', source: 'seed' as const },
  { id: 'starter-generous', text: 'Generous', source: 'seed' as const },
  { id: 'starter-brave', text: 'Brave', source: 'seed' as const },
  { id: 'starter-creative', text: 'Creative', source: 'seed' as const },
  { id: 'starter-precise', text: 'Precise', source: 'seed' as const }
];

const GENTLE_TRAITS = [
  { id: 'gentle-calm', text: 'A bit calmer', source: 'seed' as const },
  { id: 'gentle-kind', text: 'More kind', source: 'seed' as const },
  { id: 'gentle-patient', text: 'Slightly patient', source: 'seed' as const },
  { id: 'gentle-present', text: 'More present', source: 'seed' as const },
  { id: 'gentle-gentle', text: 'Gentler', source: 'seed' as const }
];

// Everything written on this page, kept as a draft until it is saved.
type Writing = {
  input: string;
  working: string;
  recurring: string;
  jealousy: string;
  moment: string;
  natural: string;
  overlap: string;
};
const EMPTY: Writing = { input: '', working: '', recurring: '', jealousy: '', moment: '', natural: '', overlap: '' };
const DRAFT_KEY = 'tja-clarity-draft';

function readDraft(): Writing {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

export default function Clarity() {
  const [searchParams] = useSearchParams();
  const gentleMode = searchParams.get('mode') === 'gentle';

  const [draft] = useState<Writing>(readDraft);
  const [writing, setWriting] = useState<Writing>(draft);
  const { input, overlap } = writing;
  const [selectedTrait, setSelectedTrait] = useState<string | null>(null);
  const [chips, setChips] = useState<{ id: string; text: string; source: 'seed' | 'user'; method?: 'embedding' | 'fuzzy' }[]>([]);
  const [isThrottled, setIsThrottled] = useState(false);
  const [rehearsing, setRehearsing] = useState(false);
  const [overlapChips, setOverlapChips] = useState<{ id: string; text: string; source: 'seed' | 'user' }[]>([]);
  const [userTraitChips, setUserTraitChips] = useState<{ id: string; text: string; source: 'user' }[]>([]);
  const [relatedTraitChips, setRelatedTraitChips] = useState<{ id: string; text: string; source: 'user' }[]>([]);
  const [status, setStatus] = useState('');
  const prefersReduced = useReducedMotion();

  function write(key: keyof Writing) {
    return (e: { target: { value: string } }) => setWriting((w) => ({ ...w, [key]: e.target.value }));
  }

  useEffect(() => {
    try {
      if (Object.values(writing).some((v) => v.trim())) localStorage.setItem(DRAFT_KEY, JSON.stringify(writing));
      else localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Storage unavailable: the writing still saves with the Save button.
    }
  }, [writing]);

  useEffect(() => {
    // Debounce ML suggestions and merge with starter traits
    const timer = setTimeout(() => {
      getSuggestions('traits', input).then((result: SuggestResult) => {
        setIsThrottled(result.throttled || false);
        const mlChips = result.items;
        const starterTraits = gentleMode ? GENTLE_TRAITS : STARTER_TRAITS;
        const finalChips = mlChips.length > 0 ? mlChips : starterTraits;
        setChips(finalChips);
      }).catch(() => {
        setIsThrottled(false);
        const starterTraits = gentleMode ? GENTLE_TRAITS : STARTER_TRAITS;
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
    await addEntry('clarity', { ...writing, selectedTrait });

    // Ingest selected trait for future ML suggestions
    if (selectedTrait) {
      try {
        await ingestUserText('traits', selectedTrait);
      } catch (error) {
        console.error('Failed to ingest trait:', error);
      }
    }

    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setStatus('Saved.');
    setTimeout(() => setStatus(''), 1500);
  }

  return (
    <section className="scene">
      <ScenePlate
        index="02"
        kicker="/ 06"
        title={`Clarity${gentleMode ? ' (Gentle Mode)' : ''}`}
        lead="Clarity means uncovering the identity shift that calls you. This can surface from desire, tension, or even envy."
        art={<ClarityIllustration />}
        artLabel="Clarity illustration"
      >
        Clarity points your compass. Without it, your mind runs on yesterday's autopilot. You are listening for what wants to emerge from you, reveal itself to you from your reality's mirror. Sometimes it comes through admiration. Sometimes through tension, even jealousy. Both are signals.
        {/* TODO: Reference path for future copy: docs/Updates/Explainers */}
      </ScenePlate>
      <div className="grid gap-3">
        <h2 className="kicker"><span className="kicker__index">01</span>Entry Points</h2>

        <details className="disclosure" open={!!draft.input || undefined}>
          <summary>What inspires you?</summary>
          <div className="disclosure__body">
            <p>Think about people you admire, stories that move you, art that stops you in your tracks. What do they have that calls to you?</p>
            <div className="input-panel">
              <textarea
                id="insp"
                value={input}
                onChange={write('input')}
                className="form-element w-full"
                rows={3}
                placeholder="Write about what inspires you..."
                aria-label="Inspiration input"
              />
            </div>
          </div>
        </details>

        <details className="disclosure" open={!!draft.working || undefined}>
          <summary>What's working?</summary>
          <div className="disclosure__body">
            <p>Name one small thing that already feels aligned with who you're becoming.</p>
            <label htmlFor="working" className="sr-only">What's working</label>
            <div className="input-panel">
              <textarea
                id="working"
                value={writing.working}
                onChange={write('working')}
                className="form-element w-full"
                rows={3}
                placeholder="e.g., I noticed I spoke more slowly and felt grounded on my call today."
                aria-label="What's working"
              />
            </div>
          </div>
        </details>

        <details className="disclosure" open={!!draft.recurring || undefined}>
          <summary>What recurring thought keeps showing up?</summary>
          <div className="disclosure__body">
            <p>What is the intention of this thought? At the end of the day, what is this thought trying to get you to feel more of in your reality?</p>
            <div className="input-panel">
              <textarea
                className="form-element w-full"
                rows={3}
                value={writing.recurring}
                onChange={write('recurring')}
                placeholder="Describe the recurring thought and what it's trying to show you..."
                aria-label="Recurring thought input"
              />
            </div>
          </div>
        </details>

        <details className="disclosure" open={!!draft.jealousy || undefined}>
          <summary>Who triggers a spark of jealousy?</summary>
          <div className="disclosure__body">
            <p>Jealousy is directional. What does that person have that reveals what you want?</p>
            <div className="input-panel">
              <textarea
                className="form-element w-full"
                rows={3}
                value={writing.jealousy}
                onChange={write('jealousy')}
                placeholder="Write about the jealousy and what it reveals..."
                aria-label="Jealousy insight input"
              />
            </div>
          </div>
        </details>
      </div>

      <div className="panel">
        <div className="panel-head">
          <p className="panel-title"><span className="step-num">02</span>Choose a trait below</p>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="panel-text">Tap a trait chip to choose one.</p>
            {/* Only show "Based on what you wrote" if ML actually used embeddings to match */}
            {!isThrottled && input.trim() && chips.length > 0 && chips.some(c => c.method === 'embedding') && (
              <span className="tag">
                Based on what you wrote
              </span>
            )}
            {isThrottled && (
              <span className="tag">
                Showing recent suggestions
              </span>
            )}
          </div>
        </div>
        <ChipList
          chips={chips}
          selected={selectedTrait}
          onSelect={(c) => setSelectedTrait((prev) => (prev === c.text ? null : c.text))}
        />
        {userTraitChips.length > 0 && (
          <div className="grid gap-2">
            <p className="field-hint">Traits you've saved before:</p>
            <ChipList chips={userTraitChips} selected={selectedTrait} onSelect={(c) => setSelectedTrait(c.text)} />
          </div>
        )}
        {selectedTrait && (
          <div className="flex items-center gap-2">
            <p>
              Selected: <strong className="font-medium text-cobalt-500">{selectedTrait}</strong>
            </p>
            <button className="btn-quiet text-sm" onClick={() => setSelectedTrait(null)} aria-label="Clear selected trait">Clear</button>
          </div>
        )}
      </div>

      <div className="panel">
        {/* Orienting text - always visible */}
        <div className="panel-head">
          <p className="panel-title"><span className="step-num">03</span>45-Second Embodiment Practice</p>
          <p className="panel-text">Once you've chosen a trait, take 45 seconds to sit with it. Let it settle in your body. Notice where you feel it.</p>
        </div>

        {/* Practice button - disabled until trait selected */}
        {!rehearsing && (
          <button
            className="btn-flow btn-flow--primary justify-self-start"
            onClick={() => selectedTrait && setRehearsing(true)}
            disabled={!selectedTrait}
            aria-label={selectedTrait ? 'Begin 45-second embodiment practice' : 'Select a trait first to begin practice'}
          >
            {selectedTrait
              ? `Sit with "${selectedTrait}" for 45 seconds`
              : 'Select a trait above to begin'}
          </button>
        )}

        {/* Active practice state */}
        {rehearsing && (
          <div className="grid gap-4 place-items-center py-4">
            <Timer seconds={45} label="Embodiment practice" onDone={() => setRehearsing(false)} />
            {prefersReduced ? (
              <div className="w-24 h-24 rounded-full border border-cobalt-300" aria-hidden />
            ) : (
              <motion.div
                className="w-24 h-24 rounded-full border border-cobalt-300 bg-cobalt-50"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ repeat: Infinity, duration: 4.4, ease: 'easeInOut' }}
                aria-hidden
              />
            )}
            <p className="panel-text text-center">
              Let "{selectedTrait}" land in your body.<br />
              Where do you feel it?
            </p>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3 className="panel-title"><span className="step-num">04</span>Where Are You Already This Way?</h3>
        </div>

        <div className="grid gap-5">
          <div className="grid gap-1.5">
            <label htmlFor="moment" className="field-label">Step 1: Recall a recent moment</label>
            <p className="field-hint">Where did you already act this way today or recently?</p>
            <div className="input-panel">
              <textarea
                id="moment"
                value={writing.moment}
                onChange={write('moment')}
                className="form-element w-full"
                rows={2}
                placeholder="e.g., I stayed calm during that difficult phone call..."
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="natural" className="field-label">Step 2: What felt natural?</label>
            <p className="field-hint">What about that moment felt effortless or authentic?</p>
            <div className="input-panel">
              <textarea
                id="natural"
                value={writing.natural}
                onChange={write('natural')}
                className="form-element w-full"
                rows={2}
                placeholder="e.g., My breathing stayed steady, I listened without rushing to respond..."
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="overlap" className="field-label">Step 3: Name one connection</label>
            <p className="field-hint">This is where your current self already meets who you're becoming.</p>
            <div className="input-panel">
              <input
                id="overlap"
                value={overlap}
                onChange={write('overlap')}
                className="form-element w-full"
                placeholder="e.g., I already have the calm presence I'm cultivating"
                aria-label="Connection point input"
              />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button className="btn-flow btn-flow--primary" onClick={save} aria-label="Save what you wrote on this page">Save</button>
              {status && <p className="status-line" aria-live="polite">{status}</p>}
            </div>
          </div>
        </div>

        {overlapChips.length > 0 && (
          <div className="grid gap-2">
            <p className="field-hint">Evidence of Who You Already Are</p>
            <ChipList chips={overlapChips} onSelect={(c) => setWriting((w) => ({ ...w, overlap: c.text }))} />
          </div>
        )}
        {relatedTraitChips.length > 0 && (
          <div className="grid gap-2">
            <p className="field-hint">Related traits</p>
            <ChipList chips={relatedTraitChips} selected={selectedTrait} onSelect={(c) => setSelectedTrait(c.text)} />
          </div>
        )}
      </div>

      {/* FAQ-style reassurance */}
      <p className="note">There's no wrong way to do this. Follow what feels true.</p>

      {/* What's next guidance */}
      <SceneNext
        links={[
          { to: '/artifact/calibration', label: 'Continue to Grounding', primary: true },
          { to: '/artifact/void', label: 'Take a pause in VOID' },
        ]}
      />
    </section>
  );
}
