import { describe, it, expect } from 'vitest';
import { addEntry, listEntries } from '../storage/storage';

describe('IndexedDB storage', () => {
  it('creates and reads an entry (works with or without IDB)', async () => {
    const id = await addEntry('test', { hello: 'world' });
    const entries = await listEntries('test');
    expect(entries.find((e) => e.id === id)?.content.hello).toBe('world');
  });
});
