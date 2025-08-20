import { useEffect, useMemo, useState } from 'react';
import { exportAll, importAll, type Dump } from '../storage/export';
import { db } from '../storage/db';
import { listContexts, listRuntimeSpecs } from '../storage/storage';
import InlineHelp from '../components/InlineHelp';
import InputPanel from '../components/ui/InputPanel';

export default function StorageReveal() {
  const [status, setStatus] = useState<string>('');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [lastModified, setLastModified] = useState<string>('');
  const [table, setTable] = useState<string>('userEntries');
  const [perTableModified, setPerTableModified] = useState<Record<string, string>>({});
  const [contexts, setContexts] = useState<any[]>([]);
  const [specs, setSpecs] = useState<any[]>([]);
  const [traitFilter, setTraitFilter] = useState<string>('');
  const [traitOptions, setTraitOptions] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [groupBy, setGroupBy] = useState<'none' | 'trait' | 'week'>('none');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [humanizedCounts, setHumanizedCounts] = useState<{ overlaps: number; principles: number; microActs: number }>({ overlaps: 0, principles: 0, microActs: 0 });

  useEffect(() => {
    (async () => {
      const entries = await Promise.all(db.tables.map(async (t) => [t.name, await t.count()] as const));
      setCounts(Object.fromEntries(entries));
      // compute last modified across tables by timestamp/created_at
      const [userEntries, contexts, runtimeSpecs, releaseNotes] = await Promise.all([
        db.table('userEntries').toArray(),
        db.table('contexts').toArray(),
        db.table('runtimeSpecs').toArray(),
        db.table('releaseNotes').toArray()
      ]);
      const tableMods: Record<string, number> = {
        userEntries: Math.max(0, ...userEntries.map((e: any) => e.timestamp || 0)),
        contexts: Math.max(0, ...contexts.map((e: any) => e.created_at || 0)),
        runtimeSpecs: Math.max(0, ...runtimeSpecs.map((e: any) => e.created_at || 0)),
        releaseNotes: Math.max(0, ...releaseNotes.map((e: any) => e.timestamp || 0))
      };
      setPerTableModified(Object.fromEntries(Object.entries(tableMods).map(([k, v]) => [k, v ? new Date(v).toLocaleString() : '—'])));
      const maxTs = Math.max(
        0,
        ...userEntries.map((e: any) => e.timestamp || 0),
        ...contexts.map((e: any) => e.created_at || 0),
        ...runtimeSpecs.map((e: any) => e.created_at || 0),
        ...releaseNotes.map((e: any) => e.timestamp || 0)
      );
      setLastModified(maxTs ? new Date(maxTs).toLocaleString() : '—');
    })();
  }, []);

  // Load contexts and specs for display
  useEffect(() => {
    (async () => {
      const [contextsArr, specsArr] = await Promise.all([
        listContexts(),
        listRuntimeSpecs()
      ]);
      
      setContexts(contextsArr);
      const traits = Array.from(new Set(contextsArr.map((c: any) => c.trait).filter(Boolean)));
      setTraitOptions(traits.sort((a, b) => String(a).localeCompare(String(b))));
      setSpecs(specsArr);
      
      // Compute humanized counts
      const overlaps = contextsArr.filter((c: any) => c.content?.overlap?.trim()).length;
      const principles = new Set(specsArr.map((s: any) => s.principle?.toLowerCase().trim()).filter(Boolean)).size;
      const microActs = specsArr.reduce((total: number, s: any) => total + (s.microActs?.length || 0), 0);
      
      setHumanizedCounts({ overlaps, principles, microActs });
    })();
  }, []);

  const fromTs = useMemo(() => (fromDate ? new Date(fromDate + 'T00:00:00').getTime() : 0), [fromDate]);
  const toTs = useMemo(() => (toDate ? new Date(toDate + 'T23:59:59').getTime() : Number.MAX_SAFE_INTEGER), [toDate]);

  const filteredContexts = useMemo(() => {
    return contexts
      .filter((c: any) => (traitFilter ? c.trait === traitFilter : true))
      .filter((c: any) => (c.created_at ?? 0) >= fromTs && (c.created_at ?? 0) <= toTs)
      .sort((a: any, b: any) => (b.created_at ?? 0) - (a.created_at ?? 0));
  }, [contexts, traitFilter, fromTs, toTs]);

  const filteredSpecs = useMemo(() => {
    return specs
      .filter((s: any) => (s.created_at ?? 0) >= fromTs && (s.created_at ?? 0) <= toTs)
      .sort((a: any, b: any) => (b.created_at ?? 0) - (a.created_at ?? 0));
  }, [specs, fromTs, toTs]);

  const groupedContexts = useMemo(() => {
    if (groupBy === 'none') return { All: filteredContexts } as Record<string, any[]>;
    const groups: Record<string, any[]> = {};
    for (const c of filteredContexts) {
      let key: string;
      if (groupBy === 'trait') {
        key = c.trait || '—';
      } else if (groupBy === 'week') {
        const date = new Date(c.created_at || 0);
        const year = date.getFullYear();
        const week = Math.ceil((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekStr = weekStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        key = `Week of ${weekStr} (${year}-W${week.toString().padStart(2, '0')})`;
      } else {
        key = new Date(c.created_at || 0).toDateString();
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    }
    return groups;
  }, [filteredContexts, groupBy]);

  function timeAgo(ts?: number) {
    if (!ts) return '';
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

  async function handleExport() {
    try {
      const blob = await exportAll();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tja-storage-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('Downloaded a copy.');
    } catch (e) {
      setStatus('Download failed');
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const dump = JSON.parse(text) as Dump;
      await importAll(dump);
      setStatus('Restored from file. Reload to see updates.');
    } catch (e) {
      setStatus('Import failed');
    }
  }

  async function handleClear() {
    // Called after explicit modal confirmation
    await db.transaction('rw', db.tables, async () => {
      for (const t of db.tables) await t.clear();
    });
    setStatus('Deleted all data. Reloading…');
    setTimeout(() => location.reload(), 400);
  }

  async function handleExportCSV() {
    const entries = await db.table('userEntries').toArray();
    const header = ['id', 'scene', 'timestamp', 'content'];
    const rows = entries.map((e: any) => [e.id, e.scene, new Date(e.timestamp).toISOString(), JSON.stringify(e.content).replaceAll('"', '""')]);
    const csv = [header.join(','), ...rows.map((r) => r.map((v) => `"${String(v)}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tja-entries-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="grid gap-4">
      <header className="grid gap-2">
  <h1 className="text-2xl font-bold doto-base doto-700">Manage your saved guides</h1>
        <p className="text-ink-700 text-sm">Keep, download, or remove versions of your guide. Everything you save stays private on your device unless you choose to export it.</p>
        <div className="p-4 bg-bone-50 rounded-lg text-sm text-ink-700">
          Storage is the mirror of your becoming. Every piece of evidence, principle, and action you save here turns into a library of you. When you revisit it, you'll see patterns: traits that keep circling back, shifts that spark the biggest changes, proof that your identity is evolving over time.
          {/* TODO: Reference path for future copy: docs/Updates/Explainers */}
        </div>
      </header>
      {/* STG-3: Humanized Counts Summary */}
      <div className="p-4 bg-bone-50 border rounded-lg">
        <p className="text-sm text-ink-700">
          You've logged {humanizedCounts.overlaps} overlaps, {humanizedCounts.principles} principles, {humanizedCounts.microActs} micro-acts.
        </p>
        <p className="text-xs text-ink-600 mt-1">Last updated: {lastModified}</p>
      </div>
      
      <p className="text-ink-700">Download or restore your saved copies. Everything stays on your device.</p>
      <div className="flex gap-3 flex-wrap items-center">
        <button className="px-4 py-2 border rounded" onClick={handleExport} aria-label="Download a copy">Download a copy</button>
        <InlineHelp>Downloads a backup file (JSON) of your data. Keep it private. You can restore it later with “Upload a saved copy”.</InlineHelp>
        <label className="px-4 py-2 border rounded cursor-pointer" aria-label="Upload a saved copy">
          Upload a saved copy
          <input type="file" accept="application/json" className="sr-only" onChange={handleImport} />
        </label>
        <InlineHelp>Restores a backup you previously downloaded. It replaces current data with what’s in the file.</InlineHelp>
        <button className="px-4 py-2 border rounded" onClick={handleExportCSV} aria-label="Download entries CSV">Download entries (CSV)</button>
        <InlineHelp>Exports a spreadsheet-friendly file with your entries only. Good for analysis in Sheets/Excel.</InlineHelp>
        <button className="px-4 py-2 border rounded" onClick={() => { setShowDeleteModal(true); setConfirmDeleteText(''); }} aria-label="Delete all data">Delete all data</button>
        <InlineHelp>Removes everything saved on this device. This cannot be undone. Use only if you’re sure.</InlineHelp>
      </div>
      <details className="grid gap-2">
        <summary className="font-semibold cursor-pointer select-none">Advanced options</summary>
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <InlineHelp>Developer tools for exporting/importing specific tables. Most people don’t need this.</InlineHelp>
          <label htmlFor="table" className="text-sm">Table</label>
          <select id="table" className="border p-2 rounded" value={table} onChange={(e) => setTable(e.target.value)} aria-label="Choose table">
            {db.tables.filter(t => t.name !== 'audio').map((t) => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
          <InlineHelp>Select which internal table to export/import. Changes here affect only that table.</InlineHelp>
          <button className="px-3 py-2 border rounded" onClick={async () => {
            const arr = await db.table(table).toArray();
            const blob = new Blob([JSON.stringify(arr)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tja-${table}-${new Date().toISOString()}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }} aria-label="Export selected table">Export table (JSON)</button>
          <InlineHelp>Downloads only the selected table as JSON. Useful for debugging or partial backups.</InlineHelp>
          <label className="px-3 py-2 border rounded cursor-pointer" aria-label="Import selected table">
            Import table (JSON)
            <input type="file" accept="application/json" className="sr-only" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const json = JSON.parse(await file.text());
                await db.table(table).bulkPut(json as any[]);
                setStatus(`Imported into ${table}.`);
              } catch {
                setStatus('Per-table import failed');
              }
            }} />
          </label>
          <InlineHelp>Overwrites the selected table with data from a JSON file. Proceed carefully.</InlineHelp>
        </div>
      </details>
      <details className="grid gap-2">
        <summary className="font-semibold cursor-pointer select-none">Technical details</summary>
        <div>
          <h3 className="font-semibold mt-2">Raw counts</h3>
          <ul className="text-sm text-ink-700 grid grid-cols-2 sm:grid-cols-3 gap-x-6">
            {Object.entries(counts).map(([name, count]) => (
              <li key={name}>{name}: {count} <span className="text-slate-500">(last: {perTableModified[name] || '—'})</span></li>
            ))}
          </ul>
        </div>
      </details>
      {/* STG-1 Filters */}
      <div className="grid gap-2 border rounded p-3">
        <h2 className="font-semibold">Filter by trait or date</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="grid">
            <label className="text-sm" htmlFor="trait">Trait</label>
            <select id="trait" className="border p-2 rounded min-w-[160px]" value={traitFilter} onChange={(e) => setTraitFilter(e.target.value)} aria-label="Trait filter">
              <option value="">All traits</option>
              {traitOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="grid">
            <label className="text-sm" htmlFor="from">From</label>
            <input id="from" type="date" className="border p-2 rounded" value={fromDate} onChange={(e) => setFromDate(e.target.value)} aria-label="From date" />
          </div>
          <div className="grid">
            <label className="text-sm" htmlFor="to">To</label>
            <input id="to" type="date" className="border p-2 rounded" value={toDate} onChange={(e) => setToDate(e.target.value)} aria-label="To date" />
          </div>
          <div className="grid">
            <label className="text-sm" htmlFor="group">Group by</label>
            <select id="group" className="border p-2 rounded" value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)} aria-label="Group by">
              <option value="none">No grouping</option>
              <option value="trait">Group by Trait</option>
              <option value="week">Group by Week</option>
            </select>
          </div>
          {(traitFilter || fromDate || toDate) && (
            <button className="px-3 py-2 border rounded" onClick={() => { setTraitFilter(''); setFromDate(''); setToDate(''); }} aria-label="Clear filters">Clear</button>
          )}
        </div>
      </div>
      {/* STG-2 Enhanced Storage Display */}
      <div className="grid gap-3">
        <h2 className="font-semibold">Evidence</h2>
        {traitFilter && (
          <p className="text-sm text-ink-600">{filteredContexts.length} items tagged '{traitFilter}'</p>
        )}
        {Object.entries(groupedContexts).map(([group, items]) => (
          <div key={group} className="grid gap-1">
            {groupBy !== 'none' && <div className="text-xs font-medium text-ink-500 mt-2">{group}</div>}
            <ul className="divide-y border rounded">
              {items.map((c: any) => (
                <li key={c.id} className="p-2 text-sm flex items-start gap-2">
                  <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">{c.type}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{c.label}</span>
                      {c.trait && <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px]">{c.trait}</span>}
                    </div>
                    <div className="text-[11px] text-ink-500">{timeAgo(c.created_at)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="grid gap-3">
        <h2 className="font-semibold">Plans</h2>
        <ul className="divide-y border rounded">
          {filteredSpecs.map((s: any) => (
            <li key={s.id} className="p-2 text-sm">
              <div className="font-medium">{s.label}</div>
              <div className="text-ink-600">Principle: {s.principle}</div>
              <div className="text-[11px] text-ink-500">{timeAgo(s.created_at)}</div>
            </li>
          ))}
        </ul>
      </div>
      {status && <p className="text-sm text-ink-600" aria-live="polite">{status}</p>}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 grid gap-3">
            <h2 id="delete-title" className="text-lg font-semibold">Delete all data?</h2>
            <p className="text-sm text-ink-700">This permanently deletes everything saved on this device. Type DELETE to confirm.</p>
            <InputPanel
              label="CONFIRM"
              value={confirmDeleteText}
              onChange={(e) => setConfirmDeleteText((e.target as HTMLInputElement).value)}
              placeholder="Type DELETE"
              aria-label="Type DELETE to confirm"
            />
            <div className="flex gap-2 justify-end mt-2">
              <button className="px-3 py-2 border rounded" onClick={() => setShowDeleteModal(false)} aria-label="Cancel delete">Cancel</button>
              <button
                className="px-3 py-2 border rounded bg-red-600 text-white disabled:opacity-50"
                disabled={confirmDeleteText !== 'DELETE'}
                onClick={async () => { await handleClear(); setShowDeleteModal(false); }}
                aria-label="Confirm delete all data"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
