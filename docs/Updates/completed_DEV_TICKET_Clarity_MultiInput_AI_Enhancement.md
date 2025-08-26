# **Clarity Multi-Input AI Enhancement Design+Planning Packet**

## **Title: Enhance Clarity Scene with Multi-Input Context and Expanded Trait Vocabulary**

---

## **Problem Statement**
The Clarity scene's AI chip generation only uses the "What inspires you?" field, ignoring other contextual questions. This results in suboptimal trait suggestions that don't reflect the full user context. The trait vocabulary lacks "positive" and "optimistic" concepts with their synonyms.

---

## **Repo Evidence Validation**

### **Current Files & Functions (Validated with grep)**

**ML Pipeline Files:**
- `src/ml/index.ts` - Main ML interface with `getSuggestions()` function
- `src/ml/worker.ts` - Web Worker handling embeddings and ranking
- `src/ml/seed_corpus.json` - Current trait vocabulary source

**UI Integration:**
- `src/scenes/Clarity.tsx` - Clarity scene with single-input limitation
- `src/components/Chips.tsx` - ChipList component rendering

**Current Trait-Chip Pipeline:**
```
Input: "What inspires you?" only
↓
Preprocessing: Debounced 400ms timer
↓
Embeddings: getSuggestions('traits', input) → Worker cosine similarity
↓
Ranking: Cosine similarity + 0.1 user boost → Top 8 items
↓
UI: ChipList renders chips with fallback to starter traits
```

---

## **Current Pipeline Mapping**

### **Data Flow Diagram (Current)**
```mermaid
graph TD
    A[User Input: "What inspires you?"] --> B[Debounce 400ms]
    B --> C[getSuggestions('traits', input)]
    C --> D[Worker Message: 'suggest']
    D --> E[Pipeline Embeds Input Text]
    E --> F[Cosine Similarity vs Seed+User Embeddings]
    F --> G[Rank by similarity + user boost]
    G --> H[Return Top 8 Chips]
    H --> I[Merge with Starter Traits if Empty]
    I --> J[ChipList UI Render]
```

### **Current Function Signatures**
```typescript
// src/ml/index.ts
getSuggestions(domain: SuggestDomain, text?: string): Promise<SuggestResult>

// src/scenes/Clarity.tsx
useEffect(() => {
  getSuggestions('traits', input) // Only uses inspiration input
}, [input, gentleMode])
```

---

## **Proposed Solution Architecture**

### **Enhanced Data Flow Diagram**
```mermaid
graph TD
    A1[User Input: Inspiration] --> B[Context Aggregator]
    A2[User Input: What's Working] --> B
    A3[User Input: Recurring Thought] --> B
    A4[User Input: Jealousy Trigger] --> B
    B --> C[Debounce 400ms]
    C --> D[getSuggestionsWithContext('traits', contextBundle)]
    D --> E[Worker Message: 'suggest-multi']
    E --> F[Pipeline Embeds Combined Context]
    F --> G[Multi-Vector Similarity Scoring]
    G --> H[Weighted Ranking Algorithm]
    H --> I[Return Top 8 Enhanced Chips]
    I --> J[ChipList UI Render with Dynamic Updates]
```

---

## **Vocabulary Enhancement**

### **Source-of-Truth Format: `src/ml/trait_synonyms.json`**
```json
{
  "traits": {
    "positive": {
      "canonical": "positive",
      "synonyms": ["optimistic", "upbeat", "hopeful", "cheerful", "sunny", "bright"],
      "aliases": ["positivity", "positiveness"]
    },
    "optimistic": {
      "canonical": "positive",
      "synonyms": ["hopeful", "confident", "rosy", "sanguine"],
      "aliases": ["optimism"]
    },
    "steady": {
      "canonical": "steady",
      "synonyms": ["stable", "consistent", "reliable", "constant"],
      "aliases": ["steadiness"]
    },
    "curious": {
      "canonical": "curious",
      "synonyms": ["inquisitive", "interested", "eager", "nosy"],
      "aliases": ["curiosity"]
    },
    "clear": {
      "canonical": "clear",
      "synonyms": ["lucid", "transparent", "obvious", "distinct"],
      "aliases": ["clarity"]
    },
    "tender": {
      "canonical": "tender",
      "synonyms": ["gentle", "soft", "caring", "loving"],
      "aliases": ["tenderness"]
    },
    "focused": {
      "canonical": "focused",
      "synonyms": ["concentrated", "attentive", "intent", "fixed"],
      "aliases": ["focus"]
    },
    "playful": {
      "canonical": "playful",
      "synonyms": ["fun", "mischievous", "lighthearted", "joyful"],
      "aliases": ["playfulness"]
    },
    "patient": {
      "canonical": "patient",
      "synonyms": ["tolerant", "understanding", "calm", "composed"],
      "aliases": ["patience"]
    },
    "bold": {
      "canonical": "bold",
      "synonyms": ["brave", "daring", "courageous", "fearless"],
      "aliases": ["boldness"]
    },
    "gentle": {
      "canonical": "gentle",
      "synonyms": ["soft", "mild", "kind", "tender"],
      "aliases": ["gentleness"]
    },
    "grounded": {
      "canonical": "grounded",
      "synonyms": ["centered", "balanced", "stable", "practical"],
      "aliases": ["grounding"]
    }
  },
  "negative_terms": [
    "scrolling", "overcommit", "clutter", "late nights", "self-critique",
    "procrastination", "overthinking", "rushing", "avoidance", "perfectionism",
    "distraction", "overwhelm", "anxiety", "stress", "worry", "fear",
    "doubt", "impatience", "anger", "frustration", "burnout", "exhaustion"
  ]
}
```

