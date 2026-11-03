import { useRef, useState, useEffect } from 'react';
// Inline-controllable SVG for breathing animation
// Fallback raster for wide support
import { Link, useSearchParams } from 'react-router-dom';
import { addEntry } from '../storage/storage';
import LetterDrift from '../components/LetterDrift';
import InputPanel from '../components/ui/InputPanel';
import VoidLabel from '../components/VoidLabel';
import AnchorPreview from '../components/AnchorPreview';
import ImmersiveHoldSpace from '../components/ImmersiveHoldSpace';
import LabelInsights from '../components/LabelInsights';
import { ScenePlate } from '../components/ScenePlate';
import voidImage from '../assets/VOID_1.webp';

type VoidState = 'enter_labels' | 'choose_anchor' | 'hold' | 'release' | 'integration';

// When the release letters have drifted apart, and when they have dissolved (see LetterDrift).
const RELEASE_APART_AT = 34;
const RELEASE_GONE_AT = 84;
const LABEL_STAGGER = 1.5;

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
  const [releaseElapsed, setReleaseElapsed] = useState(0);
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
    setReleaseElapsed(0);
    setState('release');
  }

  // Release: the labels drift apart into letters and dissolve (see LetterDrift), then the
  // scene moves on to Integration by itself. Continue is there the whole time.
  useEffect(() => {
    if (state !== 'release') return;
    const started = Date.now();
    const id = window.setInterval(() => setReleaseElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [state]);

  const releaseGoneAt = labels.length ? RELEASE_GONE_AT + (labels.length - 1) * LABEL_STAGGER : 0;
  const releaseGone = releaseElapsed >= releaseGoneAt;

  useEffect(() => {
    if (state === 'release' && releaseElapsed >= releaseGoneAt + 6) setState('integration');
  }, [state, releaseElapsed, releaseGoneAt]);

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
      // Escape is handled by the hold space, which asks in the page before ending.
      if (e.code === 'Space' && state === 'hold') {
        e.preventDefault();
        togglePause();
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
      <section className="scene">
        <ScenePlate
          index="04"
          kicker="/ 06"
          title={`VOID${autostart ? ' (Quick Start)' : ''}`}
          art={<img src={voidImage} alt="" />}
          artLabel="The VOID"
        >
          {autostart ? 'Ready to dissolve. Add your labels and begin.' : 'VOID is a shower. VOID is the dissolve. Labels melt here, good or bad, success or failure, they soften until they disappear. Neutrality creates breathing room. Your being relaxes, no longer defending or rejecting a label. And in that emptiness, possibility pulls you forward. VOID is powerful because when you let go, space opens. And because desire is magnetic space naturally calls in the new identity you\'ve been clarifying and calibrating.'}
        </ScenePlate>

        <div className="panel">
          <div className="panel-head">
            <h2 className="panel-title"><span className="step-num">01</span>What labels feel heavy right now?</h2>
          </div>

          <div className="flex gap-2 items-stretch">
            <InputPanel
              label="LABELS"
              placeholder="failure, tired, too much…"
              value={labelInput}
              onChange={(e) => setLabelInput((e.target as HTMLInputElement).value)}
              onKeyDown={(e) => e.key === 'Enter' && addLabelsFromInput()}
              ref={labelInputRef as any}
              className="flex-1"
            />
            <button
              onClick={addLabelsFromInput}
              disabled={!labelInput.trim()}
              aria-label="Add Label"
              className="btn-flow"
            >
              Add Label
            </button>
          </div>

          {labels.length > 0 && (
            <div className="grid gap-4">
              <h3 className="kicker">Labels to dissolve:</h3>
              <div className="flex flex-wrap gap-3 p-6 rounded-xl bg-ink-900 min-h-20">
                {labels.map((label, index) => (
                  <VoidLabel
                    key={index}
                    text={label}
                    variant={['orb', 'fragment', 'glitch'][index % 3] as any}
                    onRemove={() => removeLabel(index)}
                  />
                ))}
              </div>

              <LabelInsights labels={labels} />

              <button
                onClick={() => setState('choose_anchor')}
                aria-label="Continue to Anchor Selection"
                className="btn-flow btn-flow--primary btn-flow--wide"
              >
                Continue to Anchor Selection
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (state === 'choose_anchor') {
    const isReady = selectedAnchor && (selectedAnchor.type !== 'custom' || customAnchor.trim());

    return (
      <section className="scene pb-40">
        <header className="grid gap-3">
          <p className="kicker"><span className="kicker__index">04</span>VOID</p>
          <h1 className="scene-title">Choose Your Anchor</h1>
          <p className="scene-explainer">
            <strong className="font-medium text-ink-900">Step 1:</strong> Tap an anchor below to select it. <strong className="font-medium text-ink-900">Step 2:</strong> Press "Begin Hold" to start.
          </p>
          <p className="field-hint">
            Pick your favorite meditative sound and play that as a companion if you would like. Or if you want a guided Timeline Jump, grab <a href="https://www.peathefeary.com/classesandaudios/p/timeline-jumping-audio" className="text-cobalt-500 underline hover:text-cobalt-700" target="_blank" rel="noopener noreferrer">one here</a>.
          </p>
        </header>

        <div className="grid gap-3">
          {[
            { type: 'breath_2_2_4' as const, label: 'Breath 2-2-4', desc: 'Inhale 2, hold 2, exhale 4' },
            { type: 'breath_steady_4' as const, label: 'Breath steady 4', desc: 'Steady 4-count breathing' },
            { type: 'count_1234' as const, label: 'Count 1-2-3-4', desc: 'Simple counting pattern' },
            { type: 'stillness' as const, label: 'Stillness', desc: 'Pure awareness, no technique' },
            { type: 'custom' as const, label: 'Custom', desc: 'Your own anchor' }
          ].map((anchor) => (
            <AnchorPreview
              key={anchor.type}
              type={anchor.type}
              isSelected={selectedAnchor?.type === anchor.type}
              onClick={() => selectAnchor(anchor.type)}
              label={anchor.label}
              description={anchor.desc}
              customValue={customAnchor}
            />
          ))}

          {selectedAnchor?.type === 'custom' && (
            <div className="input-panel">
              <input
                type="text"
                value={customAnchor}
                onChange={(e) => setCustomAnchor(e.target.value)}
                placeholder="Describe your custom anchor..."
                className="form-element"
                aria-label="Custom anchor"
                onBlur={() => selectedAnchor && setSelectedAnchor({ ...selectedAnchor, custom: customAnchor })}
              />
            </div>
          )}
        </div>

        {/* Sticky bottom action bar */}
        <div className="action-bar">
          <div className="max-w-xl mx-auto grid gap-3">
            {!selectedAnchor && (
              <p className="text-center field-hint">Tap an anchor above to select it</p>
            )}
            {selectedAnchor && (
              <p className="text-center field-hint">
                Selected: <span className="font-medium text-cobalt-500">{getAnchorDisplay(selectedAnchor)}</span>
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setState('enter_labels')}
                className="btn-quiet flex-shrink-0"
              >
                Back
              </button>
              <button
                onClick={() => startHold()}
                disabled={!isReady}
                className="btn-flow btn-flow--primary btn-flow--wide flex-1"
              >
                {isReady ? 'Begin Hold (90s)' : 'Select an Anchor to Begin'}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (state === 'hold') {
    if (!selectedAnchor) return null;

    return (
      <ImmersiveHoldSpace
        anchor={selectedAnchor}
        labels={labels}
        actualHoldTime={actualHoldTime}
        isPaused={isPaused}
        onTogglePause={togglePause}
        onEndEarly={endHold}
        onComplete={endHold}
        holdSeconds={holdSeconds}
      />
    );
  }

  if (state === 'release') {
    return (
      <section className="void-immersive">
        <div className="grid gap-8">
          <header className="grid gap-3">
            <h1 className="void-heading text-2xl sm:text-3xl">Release</h1>
            <p className="void-subheading text-sm">congratulations</p>
          </header>

          <div className="grid gap-6 min-h-[200px] place-items-center">
            {!releaseGone && (
              <>
                <div className="jump-hold__labels">
                  {labels.map((label, index) => (
                    <LetterDrift key={`${label}-${index}`} text={label} delay={index * LABEL_STAGGER} />
                  ))}
                </div>
                <p className="void-subheading" aria-live="polite">
                  {releaseElapsed < RELEASE_APART_AT ? 'Let each word become just letters.' : 'Let the letters dissolve.'}
                </p>
              </>
            )}

            {releaseGone && (
              <div className="void-heading text-xl" style={{ color: 'var(--void-accent)' }}>
                welcome to your new timeline
              </div>
            )}
          </div>

          <button
            onClick={() => setState('integration')}
            className={releaseGone ? 'void-btn-primary justify-self-center' : 'void-btn-quiet justify-self-center'}
          >
            Continue
          </button>
        </div>
      </section>
    );
  }

  if (state === 'integration') {
    return (
      <section className="void-immersive" style={{ overflowY: 'auto', justifyContent: 'flex-start', paddingTop: '3rem', paddingBottom: '3rem' }}>
        <div className="void-integration">
          <header className="grid gap-3 text-center">
            <h1 className="void-heading text-2xl sm:text-3xl">Integration</h1>
            <p className="void-subheading text-sm">Capture what emerged from the space.</p>
          </header>

          <div className="grid gap-5">
            <LabelInsights
              labels={labels}
              showReflectionPrompts={true}
              onReflectionPrompt={(prompt) => {
                setReflection(prev => prev ? prev + '\n\n' + prompt : prompt);
              }}
            />

            <div className="grid gap-2">
              <InputPanel
                as="textarea"
                label="WHAT FEELS DIFFERENT NOW?"
                id="reflection"
                value={reflection}
                onChange={(e) => setReflection((e.target as HTMLTextAreaElement).value)}
                placeholder="Ex: chest softer, face relaxed."
                className="void-input"
              />
            </div>

            <div className="grid gap-2">
              <InputPanel
                as="textarea"
                label="WHAT FEELS POSSIBLE NOW?"
                id="possibility"
                value={possibility}
                onChange={(e) => setPossibility((e.target as HTMLTextAreaElement).value)}
                placeholder="Ex: send the email."
                className="void-input"
              />
            </div>

            <div className="grid gap-2">
              <InputPanel
                as="textarea"
                label="INSPIRED ACTION"
                id="inspiration"
                value={inspiration}
                onChange={(e) => setInspiration((e.target as HTMLTextAreaElement).value)}
                className="void-input"
                placeholder="Ex: reach out to that collaborator."
              />
            </div>

            <button
              onClick={save}
              className="void-btn-primary mt-2"
            >
              Save Session
            </button>
            <Link to="/artifact/implementation" className="void-btn-quiet text-center">
              Continue to Implementation
            </Link>

            {status && <p className="void-subheading text-sm mt-2" aria-live="polite">{status}</p>}
          </div>
        </div>
      </section>
    );
  }

  return null;
}
