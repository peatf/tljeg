import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import BodyScan from '../components/BodyScan';
import DissolveWord from '../components/DissolveWord';
import Timer from '../components/Timer';
import { ChipList } from '../components/Chips';
import { STARTER_TRAITS } from '../config/traits';
import { ingestUserText } from '../ml';
import { addEntry, addTrait, listEntries, listTraits } from '../storage/storage';

// One sitting, in the order the guide teaches it. Each screen asks one thing.
const STEPS = ['Safety', 'Scan', 'Character', 'Embody', 'Overlap', 'VOID', 'Action'] as const;
type Step = 'arrive' | 'safety' | 'scan' | 'character' | 'embody' | 'overlap' | 'void' | 'hold' | 'action' | 'done';
const ORDER: Step[] = ['arrive', 'safety', 'scan', 'character', 'embody', 'overlap', 'void', 'hold', 'action', 'done'];

const ENV_OPTIONS = ['Door locked', 'Water nearby', 'Warmth', 'Low light', 'Phone silent'];
const HOLD_SECONDS = 90;

type LastJump = { trait: string | null; overlap: string; timestamp: number };

function stepIndex(step: Step): number {
  if (step === 'hold') return STEPS.indexOf('VOID');
  return STEPS.findIndex((s) => s.toLowerCase() === step);
}