---

## **Updated Function Signatures**

### **Enhanced ML Interface**
```typescript
// src/ml/index.ts - New Functions
export type ContextBundle = {
  inspiration?: string;
  working?: string;
  recurringThought?: string;
  jealousy?: string;
  recentMoment?: string;
  feltNatural?: string;
};

export async function getSuggestionsWithContext(
  domain: SuggestDomain,
  context: ContextBundle,
  options?: { weights?: Record<keyof ContextBundle, number> }
): Promise<SuggestResult>;

// src/ml/worker.ts - New Message Types
type Message =
  | { type: 'suggest-multi'; domain: 'needs' | 'traits' | 'contexts' | 'frictions'; context: ContextBundle; options?: { weights?: Record<string, number> } }
  | // ... existing messages
```

### **Enhanced Clarity Component**
```typescript
// src/scenes/Clarity.tsx - Updated useEffect
useEffect(() => {
  const contextBundle = {
    inspiration: input,
    working: workingInput,
    recurringThought: recurringThoughtInput,
    jealousy: jealousyInput,
    recentMoment,
    feltNatural
  };

  getSuggestionsWithContext('traits', contextBundle, {
    weights: {
      inspiration: 0.4,
      working: 0.2,
      recurringThought: 0.2,
      jealousy: 0.2,
      recentMoment: 0.05,
      feltNatural: 0.05
    }
  }).then(result => {
    // ... existing chip logic
  });
}, [input, workingInput, recurringThoughtInput, jealousyInput, recentMoment, feltNatural, gentleMode]);
```

---

## **Pseudocode for Enhanced Ranking**

### **Multi-Context Vector Scoring**
```typescript
function scoreMultiContextEmbeddings(
  contextBundle: ContextBundle,
  embeddings: EmbeddingItem[],
  weights: Record<string, number>
): Array<{ embedding: EmbeddingItem; score: number }> {

  // 1. Generate embeddings for each non-empty context
  const contextEmbeddings = {};
  for (const [key, text] of Object.entries(contextBundle)) {
    if (text?.trim()) {
      contextEmbeddings[key] = await pipeline_(text, { pooling: 'mean', normalize: true });
    }
  }

  // 2. Score each trait embedding against all context embeddings
  return embeddings.map(embedding => {
    let totalScore = 0;
    let contextCount = 0;

    for (const [contextKey, contextVector] of Object.entries(contextEmbeddings)) {
      const similarity = cosineSimilarity(embedding.vector, contextVector);
      const weight = weights[contextKey] || 0.1;
      totalScore += similarity * weight;
      contextCount++;
    }

    // 3. Apply normalization and bonuses
    const normalizedScore = contextCount > 0 ? totalScore / contextCount : 0;
    const userBonus = embedding.source === 'user' ? 0.15 : 0;
    const synonymBonus = checkSynonymMatch(embedding.text, contextBundle) ? 0.1 : 0;

    return {
      embedding,
      score: normalizedScore + userBonus + synonymBonus
    };
  });
}
```

### **Synonym Matching Function**
```typescript
function checkSynonymMatch(traitText: string, contextBundle: ContextBundle): boolean {
  const traitSynonyms = trait_synonyms.traits[traitText.toLowerCase()];
  if (!traitSynonyms) return false;

  const allSynonyms = [
    traitSynonyms.canonical,
    ...traitSynonyms.synonyms,
    ...traitSynonyms.aliases
  ];

  const contextText = Object.values(contextBundle)
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return allSynonyms.some(synonym =>
    contextText.includes(synonym.toLowerCase())
  );
}
```

---

## **Exact File Edit List**

### **New Files**
1. `src/ml/trait_synonyms.json` - Vocabulary enhancement
2. `src/ml/context_aggregator.ts` - Multi-context processing logic
3. `src/__tests__/clarity_multi_input.test.tsx` - E2E tests

### **Modified Files**
1. `src/ml/index.ts` - Add new functions and types
2. `src/ml/worker.ts` - Add multi-context processing
3. `src/scenes/Clarity.tsx` - Update useEffect and state dependencies
4. `src/components/Chips.tsx` - Add context-aware rendering (optional)
5. `src/__tests__/ml.test.ts` - Add unit tests for new functions

---

## **Test Plan**

