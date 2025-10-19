import { createHash } from 'crypto';
import { ProductProfile, ProductProfileSchema, createEmptyProductProfile, mergeProductProfiles } from './product-profile.schema';
import { createDeterministicMappingService, ShopifyProduct } from './deterministic-mapping.service';
import { createHeuristicExtractionService } from './heuristic-extraction.service';
import { createLLMEnrichmentService } from './llm-enrichment.service';
import { createWebSearchEnrichmentService } from './web-search-enrichment.service';
import { prisma } from '~/db.server';

/**
 * Options for product enrichment
 */
export interface EnrichmentOptions {
  useAIEnrichment?: boolean;
  useWebSearch?: boolean;
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
  private webSearchService?: ReturnType<typeof createWebSearchEnrichmentService>;

  constructor(options: { useAIEnrichment?: boolean; useWebSearch?: boolean } = {}) {
    this.deterministicService = createDeterministicMappingService();
    this.heuristicService = createHeuristicExtractionService();

    if (options.useAIEnrichment) {
      try {
        this.llmService = createLLMEnrichmentService();
      } catch (error) {
        console.warn('LLM enrichment service not available:', error.message);
      }
    }

    if (options.useWebSearch) {
      try {
        this.webSearchService = createWebSearchEnrichmentService();
      } catch (error) {
        console.warn('Web search enrichment service not available:', error.message);
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
      useWebSearch = false,
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

    // Calculate current confidence from deterministic and heuristic methods
    const currentConfidence = Math.max(
      deterministicProfile.confidence || 0,
      heuristicProfile.confidence || 0
    );

    // Step 2.5: Web search enrichment (if enabled and data is weak)
    let webSearchProfile: Partial<ProductProfile> = {};

    if (useWebSearch && this.webSearchService) {
      const isWeakData = this.isProductDataWeak(shopifyProduct, currentConfidence);
      
      if (isWeakData) {
        console.log(`[Enrichment] Product has weak data, triggering web search: "${shopifyProduct.title}"`);
        try {
          webSearchProfile = await this.webSearchService.enrichProduct({
            title: shopifyProduct.title,
            vendor: shopifyProduct.vendor,
            description: shopifyProduct.description,
            productType: shopifyProduct.productType
          });
          console.log(`[Enrichment] Web search completed with confidence: ${webSearchProfile.confidence}`);
        } catch (error) {
          console.warn('[Enrichment] Web search enrichment failed:', error);
          // Continue without web search results
        }
      } else {
        console.log(`[Enrichment] Product has sufficient data, skipping web search`);
      }
    }

    // Step 3: LLM enrichment (if enabled and still needed)
    let llmProfile: Partial<ProductProfile> = {};

    if (useAIEnrichment && this.llmService) {
      try {
        // Recalculate confidence including web search results
        const confidenceWithWebSearch = Math.max(
          currentConfidence,
          webSearchProfile.confidence || 0
        );

        // Lowered threshold from 0.7 to 0.5 to trigger AI more often
        if (confidenceWithWebSearch < 0.5) {
          llmProfile = await this.llmService.enrichProduct(shopifyProduct);
        }
      } catch (error) {
        console.error('LLM enrichment failed:', error);
        // Continue without LLM results
      }
    }

    // Step 4: Merge results (deterministic > webSearch > heuristic > LLM)
    let mergedProfile = createEmptyProductProfile();

    // Start with deterministic (highest priority)
    if (deterministicProfile.confidence && deterministicProfile.confidence > 0) {
      mergedProfile = mergeProductProfiles(mergedProfile, deterministicProfile);
    }

    // Add web search results (second priority)
    if (webSearchProfile.confidence && webSearchProfile.confidence > 0) {
      mergedProfile = mergeProductProfiles(mergedProfile, webSearchProfile);
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
   * DISABLED: This was creating "Untitled" products with empty shopifyProductId and title.
   * The indexer has its own proper caching based on contentHash that includes full product data.
   */
  private async cacheProfile(profile: ProductProfile, contentHash: string, tenant?: string) {
    // Cache disabled - indexer handles caching properly with full product data
    // This method was creating invalid ProductProfile records with:
    // - shopifyProductId: '' (empty)
    // - title: '' (empty)
    // which appeared as "Untitled" products in the UI
    return;
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

  /**
   * Determine if product data is weak and needs web search enrichment
   */
  private isProductDataWeak(product: ShopifyProduct, confidence: number): boolean {
    // 1. Check if description is empty or very short
    const hasWeakDescription = !product.description || product.description.trim().length < 100;
    
    // 2. Check if confidence from existing methods is low
    const hasLowConfidence = confidence < 0.5;
    
    // 3. Check if product has no metafields
    const hasNoMetafields = !product.metafields || product.metafields.length === 0;
    
    // 4. Check if title is vague (doesn't contain material/firmness keywords)
    const titleLower = product.title.toLowerCase();
    const hasVagueTitle = !(
      titleLower.includes('memory') || titleLower.includes('foam') ||
      titleLower.includes('latex') || titleLower.includes('spring') ||
      titleLower.includes('hybrid') || titleLower.includes('firm') ||
      titleLower.includes('soft') || titleLower.includes('plush') ||
      titleLower.includes('coil')
    );
    
    // Trigger web search if:
    // - (Weak description AND low confidence) OR
    // - (No metafields AND vague title)
    const shouldTriggerWebSearch = (hasWeakDescription && hasLowConfidence) || (hasNoMetafields && hasVagueTitle);
    
    if (shouldTriggerWebSearch) {
      console.log(`[Weak Data Detection] Product "${product.title}":`);
      console.log(`  - Weak description: ${hasWeakDescription} (length: ${product.description?.length || 0})`);
      console.log(`  - Low confidence: ${hasLowConfidence} (${confidence})`);
      console.log(`  - No metafields: ${hasNoMetafields}`);
      console.log(`  - Vague title: ${hasVagueTitle}`);
    }
    
    return shouldTriggerWebSearch;
  }
}

/**
 * Factory function to create product enrichment service
 */
export function createProductEnrichmentService(options: { useAIEnrichment?: boolean; useWebSearch?: boolean } = {}): ProductEnrichmentService {
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
    useAIEnrichment: options.useAIEnrichment,
    useWebSearch: options.useWebSearch
  });

  return await service.enrichProduct(shopifyProduct, options);
}


