// In-memory fallback store when IndexedDB is unavailable.

type Entry = { id: string; scene: string; content: any; timestamp: number };
type Trait = { id: string; text: string };
type Context = { id: string; label: string; type: 'ordinary' | 'friction' | 'proof' | 'rehearsal'; trait?: string; created_at: number };
type Spec = { id: string; label: string; principle: string; microActs: string[]; friction?: string; created_at: number };
type Note = { id: string; spec_id: string; action: string; timestamp: number };
type Audio = { id: string; filename: string; blob: Blob; created_at: number };

const mem = {
  userEntries: [] as Entry[],
  traits: [] as Trait[],
  contexts: [] as Context[],
  runtimeSpecs: [] as Spec[],
  releaseNotes: [] as Note[],
  // audio removed
};

export const memStore = {
  addEntry(scene: string, content: any) {
    const id = crypto.randomUUID();
    mem.userEntries.push({ id, scene, content, timestamp: Date.now() });
    return id;
  },
  listEntries(scene?: string) {
    return scene ? mem.userEntries.filter((e) => e.scene === scene) : [...mem.userEntries];
  },
  addTrait(text: string) {
    const id = crypto.randomUUID();
    mem.traits.push({ id, text });
    return id;
  },
  listTraits() {
    return [...mem.traits];
  },
  addContext(label: string, type: 'ordinary' | 'friction' | 'proof' | 'rehearsal', trait?: string) {
    const id = crypto.randomUUID();
    mem.contexts.push({ id, label, type, trait, created_at: Date.now() });
    return id;
  },
  listContexts(type?: 'ordinary' | 'friction' | 'proof' | 'rehearsal') {
    return type ? mem.contexts.filter((c) => c.type === type) : [...mem.contexts];
  },
  updateContext(id: string, label: string) {
    const c = mem.contexts.find((x) => x.id === id);
    if (c) c.label = label;
  },
  deleteContext(id: string) {
    mem.contexts = mem.contexts.filter((c) => c.id !== id);
  },
  addRuntimeSpec(data: { label: string; principle: string; microActs: string[]; friction?: string }) {
    const id = crypto.randomUUID();
    mem.runtimeSpecs.push({ id, created_at: Date.now(), ...data });
    return id;
  },
  listRuntimeSpecs() {
    return [...mem.runtimeSpecs].sort((a, b) => b.created_at - a.created_at);
  },
  updateRuntimeSpecMicroActs(id: string, microActs: string[]) {
    const s = mem.runtimeSpecs.find((x) => x.id === id);
    if (s) s.microActs = microActs;
  },
  addReleaseNote(spec_id: string, action: string) {
    const id = crypto.randomUUID();
    mem.releaseNotes.push({ id, spec_id, action, timestamp: Date.now() });
    return id;
  },
  listReleaseNotes(spec_id: string) {
    return mem.releaseNotes.filter((n) => n.spec_id === spec_id);
  },
  deleteReleaseNote(id: string) {
    mem.releaseNotes = mem.releaseNotes.filter((n) => n.id !== id);
  },
  // audio removed
};
