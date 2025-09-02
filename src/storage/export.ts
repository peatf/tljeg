import { db } from './db';
import { jsPDF } from 'jspdf';

export type Dump = {
  userEntries: any[];
  traits: any[];
  contexts: any[];
  runtimeSpecs: any[];
  releaseNotes: any[];
  settings?: { highContrast?: boolean; textScale?: string };
  // audio removed
};

export async function exportAll(): Promise<Blob> {
  const [userEntries, traits, contexts, runtimeSpecs, releaseNotes] = await Promise.all([
    db.table('userEntries').toArray(),
    db.table('traits').toArray(),
    db.table('contexts').toArray(),
    db.table('runtimeSpecs').toArray(),
    db.table('releaseNotes').toArray()
  ]);
  let settings: Dump['settings'] | undefined;
  try {
    const hc = !!localStorage.getItem('tja-hc');
    const ts = localStorage.getItem('tja-text-scale') || undefined;
    settings = { highContrast: hc || undefined, textScale: ts };
  } catch {}
  const dump: Dump = { userEntries, traits, contexts, runtimeSpecs, releaseNotes, settings } as any;
  return new Blob([JSON.stringify(dump)], { type: 'application/json' });
}

export async function importAll(dump: Dump) {
  await db.transaction('rw', db.tables, async () => {
  await db.table('userEntries').bulkPut(dump.userEntries as any);
  await db.table('traits').bulkPut(dump.traits as any);
  await db.table('contexts').bulkPut(dump.contexts as any);
  await db.table('runtimeSpecs').bulkPut(dump.runtimeSpecs as any);
  await db.table('releaseNotes').bulkPut(dump.releaseNotes as any);
  });
  // Restore settings
  try {
    if (dump.settings?.highContrast) localStorage.setItem('tja-hc', '1');
    if (dump.settings?.textScale) localStorage.setItem('tja-text-scale', String(dump.settings.textScale));
  } catch {}
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string): Blob {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes.buffer], { type: 'application/octet-stream' });
}

// Simple ICS event generator for calendar export (IMP-1)
export function makeIcsEvent(opts: { title: string; description?: string; start?: Date; durationMinutes?: number; location?: string }) {
  const uid = `${Date.now()}@tgj.local`;
  const dt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const start = opts.start ?? new Date();
  const dur = opts.durationMinutes ?? 30;
  const end = new Date(start.getTime() + dur * 60000);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TGJ Guide//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dt(new Date())}`,
    `DTSTART:${dt(start)}`,
    `DTEND:${dt(end)}`,
    `SUMMARY:${escapeIcs(opts.title)}`,
    opts.description ? `DESCRIPTION:${escapeIcs(opts.description)}` : undefined,
    opts.location ? `LOCATION:${escapeIcs(opts.location)}` : undefined,
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean) as string[];
  return new Blob([lines.join('\r\n')], { type: 'text/calendar' });
}

