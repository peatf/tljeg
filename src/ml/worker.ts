/* ML worker with transformers.js embeddings */
// Import transformers.js dynamically to avoid MIME type issues
let transformers;

// Seed corpus - inline to avoid import issues
const seed = {
  "needs": ["rest", "warmth", "water", "quiet", "softness", "permission", "time", "support", "light", "breath"],
  "traits": ["steady", "curious", "clear", "tender", "focused", "playful", "patient", "bold", "gentle", "grounded", "positive"],
  "contexts": ["kitchen cleanup", "morning light", "desk reset", "walk outside", "tea ritual", "soft clothes", "open window"],
  "frictions": ["scrolling", "overcommit", "clutter", "late nights", "self-critique"]
};

// Trait synonyms for enhanced matching - inline to avoid import issues
const traitSynonyms = {
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
  }
};

// Will be configured after dynamic import

type ContextBundle = {
  inspiration?: string;
  working?: string;
  recurringThought?: string;
  jealousy?: string;
  recentMoment?: string;
  feltNatural?: string;
};

type Message =
  | { type: 'ready' }
  | { type: 'suggest'; domain: 'needs' | 'traits' | 'contexts' | 'frictions'; text?: string }
  | { type: 'suggest-multi'; domain: 'needs' | 'traits' | 'contexts' | 'frictions'; context: ContextBundle; options?: { weights?: Record<string, number> } }
  | { type: 'ingest'; domain: 'needs' | 'traits' | 'contexts' | 'frictions'; text: string; source: 'user' }
  | { type: 'reframe'; text: string }
  | { type: 'load-user-embeddings'; embeddings: Array<{ id: string; domain: string; text: string; vector: number[]; source: string; created_at: number }> };

type WorkerResponse = 
  | { type: 'suggest'; items: { id: string; text: string; source: 'seed' | 'user'; method?: 'embedding' | 'fuzzy' }[] } 
  | { type: 'suggest-multi'; items: { id: string; text: string; source: 'seed' | 'user'; method?: 'embedding' | 'fuzzy' }[] }
  | { type: 'ready'; pipelineAvailable: boolean }
  | { type: 'ingest'; id: string; vector: number[] }
  | { type: 'reframe'; text: string };

interface EmbeddingItem {
  id: string;
  domain: 'needs' | 'traits' | 'contexts' | 'frictions';
  text: string;
  vector: number[];
  source: 'seed' | 'user';
  created_at: number;
}

let pipeline_: any = null;
let seedEmbeddings: EmbeddingItem[] = [];
let userEmbeddings: EmbeddingItem[] = [];

// Cosine similarity function
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Check if trait matches any synonyms in context
function checkSynonymMatch(traitText: string, contextBundle: ContextBundle): boolean {
  const traitLower = traitText.toLowerCase();
  const traitSynonymsData = (traitSynonyms as any).traits[traitLower];
  
  if (!traitSynonymsData) return false;

  const allSynonyms = [
    traitSynonymsData.canonical,
    ...traitSynonymsData.synonyms,
    ...traitSynonymsData.aliases
  ];

  const contextText = Object.values(contextBundle)
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return allSynonyms.some(synonym =>
    contextText.includes(synonym.toLowerCase())
  );
}

// Aggregate context with weights
function aggregateContext(context: ContextBundle, weights: Record<string, number>): string {
  const contextParts: string[] = [];
  
  Object.entries(context).forEach(([key, value]) => {
    if (value?.trim()) {
      const weight = weights[key] || 0.1;
      const repeats = Math.ceil(weight * 10);
      for (let i = 0; i < repeats; i++) {
        contextParts.push(value.trim());
      }
    }
  });
  
  return contextParts.join(' ');
}

// Multi-context scoring algorithm
async function scoreMultiContextEmbeddings(
  contextBundle: ContextBundle,
  embeddings: EmbeddingItem[],
  weights: Record<string, number>
): Promise<Array<{ embedding: EmbeddingItem; score: number }>> {
  if (!pipeline_) return [];

  // Generate embeddings for each non-empty context
  const contextEmbeddings: { [key: string]: number[] } = {};
  
  for (const [key, text] of Object.entries(contextBundle)) {
    if (text?.trim()) {
      try {
        const output = await pipeline_(text, { pooling: 'mean', normalize: true });
        contextEmbeddings[key] = Array.from(output.data) as number[];
      } catch (error) {
        console.warn(`Failed to embed context ${key}:`, error);
      }
    }
  }

  // Score each trait embedding against all context embeddings
  return embeddings.map(embedding => {
    let totalScore = 0;
    let contextCount = 0;

    for (const [contextKey, contextVector] of Object.entries(contextEmbeddings)) {
      const similarity = cosineSimilarity(embedding.vector, contextVector);
      const weight = weights[contextKey] || 0.1;
      totalScore += similarity * weight;
      contextCount++;
    }

    // Apply normalization and bonuses
    const normalizedScore = contextCount > 0 ? totalScore / contextCount : 0;
    const userBonus = embedding.source === 'user' ? 0.15 : 0;
    const synonymBonus = checkSynonymMatch(embedding.text, contextBundle) ? 0.1 : 0;

    return {
      embedding,
      score: normalizedScore + userBonus + synonymBonus
    };
  });
}

