import { EmbeddingPort } from './embedding.port';
import { VectorStorePort } from './vector-store.port';
import { createOpenAIEmbeddingsDriver } from './drivers/openai-embeddings.driver';
import { createPineconeVectorStoreDriver } from './drivers/pinecone-vector-store.driver';

/**
 * Provider types for configuration
 */
export type ProviderType = 'openai' | 'cohere' | 'pinecone' | 'weaviate' | 'pgvector';

/**
 * Provider configuration for a tenant
 */
export interface ProviderConfig {
  llm?: ProviderType;
  embeddings?: ProviderType;
  vector?: ProviderType;
}

/**
 * Default provider configuration
 */
const DEFAULT_PROVIDERS: ProviderConfig = {
  llm: 'openai',
  embeddings: 'openai',
  vector: 'pinecone'
};

/**
 * Tenant-specific provider overrides
 */
const TENANT_PROVIDER_OVERRIDES: Record<string, ProviderConfig> = {};

if (process.env.TENANT_PROVIDER_OVERRIDES) {
  try {
    const overrides = JSON.parse(process.env.TENANT_PROVIDER_OVERRIDES);
    Object.assign(TENANT_PROVIDER_OVERRIDES, overrides);
  } catch (error) {
    console.error('Failed to parse TENANT_PROVIDER_OVERRIDES:', error);
  }
}

/**
 * Get provider configuration for a tenant
 */
export function getProviderConfig(tenantId: string): ProviderConfig {
  const tenantConfig = TENANT_PROVIDER_OVERRIDES[tenantId] || {};
  return { ...DEFAULT_PROVIDERS, ...tenantConfig };
}

/**
 * Registry for embedding providers
 */
class EmbeddingProviderRegistry {
  private providers: Map<ProviderType, () => EmbeddingPort> = new Map();

  register(provider: ProviderType, factory: () => EmbeddingPort) {
    this.providers.set(provider, factory);
  }

  getProvider(tenantId: string): EmbeddingPort {
    const config = getProviderConfig(tenantId);
    const providerType = config.embeddings || 'openai';

    const factory = this.providers.get(providerType);
    if (!factory) {
      throw new Error(`Unsupported embedding provider: ${providerType}`);
    }

    return factory();
  }
}

/**
 * Registry for vector store providers
 */
class VectorStoreProviderRegistry {
  private providers: Map<ProviderType, () => VectorStorePort> = new Map();

  register(provider: ProviderType, factory: () => VectorStorePort) {
    this.providers.set(provider, factory);
  }

  getProvider(tenantId: string): VectorStorePort {
    const config = getProviderConfig(tenantId);
    const providerType = config.vector || 'pinecone';

    const factory = this.providers.get(providerType);
    if (!factory) {
      throw new Error(`Unsupported vector store provider: ${providerType}`);
    }

    return factory();
  }
}

/**
 * Global provider registries
 */
export const embeddingProviders = new EmbeddingProviderRegistry();
export const vectorStoreProviders = new VectorStoreProviderRegistry();

/**
 * Initialize default providers
 */
export function initializeProviders() {
  // Register embedding providers
  embeddingProviders.register('openai', () => createOpenAIEmbeddingsDriver());

  // Register vector store providers
  vectorStoreProviders.register('pinecone', () => createPineconeVectorStoreDriver());

  // TODO: Add more providers as needed
  // embeddingProviders.register('cohere', () => createCohereEmbeddingsDriver());
  // vectorStoreProviders.register('weaviate', () => createWeaviateVectorStoreDriver());
  // vectorStoreProviders.register('pgvector', () => createPgVectorStoreDriver());
}

/**
 * Get embedding provider for a tenant
 */
export function getEmbeddingProvider(tenantId: string): EmbeddingPort {
  return embeddingProviders.getProvider(tenantId);
}

/**
 * Get vector store provider for a tenant
 */
export function getVectorStoreProvider(tenantId: string): VectorStorePort {
  return vectorStoreProviders.getProvider(tenantId);
}


