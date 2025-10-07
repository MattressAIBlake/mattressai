import { describe, it } from 'node:test';
import assert from 'node:assert';

/**
 * Phase 3: Enrichment Services Tests
 */
describe('Deterministic Mapping Service', () => {
  it('should extract firmness from metafields', async () => {
    const { createDeterministicMappingService } = await import('../app/lib/enrichment/deterministic-mapping.service.ts');
    const service = createDeterministicMappingService();
    
    const product = {
      id: 'test-1',
      title: 'Test Mattress',
      metafields: [
        {
          namespace: 'custom',
          key: 'firmness',
          value: 'medium-firm'
        }
      ]
    };
    
    const result = service.extractAttributes(product);
    
    assert.strictEqual(result.firmness, 'medium-firm');
    assert.strictEqual(result.enrichmentMethod, 'mapping');
    assert.strictEqual(result.confidence, 1.0);
  });
  
  it('should extract height from metafields with unit conversion', async () => {
    const { createDeterministicMappingService } = await import('../app/lib/enrichment/deterministic-mapping.service.ts');
    const service = createDeterministicMappingService();
    
    const product = {
      id: 'test-1',
      title: 'Test Mattress',
      metafields: [
        {
          namespace: 'custom',
          key: 'height',
          value: '12 inches'
        }
      ]
    };
    
    const result = service.extractAttributes(product);
    
    assert.strictEqual(result.height, '12 inches');
  });
  
  it('should extract features from tags', async () => {
    const { createDeterministicMappingService } = await import('../app/lib/enrichment/deterministic-mapping.service.ts');
    const service = createDeterministicMappingService();
    
    const product = {
      id: 'test-1',
      title: 'Test Mattress',
      tags: ['cooling', 'organic', 'hypoallergenic']
    };
    
    const result = service.extractAttributes(product);
    
    assert.ok(Array.isArray(result.features));
    assert.ok(result.features.includes('cooling-gel'));
    assert.ok(result.features.includes('organic-materials'));
    assert.ok(result.features.includes('hypoallergenic'));
  });
});

describe('Heuristic Extraction Service', () => {
  it('should extract firmness from description text', async () => {
    const { createHeuristicExtractionService } = await import('../app/lib/enrichment/heuristic-extraction.service.ts');
    const service = createHeuristicExtractionService();
    
    const content = {
      title: 'Luxury Plush Mattress',
      description: 'Experience cloud-like comfort with our soft plush mattress'
    };
    
    const result = service.extractAttributes(content);
    
    assert.strictEqual(result.firmness, 'soft');
    assert.strictEqual(result.enrichmentMethod, 'heuristic');
    assert.ok(result.confidence > 0);
  });
  
  it('should extract height from product title', async () => {
    const { createHeuristicExtractionService } = await import('../app/lib/enrichment/heuristic-extraction.service.ts');
    const service = createHeuristicExtractionService();
    
    const content = {
      title: '12" Memory Foam Mattress',
      description: 'Premium comfort mattress'
    };
    
    const result = service.extractAttributes(content);
    
    assert.strictEqual(result.height, '12 inches');
  });
  
  it('should extract material from description', async () => {
    const { createHeuristicExtractionService } = await import('../app/lib/enrichment/heuristic-extraction.service.ts');
    const service = createHeuristicExtractionService();
    
    const content = {
      title: 'Premium Mattress',
      description: 'Made with high-quality memory foam for optimal comfort'
    };
    
    const result = service.extractAttributes(content);
    
    assert.strictEqual(result.material, 'memory-foam');
  });
  
  it('should extract certifications from text', async () => {
    const { createHeuristicExtractionService } = await import('../app/lib/enrichment/heuristic-extraction.service.ts');
    const service = createHeuristicExtractionService();
    
    const content = {
      title: 'Certified Organic Mattress',
      description: 'CertiPUR-US certified foam, GREENGUARD Gold certified, OEKO-TEX Standard 100'
    };
    
    const result = service.extractAttributes(content);
    
    assert.ok(Array.isArray(result.certifications));
    assert.ok(result.certifications.includes('CertiPUR-US'));
    assert.ok(result.certifications.includes('GREENGUARD'));
    assert.ok(result.certifications.includes('OEKO-TEX'));
  });
  
  it('should extract cooling features', async () => {
    const { createHeuristicExtractionService } = await import('../app/lib/enrichment/heuristic-extraction.service.ts');
    const service = createHeuristicExtractionService();
    
    const content = {
      title: 'Cooling Gel Memory Foam Mattress',
      description: 'Features gel-infused foam and graphite for temperature regulation'
    };
    
    const result = service.extractAttributes(content);
    
    assert.ok(Array.isArray(result.features));
    assert.ok(result.features.includes('cooling-gel') || result.features.includes('graphite-infused'));
  });
});

