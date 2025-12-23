import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the worker functionality for testing
const mockWorker = {
  postMessage: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  terminate: vi.fn()
};

// Mock worker creation
vi.stubGlobal('Worker', vi.fn(() => mockWorker));

// Mock transformers.js 
vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn(() => Promise.resolve(vi.fn((text) => ({ data: new Float32Array(384) })))),
  env: {
    allowLocalModels: false,
    backends: { onnx: { wasm: { wasmPaths: '' } } },
    localModelPath: '',
    useBrowserCache: false
  }
}));

// Import after mocking
import { getSuggestions, ingestUserText, reframeText } from '../ml';

describe('ML Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSuggestions', () => {
    it('should return suggestions for traits domain', async () => {
      const promise = getSuggestions('traits', 'peaceful');
      // Signal ready, then on next tick deliver result
      setTimeout(() => {
        // @ts-expect-error
        mockWorker.onmessage?.({ data: { type: 'ready' } });
        setTimeout(() => {
          const listener = (mockWorker.addEventListener as any).mock.calls.find((call: any[]) => call[0] === 'message')?.[1];
          listener?.({ data: { type: 'suggest', items: [{ id: 'trait:calm', text: 'calm', source: 'seed' }] } });
        }, 0);
      }, 0);

      await promise;
      expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'suggest', domain: 'traits', text: 'peaceful' });
      
      // Note: In a real test environment, we'd need to properly handle async worker communication
      // For now, we're just testing that the correct message is posted
    });

    it('should handle empty text input', async () => {
      const promise = getSuggestions('needs');
      setTimeout(() => {
        // @ts-expect-error
        mockWorker.onmessage?.({ data: { type: 'ready' } });
        setTimeout(() => {
          const listener = (mockWorker.addEventListener as any).mock.calls.find((call: any[]) => call[0] === 'message')?.[1];
          listener?.({ data: { type: 'suggest', items: [] } });
        }, 0);
      }, 0);
      await promise;
      expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'suggest', domain: 'needs', text: undefined });
    });
  });

  describe('ingestUserText', () => {
    it('should send ingest message to worker', async () => {
      const promise = ingestUserText('traits', 'confident');
      setTimeout(() => {
        // @ts-expect-error
        mockWorker.onmessage?.({ data: { type: 'ready' } });
        setTimeout(() => {
          const listener = (mockWorker.addEventListener as any).mock.calls.find((call: any[]) => call[0] === 'message')?.[1];
          listener?.({ data: { type: 'ingest', id: 'id1', vector: new Float32Array(1) } });
        }, 0);
      }, 0);
      await promise;
      expect(mockWorker.postMessage).toHaveBeenCalledWith({ 
        type: 'ingest', 
        domain: 'traits', 
        text: 'confident', 
        source: 'user' 
      });
    });
  });

  describe('reframeText', () => {
    it('should send reframe message to worker', async () => {
      const promise = reframeText('I am terrible at this');
      setTimeout(() => {
        // @ts-expect-error
        mockWorker.onmessage?.({ data: { type: 'ready' } });
        setTimeout(() => {
          const listener = (mockWorker.addEventListener as any).mock.calls.find((call: any[]) => call[0] === 'message')?.[1];
          listener?.({ data: { type: 'reframe', text: 'I notice something is present.' } });
        }, 0);
      }, 0);
      await promise;
      expect(mockWorker.postMessage).toHaveBeenCalledWith({ 
        type: 'reframe', 
        text: 'I am terrible at this' 
      });
    });
  });
});

describe('VOID Reframing Logic', () => {
  // Test the neutralization logic directly
  function reframeToNeutral(text: string): string {
    const emotionalWords = /\b(terrible|awful|amazing|great|horrible|wonderful|stupid|brilliant|bad|good|worst|best|hate|love|disgusting|beautiful)\b/gi;
    const judgmentWords = /\b(should|shouldn't|must|can't|never|always|impossible|perfect|failure|success)\b/gi;
    
    let neutral = text
      .replace(emotionalWords, '')
      .replace(judgmentWords, '')
      .replace(/\s+/g, ' ')
      .trim();
      
    if (neutral.length > 0) {
      neutral = 'I notice ' + neutral.toLowerCase();
    }
    
    return neutral || 'I notice something is present.';
  }

  it('should neutralize emotional language', () => {
    expect(reframeToNeutral('This is terrible and I hate it')).toBe('I notice this is and i it');
  });

  it('should neutralize judgment language', () => {
    expect(reframeToNeutral('I should never fail like this')).toBe('I notice i fail like this');
  });

  it('should handle empty input', () => {
    expect(reframeToNeutral('')).toBe('I notice something is present.');
  });

  it('should clean up multiple spaces', () => {
    expect(reframeToNeutral('This    is   amazing')).toBe('I notice this is');
  });
});
