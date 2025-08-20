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
import { StackedButton } from '../components/ui';
import InputPanel from '../components/ui/InputPanel';
import VoidLabel from '../components/VoidLabel';
import AnchorPreview from '../components/AnchorPreview';
import ImmersiveHoldSpace from '../components/ImmersiveHoldSpace';
import LabelInsights from '../components/LabelInsights';

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
          <h1 className="text-2xl font-bold doto-base doto-700">VOID{autostart ? ' (Quick Start)' : ''}</h1>
          <p className="text-ink-700 text-sm">{autostart ? 'Ready to dissolve. Add your labels and begin.' : 'VOID is a shower. VOID is the dissolve. Labels melt here, good or bad, success or failure, they soften until they disappear. Neutrality creates breathing room. Your being relaxes, no longer defending or rejecting a label. And in that emptiness, possibility pulls you forward. VOID is powerful because when you let go, space opens. And because desire is magnetic space naturally calls in the new identity you\'ve been clarifying and calibrating.'}</p>
        </header>
        
        <div className="grid gap-4">
          <h2 className="text-lg font-semibold">What labels feel heavy right now?</h2>
          
          <div className="grid gap-3">
            <InputPanel
              label="LABELS"
              placeholder="failure, tired, too much…"
              value={labelInput}
              onChange={(e) => setLabelInput((e.target as HTMLInputElement).value)}
              onKeyDown={(e) => e.key === 'Enter' && addLabelsFromInput()}
              ref={labelInputRef as any}
            />
            <StackedButton
              onClick={addLabelsFromInput}
              disabled={!labelInput.trim()}
              aria-label="Add Label"
              className="rect-btn--sm"
            >
              ADD LABEL
            </StackedButton>
          </div>
          
          {labels.length > 0 && (
            <div className="grid gap-3">
              <h3 className="font-medium">Labels to dissolve:</h3>
              <div className="flex flex-wrap gap-3 p-6 bg-stone-25 border border-stone-100 min-h-20">
                {labels.map((label, index) => (
                  <VoidLabel
                    key={index}
                    text={label}
                    variant={['orb', 'fragment', 'glitch'][index % 3] as any}
                    onRemove={() => removeLabel(index)}
                  />
                ))}
              </div>
              
              <LabelInsights 
                labels={labels}
                onClusterSuggestion={(cluster) => {
                  // Optional: could focus the experience on a specific theme
                  console.log('Focus on theme:', cluster.theme);
                }}
              />
              
              <StackedButton
                onClick={() => setState('choose_anchor')}
                aria-label="Continue to Anchor Selection"
                className="rect-btn--wide"
              >
                CONTINUE TO ANCHOR SELECTION
              </StackedButton>
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
          <h1 className="text-2xl font-bold doto-base doto-700">Choose Your Anchor</h1>
          <p className="text-ink-700 text-sm">Select something to hold your attention during the ritual. Pick your favorite meditative sound and play that as a companion if you would like. Or if you want a guided Timeline Jump, grab <a href="https://www.peathefeary.com/classesandaudios/p/timeline-jumping-audio" className="text-purple-600 hover:text-purple-800 underline" target="_blank" rel="noopener noreferrer">one here</a>.</p>
        </header>
        
        <div className="grid gap-4">
          <div className="grid gap-4">
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
          
          <div className="flex gap-3 items-center">
            <button 
              onClick={() => setState('enter_labels')}
              className="px-4 py-2 border rounded"
            >
              Back
            </button>
            <StackedButton
              onClick={() => startHold()}
              disabled={!selectedAnchor || (selectedAnchor.type === 'custom' && !customAnchor.trim())}
              aria-label="Begin Hold"
              className="rect-btn--sm"
            >
              BEGIN HOLD (90s)
            </StackedButton>
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
      <section className="grid gap-6 text-center">
        <header className="grid gap-2">
          <h1 className="text-2xl font-bold doto-base doto-700">Release</h1>
          <p className="text-ink-700 text-sm">congratulations!</p>
        </header>
        
        <div className="grid gap-4">
          {dissolvingLabels.map((label, index) => (
            <DissolveWord key={index} text={label} delay={reducedMotion ? 0 : index * 300} />
          ))}
          
          {dissolvingLabels.length === 0 && (
            <div className="text-xl text-purple-600">welcome to your new timeline</div>
          )}
        </div>
      </section>
    );
  }
  
  if (state === 'integration') {
    return (
      <section className="grid gap-6">
        <header className="grid gap-2">
          <h1 className="text-2xl font-bold doto-base doto-700">Integration</h1>
          <p className="text-ink-700 text-sm">Capture what emerged from the space.</p>
        </header>
        
        <div className="grid gap-4">
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
            />
          </div>
          
          <div className="grid gap-2">
            <InputPanel
              as="textarea"
              label="INSPIRED ACTION"
              id="inspiration"
              value={inspiration}
              onChange={(e) => setInspiration((e.target as HTMLTextAreaElement).value)}
              className=""
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
