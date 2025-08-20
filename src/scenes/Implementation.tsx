import { useEffect, useMemo, useState } from 'react';
import { addReleaseNote, addRuntimeSpec, listReleaseNotes, listRuntimeSpecs, deleteReleaseNote, updateRuntimeSpecMicroActs, listEntries, listContexts } from '../storage/storage';
import { getSuggestions, type SuggestResult } from '../ml';
import Timer from '../components/Timer';
import { makeIcsEvent } from '../storage/export';
import StackedButton from '../components/ui/StackedButton';
import InputPanel from '../components/ui/InputPanel';

export default function Implementation() {
  const [label, setLabel] = useState('');
  const [principle, setPrinciple] = useState('');
  const [micro1, setMicro1] = useState('');
  const [micro2, setMicro2] = useState('');
  const [friction, setFriction] = useState('');
  const [specs, setSpecs] = useState<any[]>([]);
  const [selectedSpecId, setSelectedSpecId] = useState<string | null>(null);
  const [action, setAction] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  const [frictionChips, setFrictionChips] = useState<{ id: string; text: string; source: 'seed' | 'user'; from?: 'safety' | 'calibration' }[]>([]);
  const [microActChips, setMicroActChips] = useState<{ id: string; text: string; source: 'seed' | 'user'; from?: 'void' | 'clarity' | 'safety' }[]>([]);
  const [newAct, setNewAct] = useState('');
  const [actTimers, setActTimers] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState('');
  const [reminders, setReminders] = useState<any[]>([]);
  const [specNotes, setSpecNotes] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [chipsLoading, setChipsLoading] = useState(false);

  useEffect(() => {
    listRuntimeSpecs().then(setSpecs);
  }, []);

  // Load per-spec notes for progress dots (IMP-2)
  useEffect(() => {
    (async () => {
      const map: Record<string, any[]> = {};
      for (const s of specs) {
        map[s.id] = await listReleaseNotes(s.id);
      }
      setSpecNotes(map);
    })();
  }, [specs]);

  useEffect(() => {
    // Load ML friction suggestions + Safety unmet needs + recent Calibration frictions
    (async () => {
      setChipsLoading(true);
      try {
        const [mlSuggestions, safetyEntries, contextFrictions] = await Promise.all([
          getSuggestions('frictions', friction),
          listEntries('safety'),
          listContexts('friction')
        ]);
        const chips: { id: string; text: string; source: 'seed' | 'user'; from?: 'safety' | 'calibration' }[] = [...mlSuggestions.items];
        
        // Helper: same-day filter
        const today = new Date().toDateString();
        const isTodayTs = (ts?: number) => !!ts && new Date(ts).toDateString() === today;

        // Safety-derived frictions: include multiple needsText/partNeed from ALL recent safety entries (same day)
        const safetyTexts = new Set<string>();
        for (const s of safetyEntries) {
          if (!isTodayTs(s.timestamp)) continue;
          const need = String(s.content?.needsText || '').trim();
          const partNeed = String(s.content?.partNeed || '').trim();
          if (need) safetyTexts.add(need);
          if (partNeed) safetyTexts.add(partNeed);
        }
        for (const t of safetyTexts) {
          chips.push({ id: `safety:${t}`, text: t, source: 'user', from: 'safety' });
        }

        // Calibration frictions from contexts (same day)
        for (const c of contextFrictions) {
          if (!isTodayTs(c.created_at)) continue;
          if (typeof c.label === 'string' && c.label.trim()) {
            chips.push({ id: `calib:${c.id}`, text: c.label, source: 'user', from: 'calibration' });
          }
        }

        setFrictionChips(chips);
      } catch (e) {
        setFrictionChips([]);
      } finally {
        setChipsLoading(false);
      }
    })();
  }, [friction]);

  useEffect(() => {
    // Enhanced micro-act suggestions from VOID, Clarity, and Safety
    (async () => {
      try {
        const [ctxResult, trResult, voidInsp, clarityEntries, safetyEntries] = await Promise.all([
          getSuggestions('contexts'),
          getSuggestions('traits'),
          listEntries('implementation_suggestions'),
          listEntries('clarity'),
          listEntries('safety')
        ]);
        
        const acts: { id: string; text: string; source: 'seed' | 'user'; from?: 'void' | 'clarity' | 'safety' }[] = [];
        
        // Blacklist of negative terms that shouldn't appear as traits for micro-acts
        const negativeTraitTerms = [
          'scrolling', 'overcommit', 'clutter', 'late nights', 'self-critique',
          'procrastination', 'overthinking', 'rushing', 'avoidance', 'perfectionism',
          'distraction', 'overwhelm', 'anxiety', 'stress', 'worry', 'fear',
          'doubt', 'impatience', 'anger', 'frustration', 'burnout', 'exhaustion'
        ];
        
        // Filter traits to only include positive ones
        const positiveTraits = trResult.items.filter(t => {
          const text = t.text.toLowerCase().trim();
          return !negativeTraitTerms.some(negative => 
            text.includes(negative.toLowerCase()) || 
            negative.toLowerCase().includes(text)
          );
        });
        
        // Seed suggestions (fallback) - only use positive traits, not contexts
        for (const t of positiveTraits.slice(0, 4)) {
          // Generate positive embodiment actions for traits
          acts.push({ id: `tr:${t.id}`, text: `Act as ${t.text} for 2m`, source: 'seed' });
        }
        
        // Expanded universal positive micro-acts as fallback
        const universalMicroActs = [
          'Take 3 deep breaths mindfully',
          'Make eye contact during conversations', 
          'Stand with good posture for 1 minute',
          'Write one thing you\'re grateful for',
          'Act as confident for 2m',
          'Act as patient for 2m',
          'Act as focused for 2m',
          'Act as gentle for 2m',
          'Act as curious for 2m',
          'Act as grounded for 2m'
        ];
        
        // Always ensure we have at least 4 positive suggestions
        if (acts.length < 4) {
          universalMicroActs.slice(0, 4 - acts.length).forEach((text, i) => {
            acts.push({ id: `universal:${i}`, text, source: 'seed' });
          });
        }
        
        // Helper: same-day filter
        const today = new Date().toDateString();
        const isTodayTs = (ts?: number) => !!ts && new Date(ts).toDateString() === today;
        
        // VOID: implementation suggestions (same day)
        for (const s of voidInsp) {
          const when = Date.parse(s.content?.created_at || '') || s.timestamp;
          if (when && new Date(when).toDateString() === today && s.content?.suggestion) {
            const isInspiration = s.content?.session_id && s.content?.inspiration_text;
            const displayText = isInspiration ? s.content.inspiration_text : s.content.suggestion;
            acts.unshift({ id: `void:${s.id}`, text: displayText, source: 'user', from: 'void' });
          }
        }
        
        // Clarity: overlaps → micro-acts
        for (const c of clarityEntries) {
          if (!isTodayTs(c.timestamp)) continue;
          const overlap = c.content?.overlap?.trim();
          if (overlap) {
            acts.unshift({ id: `clarity:${c.id}`, text: `Repeat: ${overlap} once today`, source: 'user', from: 'clarity' });
          }
        }
        
        // Safety: needs → micro-acts
        for (const s of safetyEntries) {
          if (!isTodayTs(s.timestamp)) continue;
          const needsText = s.content?.needsText?.trim();
          const partNeed = s.content?.partNeed?.trim();
          if (needsText) {
            acts.unshift({ id: `safety-need:${s.id}`, text: `Give yourself: ${needsText} for 2m`, source: 'user', from: 'safety' });
          }
          if (partNeed) {
            acts.unshift({ id: `safety-part:${s.id}`, text: `Give yourself: ${partNeed} for 2m`, source: 'user', from: 'safety' });
          }
        }
        
        // Remove duplicates by normalized text, sort by recency, cap to 5
        const uniqueActs = acts.filter((act, index, self) => 
          index === self.findIndex(a => a.text === act.text)
        );
        setMicroActChips(uniqueActs.slice(0, 5));
      } catch {
        setMicroActChips([]);
      }
    })();
  }, []);

  // Real notification system (IMP-1)
  useEffect(() => {
    // Request notification permission on load
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    try {
      const raw = localStorage.getItem('tja-reminders');
      setReminders(raw ? JSON.parse(raw) : []);
    } catch {}
    
    const t = setInterval(() => {
      try {
        const raw = localStorage.getItem('tja-reminders');
        const arr: any[] = raw ? JSON.parse(raw) : [];
        const now = Date.now();
        const due = arr.find((r) => !r.done && r.dueAt && r.dueAt <= now);
        if (due) {
          // Try Web Notifications API first, fallback to alert
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`TGJ Reminder`, {
              body: due.text,
              icon: '/icons/icon-192.png',
              tag: `reminder-${due.id}`,
              requireInteraction: false
            });
          } else {
            // Fallback to in-app alert
            alert(`Reminder: ${due.text}`);
          }
          due.done = true;
          localStorage.setItem('tja-reminders', JSON.stringify(arr));
          setReminders(arr);
        }
      } catch {}
    }, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (selectedSpecId) listReleaseNotes(selectedSpecId).then(setNotes);
  }, [selectedSpecId]);

  async function saveSpec() {
    setLoading(true);
    try {
      const id = await addRuntimeSpec({
        label,
        principle,
        microActs: [micro1, micro2].filter(Boolean),
        friction
      });
      setLabel('');
      setPrinciple('');
      setMicro1('');
      setMicro2('');
      setFriction('');
      const next = await listRuntimeSpecs();
      setSpecs(next);
      setSelectedSpecId(id);
      setStatus('Saved plan.');
      setTimeout(() => setStatus(''), 1500);
    } finally {
      setLoading(false);
    }
  }

  async function addNote() {
    if (!selectedSpecId) return;
    await addReleaseNote(selectedSpecId, action);
    setAction('');
    listReleaseNotes(selectedSpecId).then(setNotes);
    setStatus('Added note.');
    setTimeout(() => setStatus(''), 1500);
  }

  function saveToCalendar() {
    const title = label || selectedSpec?.label || 'TGJ Plan';
    const desc = principle ? `Principle: ${principle}` : selectedSpec ? `Principle: ${selectedSpec.principle}` : '';
    const blob = makeIcsEvent({ title, description: desc, durationMinutes: 30 });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'event').replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function saveQuickNote() {
    if (!selectedSpecId) return;
    const t = prompt('Quick note to save to this plan?');
    if (!t) return;
    addReleaseNote(selectedSpecId, t).then(() => listReleaseNotes(selectedSpecId).then(setNotes));
  }

  function addReminder() {
    // Check notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setStatus('Notifications enabled. Setting reminder...');
        } else {
          setStatus('Notifications blocked. Will use in-app alerts.');
        }
      });
    }
    
    const base = selectedSpec?.label || label || 'Follow up';
    const mins = parseInt(prompt('Remind me in how many minutes? (default 120)') || '120', 10);
    const when = Date.now() + (isNaN(mins) ? 120 : mins) * 60000;
    const next = [...reminders, { id: crypto.randomUUID(), text: base, dueAt: when, done: false, createdAt: Date.now() }];
    localStorage.setItem('tja-reminders', JSON.stringify(next));
    setReminders(next);
    
    const hasNotifications = 'Notification' in window && Notification.permission === 'granted';
    setStatus(`Reminder set${hasNotifications ? ' (notifications enabled)' : ' (browser alerts)'}. Will remind in ${isNaN(mins) ? 120 : mins} minutes.`);
    setTimeout(() => setStatus(''), 3000);
  }

  const selectedSpec = useMemo(() => specs.find((s) => s.id === selectedSpecId), [specs, selectedSpecId]);
  const todayKey = new Date().toDateString();
  const notesToday = useMemo(() => notes.filter(n => new Date(n.timestamp).toDateString() === todayKey), [notes, todayKey]);
  const [todayOnly, setTodayOnly] = useState(true);

  function isActDoneToday(act: string) {
    return notesToday.some(n => n.action === `Completed: ${act}`);
  }

  async function toggleAct(act: string) {
    const existing = notesToday.find(n => n.action === `Completed: ${act}`);
    if (existing) {
      await deleteReleaseNote(existing.id);
    } else if (selectedSpecId) {
      await addReleaseNote(selectedSpecId, `Completed: ${act}`);
    }
    if (selectedSpecId) listReleaseNotes(selectedSpecId).then(setNotes);
  }

  return (
    <section className="grid gap-6">
      <header className="grid gap-2">
  <h1 className="text-2xl font-bold doto-base doto-700">Implementation</h1>
        <p className="text-ink-700 text-sm">The actions you take are reflection of who you are.</p>
        <div className="p-4 bg-bone-50 rounded-lg text-sm text-ink-700">
          This is where your clarified, calibrated self moves into the world. But the secret is, you don't have to plan it all out. Desire has gravity. When you step out of VOID, it tugs you toward the right choices, conversations, and micro-acts that belong to this new version of you.
          {/* TODO: Reference path for future copy: docs/Updates/Explainers */}
        </div>
      </header>
      <div className="grid gap-2">
        <p className="text-xs text-ink-600">Give your action plan a simple name (e.g., Morning reset, Saying no gracefully).</p>
        <InputPanel
          label="TITLE"
          id="label"
          value={label}
          onChange={(e) => setLabel((e.target as HTMLInputElement).value)}
          aria-label="Plan title"
          placeholder="Morning reset, Saying no gracefully…"
        />

        <p className="text-xs text-ink-600">What core value or intention does this reflect? (e.g., Calm, Honesty, Patience).</p>
        <InputPanel
          label="PRINCIPLE"
          id="principle"
          value={principle}
          onChange={(e) => setPrinciple((e.target as HTMLInputElement).value)}
          aria-label="Principle"
          placeholder="Calm, Honesty, Patience…"
        />

        <p className="text-xs text-ink-600">List 1–2 small, concrete actions that express this principle. (e.g., Pause before replying, Put phone in drawer at dinner).</p>
        <InputPanel
          label="MICRO-ACT 1"
          id="micro1"
          value={micro1}
          onChange={(e) => setMicro1((e.target as HTMLInputElement).value)}
          aria-label="Micro act 1"
          placeholder="Pause before replying…"
        />
        <InputPanel
          label="MICRO-ACT 2"
          id="micro2"
          value={micro2}
          onChange={(e) => setMicro2((e.target as HTMLInputElement).value)}
          aria-label="Micro act 2"
          placeholder="Phone in drawer at dinner…"
        />
        <div className="flex flex-wrap gap-2 mt-1" role="group" aria-label="Micro-act suggestions">
          {microActChips.map((c) => (
            <button key={c.id} className="px-3 py-1 rounded-full border text-sm" onClick={() => {
              if (!micro1) setMicro1(c.text); else setMicro2(c.text);
            }} aria-label={`Micro-act ${c.text}`} title={c.source === 'seed' ? "Anchor = the first trait or identity shift you want to ground in." : undefined}>
              {c.text} <span className="text-slate-400">({c.from ? `from ${c.from}` : c.source === 'seed' ? 'anchor' : c.source})</span>
            </button>
          ))}
          {microActChips.length === 0 && !chipsLoading && (
            <span className="text-xs text-ink-600">No suggestions yet</span>
          )}
        </div>
        <p className="text-xs text-ink-600" id="friction-help">Name one thing you can reduce tomorrow to help this land</p>
        <InputPanel label="FRICTION" id="fric" value={friction} onChange={(e) => setFriction((e.target as HTMLInputElement).value)} aria-label="Friction"/>
        {chipsLoading && <div className="text-sm text-ink-600 italic">Loading suggestions...</div>}
        <div className="flex flex-wrap gap-2">
          {frictionChips.map((c) => (
            <button key={c.id} className={`px-3 py-1 rounded-full border text-sm ${c.from === 'safety' ? 'border-amber-400 bg-amber-50' : c.from === 'calibration' ? 'border-blue-300 bg-blue-50' : ''}`} onClick={() => setFriction(c.text)} aria-label={`Friction ${c.text} ${c.from ? `from ${c.from}` : ''}`} title={c.from ? `From ${c.from}` : c.source === 'seed' ? 'Anchor = first trait or identity shift' : undefined}>
              {c.text} <span className="text-slate-400">({c.from ?? (c.source === 'seed' ? 'anchor' : c.source)})</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <StackedButton className="rect-btn--sm" onClick={saveSpec} disabled={loading} aria-label="Save plan">
            {loading ? 'SAVING…' : 'SAVE PLAN'}
          </StackedButton>
          {/* Keep utility actions as bordered buttons */}
          <button className="px-4 py-2 border rounded" onClick={saveToCalendar} aria-label="Save to Calendar">Save to Calendar</button>
          <button className="px-4 py-2 border rounded" onClick={saveQuickNote} aria-label="Save a Note">Save a Note</button>
          <button className="px-4 py-2 border rounded" onClick={addReminder} aria-label="Add reminder">I'll add this later</button>
        </div>
      </div>

      <div className="grid gap-2">
        <h2 className="font-semibold">Plans</h2>
        <ul className="border rounded divide-y">
          {specs.map((s) => (
            <li key={s.id}>
              <div className={`w-full p-3 ${selectedSpecId === s.id ? 'bg-bone-100' : ''}`}>
                <button className="text-left" onClick={() => setSelectedSpecId(s.id)} aria-label={`Select plan ${s.label}`}>
                  <div className="font-medium">{s.label}</div>
                  <div className="text-sm text-ink-600">Principle: {s.principle}</div>
                </button>
                {/* IMP-2 progress dots */}
                {Array.isArray(s.microActs) && s.microActs.length > 0 && (
                  <div className="mt-1 text-[11px] text-ink-600" aria-label="Daily progress">
                    {(s.microActs || []).map((act: string, i: number) => {
                      const today = new Date().toDateString();
                      const notes = specNotes[s.id] || [];
                      const done = notes.some((n) => new Date(n.timestamp).toDateString() === today && n.action === `Completed: ${act}`);
                      return <span key={i} className={`mr-1 ${done ? 'text-ink-900' : 'text-ink-300'}`}>{done ? '●' : '○'}</span>;
                    })}
                  </div>
                )}
                {/* IMP-3 repeat button */}
                <div className="mt-2">
                  <button
                    className="text-xs px-2 py-1 border rounded"
                    onClick={async () => {
                      const id = await addRuntimeSpec({ label: s.label, principle: s.principle, microActs: s.microActs || [], friction: s.friction });
                      const next = await listRuntimeSpecs();
                      setSpecs(next);
                      setSelectedSpecId(id);
                    }}
                    aria-label={`Repeat plan ${s.label}`}
                  >
                    Repeat
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {status && <p className="text-sm text-ink-600" aria-live="polite">{status}</p>}

      {selectedSpec && (
        <div className="grid gap-2">
          <h3 className="font-semibold">Release Notes for “{selectedSpec.label}”</h3>
          <div className="flex items-center gap-2">
            <input id="today-only" type="checkbox" checked={todayOnly} onChange={(e) => setTodayOnly(e.target.checked)} aria-label="Show today only"/>
            <label htmlFor="today-only" className="text-sm">Show today only</label>
          </div>
          {selectedSpec.microActs?.length ? (
            <div className="grid gap-2 mb-2" aria-label="Today's micro-acts">
              {selectedSpec.microActs.map((act: string) => (
                <div key={act} className="flex items-center gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={isActDoneToday(act)} onChange={() => toggleAct(act)} aria-label={`Complete ${act}`} />
                    {act}
                  </label>
                  <button className="px-2 py-1 border rounded" onClick={() => setActTimers((t) => ({ ...t, [act]: true }))} aria-label={`Start timer for ${act}`}>Start 60s</button>
                  {actTimers[act] && (
                    <Timer seconds={60} label={`${act} timer`} onDone={() => setActTimers((t) => ({ ...t, [act]: false }))} />
                  )}
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex gap-2">
            <InputPanel label="NEW MICRO-ACT" value={newAct} onChange={(e) => setNewAct((e.target as HTMLInputElement).value)} placeholder="Add micro-act" className="flex-1" aria-label="New micro act"/>
            <button className="px-3 py-2 border rounded" onClick={async () => {
              if (!selectedSpecId || !newAct) return;
              const nextActs = [...(selectedSpec.microActs || []), newAct];
              await updateRuntimeSpecMicroActs(selectedSpecId, nextActs);
              const next = await listRuntimeSpecs(); setSpecs(next);
              setNewAct('');
            }} aria-label="Add micro act">Add</button>
          </div>
          <div className="flex gap-2">
            <InputPanel label="RELEASE NOTE" value={action} onChange={(e) => setAction((e.target as HTMLInputElement).value)} placeholder="Logged action" className="flex-1" aria-label="Release note input"/>
            <button className="px-4 py-2 border rounded" onClick={addNote} aria-label="Add release note">Add</button>
          </div>
          <ul className="list-disc pl-6">
            {(todayOnly ? notesToday : notes).map((n) => (
              <li key={n.id}>{new Date(n.timestamp).toLocaleString()}: {n.action}</li>
            ))}
          </ul>
        </div>
      )}

  {/* Audio integration removed */}
    </section>
  );
}
