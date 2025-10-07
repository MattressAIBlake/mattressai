import { Pinecone } from '@pinecone-database/pinecone';
import {
  VectorStorePort,
  VectorRecord,
  SearchOptions,
  VectorSearchResult,
  VectorStoreStats
} from '../vector-store.port';

/**
 * Pinecone vector store driver implementation
 */
export class PineconeVectorStoreDriver implements VectorStorePort {
  private client: Pinecone;
  private indexName: string;
  private namespace?: string;

  constructor(apiKey: string, options: { indexName: string; namespace?: string } = { indexName: 'products' }) {
    this.client = new Pinecone({ apiKey });
    this.indexName = options.indexName;
    this.namespace = options.namespace;
  }

  async upsert(vectors: VectorRecord[]): Promise<void> {
    try {
      const index = this.client.index(this.indexName);

      // Convert to Pinecone format
      const pineconeVectors = vectors.map(vector => ({
        id: vector.id,
        values: vector.vector,
        metadata: {
          ...vector.metadata,
          // Add timestamp for tracking
          _updated_at: new Date().toISOString()
        }
      }));

      // Upsert in batches to avoid rate limits
      const batchSize = 100;
      for (let i = 0; i < pineconeVectors.length; i += batchSize) {
        const batch = pineconeVectors.slice(i, i + batchSize);
        await index.upsert(batch);
      }
    } catch (error) {
      console.error('Pinecone upsert error:', error);
      throw new Error(`Failed to upsert vectors: ${error.message}`);
    }
  }

  async search(queryVector: number[], options: SearchOptions = {}): Promise<VectorSearchResult[]> {
    try {
      const index = this.client.index(this.indexName);

      const queryRequest = {
        vector: queryVector,
        topK: options.topK || 10,
        includeMetadata: options.includeMetadata !== false,
        includeValues: options.includeValues || false,
        filter: options.filter,
        namespace: options.namespace || this.namespace
      };

      const response = await index.query(queryRequest);

      return response.matches?.map(match => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata,
        vector: match.values
      })) || [];
    } catch (error) {
      console.error('Pinecone search error:', error);
      throw new Error(`Failed to search vectors: ${error.message}`);
    }
  }

  async delete(ids: string[]): Promise<void> {
    try {
      const index = this.client.index(this.indexName);
      await index.deleteMany(ids);
    } catch (error) {
      console.error('Pinecone delete error:', error);
      throw new Error(`Failed to delete vectors: ${error.message}`);
    }
  }

  async deleteByTenant(tenantId: string): Promise<void> {
    try {
      const index = this.client.index(this.indexName);

      // Use metadata filter to delete all vectors for a tenant
      await index.deleteMany({
        filter: { tenant_id: tenantId }
      });
    } catch (error) {
      console.error('Pinecone deleteByTenant error:', error);
      throw new Error(`Failed to delete tenant vectors: ${error.message}`);
    }
  }

  async getStats(): Promise<VectorStoreStats> {
    try {
      const index = this.client.index(this.indexName);
      const stats = await index.describeIndexStats();

      return {
        totalVectors: stats.totalVectorCount || 0,
        namespaces: Object.keys(stats.namespaces || {}),
        indexFullness: stats.indexFullness || 0,
        dimension: stats.dimension
      };
    } catch (error) {
      console.error('Pinecone stats error:', error);
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.getStats();
      return true;
    } catch (error) {
      console.error('Pinecone health check failed:', error);
      return false;
    }
  }
}

/**
 * Factory function to create Pinecone vector store driver
 */
export function createPineconeVectorStoreDriver(): PineconeVectorStoreDriver {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error('PINECONE_API_KEY environment variable is required');
  }

  return new PineconeVectorStoreDriver(apiKey, {
    indexName: process.env.PINECONE_INDEX_NAME || 'products',
    namespace: process.env.PINECONE_NAMESPACE
  });
}


