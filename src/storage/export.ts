import { db } from './db';

export type Dump = {
  userEntries: any[];
  traits: any[];
  contexts: any[];
  runtimeSpecs: any[];
  releaseNotes: any[];
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
  const dump: Dump = { userEntries, traits, contexts, runtimeSpecs, releaseNotes } as any;
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