function escapeIcs(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

// Human‑readable export (Markdown/HTML) — no IDs/timestamps, narrative summary
export async function exportUserFriendly(): Promise<Blob> {
  const [userEntries, traits, contexts, runtimeSpecs, releaseNotes] = await Promise.all([
    db.table('userEntries').toArray(),
    db.table('traits').toArray(),
    db.table('contexts').toArray(),
    db.table('runtimeSpecs').toArray(),
    db.table('releaseNotes').toArray()
  ]);

  const byId = new Map<string, any>();
  for (const s of runtimeSpecs) byId.set(s.id, s);

  const formatDate = (ts?: number) => (ts ? new Date(ts).toLocaleDateString() : '');
  const today = new Date();
  const uniqueScenes = Array.from(new Set(userEntries.map((e: any) => e.scene))).filter(Boolean);

  // Contexts by type
  const ctxByType: Record<string, any[]> = { ordinary: [], friction: [], proof: [], rehearsal: [] } as any;
  for (const c of contexts) {
    if (!ctxByType[c.type]) ctxByType[c.type] = [];
    ctxByType[c.type].push(c);
  }
  for (const k of Object.keys(ctxByType)) ctxByType[k] = ctxByType[k].sort((a, b) => (a.created_at ?? 0) - (b.created_at ?? 0));

  // Timeline events (chronological)
  type Event = { when: number; text: string };
  const events: Event[] = [];
  for (const c of contexts) {
    const prettyType = c.type.charAt(0).toUpperCase() + c.type.slice(1);
    events.push({ when: c.created_at ?? 0, text: `${formatDate(c.created_at)} — ${prettyType}: ${c.label}${c.trait ? ` (trait: ${c.trait})` : ''}` });
  }
  for (const s of runtimeSpecs) {
    events.push({ when: s.created_at ?? 0, text: `${formatDate(s.created_at)} — Plan created: ${s.label} (Principle: ${s.principle})` });
  }
  for (const n of releaseNotes) {
    const spec = byId.get(n.spec_id);
    const label = spec?.label ? ` for “${spec.label}”` : '';
    events.push({ when: n.timestamp ?? 0, text: `${formatDate(n.timestamp)} — ${n.action}${label}` });
  }
  events.sort((a, b) => a.when - b.when);

  // Patterns & insights (simple heuristics)
  const traitCounts = new Map<string, number>();
  for (const c of contexts) if (c.trait) traitCounts.set(c.trait, (traitCounts.get(c.trait) || 0) + 1);
  const topTraits = Array.from(traitCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const typeCounts: Record<string, number> = { ordinary: 0, friction: 0, proof: 0, rehearsal: 0 } as any;
  for (const c of contexts) typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
  const totalMicroActs = runtimeSpecs.reduce((sum: number, s: any) => sum + (s.microActs?.length || 0), 0);

  const mdLines: string[] = [];
  mdLines.push(`# Your Timeline Jumping Journey`);
  mdLines.push(`*Generated on ${today.toLocaleString()}*`);
  mdLines.push('');

  // Summary
  mdLines.push(`## Summary`);
  mdLines.push(
    `You've explored ${uniqueScenes.length} scenes, identified ${traits.length} traits, and created ${runtimeSpecs.length} implementation plan${runtimeSpecs.length === 1 ? '' : 's'}.`
  );
  mdLines.push(
    `Evidence captured — Ordinary: ${typeCounts.ordinary || 0}, Friction: ${typeCounts.friction || 0}, Proof: ${typeCounts.proof || 0}, Rehearsal: ${typeCounts.rehearsal || 0}.`
  );
  mdLines.push('');

  // Traits
  mdLines.push(`## Key Traits`);
  if (traits.length === 0) {
    mdLines.push(`- No traits saved yet.`);
  } else {
    for (const t of traits) mdLines.push(`- ${t.text}`);
  }
  if (topTraits.length > 0) {
    mdLines.push('');
    mdLines.push(`Most-referenced traits in your evidence:`);
    for (const [name, count] of topTraits) mdLines.push(`- ${name}: ${count} item${count === 1 ? '' : 's'}`);
  }
  mdLines.push('');

  // Evidence
  mdLines.push(`## Evidence Collected`);
  const group = (title: string, arr: any[]) => {
    mdLines.push(`### ${title}`);
    if (!arr || arr.length === 0) {
      mdLines.push(`- (none yet)`);
      return;
    }
    for (const c of arr) mdLines.push(`- ${c.label}${c.trait ? ` [${c.trait}]` : ''} (${formatDate(c.created_at)})`);
    mdLines.push('');
  };
  group('Friction Points', ctxByType.friction);
  group('Proof of Growth', ctxByType.proof);
  group('Ordinary Contexts', ctxByType.ordinary);
  group('Rehearsal Moments', ctxByType.rehearsal);

  // Plans
  mdLines.push(`## Implementation Plans`);
  if (runtimeSpecs.length === 0) {
    mdLines.push(`- No plans yet. Create one from your evidence and principles.`);
  } else {
    for (const s of runtimeSpecs.sort((a: any, b: any) => (a.created_at ?? 0) - (b.created_at ?? 0))) {
      mdLines.push(`### Plan: ${s.label}`);
      mdLines.push(`- Principle: ${s.principle}`);
      if (s.friction) mdLines.push(`- Tackles: ${s.friction}`);
      if (Array.isArray(s.microActs) && s.microActs.length) {
        mdLines.push(`- Micro-acts:`);
        for (const m of s.microActs) mdLines.push(`  - ${m}`);
      }
      mdLines.push('');
    }
  }

  // Timeline
  mdLines.push(`## Journey Timeline`);
  if (events.length === 0) {
    mdLines.push(`- No timeline events yet. As you add evidence and actions, they’ll appear here.`);
  } else {
    for (const ev of events) mdLines.push(`- ${ev.text}`);
  }
  mdLines.push('');

  // Patterns & insights
  mdLines.push(`## Patterns & Insights`);
  const typeLeaders = Object.entries(typeCounts).sort((a, b) => (b[1] || 0) - (a[1] || 0));
  const mostCommonType = typeLeaders[0]?.[1] ? typeLeaders[0][0] : undefined;
  const insights: string[] = [];
  if (mostCommonType) insights.push(`You most often logged ${mostCommonType} evidence, suggesting a recurring focus there.`);
  if (topTraits.length > 0) insights.push(`Top trait${topTraits.length > 1 ? 's' : ''} in context: ${topTraits.map(([n]) => n).join(', ')}.`);
  if (totalMicroActs > 0) insights.push(`You’ve defined ${totalMicroActs} micro-acts across your plans.`);
  if (runtimeSpecs.length > 0 && releaseNotes.length > 0) insights.push(`You are taking action on your plans — keep shipping small updates.`);
  if (insights.length === 0) insights.push(`As you add more items, we’ll surface patterns here.`);
  for (const i of insights) mdLines.push(`- ${i}`);

  // PDF rendering with branding, dividers, headers/footers
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const margin = 56;
  const headerHeight = 36;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const wrapWidth = pageWidth - margin * 2;
  const lineHeight = 16;
  let y = margin + headerHeight;

  function drawHeader(pageNo: number) {
    doc.setTextColor(55, 65, 81); // slate-700
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const left = 'Timeline Jumping Guide';
    const right = today.toLocaleDateString();
    doc.text(left, margin, margin - 18);
    const rWidth = doc.getTextWidth(right);
    doc.text(right, pageWidth - margin - rWidth, margin - 18);
    doc.setDrawColor(229, 231, 235); // gray divider
    doc.line(margin, margin - 14, pageWidth - margin, margin - 14);
  }

  function drawFooter(pageNo: number, total: number) {
    doc.setTextColor(107, 114, 128); // slate-500
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const text = `Page ${pageNo} of ${total}`;
    const tWidth = doc.getTextWidth(text);
    doc.text(text, pageWidth - margin - tWidth, pageHeight - 20);
  }

  function addPage() {
    doc.addPage();
    y = margin + headerHeight;
    drawHeader(doc.getNumberOfPages());
  }

  function ensureSpace(linesNeeded = 1) {
    if (y + linesNeeded * lineHeight > pageHeight - margin - 20) addPage();
  }

  function addDivider() {
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
  }

  function addHeading(text: string, level: 1 | 2 | 3) {
    ensureSpace(2);
    if (level === 1) doc.setFontSize(20);
    if (level === 2) doc.setFontSize(15);
    if (level === 3) doc.setFontSize(13);
    doc.setFont('helvetica', level === 1 ? 'bold' : 'bold');
    doc.setTextColor(17, 24, 39); // slate-900
    const wrapped = doc.splitTextToSize(text, wrapWidth);
    for (const line of wrapped) {
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += 6;
    if (level === 2) addDivider();
  }

  function addParagraph(text: string) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55); // slate-800
    const wrapped = doc.splitTextToSize(text, wrapWidth);
    for (const line of wrapped) {
      ensureSpace();
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += 6;
  }

  function addBullet(text: string) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    const wrapped = doc.splitTextToSize(text, wrapWidth - 16);
    ensureSpace(wrapped.length);
    doc.text('•', margin, y);
    for (const line of wrapped) {
      doc.text(line, margin + 14, y);
      y += lineHeight;
      if (y > pageHeight - margin - 20) addPage();
    }
  }

  // First page header
  drawHeader(1);

  // Parse our markdown-ish lines into PDF with styling
  for (const raw of mdLines) {
    const line = raw.trimEnd();
    if (!line) {
      y += 4;
      continue;
    }
    if (line.startsWith('### ')) {
      addHeading(line.replace(/^###\s+/, ''), 3);
    } else if (line.startsWith('## ')) {
      addHeading(line.replace(/^##\s+/, ''), 2);
    } else if (line.startsWith('# ')) {
      addHeading(line.replace(/^#\s+/, ''), 1);
    } else if (line.startsWith('- ')) {
      addBullet(line.replace(/^-\s+/, ''));
    } else {
      addParagraph(line);
    }
  }

  // Add footers with page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  return doc.output('blob') as Blob;
}