// Initialize pipeline and embed seed corpus
async function initializePipeline() {
  try {
    console.log('Loading transformers.js...');
    // Dynamic import to avoid MIME type issues
    transformers = await import('@xenova/transformers');
    
    // Configure transformers.js for local models
    if (transformers.env) {
      transformers.env.allowLocalModels = true;
      transformers.env.localModelPath = '/models/';
      transformers.env.useBrowserCache = false;
    }
    
    console.log('Initializing transformers.js pipeline...');
    pipeline_ = await transformers.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true
    });
    console.log('Transformers pipeline ready.');

    // Signal ready promptly so the main thread can continue.
    self.postMessage({ type: 'ready', pipelineAvailable: true } satisfies WorkerResponse);

    // Embed seed corpus in background (don't block readiness)
    (async () => {
      try {
        console.log('Embedding seed corpus (background)...');
        const domains = ['needs', 'traits', 'contexts', 'frictions'] as const;
        for (const domain of domains) {
          const items = (seed as any)[domain] as string[];
          const jobs = items.map(async (text) => {
            try {
              const output = await pipeline_(text, { pooling: 'mean', normalize: true });
              const vector = Array.from(output.data) as number[];
              seedEmbeddings.push({
                id: `seed:${domain}:${text}`,
                domain,
                text,
                vector,
                source: 'seed',
                created_at: Date.now()
              });
            } catch (err) {
              console.warn('Failed to embed seed item', text, err);
            }
          });
          await Promise.all(jobs);
        }
        console.log(`Embedded ${seedEmbeddings.length} seed items (background)`);
      } catch (bgErr) {
        console.warn('Seed embedding background failed:', bgErr);
      }
    })();
  } catch (error) {
    console.error('Failed to initialize pipeline:', error);
    // Fallback to fuzzy matching
    self.postMessage({ type: 'ready', pipelineAvailable: false } satisfies WorkerResponse);
  }
}

