import { loadAllEmbeddings, saveEmbedding } from '../storage/embeddings';

export type SuggestDomain = 'needs' | 'traits' | 'contexts' | 'frictions';
export type Chip = { id: string; text: string; source: 'seed' | 'user'; method?: 'embedding' | 'fuzzy' };
export type SuggestResult = { items: Chip[]; throttled?: boolean };

let worker: Worker | null = null;
let ready = false;
let pipelineAvailable = false;
const waiters: (() => void)[] = [];
let calls: number[] = [];
let lastSuggestions: { [domain: string]: Chip[] } = {};
let recentUserEmbeddings: Array<{ id: string; domain: string; text: string; vector: number[]; source: string; created_at: number }> = [];

function rateLimitOk() {
  const now = Date.now();
  // Keep only calls in last 60s
  calls = calls.filter((t) => now - t < 60_000);
  if (calls.length >= 10) return false;
  calls.push(now);
  return true;
}

async function ensureWorker() {
  if (!worker) {
    try {
      worker = new Worker(new URL('./worker.ts?worker', import.meta.url));
      
      worker.onerror = (error) => {
        console.error('Worker error:', error);
        // Reset worker to allow retry
        worker = null;
        ready = false;
        pipelineAvailable = false;
      };
      
      worker.onmessage = async (e) => {
        if (e.data?.type === 'ready') {
          ready = true;
          pipelineAvailable = e.data.pipelineAvailable;
          console.log(`Worker ready, pipeline available: ${pipelineAvailable}`);
          
          // Load user embeddings from storage and send to worker
          try {
            const userEmbeddings = await loadAllEmbeddings();
            // Cache recent embeddings in memory for faster access
            recentUserEmbeddings = userEmbeddings.slice(-20); // Keep last 20 for quick access
            worker?.postMessage({ 
              type: 'load-user-embeddings', 
              embeddings: userEmbeddings 
            });
          } catch (error) {
            console.error('Failed to load user embeddings:', error);
          }
          
          waiters.splice(0).forEach((w) => w());
        }
      };
    } catch (error) {
      console.error('Failed to create worker:', error);
      // Set fallback state
      ready = true;
      pipelineAvailable = false;
    }
  }
}

async function waitReady() {
  if (ready) return;
  await new Promise<void>((res) => waiters.push(res));
}

export async function getSuggestions(domain: SuggestDomain, text?: string): Promise<SuggestResult> {
  try {
    await ensureWorker();
    await waitReady();
    
    if (!rateLimitOk()) {
      // Return last known suggestions with throttled flag instead of empty array
      const items = lastSuggestions[domain] || [];
      return Promise.resolve({ items, throttled: true });
    }
    
    // If no worker available (e.g., due to MIME type issues), return empty result
    if (!worker) {
      console.warn('Worker not available, returning empty suggestions');
      return Promise.resolve({ items: [] });
    }
    
    return new Promise((resolve) => {
      const onMessage = (e: MessageEvent) => {
        if (e.data?.type === 'suggest') {
          worker?.removeEventListener('message', onMessage as any);
          const items = e.data.items;
          // Cache suggestions for throttled responses
          lastSuggestions[domain] = items;
          resolve({ items });
        }
      };
      
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        worker?.removeEventListener('message', onMessage as any);
        console.warn('Worker suggestion request timed out');
        resolve({ items: [] });
      }, 10000); // 10 second timeout
      
      const onMessageWithTimeout = (e: MessageEvent) => {
        clearTimeout(timeout);
        onMessage(e);
      };
      
      worker.addEventListener('message', onMessageWithTimeout as any);
      worker.postMessage({ type: 'suggest', domain, text });
    });
  } catch (error) {
    console.error('Error in getSuggestions:', error);
    return Promise.resolve({ items: [] });
  }
}

export async function ingestUserText(domain: SuggestDomain, text: string): Promise<string | null> {
  await ensureWorker();
  await waitReady();
  if (!rateLimitOk()) return null;

  return new Promise((resolve) => {
    const onMessage = async (e: MessageEvent) => {
      if (e.data?.type === 'ingest') {
        worker?.removeEventListener('message', onMessage as any);
        try {
          // Save to persistent storage
          const id = await saveEmbedding({
            id: e.data.id,
            domain,
            text,
            vector: e.data.vector,
            source: 'user'
          });
          
          // Also add to in-memory cache for immediate availability
          const newEmbedding = {
            id: e.data.id,
            domain,
            text,
            vector: e.data.vector,
            source: 'user',
            created_at: Date.now()
          };
          recentUserEmbeddings.push(newEmbedding);
          // Keep only the most recent 20 in memory
          if (recentUserEmbeddings.length > 20) {
            recentUserEmbeddings = recentUserEmbeddings.slice(-20);
          }
          
          resolve(id);
        } catch (error) {
          console.error('Failed to save embedding:', error);
          resolve(null);
        }
      }
    };
    worker!.addEventListener('message', onMessage as any);
    worker!.postMessage({ type: 'ingest', domain, text, source: 'user' });
  });
}

export async function reframeText(text: string): Promise<string> {
  await ensureWorker();
  await waitReady();
  
  return new Promise((resolve) => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'reframe') {
        worker?.removeEventListener('message', onMessage as any);
        resolve(e.data.text);
      }
    };
    worker!.addEventListener('message', onMessage as any);
    worker!.postMessage({ type: 'reframe', text });
  });
}
