import { userEntriesTable, traitsTable, runtimeSpecsTable, contextsTable, releaseNotesTable } from './db';
import { memStore } from './fallback';

const hasIDB = typeof indexedDB !== 'undefined';
if (!hasIDB) {
  console.warn('IndexedDB not available; using in-memory storage. Data will not persist.');
}

export async function addEntry(scene: string, content: any) {
  if (!hasIDB) return memStore.addEntry(scene, content);
  const id = crypto.randomUUID();
  await userEntriesTable.put({ id, scene, content, timestamp: Date.now() });
  return id;
}

export async function listEntries(scene?: string) {
  if (!hasIDB) return memStore.listEntries(scene);
  if (!scene) return userEntriesTable.toArray();
  return userEntriesTable.where('scene').equals(scene).toArray();
}

export async function addTrait(text: string) {
  if (!hasIDB) return memStore.addTrait(text);
  const id = crypto.randomUUID();
  await traitsTable.put({ id, text });
  return id;
}

export async function listTraits() {
  if (!hasIDB) return memStore.listTraits();
  return traitsTable.toArray();
}

export async function listAudio() {
  // Audio support removed. Return empty array for compatibility.
  return [];
}

export async function addContext(label: string, type: 'ordinary' | 'friction' | 'proof' | 'rehearsal', trait?: string) {
  if (!hasIDB) return memStore.addContext(label, type, trait);
  const id = crypto.randomUUID();
  await contextsTable.put({ id, label, type, trait, created_at: Date.now() });
  return id;
}

export async function listContexts(type?: 'ordinary' | 'friction' | 'proof' | 'rehearsal') {
  if (!hasIDB) return memStore.listContexts(type);
  if (!type) return contextsTable.toArray();
  return contextsTable.where('type').equals(type).toArray();
}

export async function addRuntimeSpec(data: { label: string; principle: string; microActs: string[]; friction?: string }) {
  if (!hasIDB) return memStore.addRuntimeSpec(data);
  const id = crypto.randomUUID();
  await runtimeSpecsTable.put({ id, created_at: Date.now(), ...data });
  return id;
}

export async function listRuntimeSpecs() {
  if (!hasIDB) return memStore.listRuntimeSpecs();
  return runtimeSpecsTable.orderBy('created_at').reverse().toArray();
}

export async function addReleaseNote(spec_id: string, action: string) {
  if (!hasIDB) return memStore.addReleaseNote(spec_id, action);
  const id = crypto.randomUUID();
  await releaseNotesTable.put({ id, spec_id, action, timestamp: Date.now() });
  // Enforce max 100 notes per spec: delete oldest beyond 100
  const notes = await releaseNotesTable.where('spec_id').equals(spec_id).sortBy('timestamp');
  if (notes.length > 100) {
    const overflow = notes.length - 100;
    const toDelete = notes.slice(0, overflow).map((n) => n.id);
    await releaseNotesTable.bulkDelete(toDelete);
  }
  return id;
}

export async function listReleaseNotes(spec_id: string) {
  if (!hasIDB) return memStore.listReleaseNotes(spec_id);
  return releaseNotesTable.where('spec_id').equals(spec_id).toArray();
}

export async function deleteReleaseNote(id: string) {
  if (!hasIDB) return memStore.deleteReleaseNote(id);
  return releaseNotesTable.delete(id);
}

export async function deleteContext(id: string) {
  if (!hasIDB) return memStore.deleteContext(id);
  return contextsTable.delete(id);
}

export async function updateContext(id: string, label: string) {
  if (!hasIDB) return memStore.updateContext(id, label);
  return contextsTable.update(id, { label });
}

export async function updateRuntimeSpecMicroActs(id: string, microActs: string[]) {
  if (!hasIDB) return memStore.updateRuntimeSpecMicroActs(id, microActs);
  return runtimeSpecsTable.update(id, { microActs });
}
