import { createHash } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { ProductProfile, createEmptyProductProfile, mergeProductProfiles } from './product-profile.schema';
import { createDeterministicMappingService, ShopifyProduct } from './deterministic-mapping.service';
import { createHeuristicExtractionService } from './heuristic-extraction.service';
import { createLLMEnrichmentService } from './llm-enrichment.service';

const prisma = new PrismaClient();

/**
 * Options for product enrichment
 */
export interface EnrichmentOptions {
  useAIEnrichment?: boolean;
  confidenceThreshold?: number;
  tenant?: string;
  skipCache?: boolean;
}

/**
 * Main product enrichment service that coordinates all enrichment methods
 */
export class ProductEnrichmentService {
  private deterministicService: ReturnType<typeof createDeterministicMappingService>;
  private heuristicService: ReturnType<typeof createHeuristicExtractionService>;
  private llmService?: ReturnType<typeof createLLMEnrichmentService>;

  constructor(options: { useAIEnrichment?: boolean } = {}) {
    this.deterministicService = createDeterministicMappingService();
    this.heuristicService = createHeuristicExtractionService();

    if (options.useAIEnrichment) {
      try {
        this.llmService = createLLMEnrichmentService();
      } catch (error) {
        console.warn('LLM enrichment service not available:', error.message);
      }
    }
  }

  /**
   * Enrich a Shopify product with mattress attributes
   */
  async enrichProduct(
    shopifyProduct: ShopifyProduct,
    options: EnrichmentOptions = {}
  ): Promise<ProductProfile> {
    const {
      useAIEnrichment = true,
      confidenceThreshold = 0.7,
      tenant,
      skipCache = false
    } = options;

    // Create content hash for caching
    const contentHash = this.createContentHash(shopifyProduct);

    // Check cache unless skipping
    if (!skipCache) {
      const cached = await this.getCachedProfile(contentHash, tenant);
      if (cached) {
        return cached;
      }
    }

    // Step 1: Deterministic mapping (highest confidence)
    const deterministicProfile = this.deterministicService.extractAttributes(shopifyProduct);

    // Step 2: Heuristic extraction (medium confidence)
    const contentForHeuristics = {
      title: shopifyProduct.title,
      description: shopifyProduct.body,
      tags: shopifyProduct.tags,
      vendor: shopifyProduct.vendor,
      productType: shopifyProduct.productType
    };

    const heuristicProfile = this.heuristicService.extractAttributes(contentForHeuristics);

    // Step 3: LLM enrichment (if enabled and needed)
    let llmProfile: Partial<ProductProfile> = {};

    if (useAIEnrichment && this.llmService) {
      try {
        // Only use LLM if we don't have high confidence from other methods
        const currentConfidence = Math.max(
          deterministicProfile.confidence || 0,
          heuristicProfile.confidence || 0
        );

        if (currentConfidence < confidenceThreshold) {
          llmProfile = await this.llmService.enrichProduct(shopifyProduct);
        }
      } catch (error) {
        console.error('LLM enrichment failed:', error);
        // Continue without LLM results
      }
    }

    // Step 4: Merge results (deterministic > heuristic > LLM)
    let mergedProfile = createEmptyProductProfile();

    // Start with deterministic (highest priority)
    if (deterministicProfile.confidence && deterministicProfile.confidence > 0) {
      mergedProfile = mergeProductProfiles(mergedProfile, deterministicProfile);
    }

    // Add heuristic results
    if (heuristicProfile.confidence && heuristicProfile.confidence > 0) {
      mergedProfile = mergeProductProfiles(mergedProfile, heuristicProfile);
    }

    // Add LLM results (lowest priority, but may fill gaps)
    if (llmProfile.confidence && llmProfile.confidence > 0) {
      mergedProfile = mergeProductProfiles(mergedProfile, llmProfile);
    }

    // Step 5: Validate and cache the final result
    const validatedProfile = this.validateAndFinalize(mergedProfile, contentHash);

    // Cache the result
    if (!skipCache) {
      await this.cacheProfile(validatedProfile, contentHash, tenant);
    }

    return validatedProfile;
  }

