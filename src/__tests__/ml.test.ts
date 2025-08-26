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
import { getSuggestions, getSuggestionsWithContext, ingestUserText, reframeText } from '../ml';
import { aggregateContext, checkSynonymMatch, getContextFields, calculateContextLength } from '../ml/context_aggregator';

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

describe('Multi-Context ML Functions', () => {
  describe('getSuggestionsWithContext', () => {
    it('should send suggest-multi message with context bundle', () => {
      const contextBundle = {
        inspiration: 'I admire my partners positivity',
        working: 'I stayed calm during the meeting',
        recurringThought: 'I keep thinking about being more patient'
      };

      getSuggestionsWithContext('traits', contextBundle);
      
      // Signal ready first
      // @ts-expect-error
      mockWorker.onmessage?.({ data: { type: 'ready' } });
      
      // Verify the message was posted (should be the latest call)
      expect(mockWorker.postMessage).toHaveBeenLastCalledWith({ 
        type: 'suggest-multi', 
        domain: 'traits', 
        context: contextBundle,
        options: { weights: expect.any(Object) }
      });
    });

    it('should use custom weights when provided', () => {
      const contextBundle = { inspiration: 'test' };
      const customWeights = { inspiration: 1.0, working: 0 };

      getSuggestionsWithContext('traits', contextBundle, { weights: customWeights });
      
      // Signal ready first
      // @ts-expect-error
      mockWorker.onmessage?.({ data: { type: 'ready' } });
      
      // Verify the message was posted with custom weights (should be the latest call)
      expect(mockWorker.postMessage).toHaveBeenLastCalledWith({ 
        type: 'suggest-multi', 
        domain: 'traits', 
        context: contextBundle,
        options: { weights: customWeights }
      });
    });
  });
});

describe('Context Aggregator Functions', () => {
  describe('aggregateContext', () => {
    it('should aggregate context with default weights', () => {
      const context = {
        inspiration: 'positive energy',
        working: 'staying calm',
        recurringThought: 'be patient'
      };

      const result = aggregateContext(context);
      
      // Should repeat inspiration 4 times (0.4 * 10 = 4)
      expect(result).toContain('positive energy');
      // Should repeat working 2 times (0.2 * 10 = 2)  
      expect(result).toContain('staying calm');
      // Should repeat recurringThought 2 times (0.2 * 10 = 2)
      expect(result).toContain('be patient');
    });

    it('should handle empty context values', () => {
      const context = {
        inspiration: 'test',
        working: '',
        recurringThought: undefined
      };

      const result = aggregateContext(context);
      expect(result).toContain('test');
      expect(result).not.toContain('working');
      expect(result).not.toContain('recurringThought');
    });

    it('should use custom weights', () => {
      const context = { inspiration: 'test' };
      const weights = { inspiration: 1.0 };

      const result = aggregateContext(context, weights);
      
      // Should repeat 10 times (1.0 * 10 = 10)
      const occurrences = (result.match(/test/g) || []).length;
      expect(occurrences).toBe(10);
    });
  });

  describe('checkSynonymMatch', () => {
    it('should match direct synonyms', () => {
      const context = { inspiration: 'I want to be more upbeat and hopeful' };
      
      const result = checkSynonymMatch('positive', context);
      expect(result).toBe(true);
    });

    it('should match canonical forms', () => {
      const context = { working: 'I was optimistic during the call' };
      
      const result = checkSynonymMatch('positive', context);
      expect(result).toBe(true);
    });

    it('should match aliases', () => {
      const context = { jealousy: 'I admire their positivity' };
      
      const result = checkSynonymMatch('positive', context);
      expect(result).toBe(true);
    });

    it('should return false for no matches', () => {
      const context = { inspiration: 'I want to be different' };
      
      const result = checkSynonymMatch('positive', context);
      expect(result).toBe(false);
    });

    it('should return false for unknown traits', () => {
      const context = { inspiration: 'amazing energy' };
      
      const result = checkSynonymMatch('unknown-trait', context);
      expect(result).toBe(false);
    });
  });

  describe('getContextFields', () => {
    it('should return only filled fields', () => {
      const context = {
        inspiration: 'test',
        working: '',
        recurringThought: 'another test',
        jealousy: undefined
      };

      const result = getContextFields(context);
      expect(result).toEqual(['inspiration', 'recurringThought']);
    });

    it('should return empty array for empty context', () => {
      const context = { inspiration: '', working: undefined };

      const result = getContextFields(context);
      expect(result).toEqual([]);
    });
  });

  describe('calculateContextLength', () => {
    it('should calculate total context length', () => {
      const context = {
        inspiration: 'hello',     // 5 chars
        working: 'world',         // 5 chars
        recurringThought: 'test'  // 4 chars
      };

      const result = calculateContextLength(context);
      expect(result).toBe(16); // 5 + 1 + 5 + 1 + 4 = 16 (includes spaces)
    });

    it('should ignore empty values', () => {
      const context = {
        inspiration: 'hello',
        working: '',
        recurringThought: undefined
      };

      const result = calculateContextLength(context);
      expect(result).toBe(5);
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
