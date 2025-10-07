/**
 * Port interface for vector database operations
 * Allows swapping between different vector stores (Pinecone, Weaviate, pgvector, etc.)
 */
export interface VectorStorePort {
  /**
   * Upsert vectors with associated metadata
   * @param vectors Array of vector objects to upsert
   */
  upsert(vectors: VectorRecord[]): Promise<void>;

  /**
   * Search for similar vectors
   * @param queryVector The query vector
   * @param options Search configuration
   * @returns Array of matching vectors with scores
   */
  search(queryVector: number[], options: SearchOptions): Promise<VectorSearchResult[]>;

  /**
   * Delete vectors by IDs
   * @param ids Array of vector IDs to delete
   */
  delete(ids: string[]): Promise<void>;

  /**
   * Delete all vectors for a specific tenant
   * @param tenantId The tenant identifier
   */
  deleteByTenant(tenantId: string): Promise<void>;

  /**
   * Get statistics about the vector store
   */
  getStats(): Promise<VectorStoreStats>;

  /**
   * Health check for the vector store
   */
  isHealthy(): Promise<boolean>;
}

export interface VectorRecord {
  id: string;
  vector: number[];
  metadata: Record<string, any>;
  namespace?: string; // For namespaced vector stores
}

export interface SearchOptions {
  topK?: number;
  threshold?: number;
  includeMetadata?: boolean;
  includeValues?: boolean;
  filter?: Record<string, any>; // Metadata filters
  namespace?: string;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata?: Record<string, any>;
  vector?: number[];
}

export interface VectorStoreStats {
  totalVectors: number;
  namespaces?: string[];
  indexFullness?: number;
  dimension?: number;
}