export default function Jump() {
  const [step, setStep] = useState<Step>('arrive');
  const [last, setLast] = useState<LastJump | null>(null);

  const [consent, setConsent] = useState('');
  const [env, setEnv] = useState<string[]>([]);
  const [needs, setNeeds] = useState('');
  const [scanned, setScanned] = useState(false);
  const [trait, setTrait] = useState<string | null>(null);
  const [ownTrait, setOwnTrait] = useState('');
  const [embodied, setEmbodied] = useState(false);
  const [embodying, setEmbodying] = useState(false);
  const [overlap, setOverlap] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [holdStart, setHoldStart] = useState(0);
  const [holdSeconds, setHoldSeconds] = useState(0);
  const [held, setHeld] = useState(false);
  const [action, setAction] = useState('');

  const [savedTraits, setSavedTraits] = useState<{ id: string; text: string; source: 'user' }[]>([]);
  const [pastOverlaps, setPastOverlaps] = useState<{ id: string; text: string; source: 'user' }[]>([]);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    listEntries('jump').then((arr: any[]) => {
      const latest = arr.sort((a, b) => b.timestamp - a.timestamp)[0];
      if (latest) setLast({ trait: latest.content?.trait ?? null, overlap: latest.content?.overlap ?? '', timestamp: latest.timestamp });
    });
    listTraits().then((ts: any[]) => {
      const seen = new Set<string>();
      const recent = ts.slice(-10).reverse().filter((t) => !seen.has(t.text) && seen.add(t.text));
      setSavedTraits(recent.map((t) => ({ id: `ut:${t.id}`, text: t.text, source: 'user' as const })));
    });
    listEntries('clarity').then((arr: any[]) => {
      const texts = Array.from(new Set(arr.map((e) => e.content?.overlap).filter(Boolean))).slice(-6);
      setPastOverlaps(texts.map((t) => ({ id: `ov:${t}`, text: String(t), source: 'user' as const })));
    });
  }, []);

  // Escape leaves the hold, with no confirmation to break the mood.
  useEffect(() => {
    if (step !== 'hold') return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && endHold();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  // A new screen starts at the top, with focus on its question.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    titleRef.current?.focus();
  }, [step]);

  function back() {
    const i = ORDER.indexOf(step);
    setStep(ORDER[Math.max(0, step === 'action' ? i - 2 : i - 1)]);
  }

  function beginAgain(withTrait: string | null) {
    setConsent('');
    setNeeds('');
    setScanned(false);
    setTrait(withTrait);
    setOwnTrait('');
    setEmbodied(false);
    setOverlap('');
    setLabels([]);
    setAction('');
    setStep('safety');
  }

  function addLabels() {
    const next = labelInput.split(',').map((t) => t.trim()).filter(Boolean);
    if (!next.length) return;
    setLabels((cur) => [...cur, ...next]);
    setLabelInput('');
  }

  function startHold() {
    setHeld(false);
    setHoldStart(Date.now());
    setStep('hold');
  }

  function endHold() {
    setHoldSeconds(Math.round((Date.now() - holdStart) / 1000));
    setStep('action');
  }

  async function stopForToday() {
    await addEntry('safety', { consent: 'not yet', needsText: needs, env, source: 'jump' });
    setStep('arrive');
  }

  async function finish() {
    const created_at = new Date().toISOString();
    await addEntry('safety', { consent: 'yes', needsText: needs, env, source: 'jump' });
    if (trait) {
      await addTrait(trait);
      ingestUserText('traits', trait).catch(() => {});
    }
    if (trait || overlap.trim()) await addEntry('clarity', { selectedTrait: trait, overlap: overlap.trim(), source: 'jump' });
    const sessionId = crypto.randomUUID();
    await addEntry('void', {
      id: sessionId,
      created_at,
      labels,
      anchor: { type: 'stillness' },
      hold_seconds: holdSeconds,
      reflection: '',
      possibility: '',
      inspiration: action.trim()
    });
    if (action.trim()) {
      await addEntry('implementation_suggestions', {
        source: 'jump',
        suggestion: action.trim(),
        session_id: sessionId,
        inspiration_text: action.trim(),
        created_at
      });
    }
    await addEntry('jump', { trait, overlap: overlap.trim(), labels, inspiration: action.trim(), hold_seconds: holdSeconds, created_at });
    setLast({ trait, overlap: overlap.trim(), timestamp: Date.now() });
    setStep('done');
  }

  // The VOID hold takes the whole room.
  if (step === 'hold') {
    return (
      <section className="void-immersive jump-hold" aria-labelledby="jump-hold-title">
        <p className="kicker jump-hold__kicker">
          <span className="kicker__index">06</span>VOID
        </p>
        <div className="jump-hold__center">
          <h1 id="jump-hold-title" ref={titleRef} tabIndex={-1} className="sr-only">VOID hold</h1>
          {labels.length > 0 ? (
            <div className="jump-hold__labels">
              {labels.map((label, i) => (
                <DissolveWord key={`${label}-${i}`} text={label} delay={i * 300} />
              ))}
            </div>
          ) : (
            <p className="void-heading text-xl">In the void there is only the present, only awareness.</p>
          )}
          {!held && <Timer seconds={HOLD_SECONDS} label="VOID hold" className="void-timer" onDone={() => setHeld(true)} />}
          {held && <p className="void-subheading">Hang out in this sensation as long as you want.</p>}
        </div>
        <div className="jump-hold__actions">
          {held ? (
            <button className="void-btn-primary" onClick={endHold}>Continue</button>
          ) : (
            <button className="void-btn-quiet" onClick={endHold}>End hold</button>
          )}
        </div>
      </section>
    );
  }

  const index = stepIndex(step);
  const chosen = trait || 'your chosen self';

  return (
    <section className="jump">
      {index >= 0 && (
        <div className="jump-progress" aria-label={`Step ${index + 1} of ${STEPS.length}: ${STEPS[index]}`}>
          <ol className="jump-progress__dots" aria-hidden>
            {STEPS.map((s, i) => (
              <li key={s} className={i < index ? 'is-past' : i === index ? 'is-now' : ''} />
            ))}
          </ol>
          {trait && index >= STEPS.indexOf('Embody') && <p className="jump-as">As <strong>{trait}</strong></p>}
        </div>
      )}

      {step === 'arrive' && (
        <Screen
          titleRef={titleRef}
          kicker="One sitting"
          title="Timeline Jump"
          line="Timeline Jumping can be simply put as BEING another version of yourself in the now."
        >
          <ol className="jump-outline">
            {STEPS.map((s, i) => (
              <li key={s}>
                <span className="orbit-node__index">{String(i + 1).padStart(2, '0')}</span>
                {s}
              </li>
            ))}
          </ol>
          <p className="field-hint">About ten minutes. Everything stays on this device.</p>

          {last ? (
            <div className="jump-last">
              <p className="kicker">Last time · {new Date(last.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
              {last.trait && <p className="jump-last__trait">{last.trait}</p>}
              {last.overlap && <p className="jump-last__overlap">{last.overlap}</p>}
              <Actions>
                <button className="btn-flow btn-flow--primary" onClick={() => beginAgain(last.trait)}>
                  {last.trait ? `Jump again as ${last.trait}` : 'Jump again'}
                </button>
                <button className="btn-quiet" onClick={() => beginAgain(null)}>Start fresh</button>
              </Actions>
            </div>
          ) : (
            <Actions>
              <button className="btn-flow btn-flow--primary" onClick={() => setStep('safety')}>Begin</button>
            </Actions>
          )}
        </Screen>
      )}

      {step === 'safety' && (
        <Screen
          titleRef={titleRef}
          kicker="01 Safety"
          title="Are you ready to continue?"
          line="Allow yourself to tap into the sensation of safety before beginning your embodiment practice. (Can be as simple as locking your door before this practice or simply just letting yourself know that right now you are safe)."
        >
          <div className="grid gap-2">
            <p className="field-label">Prepare your space</p>
            <div className="flex flex-wrap gap-2">
              {ENV_OPTIONS.map((e) => {
                const on = env.includes(e);
                return (
                  <button
                    key={e}
                    className={`chip ${on ? 'chip-interactive' : 'chip-suggestion'}`}
                    aria-pressed={on}
                    onClick={() => setEnv((cur) => (on ? cur.filter((x) => x !== e) : [...cur, e]))}
                  >
                    {on ? '✔ ' : ''}{e}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="choice-row" role="radiogroup" aria-label="Ready to continue">
            {['yes', 'not yet'].map((v) => (
              <label key={v} className="choice">
                <input type="radio" name="jump-consent" value={v} checked={consent === v} onChange={() => setConsent(v)} />
                <span>{v === 'yes' ? 'Yes' : 'Not yet'}</span>
              </label>
            ))}
          </div>

          {consent === 'not yet' && (
            <div className="grid gap-2">
              <p className="jump-line">Ask yourself what is needed to feel safe. And give that to yourself.</p>
              <label htmlFor="jump-needs" className="field-label">Name what you need before moving forward</label>
              <div className="input-panel">
                <input
                  id="jump-needs"
                  value={needs}
                  onChange={(e) => setNeeds(e.target.value)}
                  placeholder="e.g., rest, warmth, quiet"
                  className="form-element"
                />
              </div>
            </div>
          )}

          <Actions onBack={back}>
            {consent === 'not yet' ? (
              <>
                <button className="btn-flow btn-flow--primary" onClick={() => setStep('scan')}>I'm ready now</button>
                <button className="btn-quiet" onClick={stopForToday}>Stop here for today</button>
              </>
            ) : (
              <button className="btn-flow btn-flow--primary" onClick={() => setStep('scan')} disabled={consent !== 'yes'}>
                Continue
              </button>
            )}
          </Actions>
        </Screen>
      )}

      {step === 'scan' && (
        <Screen
          titleRef={titleRef}
          kicker="02 Body scan"
          title="Close your eyes and notice how your body feels right now."
        >
          <BodyScan onDone={() => setScanned(true)} />
          <Actions onBack={back}>
            <button className={`btn-flow ${scanned ? 'btn-flow--primary' : ''}`} onClick={() => setStep('character')}>
              {scanned ? 'Continue' : 'Skip the scan'}
            </button>
          </Actions>
        </Screen>
      )}

      {step === 'character' && (
        <Screen
          titleRef={titleRef}
          kicker="03 Choosing your character"
          title="Who are you intending to become?"
          line="Clarity doesn't mean specificity here, clarity is awareness of your preferences."
        >
          <ChipList
            chips={[...savedTraits, ...STARTER_TRAITS.filter((s) => !savedTraits.some((t) => t.text === s.text))]}
            selected={trait}
            onSelect={(c) => {
              setOwnTrait('');
              setTrait((prev) => (prev === c.text ? null : c.text));
            }}
          />
          <div className="grid gap-1.5">
            <label htmlFor="jump-own" className="field-label">Or name it yourself</label>
            <div className="input-panel">
              <input
                id="jump-own"
                value={ownTrait}
                onChange={(e) => {
                  setOwnTrait(e.target.value);
                  setTrait(e.target.value.trim() || null);
                }}
                placeholder="e.g., Unhurried"
                className="form-element"
              />
            </div>
          </div>
          <Actions onBack={back}>
            <button className="btn-flow btn-flow--primary" onClick={() => setStep('embody')} disabled={!trait}>
              Continue
            </button>
            <button
              className="btn-quiet"
              onClick={() => {
                setTrait(null);
                setOwnTrait('');
                setStep('embody');
              }}
            >
              Jump without a specific aim
            </button>
          </Actions>
        </Screen>
      )}

      {step === 'embody' && (
        <Screen
          titleRef={titleRef}
          kicker="04 Embody"
          title={trait ? `Sit with "${trait}"` : 'Sit with your chosen self'}
          line="Take 45 seconds to sit with it. Let it settle in your body. Notice where you feel it."
        >
          <div className={`scan-space jump-embody ${embodying ? 'is-running' : ''} ${embodied ? 'is-done' : ''}`}>
            <p className="jump-word" aria-hidden>{chosen}</p>
            {embodying && (
              <Timer
                seconds={45}
                label="Embodiment practice"
                className="scan-time"
                onDone={() => {
                  setEmbodying(false);
                  setEmbodied(true);
                }}
              />
            )}
            {embodying && <p className="scan-cue">Where do you feel it?</p>}
          </div>
          {!embodying && (
            <button className={`btn-flow ${embodied ? '' : 'btn-flow--primary'} justify-self-start`} onClick={() => setEmbodying(true)}>
              {embodied ? 'Sit again' : 'Begin 45 seconds'}
            </button>
          )}
          <Actions onBack={back}>
            <button className={`btn-flow ${embodied ? 'btn-flow--primary' : ''}`} onClick={() => setStep('overlap')}>
              {embodied ? 'Continue' : 'Skip'}
            </button>
          </Actions>
        </Screen>
      )}

      {step === 'overlap' && (
        <Screen
          titleRef={titleRef}
          kicker="05 Overlap"
          title="Where are you already this way?"
          line="Next notice where you are already experiencing those traits, energies, feelings, perspectives right now in your reality."
        >
          <div className="grid gap-1.5">
            <label htmlFor="jump-overlap" className="field-label">Name one connection</label>
            <div className="input-panel">
              <input
                id="jump-overlap"
                value={overlap}
                onChange={(e) => setOverlap(e.target.value)}
                placeholder="e.g., I already have the calm presence I'm cultivating"
                className="form-element"
              />
            </div>
          </div>
          {pastOverlaps.length > 0 && (
            <div className="grid gap-2">
              <p className="field-hint">Evidence of Who You Already Are</p>
              <ChipList chips={pastOverlaps} selected={overlap} onSelect={(c) => setOverlap(c.text)} />
            </div>
          )}
          {overlap.trim() && <p className="jump-line">Bask in the things about you that remind you of the desired self.</p>}
          <Actions onBack={back}>
            <button className="btn-flow btn-flow--primary" onClick={() => setStep('void')}>Continue</button>
          </Actions>
        </Screen>
      )}

      {step === 'void' && (
        <Screen
          titleRef={titleRef}
          kicker="06 VOID"
          title="What labels feel heavy right now?"
          line="Release all judgments about your current reality positive and negative."
        >
          <p className="field-hint">“Who I have been being and what has that created in my reality?”</p>
          <div className="flex gap-2 items-stretch">
            <div className="input-panel flex-1">
              <input
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addLabels()}
                placeholder="failure, tired, too much…"
                className="form-element"
                aria-label="Labels"
              />
            </div>
            <button className="btn-flow" onClick={addLabels} disabled={!labelInput.trim()}>Add</button>
          </div>
          {labels.length > 0 && (
            <ul className="jump-labels">
              {labels.map((l, i) => (
                <li key={`${l}-${i}`}>
                  {l}
                  <button aria-label={`Remove ${l}`} onClick={() => setLabels((cur) => cur.filter((_, j) => j !== i))}>×</button>
                </li>
              ))}
            </ul>
          )}
          <Actions onBack={back}>
            <button className="btn-flow btn-flow--primary" onClick={startHold}>Begin hold (90s)</button>
          </Actions>
        </Screen>
      )}

      {step === 'action' && (
        <Screen
          titleRef={titleRef}
          kicker="07 Inspired action"
          title="Is there something you feel inspired to do?"
          line="You may be inspired to do something different in the next few hours or days. Do it, try it out. But you do not NEED to do anything different."
        >
          <div className="grid gap-1.5">
            <label htmlFor="jump-action" className="field-label">Inspired action</label>
            <div className="input-panel">
              <input
                id="jump-action"
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="Ex: reach out to that collaborator."
                className="form-element"
              />
            </div>
          </div>
          <Actions onBack={back}>
            <button className="btn-flow btn-flow--primary" onClick={finish}>Finish</button>
          </Actions>
        </Screen>
      )}

      {step === 'done' && (
        <Screen titleRef={titleRef} kicker="Saved on this device" title="It is done, you are them.">
          {(trait || overlap.trim() || action.trim()) && (
            <dl className="jump-kept">
              {trait && (
                <div>
                  <dt>Chosen self</dt>
                  <dd>{trait}</dd>
                </div>
              )}
              {overlap.trim() && (
                <div>
                  <dt>Where you already are</dt>
                  <dd>{overlap.trim()}</dd>
                </div>
              )}
              {action.trim() && (
                <div>
                  <dt>Inspired action</dt>
                  <dd>{action.trim()}</dd>
                </div>
              )}
            </dl>
          )}
          <Actions>
            <Link to="/artifact" className="btn-flow btn-flow--primary">Back to the map</Link>
            <Link to="/text" className="btn-quiet">Read the guide</Link>
          </Actions>
        </Screen>
      )}
    </section>
  );
}

type ScreenProps = {
  titleRef: RefObject<HTMLHeadingElement>;
  kicker: string;
  title: string;
  /** A line from the guide, in its own words. */
  line?: string;
  children: ReactNode;
};

function Screen({ titleRef, kicker, title, line, children }: ScreenProps) {
  return (
    <div className="jump-screen">
      <header className="grid gap-3">
        <p className="kicker">{kicker}</p>
        <h1 ref={titleRef} tabIndex={-1} className="scene-title jump-title">{title}</h1>
        {line && <p className="jump-line">{line}</p>}
      </header>
      {children}
    </div>
  );
}

function Actions({ onBack, children }: { onBack?: () => void; children: ReactNode }) {
  return (
    <div className="jump-actions">
      <div className="jump-actions__go">{children}</div>
      {onBack && <button className="btn-quiet" onClick={onBack}>Back</button>}
    </div>
  );
}
