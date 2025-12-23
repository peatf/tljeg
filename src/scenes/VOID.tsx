import { useRef, useState, useEffect } from 'react';
// Inline-controllable SVG for breathing animation
import BreathingIllustration from '../assets/breathing.svg?react';
// Fallback raster for wide support
import voidWebp from '../assets/VOID_1.webp';
import { useSearchParams } from 'react-router-dom';
import Timer from '../components/Timer';
import { addEntry } from '../storage/storage';
import DissolveWord from '../components/DissolveWord';
import { useReducedMotionPref } from '../hooks/useReducedMotionPref';

type VoidState = 'enter_labels' | 'choose_anchor' | 'hold' | 'release' | 'integration';

type AnchorType = {
  type: 'breath_2_2_4' | 'breath_steady_4' | 'count_1234' | 'stillness' | 'custom';
  custom?: string;
};

interface VoidSession {
  id: string;
  created_at: string;
  labels: string[];
  anchor: AnchorType;
  hold_seconds: number;
  reflection: string;
  possibility: string;
  inspiration: string;
}

export default function VOIDScene() {
  const reducedMotion = useReducedMotionPref();
  const [searchParams] = useSearchParams();
  const autostart = searchParams.get('autostart') === 'true';
  const [state, setState] = useState<VoidState>('enter_labels');
  const [labelInput, setLabelInput] = useState('');
  const labelInputRef = useRef<HTMLInputElement | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [selectedAnchor, setSelectedAnchor] = useState<AnchorType | null>(null);
  const [customAnchor, setCustomAnchor] = useState('');
  const [holdSeconds, setHoldSeconds] = useState(90);
  const [actualHoldTime, setActualHoldTime] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [reflection, setReflection] = useState('');
  const [possibility, setPossibility] = useState('');
  const [inspiration, setInspiration] = useState('');
  const [dissolvingLabels, setDissolvingLabels] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  function addLabelsFromInput() {
    if (!labelInput.trim()) return;

    const newLabels = labelInput.split(',')
      .map(text => text.trim())
      .filter(text => text.length > 0);

    setLabels(prev => [...prev, ...newLabels]);
    setLabelInput('');
  }

  function removeLabel(index: number) {
    setLabels(prev => prev.filter((_, i) => i !== index));
  }

  function selectAnchor(type: AnchorType['type']) {
    if (type === 'custom') {
      setSelectedAnchor({ type, custom: customAnchor });
    } else {
      setSelectedAnchor({ type });
    }
  }

  function startHold(anchorOverride?: AnchorType) {
    const anchor = anchorOverride ?? selectedAnchor;
    if (!anchor) return;
    if (!selectedAnchor) setSelectedAnchor(anchor);
    setState('hold');
    setIsHolding(true);
    setActualHoldTime(0);

    timerRef.current = setInterval(() => {
      setActualHoldTime(prev => prev + 1);
    }, 1000);
  }

  // Focus label input when entering labels state
  useEffect(() => {
    if (state === 'enter_labels') {
      setTimeout(() => labelInputRef.current?.focus(), 50);
    }
  }, [state]);

  function togglePause() {
    setIsPaused(prev => {
      if (!prev && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      } else if (prev) {
        timerRef.current = setInterval(() => {
          setActualHoldTime(prev => prev + 1);
        }, 1000);
      }
      return !prev;
    });
  }

  function endHold() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsHolding(false);
    setIsPaused(false);
    setState('release');

    // Start dissolve animation
    setDissolvingLabels([...labels]);

    // Stagger the dissolve animation
    labels.forEach((_, index) => {
      setTimeout(() => {
        setDissolvingLabels(prev => prev.slice(1));
      }, index * 300);
    });

    // Move to integration after all labels have dissolved (90s total dissolve + 1s buffer)
    setTimeout(() => {
      setState('integration');
    }, labels.length * 300 + 90000 + 1000);
  }

  // Deep link: autostart (RST-2)
  useEffect(() => {
    if (autostart) {
      // choose default anchor and start hold automatically
      startHold({ type: 'stillness' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Effect for keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && state === 'hold') {
        e.preventDefault();
        togglePause();
      } else if (e.code === 'Escape' && state === 'hold') {
        e.preventDefault();
        if (confirm('End VOID session early?')) {
          endHold();
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [state]);

  function getAnchorDisplay(anchor: AnchorType): string {
    switch (anchor.type) {
      case 'breath_2_2_4': return 'Breath 2-2-4';
      case 'breath_steady_4': return 'Breath steady 4';
      case 'count_1234': return 'Count 1-2-3-4';
      case 'stillness': return 'Stillness';
      case 'custom': return anchor.custom || 'Custom';
    }
  }

  async function save() {
    if (!selectedAnchor) return;

    const sessionId = crypto.randomUUID();
    const session: VoidSession = {
      id: sessionId,
      created_at: new Date().toISOString(),
      labels,
      anchor: selectedAnchor,
      hold_seconds: actualHoldTime,
      reflection,
      possibility,
      inspiration
    };

    await addEntry('void', session);

    // Route reflection to Evidence Shelf tagged void
    if (reflection.trim()) {
      // Import addContext if not already imported
      const { addContext } = await import('../storage/storage');
      await addContext(reflection, 'proof', 'void');
    }

    // Route possibility to Implementation as suggested micro-act
    if (possibility.trim()) {
      await addEntry('implementation_suggestions', {
        source: 'void',
        suggestion: possibility,
        created_at: new Date().toISOString()
      });
    }

    // Route inspiration to Implementation with session ID and metadata
    if (inspiration.trim()) {
      await addEntry('implementation_suggestions', {
        source: 'void',
        suggestion: inspiration,
        session_id: sessionId,
        inspiration_text: inspiration,
        created_at: new Date().toISOString()
      });
    }

    setStatus('VOID session saved.');
    setTimeout(() => setStatus(''), 1500);

    // Reset to beginning
    setState('enter_labels');
    setLabels([]);
    setSelectedAnchor(null);
    setReflection('');
    setPossibility('');
    setInspiration('');
    setActualHoldTime(0);
  }

  if (state === 'enter_labels') {
    return (
      <section className="grid gap-6">
        <header className="grid gap-2">
          <h1 className="text-2xl font-bold font-humanist">VOID{autostart ? ' (Quick Start)' : ''}</h1>
          <p className="text-ink-700 text-sm">{autostart ? 'Ready to dissolve. Add your labels and begin.' : 'VOID is rest between steps. It\'s where you dissolve what you were before picking up what\'s next.'}</p>
          <div className="p-4 bg-bone-50 rounded-lg text-sm text-ink-700">
            The void is the lift-off point. In this neutral space, you release labels and judgments to create space for movement. Sit here for a moment. Let the last step settle before moving forward.
          </div>
        </header>

        <div className="grid gap-4">
          <h2 className="text-lg font-semibold">What labels feel heavy right now?</h2>

          <div className="grid gap-3">
            <input
              type="text"
              ref={labelInputRef}
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              className="border p-3 rounded"
              placeholder="failure, tired, too much…"
              onKeyDown={(e) => e.key === 'Enter' && addLabelsFromInput()}
            />
            <button
              onClick={addLabelsFromInput}
              disabled={!labelInput.trim()}
              className="px-4 py-2 bg-ink-900 text-bone-50 rounded disabled:opacity-50"
            >
              Add Label
            </button>
          </div>

          {labels.length > 0 && (
            <div className="grid gap-3">
              <h3 className="font-medium">Labels to dissolve:</h3>
              <div className="flex flex-wrap gap-2">
                {labels.map((label, index) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-800 rounded">
                    <span>{label}</span>
                    <button
                      onClick={() => removeLabel(index)}
                      className="text-red-600 hover:text-red-800"
                      aria-label={`Remove ${label}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setState('choose_anchor')}
                className="px-4 py-2 bg-purple-600 text-white rounded"
              >
                Continue to Grounding Method
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (state === 'choose_anchor') {
    return (
      <section className="grid gap-6">
        <header className="grid gap-2">
          <h1 className="text-2xl font-bold font-humanist">Choose Your Grounding Method</h1>
          <p className="text-ink-700 text-sm">Select something to hold your attention during the dissolve.</p>
        </header>

        <div className="grid gap-4">
          <div className="grid gap-3">
            {[
              { type: 'breath_2_2_4' as const, label: 'Breath 2-2-4', desc: 'Inhale 2, hold 2, exhale 4' },
              { type: 'breath_steady_4' as const, label: 'Breath steady 4', desc: 'Steady 4-count breathing' },
              { type: 'count_1234' as const, label: 'Count 1-2-3-4', desc: 'Simple counting pattern' },
              { type: 'stillness' as const, label: 'Stillness', desc: 'Pure awareness, no technique' },
              { type: 'custom' as const, label: 'Custom', desc: 'Your own anchor' }
            ].map((anchor) => (
              <button
                key={anchor.type}
                onClick={() => selectAnchor(anchor.type)}
                className={`p-4 border rounded-lg text-left hover:bg-bone-50 ${selectedAnchor?.type === anchor.type ? 'border-purple-500 bg-purple-50' : ''
                  }`}
              >
                <div className="font-medium">{anchor.label}</div>
                <div className="text-sm text-ink-600">{anchor.desc}</div>
              </button>
            ))}
          </div>

          {selectedAnchor?.type === 'custom' && (
            <input
              type="text"
              value={customAnchor}
              onChange={(e) => setCustomAnchor(e.target.value)}
              placeholder="Describe your custom anchor..."
              className="border p-3 rounded"
              onBlur={() => selectedAnchor && setSelectedAnchor({ ...selectedAnchor, custom: customAnchor })}
            />
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setState('enter_labels')}
              className="px-4 py-2 border rounded"
            >
              Back
            </button>
            <button
              onClick={() => startHold()}
              disabled={!selectedAnchor || (selectedAnchor.type === 'custom' && !customAnchor.trim())}
              className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
            >
              Begin Hold (90s)
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (state === 'hold') {
    return (
      <section className="grid gap-6 text-center">
        <div className="grid gap-4">
          <h1 className="text-2xl font-bold font-humanist">Holding Space</h1>
          <div className="text-lg">Anchor: {selectedAnchor && getAnchorDisplay(selectedAnchor)}</div>

          {/* Decorative/illustrative breathing SVG - accessible name provided; respect reduced motion */}
          <div className="mx-auto" role="img" aria-label="Breathing illustration" title="Breathing illustration">
            {!reducedMotion ? (
              <BreathingIllustration aria-hidden={false} />
            ) : (
              <img src={voidWebp} alt="Breathing decoration" loading="lazy" />
            )}
          </div>

          <div className="text-4xl font-mono">
            {Math.floor(actualHoldTime / 60)}:{(actualHoldTime % 60).toString().padStart(2, '0')}
          </div>

          {isPaused && <div className="text-yellow-600">PAUSED</div>}

          <div className="flex justify-center gap-4">
            <button
              onClick={togglePause}
              className="px-4 py-2 border rounded"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={() => confirm('End VOID session early?') && endHold()}
              className="px-4 py-2 border rounded text-red-600"
            >
              End Early
            </button>
          </div>

          <div className="text-sm text-ink-600">
            Space to pause/resume • Esc to end early
          </div>

          {actualHoldTime >= holdSeconds && (
            <button
              onClick={endHold}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg text-lg"
            >
              Complete Hold
            </button>
          )}
        </div>
      </section>
    );
  }

  if (state === 'release') {
    return (
      <section className="grid gap-6 text-center">
        <header className="grid gap-2">
          <h1 className="text-2xl font-bold font-humanist">Release</h1>
          <p className="text-ink-700 text-sm">Watch the labels dissolve...</p>
        </header>

        <div className="grid gap-4">
          {dissolvingLabels.map((label, index) => (
            <DissolveWord key={index} text={label} delay={reducedMotion ? 0 : index * 300} />
          ))}

          {dissolvingLabels.length === 0 && (
            <div className="text-xl text-purple-600">✨ Space cleared ✨</div>
          )}
        </div>
      </section>
    );
  }

  if (state === 'integration') {
    return (
      <section className="grid gap-6">
        <header className="grid gap-2">
          <h1 className="text-2xl font-bold font-humanist">Integration</h1>
          <p className="text-ink-700 text-sm">Capture what emerged from the space.</p>
        </header>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="reflection" className="font-medium">What feels different now?</label>
            <textarea
              id="reflection"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="border p-3 rounded min-h-[80px]"
              placeholder="Ex: chest softer, face relaxed."
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="possibility" className="font-medium">What feels possible now?</label>
            <textarea
              id="possibility"
              value={possibility}
              onChange={(e) => setPossibility(e.target.value)}
              className="border p-3 rounded min-h-[80px]"
              placeholder="Ex: send the email."
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="inspiration" className="font-medium">What inspired action came through?</label>
            <textarea
              id="inspiration"
              value={inspiration}
              onChange={(e) => setInspiration(e.target.value)}
              className="border p-3 rounded min-h-[80px]"
              placeholder="Ex: reach out to that collaborator."
            />
          </div>

          <button
            onClick={save}
            className="px-4 py-2 bg-purple-600 text-white rounded"
          >
            Save VOID Session
          </button>

          {status && <p className="text-sm text-ink-600" aria-live="polite">{status}</p>}
        </div>
      </section>
    );
  }

  return null;
}