// Fuzzy fallback for when ML isn't available
function fuzzyFilter(items: string[], q?: string) {
  if (!q) return items.slice(0, 8);
  const s = q.toLowerCase();
  return items
    .map((it) => ({ it, score: it.toLowerCase().includes(s) ? 2 : 1 / (1 + Math.abs(it.length - s.length)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.it);
}

// VOID reframing - neutralize text
function reframeToNeutral(text: string): string {
  // Simple neutralization: remove emotional adjectives and judgments
  const emotionalWords = /\b(terrible|awful|amazing|great|horrible|wonderful|stupid|brilliant|bad|good|worst|best|hate|love|disgusting|beautiful)\b/gi;
  const judgmentWords = /\b(should|shouldn't|must|can't|never|always|impossible|perfect|failure|success)\b/gi;
  
  let neutral = text
    .replace(emotionalWords, '')
    .replace(judgmentWords, '')
    .replace(/\s+/g, ' ')
    .trim();
    
  // Ensure it starts with a neutral observation
  if (neutral.length > 0) {
    neutral = 'I notice ' + neutral.toLowerCase();
  }
  
  return neutral || 'I notice something is present.';
}

self.onmessage = async (e: MessageEvent<Message>) => {
  const msg = e.data;
  
  try {
    switch (msg.type) {
      case 'suggest': {
        if (pipeline_ && (seedEmbeddings.length > 0 || userEmbeddings.length > 0)) {
          // Use embeddings for suggestions
          let queryVector: number[] | null = null;
          
          if (msg.text) {
            const output = await pipeline_(msg.text, { pooling: 'mean', normalize: true });
            queryVector = Array.from(output.data) as number[];
          }
          
          // Combine seed and user embeddings for the domain
          const domainEmbeddings = [
            ...seedEmbeddings.filter(e => e.domain === msg.domain),
            ...userEmbeddings.filter(e => e.domain === msg.domain)
          ];
          
          let suggestions: Array<{ id: string; text: string; source: 'seed' | 'user'; score: number }>;
          
          if (queryVector) {
            // Rank by cosine similarity
            suggestions = domainEmbeddings
              .map(embedding => ({
                id: embedding.id,
                text: embedding.text,
                source: embedding.source,
                score: cosineSimilarity(queryVector!, embedding.vector) + (embedding.source === 'user' ? 0.1 : 0) // slight user boost
              }))
              .sort((a, b) => b.score - a.score)
              .slice(0, 8);
          } else {
            // Cold start - return top items (user first, then seed)
            suggestions = domainEmbeddings
              .sort((a, b) => {
                if (a.source !== b.source) return a.source === 'user' ? -1 : 1;
                return b.created_at - a.created_at;
              })
              .slice(0, 8)
              .map(e => ({ ...e, score: 1 }));
          }
          
          const items = suggestions.map(s => ({ id: s.id, text: s.text, source: s.source, method: 'embedding' as const }));
          self.postMessage({ type: 'suggest', items } satisfies WorkerResponse);
        } else {
          // Fallback to fuzzy matching
          const pool = (seed as any)[msg.domain] as string[];
          const items = fuzzyFilter(pool, msg.text).map((t) => ({ 
            id: `${msg.domain}:${t}`, 
            text: t, 
            source: 'seed' as const,
            method: 'fuzzy' as const
          }));
          self.postMessage({ type: 'suggest', items } satisfies WorkerResponse);
        }
        break;
      }
      
      case 'suggest-multi': {
        if (pipeline_ && (seedEmbeddings.length > 0 || userEmbeddings.length > 0)) {
          // Use multi-context embeddings for suggestions
          const defaultWeights = {
            inspiration: 0.4,
            working: 0.2,
            recurringThought: 0.2,
            jealousy: 0.2,
            recentMoment: 0.05,
            feltNatural: 0.05
          };
          
          const weights = msg.options?.weights || defaultWeights;
          
          // Combine seed and user embeddings for the domain
          const domainEmbeddings = [
            ...seedEmbeddings.filter(e => e.domain === msg.domain),
            ...userEmbeddings.filter(e => e.domain === msg.domain)
          ];
          
          if (domainEmbeddings.length > 0) {
            // Use multi-context scoring algorithm
            const scoredEmbeddings = await scoreMultiContextEmbeddings(
              msg.context,
              domainEmbeddings,
              weights
            );
            
            const suggestions = scoredEmbeddings
              .sort((a, b) => b.score - a.score)
              .slice(0, 8);
            
            const items = suggestions.map(s => ({ 
              id: s.embedding.id, 
              text: s.embedding.text, 
              source: s.embedding.source, 
              method: 'embedding' as const 
            }));
            
            self.postMessage({ type: 'suggest-multi', items } satisfies WorkerResponse);
          } else {
            // No embeddings available, return empty
            self.postMessage({ type: 'suggest-multi', items: [] } satisfies WorkerResponse);
          }
        } else {
          // Fallback to fuzzy matching with aggregated context
          const defaultWeights = {
            inspiration: 0.4,
            working: 0.2,
            recurringThought: 0.2,
            jealousy: 0.2,
            recentMoment: 0.05,
            feltNatural: 0.05
          };
          
          const weights = msg.options?.weights || defaultWeights;
          const aggregatedText = aggregateContext(msg.context, weights);
          
          const pool = (seed as any)[msg.domain] as string[];
          const items = fuzzyFilter(pool, aggregatedText).map((t) => ({ 
            id: `${msg.domain}:${t}`, 
            text: t, 
            source: 'seed' as const,
            method: 'fuzzy' as const
          }));
          self.postMessage({ type: 'suggest-multi', items } satisfies WorkerResponse);
        }
        break;
      }
      
      case 'ingest': {
        if (pipeline_) {
          const output = await pipeline_(msg.text, { pooling: 'mean', normalize: true });
          const vector = Array.from(output.data) as number[];
          const id = `user:${msg.domain}:${Date.now()}`;
          
          // Store in user embeddings
          userEmbeddings.push({
            id,
            domain: msg.domain,
            text: msg.text,
            vector,
            source: 'user',
            created_at: Date.now()
          });
          
          self.postMessage({ type: 'ingest', id, vector } satisfies WorkerResponse);
        }
        break;
      }
      
      case 'reframe': {
        const neutralText = reframeToNeutral(msg.text);
        self.postMessage({ type: 'reframe', text: neutralText } satisfies WorkerResponse);
        break;
      }
      
      case 'load-user-embeddings': {
        userEmbeddings = msg.embeddings.map(e => ({
          id: e.id,
          domain: e.domain as 'needs' | 'traits' | 'contexts' | 'frictions',
          text: e.text,
          vector: e.vector,
          source: e.source as 'seed' | 'user',
          created_at: e.created_at
        }));
        console.log(`Loaded ${userEmbeddings.length} user embeddings`);
        break;
      }
    }
  } catch (error) {
    console.error('Worker error:', error);
    // For suggestions, fall back to fuzzy matching
    if (msg.type === 'suggest') {
      const pool = (seed as any)[msg.domain] as string[];
      const items = fuzzyFilter(pool, msg.text).map((t) => ({ 
        id: `${msg.domain}:${t}`, 
        text: t, 
        source: 'seed' as const,
        method: 'fuzzy' as const
      }));
      self.postMessage({ type: 'suggest', items } satisfies WorkerResponse);
    }
  }
};

// Initialize the pipeline
initializePipeline();

