import { embeddingsTable, EmbeddingItem } from './db';

export interface StoredEmbedding {
  id: string;
  domain: 'needs' | 'traits' | 'contexts' | 'frictions';
  text: string;
  vector: number[];
  source: 'seed' | 'user';
  created_at: number;
}

/**
 * Save an embedding to persistent storage
 */
export async function saveEmbedding(embedding: Omit<StoredEmbedding, 'created_at'>): Promise<string> {
  const item: EmbeddingItem = {
    ...embedding,
    created_at: Date.now()
  };
  
  await embeddingsTable.put(item);
  return item.id;
}

/**
 * Load all embeddings from storage
 */
export async function loadAllEmbeddings(): Promise<StoredEmbedding[]> {
  return await embeddingsTable.orderBy('created_at').toArray();
}

/**
 * Load embeddings by domain
 */
export async function loadEmbeddingsByDomain(domain: StoredEmbedding['domain']): Promise<StoredEmbedding[]> {
  return await embeddingsTable.where('domain').equals(domain).toArray();
}

/**
 * Load embeddings by source (seed or user)
 */
export async function loadEmbeddingsBySource(source: StoredEmbedding['source']): Promise<StoredEmbedding[]> {
  return await embeddingsTable.where('source').equals(source).toArray();
}

/**
 * Delete an embedding by ID
 */
export async function deleteEmbedding(id: string): Promise<void> {
  await embeddingsTable.delete(id);
}

/**
 * Clear all embeddings (useful for testing or reset)
 */
export async function clearAllEmbeddings(): Promise<void> {
  await embeddingsTable.clear();
}

/**
 * Get count of embeddings by domain and source
 */
export async function getEmbeddingCount(domain?: StoredEmbedding['domain'], source?: StoredEmbedding['source']): Promise<number> {
  let query = embeddingsTable;
  
  if (domain && source) {
    return await embeddingsTable.where(['domain', 'source']).equals([domain, source]).count();
  } else if (domain) {
    return await embeddingsTable.where('domain').equals(domain).count();
  } else if (source) {
    return await embeddingsTable.where('source').equals(source).count();
  }
  
  return await embeddingsTable.count();
}