  /**
   * Create content hash for caching
   */
  private createContentHash(product: ShopifyProduct): string {
    const content = JSON.stringify({
      title: product.title,
      body: product.body,
      vendor: product.vendor,
      productType: product.productType,
      tags: product.tags,
      metafields: product.metafields?.map(field => ({
        namespace: field.namespace,
        key: field.key,
        value: field.value
      })).sort((a, b) => a.namespace.localeCompare(b.namespace) || a.key.localeCompare(b.key))
    });

    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get cached profile if exists
   */
  private async getCachedProfile(contentHash: string, tenant?: string) {
    try {
      const profile = await prisma.productProfile.findUnique({
        where: { contentHash }
      });

      return profile ? this.deserializeProfile(profile) : null;
    } catch (error) {
      console.error('Error retrieving cached profile:', error);
      return null;
    }
  }

  /**
   * Cache enriched profile
   */
  private async cacheProfile(profile: ProductProfile, contentHash: string, tenant?: string) {
    try {
      await prisma.productProfile.upsert({
        where: { contentHash },
        update: {
          tenant: tenant || 'unknown',
          shopifyProductId: '', // Will be set when processing specific products
          title: profile.title || '',
          body: profile.body || '',
          vendor: profile.vendor || '',
          productType: profile.productType || '',
          tags: profile.tags ? JSON.stringify(profile.tags) : null,
          firmness: profile.firmness || null,
          height: profile.height || null,
          material: profile.material || null,
          certifications: profile.certifications ? JSON.stringify(profile.certifications) : null,
          features: profile.features ? JSON.stringify(profile.features) : null,
          supportFeatures: profile.supportFeatures ? JSON.stringify(profile.supportFeatures) : null,
          enrichedAt: new Date(),
          enrichmentMethod: profile.enrichmentMethod,
          confidence: profile.confidence,
          sourceEvidence: profile.sourceEvidence ? JSON.stringify(profile.sourceEvidence) : null,
          modelVersion: profile.modelVersion || null,
          lockedFirmness: profile.lockedFirmness,
          lockedHeight: profile.lockedHeight,
          lockedMaterial: profile.lockedMaterial,
          lockedCertifications: profile.lockedCertifications,
          lockedFeatures: profile.lockedFeatures,
          lockedSupportFeatures: profile.lockedSupportFeatures
        },
        create: {
          tenant: tenant || 'unknown',
          shopifyProductId: '',
          title: '',
          contentHash,
          enrichedAt: new Date(),
          enrichmentMethod: profile.enrichmentMethod,
          confidence: profile.confidence,
          lockedFirmness: false,
          lockedHeight: false,
          lockedMaterial: false,
          lockedCertifications: false,
          lockedFeatures: false,
          lockedSupportFeatures: false
        }
      });
    } catch (error) {
      console.error('Error caching profile:', error);
    }
  }

  /**
   * Validate and finalize the merged profile
   */
  private validateAndFinalize(profile: Partial<ProductProfile>, contentHash: string): ProductProfile {
    // Ensure we have a valid profile
    const finalProfile: ProductProfile = {
      ...createEmptyProductProfile(),
      ...profile,
      // Ensure enrichment method is set
      enrichmentMethod: profile.enrichmentMethod || 'heuristic'
    };

    // Validate against schema
    try {
      return ProductProfileSchema.parse(finalProfile);
    } catch (error) {
      console.error('Profile validation failed:', error);
      // Return a minimal valid profile if validation fails
      return {
        ...createEmptyProductProfile(),
        enrichmentMethod: 'heuristic',
        confidence: 0.0
      };
    }
  }

  /**
   * Deserialize database record back to ProductProfile
   */
  private deserializeProfile(dbRecord: any): ProductProfile {
    return {
      firmness: dbRecord.firmness,
      height: dbRecord.height,
      material: dbRecord.material,
      certifications: dbRecord.certifications ? JSON.parse(dbRecord.certifications) : undefined,
      features: dbRecord.features ? JSON.parse(dbRecord.features) : undefined,
      supportFeatures: dbRecord.supportFeatures ? JSON.parse(dbRecord.supportFeatures) : undefined,
      enrichmentMethod: dbRecord.enrichmentMethod,
      confidence: dbRecord.confidence,
      sourceEvidence: dbRecord.sourceEvidence ? JSON.parse(dbRecord.sourceEvidence) : undefined,
      modelVersion: dbRecord.modelVersion,
      lockedFirmness: dbRecord.lockedFirmness,
      lockedHeight: dbRecord.lockedHeight,
      lockedMaterial: dbRecord.lockedMaterial,
      lockedCertifications: dbRecord.lockedCertifications,
      lockedFeatures: dbRecord.lockedFeatures,
      lockedSupportFeatures: dbRecord.lockedSupportFeatures
    };
  }
}

/**
 * Factory function to create product enrichment service
 */
export function createProductEnrichmentService(options: { useAIEnrichment?: boolean } = {}): ProductEnrichmentService {
  return new ProductEnrichmentService(options);
}

/**
 * Main enrichment function exported for use in the indexer
 */
export async function enrichProductProfile(
  shopifyProduct: ShopifyProduct,
  options: EnrichmentOptions = {}
): Promise<ProductProfile> {
  const service = createProductEnrichmentService({
    useAIEnrichment: options.useAIEnrichment
  });

  return await service.enrichProduct(shopifyProduct, options);
}