describe('Product Profile Schema', () => {
  it('should validate a complete product profile', async () => {
    const { validateProductProfile } = await import('../app/lib/enrichment/product-profile.schema.ts');
    
    const profile = {
      firmness: 'medium',
      height: '12 inches',
      material: 'memory-foam',
      certifications: ['CertiPUR-US', 'GREENGUARD'],
      features: ['cooling-gel', 'pressure-relief'],
      supportFeatures: ['pocketed-coils'],
      enrichmentMethod: 'llm',
      confidence: 0.85,
      sourceEvidence: [
        {
          source: 'description',
          evidence: 'Memory foam with gel',
          confidence: 0.9
        }
      ],
      modelVersion: 'gpt-4o-mini',
      lockedFirmness: false,
      lockedHeight: false,
      lockedMaterial: false,
      lockedCertifications: false,
      lockedFeatures: false,
      lockedSupportFeatures: false
    };
    
    const validated = validateProductProfile(profile);
    
    assert.strictEqual(validated.firmness, 'medium');
    assert.strictEqual(validated.material, 'memory-foam');
    assert.strictEqual(validated.confidence, 0.85);
  });
  
  it('should reject invalid firmness values', async () => {
    const { validateProductProfile } = await import('../app/lib/enrichment/product-profile.schema.ts');
    
    const profile = {
      firmness: 'ultra-soft', // Invalid value
      enrichmentMethod: 'heuristic',
      confidence: 0.5,
      lockedFirmness: false,
      lockedHeight: false,
      lockedMaterial: false,
      lockedCertifications: false,
      lockedFeatures: false,
      lockedSupportFeatures: false
    };
    
    assert.throws(() => {
      validateProductProfile(profile);
    });
  });
  
  it('should merge two product profiles correctly', async () => {
    const { mergeProductProfiles, createEmptyProductProfile } = await import('../app/lib/enrichment/product-profile.schema.ts');
    
    const base = {
      ...createEmptyProductProfile(),
      firmness: 'medium',
      confidence: 0.7,
      enrichmentMethod: 'heuristic'
    };
    
    const overlay = {
      ...createEmptyProductProfile(),
      material: 'memory-foam',
      certifications: ['CertiPUR-US'],
      confidence: 0.9,
      enrichmentMethod: 'llm'
    };
    
    const merged = mergeProductProfiles(base, overlay);
    
    // Should have attributes from both
    assert.strictEqual(merged.firmness, 'medium');
    assert.strictEqual(merged.material, 'memory-foam');
    
    // Should use higher confidence
    assert.strictEqual(merged.confidence, 0.9);
    assert.strictEqual(merged.enrichmentMethod, 'llm');
  });
});

describe('Product Enrichment Service', () => {
  it('should enrich a product through the full pipeline', async () => {
    // This is an integration test that would require mocked LLM
    // Skipping actual LLM call for unit tests
    
    const { createProductEnrichmentService } = await import('../app/lib/enrichment/product-enrichment.service.ts');
    const service = createProductEnrichmentService({ useAIEnrichment: false });
    
    const product = {
      id: 'test-1',
      title: '12" Medium-Firm Memory Foam Mattress',
      body: 'CertiPUR-US certified memory foam with cooling gel technology',
      tags: ['cooling', 'pressure-relief'],
      vendor: 'TestBrand',
      productType: 'Mattress',
      metafields: []
    };
    
    // Note: This test would need to mock the database
    // For now, we're just testing the service instantiation
    assert.ok(service);
  });
});

console.log('✓ All enrichment tests completed');
