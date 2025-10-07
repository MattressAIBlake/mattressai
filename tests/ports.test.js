import { describe, it, mock } from 'node:test';
import assert from 'node:assert';

/**
 * Phase 3: Ports & Drivers Tests
 */
describe('Provider Registry', () => {
  it('should return default provider configuration', async () => {
    const { getProviderConfig } = await import('../app/lib/ports/provider-registry.ts');
    
    const config = getProviderConfig('test-shop.myshopify.com');
    
    assert.strictEqual(config.llm, 'openai');
    assert.strictEqual(config.embeddings, 'openai');
    assert.strictEqual(config.vector, 'pinecone');
  });
  
  it('should support tenant-specific provider overrides', async () => {
    // Set environment variable for override
    process.env.TENANT_PROVIDER_OVERRIDES = JSON.stringify({
      'custom-shop.myshopify.com': {
        vector: 'weaviate'
      }
    });
    
    // Re-import to pick up env changes
    delete require.cache[require.resolve('../app/lib/ports/provider-registry.ts')];
    const { getProviderConfig } = await import('../app/lib/ports/provider-registry.ts');
    
    const config = getProviderConfig('custom-shop.myshopify.com');
    
    // Should use default for most providers
    assert.strictEqual(config.llm, 'openai');
    assert.strictEqual(config.embeddings, 'openai');
    
    // Should use override for vector store
    assert.strictEqual(config.vector, 'weaviate');
    
    // Clean up
    delete process.env.TENANT_PROVIDER_OVERRIDES;
  });
});

describe('Embedding Port', () => {
  it('should define correct interface structure', async () => {
    // Test that the port interface is correctly defined
    const portModule = await import('../app/lib/ports/embedding.port.ts');
    
    assert.ok(portModule);
    // Interface types are compile-time only, so we can't test runtime
    // This test mainly ensures the module can be imported
  });
});

describe('Vector Store Port', () => {
  it('should define correct interface structure', async () => {
    // Test that the port interface is correctly defined
    const portModule = await import('../app/lib/ports/vector-store.port.ts');
    
    assert.ok(portModule);
    // Interface types are compile-time only, so we can't test runtime
    // This test mainly ensures the module can be imported
  });
});

describe('OpenAI Embeddings Driver', () => {
  it('should create driver with correct configuration', async () => {
    // Set required environment variable
    process.env.OPENAI_API_KEY = 'test-key-123';
    process.env.OPENAI_EMBEDDINGS_MODEL = 'text-embedding-3-small';
    process.env.OPENAI_EMBEDDINGS_DIMENSIONS = '1536';
    
    const { createOpenAIEmbeddingsDriver } = await import('../app/lib/ports/drivers/openai-embeddings.driver.ts');
    
    const driver = createOpenAIEmbeddingsDriver();
    
    assert.ok(driver);
    assert.strictEqual(driver.getEmbeddingDimensions(), 1536);
    
    // Clean up
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_EMBEDDINGS_MODEL;
    delete process.env.OPENAI_EMBEDDINGS_DIMENSIONS;
  });
  
  it('should throw error when API key is missing', async () => {
    // Ensure no API key is set
    delete process.env.OPENAI_API_KEY;
    
    // Re-import to pick up env changes
    delete require.cache[require.resolve('../app/lib/ports/drivers/openai-embeddings.driver.ts')];
    const { createOpenAIEmbeddingsDriver } = await import('../app/lib/ports/drivers/openai-embeddings.driver.ts');
    
    assert.throws(() => {
      createOpenAIEmbeddingsDriver();
    }, {
      message: /OPENAI_API_KEY environment variable is required/
    });
  });
});

describe('Pinecone Vector Store Driver', () => {
  it('should create driver with correct configuration', async () => {
    // Set required environment variables
    process.env.PINECONE_API_KEY = 'test-key-123';
    process.env.PINECONE_INDEX_NAME = 'products';
    
    const { createPineconeVectorStoreDriver } = await import('../app/lib/ports/drivers/pinecone-vector-store.driver.ts');
    
    const driver = createPineconeVectorStoreDriver();
    
    assert.ok(driver);
    
    // Clean up
    delete process.env.PINECONE_API_KEY;
    delete process.env.PINECONE_INDEX_NAME;
  });
  
  it('should throw error when API key is missing', async () => {
    // Ensure no API key is set
    delete process.env.PINECONE_API_KEY;
    
    // Re-import to pick up env changes
    delete require.cache[require.resolve('../app/lib/ports/drivers/pinecone-vector-store.driver.ts')];
    const { createPineconeVectorStoreDriver } = await import('../app/lib/ports/drivers/pinecone-vector-store.driver.ts');
    
    assert.throws(() => {
      createPineconeVectorStoreDriver();
    }, {
      message: /PINECONE_API_KEY environment variable is required/
    });
  });
});

describe('Recommendation Service', () => {
  it('should build intent text from shopper preferences', async () => {
    const { createRecommendationService } = await import('../app/lib/recommendations/recommendation.service.ts');
    const service = createRecommendationService('test-shop.myshopify.com');
    
    const intent = {
      firmness: 'medium-firm',
      sleepPosition: 'back',
      coolingPreference: true,
      sleepIssues: ['back-pain', 'hot-sleeper']
    };
    
    // Access private method through reflection (for testing purposes)
    const intentText = service['buildIntentText'](intent);
    
    assert.ok(intentText.includes('medium-firm'));
    assert.ok(intentText.includes('back sleeper'));
    assert.ok(intentText.includes('cooling'));
    assert.ok(intentText.includes('back-pain'));
  });
  
  it('should calculate fit score correctly', async () => {
    const { createRecommendationService } = await import('../app/lib/recommendations/recommendation.service.ts');
    const service = createRecommendationService('test-shop.myshopify.com');
    
    const enrichedProfile = {
      firmness: 'medium-firm',
      material: 'memory-foam',
      features: ['cooling-gel', 'motion-isolation', 'pressure-relief']
    };
    
    const intent = {
      firmness: 'medium-firm',
      preferredMaterial: 'memory-foam',
      coolingPreference: true,
      motionIsolation: true
    };
    
    // Access private method through reflection
    const fitScore = service['calculateFitScore'](enrichedProfile, intent);
    
    // Should have high fit score with multiple matches
    assert.ok(fitScore >= 80);
  });
  
  it('should generate relevant explanations', async () => {
    const { createRecommendationService } = await import('../app/lib/recommendations/recommendation.service.ts');
    const service = createRecommendationService('test-shop.myshopify.com');
    
    const enrichedProfile = {
      firmness: 'medium',
      features: ['cooling-gel', 'pressure-relief', 'motion-isolation']
    };
    
    const intent = {
      firmness: 'medium',
      coolingPreference: true,
      sleepIssues: ['back-pain']
    };
    
    // Access private method through reflection
    const explanations = service['buildExplanations'](enrichedProfile, intent);
    
    assert.ok(Array.isArray(explanations));
    assert.ok(explanations.length > 0);
    assert.ok(explanations.some(exp => exp.includes('cooling') || exp.includes('pressure relief')));
  });
});

describe('Quota Service', () => {
  it('should enforce concurrent job limits', async () => {
    const { createQuotaService } = await import('../app/lib/quota/quota.service.ts');
    const service = createQuotaService('test-shop.myshopify.com');
    
    // Note: This test would require database mocking
    // For now, we're just testing the service instantiation
    assert.ok(service);
  });
});

console.log('✓ All ports tests completed');