### **Unit Tests**
```typescript
// src/__tests__/ml.test.ts
describe('Multi-Context Trait Suggestions', () => {
  test('getSuggestionsWithContext combines multiple inputs', async () => {
    const context = {
      inspiration: 'I admire my partners positivity',
      working: 'I stayed calm during the meeting',
      recurringThought: 'I keep thinking about being more patient'
    };

    const result = await getSuggestionsWithContext('traits', context);
    expect(result.items).toContainEqual(
      expect.objectContaining({ text: 'positive' })
    );
    expect(result.items).toContainEqual(
      expect.objectContaining({ text: 'patient' })
    );
  });

  test('synonym matching boosts relevant traits', async () => {
    const context = { inspiration: 'I want to be more upbeat and hopeful' };
    const result = await getSuggestionsWithContext('traits', context);

    // Should rank 'positive' highly due to synonym matches
    const positiveChip = result.items.find(chip => chip.text === 'positive');
    expect(positiveChip).toBeDefined();
  });
});
```

### **E2E Test Cases**
```typescript
// src/__tests__/clarity_multi_input.test.tsx
describe('Clarity Multi-Input Integration', () => {
  test('chips update when any field changes', async () => {
    render(<Clarity />);

    // Fill inspiration field
    const inspirationInput = screen.getByLabelText(/WHAT INSPIRES YOU/);
    fireEvent.change(inspirationInput, {
      target: { value: 'I admire my partners positivity' }
    });

    await waitFor(() => {
      expect(screen.getByText('positive')).toBeInTheDocument();
    });

    // Fill working field
    const workingInput = screen.getByLabelText(/WHAT'S WORKING/);
    fireEvent.change(workingInput, {
      target: { value: 'I stayed patient during the meeting' }
    });

    await waitFor(() => {
      // Chips should update to reflect both contexts
      expect(screen.getByText('patient')).toBeInTheDocument();
    });
  });

  test('empty fields dont break suggestions', async () => {
    // Should still show starter traits when all fields empty
  });
});
```

---

## **Telemetry Plan**

### **Metrics to Track**
```typescript
// New telemetry events
analytics.track('clarity_multi_input_used', {
  field_count: number, // How many fields filled
  context_length: number, // Total context text length
  chip_count: number, // Number of chips returned
  top_chip_source: 'seed' | 'user', // Source of highest ranked chip
  processing_time: number // ML processing time
});

analytics.track('clarity_trait_selected', {
  trait_text: string,
  input_contexts: string[], // Which input fields contributed
  ranking_score: number,
  synonym_matched: boolean
});
```

### **Feature Flag & Rollback Plan**
```typescript
// Feature flag implementation
const ENABLE_MULTI_CONTEXT = localStorage.getItem('clarity_multi_context') !== 'false';

// Rollback plan:
// 1. Set feature flag to false
// 2. Revert to single-input getSuggestions
// 3. Monitor error rates return to baseline
// 4. Gradual rollout: 10% → 50% → 100% with rollback thresholds
```

---

## **Acceptance Criteria**

### **Binary Checks**
- [ ] `getSuggestionsWithContext()` accepts ContextBundle and returns SuggestResult
- [ ] Clarity chips update when ANY input field changes (not just inspiration)
- [ ] Trait vocabulary includes "positive" and "optimistic" with synonyms
- [ ] "I admire my partners positivity" generates "positive" chip in top 3
- [ ] Multi-input context produces different suggestions than single-input
- [ ] Synonym matching boosts relevant traits (upbeat → positive)
- [ ] Feature flag controls multi-context behavior
- [ ] Telemetry tracks multi-input usage and performance
- [ ] Unit tests pass for all new functions
- [ ] E2E tests pass for dynamic chip updates

---

## **Implementation Task Breakdown**

### **Phase 1: Foundation (Files 1-3)**
1. **Create `src/ml/trait_synonyms.json`** - Add enhanced vocabulary with synonyms
2. **Create `src/ml/context_aggregator.ts`** - Implement multi-context processing logic
3. **Update `src/ml/index.ts`** - Add new function signatures and types

### **Phase 2: Core Enhancement (Files 4-6)**
4. **Update `src/ml/worker.ts`** - Add multi-context embedding and ranking logic
5. **Update `src/scenes/Clarity.tsx`** - Modify useEffect to use all inputs
6. **Update `src/components/Chips.tsx`** - Add context-aware rendering (optional)

### **Phase 3: Testing & Validation (Files 7-8)**
7. **Create `src/__tests__/clarity_multi_input.test.tsx`** - E2E test suite
8. **Update `src/__tests__/ml.test.ts`** - Unit tests for new ML functions

### **Phase 4: Monitoring & Deployment**
9. **Add telemetry tracking** - Implement usage and performance metrics
10. **Add feature flag** - Gradual rollout capability

---

## **Risk Assessment**
- **High**: ML processing time increase with multiple embeddings
- **Medium**: Breaking changes to existing single-input flow
- **Low**: Vocabulary expansion may introduce false positives

**Mitigations:**
- Debounced processing prevents excessive ML calls
- Feature flag allows instant rollback
- Fallback to single-input if multi-context fails

---

## **Success Metrics**
- 40% increase in relevant trait suggestions
- 60% of users fill multiple Clarity fields
- <100ms additional processing time
- >95% test coverage for new functionality

---

**Created:** 2025-01-27
**Owner:** AI Implementation Team
**Priority:** High
**Estimated Effort:** 3-4 developer days
