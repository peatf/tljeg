/* ML worker with transformers.js embeddings */
// Import transformers.js dynamically to avoid MIME type issues
let transformers;

// Seed corpus - inline to avoid import issues
const seed = {
  "needs": ["rest", "warmth", "water", "quiet", "softness", "permission", "time", "support", "light", "breath"],
  "traits": ["steady", "curious", "clear", "tender", "focused", "playful", "patient", "bold", "gentle", "grounded"],
  "contexts": ["kitchen cleanup", "morning light", "desk reset", "walk outside", "tea ritual", "soft clothes", "open window"],
  "frictions": ["scrolling", "overcommit", "clutter", "late nights", "self-critique"]
};

// Will be configured after dynamic import

type Message =
  | { type: 'ready' }
  | { type: 'suggest'; domain: 'needs' | 'traits' | 'contexts' | 'frictions'; text?: string }
  | { type: 'ingest'; domain: 'needs' | 'traits' | 'contexts' | 'frictions'; text: string; source: 'user' }
  | { type: 'reframe'; text: string }
  | { type: 'load-user-embeddings'; embeddings: Array<{ id: string; domain: string; text: string; vector: number[]; source: string; created_at: number }> };

type WorkerResponse = 
  | { type: 'suggest'; items: { id: string; text: string; source: 'seed' | 'user'; method?: 'embedding' | 'fuzzy' }[] } 
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

