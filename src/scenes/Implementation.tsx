import { useEffect, useMemo, useState } from 'react';
import { addReleaseNote, addRuntimeSpec, listReleaseNotes, listRuntimeSpecs, deleteReleaseNote, updateRuntimeSpecMicroActs, listEntries, listContexts } from '../storage/storage';
import { getSuggestions } from '../ml';
import Timer from '../components/Timer';
import { makeIcsEvent } from '../storage/export';

export default function Implementation() {
  const [label, setLabel] = useState('');
  const [principle, setPrinciple] = useState('');
  const [micro1, setMicro1] = useState('');
  const [friction, setFriction] = useState('');
  const [specs, setSpecs] = useState<any[]>([]);
  const [selectedSpecId, setSelectedSpecId] = useState<string | null>(null);
  const [action, setAction] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  const [frictionChips, setFrictionChips] = useState<{ id: string; text: string; source: 'seed' | 'user'; from?: 'safety' | 'calibration' }[]>([]);
  const [microActChips, setMicroActChips] = useState<{ id: string; text: string; source: 'seed' | 'user'; from?: 'void' }[]>([]);
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
    // Generate sensible micro-act suggestions - prioritize VOID inspirations, then fallback to seed suggestions
    (async () => {
      try {
        const insp = await listEntries('implementation_suggestions');
        const acts: { id: string; text: string; source: 'seed' | 'user'; from?: 'void' }[] = [];

        // Add today's VOID-derived inspirations first
        const today = new Date().toDateString();
        for (const s of insp) {
          const when = Date.parse(s.content?.created_at || '') || s.timestamp;
          if (when && new Date(when).toDateString() === today && s.content?.suggestion) {
            const displayText = s.content.inspiration_text || s.content.suggestion;
            acts.unshift({
              id: `void:${s.id}`,
              text: displayText,
              source: 'user',
              from: 'void'
            });
          }
        }

        // Add thoughtful seed suggestions if no VOID content
        if (acts.length === 0) {
          acts.push(
            { id: 'seed-1', text: 'One conversation I have been avoiding', source: 'seed' },
            { id: 'seed-2', text: 'Something small I can complete today', source: 'seed' },
            { id: 'seed-3', text: 'A 5-minute practice that grounds me', source: 'seed' },
            { id: 'seed-4', text: 'Reach out to someone I appreciate', source: 'seed' },
            { id: 'seed-5', text: 'One thing I can let go of today', source: 'seed' }
          );
        }

        setMicroActChips(acts.slice(0, 6));
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
    } catch { }

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
              icon: '/favicon.ico',
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
      } catch { }
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
        microActs: micro1 ? [micro1] : [],
        friction
      });
      setLabel('');
      setPrinciple('');
      setMicro1('');
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
        <div className="section-card text-sm text-ink-700">
          This is where your clarified, calibrated self moves into the world. Keep in mind, you don't have to plan it all out. Desire has gravity. When you step out of VOID, it pulls you toward the aligned choices, conversations, and small acts that belong to this version of you.
          {/* TODO: Reference path for future copy: docs/Updates/Explainers */}
        </div>
      </header>
      <div className="grid gap-2">
        <label htmlFor="label" className="text-sm">Title your next 24 hours</label>
        <div className="input-panel">
          <input id="label" value={label} onChange={(e) => setLabel(e.target.value)} className="form-element" aria-label="Plan title" />
        </div>
        <label htmlFor="principle" className="text-sm">What is one thing that feels new and fresh in you today?</label>
        <div className="input-panel">
          <input id="principle" value={principle} onChange={(e) => setPrinciple(e.target.value)} className="form-element" aria-label="Principle" />
        </div>
        <label htmlFor="micro1" className="text-sm">
          Do you feel any moves or actions arising that feel like a direct expression of who you've become?
          <span className="block text-xs text-ink-500 mt-1">
            It's okay if nothing arises—let life respond to you.
          </span>
        </label>
        <div className="input-panel">
          <input id="micro1" value={micro1} onChange={(e) => setMicro1(e.target.value)} className="form-element" placeholder="Optional: one small act..." aria-label="Small act" />
        </div>
        <div className="flex flex-wrap gap-2 mt-1" role="group" aria-label="Suggestions">
          {microActChips.map((c) => (
            <button key={c.id} className="chip chip-suggestion" onClick={() => setMicro1(c.text)} aria-label={`Suggestion: ${c.text}`}>
              {c.text} {c.from === 'void' && <span className="text-purple-500">(from VOID)</span>}
            </button>
          ))}
          {microActChips.length === 0 && !chipsLoading && (
            <span className="text-xs text-ink-500">Suggestions will appear after you use VOID</span>
          )}
        </div>
        <label htmlFor="fric" className="text-sm font-medium">What's in the Way?</label>
        <p className="text-xs text-ink-600 mb-1" id="friction-help">
          Name one thing you can reduce tomorrow to help your new way of being take root.
        </p>
        <div className="input-panel">
          <input id="fric" value={friction} onChange={(e) => setFriction(e.target.value)} className="form-element" placeholder="Optional: one obstacle to reduce..." aria-label="Obstacle" aria-describedby="friction-help" />
        </div>
        {chipsLoading && <div className="text-sm text-ink-600 italic">Loading suggestions...</div>}
        {frictionChips.some(c => c.from === 'safety' || c.from === 'calibration') && (
          <p className="text-xs text-ink-500 mt-2 mb-1">From earlier, you mentioned these obstacles:</p>
        )}
        <div className="flex flex-wrap gap-2">
          {frictionChips.map((c) => (
            <button key={c.id} className={`chip chip-suggestion ${c.from === 'safety' ? 'border-amber-400 bg-amber-50' : c.from === 'calibration' ? 'border-blue-300 bg-blue-50' : ''}`} onClick={() => setFriction(c.text)} aria-label={`Obstacle: ${c.text}${c.from ? ` (from ${c.from})` : ''}`}>
              {c.text}
            </button>
          ))}
        </div>

        {/* Consolidated save buttons - reduced from 4 to 2 */}
        <div className="flex gap-3 mt-4">
          <button
            className="btn-flow disabled:opacity-50"
            onClick={saveSpec}
            disabled={loading}
            aria-label="Save plan"
            style={{ background: 'var(--color-accent-organic)', color: 'white', borderColor: 'var(--color-accent-organic)' }}
          >
            {loading ? 'Saving…' : 'Save'}
          </button>
          <button
            className="btn-quiet"
            onClick={() => {
              setLabel('');
              setPrinciple('');
              setMicro1('');
              setFriction('');
            }}
            aria-label="Skip for now"
          >
            Skip for now
          </button>
        </div>

        {/* Secondary actions appear after save */}
        {status === 'Saved plan.' && (
          <div className="flex gap-2 mt-3 p-3 bg-green-50 rounded-lg">
            <span className="text-sm text-green-700">✓ Saved!</span>
            <button className="btn-quiet" onClick={saveToCalendar}>Add to Calendar</button>
            <button className="btn-quiet" onClick={addReminder}>Set reminder</button>
          </div>
        )}
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
                    className="btn-quiet text-xs"
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
            <input id="today-only" type="checkbox" checked={todayOnly} onChange={(e) => setTodayOnly(e.target.checked)} aria-label="Show today only" />
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
                  <button className="btn-flow inline-flex items-center gap-2" style={{ background: 'var(--color-accent-organic)', color: 'white', borderColor: 'var(--color-accent-organic)' }} onClick={() => setActTimers((t) => ({ ...t, [act]: true }))} aria-label={`Start timer for ${act}`}><span aria-hidden>▶</span> Start 60s</button>
                  {actTimers[act] && (
                    <Timer seconds={60} label={`${act} timer`} onDone={() => setActTimers((t) => ({ ...t, [act]: false }))} />
                  )}
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex gap-2">
            <div className="input-panel flex-1">
              <input value={newAct} onChange={(e) => setNewAct(e.target.value)} placeholder="Add micro-act" className="form-element" aria-label="New micro act" />
            </div>
            <button className="btn-quiet" onClick={async () => {
              if (!selectedSpecId || !newAct) return;
              const nextActs = [...(selectedSpec.microActs || []), newAct];
              await updateRuntimeSpecMicroActs(selectedSpecId, nextActs);
              const next = await listRuntimeSpecs(); setSpecs(next);
              setNewAct('');
            }} aria-label="Add micro act">Add</button>
          </div>
          <div className="flex gap-2">
            <div className="input-panel flex-1">
              <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="Logged action" className="form-element" aria-label="Release note input" />
            </div>
            <button className="btn-quiet" onClick={addNote} aria-label="Add release note">Add</button>
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
