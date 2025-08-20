import Dexie, { Table } from 'dexie';

export interface UserEntry {
  id: string;
  scene: string;
  content: any;
  timestamp: number;
}

export interface Trait {
  id: string;
  text: string;
  overlaps?: string[];
  user_id?: string;
}

export interface ContextItem {
  id: string;
  label: string;
  type: 'ordinary' | 'friction' | 'proof' | 'rehearsal';
  trait?: string;
  created_at: number;
}

export interface RuntimeSpec {
  id: string;
  label: string;
  principle: string;
  microActs: string[];
  friction?: string;
  created_at: number;
}

export interface ReleaseNote {
  id: string;
  spec_id: string;
  action: string;
  timestamp: number;
}

export interface AudioItem {
  id: string;
  filename: string;
  blob: Blob;
  created_at: number;
}

export interface EmbeddingItem {
  id: string;
  domain: 'needs' | 'traits' | 'contexts' | 'frictions';
  text: string;
  vector: number[];
  source: 'seed' | 'user';
  created_at: number;
}

class TjaDB extends Dexie {
  userEntries!: Table<UserEntry, string>;
  traits!: Table<Trait, string>;
  contexts!: Table<ContextItem, string>;
  runtimeSpecs!: Table<RuntimeSpec, string>;
  releaseNotes!: Table<ReleaseNote, string>;
  audio!: Table<AudioItem, string>;
  embeddings!: Table<EmbeddingItem, string>;

  constructor() {
    super('tja-db');
    this.version(1).stores({
      userEntries: 'id, scene, timestamp',
      traits: 'id, text',
      contexts: 'id, type, created_at',
  runtimeSpecs: 'id, created_at',
  releaseNotes: 'id, spec_id, timestamp'
    });
    
    // Version 2: Add embeddings table
    this.version(2).stores({
      userEntries: 'id, scene, timestamp',
      traits: 'id, text',
      contexts: 'id, type, created_at',
  runtimeSpecs: 'id, created_at',
  releaseNotes: 'id, spec_id, timestamp',
  embeddings: 'id, domain, source, created_at'
    });
  }
}

export const db = new TjaDB();

export const userEntriesTable = db.table<UserEntry>('userEntries');
export const traitsTable = db.table<Trait>('traits');
export const contextsTable = db.table<ContextItem>('contexts');
export const runtimeSpecsTable = db.table<RuntimeSpec>('runtimeSpecs');
export const releaseNotesTable = db.table<ReleaseNote>('releaseNotes');
export const embeddingsTable = db.table<EmbeddingItem>('embeddings');

