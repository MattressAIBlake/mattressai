import { getEmbeddingProvider, getVectorStoreProvider } from '../ports/provider-registry';
import { prisma } from '~/db.server';

/**
 * Shopper intent data collected from conversation
 */
export interface ShopperIntent {
  // User preferences
  firmness?: 'soft' | 'medium-soft' | 'medium' | 'medium-firm' | 'firm';
  budget?: { min?: number; max?: number };
  sleepPosition?: 'side' | 'back' | 'stomach' | 'combination';
  bodyType?: 'petite' | 'average' | 'athletic' | 'plus-size';
  sleepIssues?: string[]; // e.g., 'back-pain', 'hot-sleeper', 'partner-disturbance'
  
  // Mattress attributes
  preferredMaterial?: 'memory-foam' | 'latex' | 'innerspring' | 'hybrid' | 'gel-foam';
  coolingPreference?: boolean;
  motionIsolation?: boolean;
  edgeSupport?: boolean;
  organic?: boolean;
  
  // Certifications
  certifications?: string[];
  
  // Free text query
  rawQuery?: string;
}

/**
 * Recommended product with explanation
 */
export interface RecommendedProduct {
  productId: string;
  title: string;
  vendor?: string;
  productType?: string;
  score: number; // Similarity score from vector search
  
  // Enriched attributes
  firmness?: string;
  height?: string;
  material?: string;
  certifications?: string[];
  features?: string[];
  supportFeatures?: string[];
  
  // Explanation
  whyItFits: string[];
  fitScore: number; // 0-100, how well it matches intent
  
  // Metadata
  price?: number;
  availableForSale?: boolean;
  imageUrl?: string;
  url?: string;
}

/**
 * Recommendation service that uses vector search + filtering
 */
export class RecommendationService {
  private tenant: string;
  
  constructor(tenant: string) {
    this.tenant = tenant;
  }
  
  /**
   * Get product recommendations based on shopper intent
   */
  async getRecommendations(
    intent: ShopperIntent,
    options: { topK?: number; includeOutOfStock?: boolean } = {}
  ): Promise<RecommendedProduct[]> {
    const { topK = 5, includeOutOfStock = false } = options;
    
    try {
      // Step 1: Build intent text for embedding
      const intentText = this.buildIntentText(intent);
      
      // Step 2: Generate embedding for intent
      const embeddingProvider = getEmbeddingProvider(this.tenant);
      const embeddings = await embeddingProvider.generateEmbeddings([intentText]);
      const queryVector = embeddings[0];
      
      // Step 3: Build metadata filters
      const filters = this.buildFilters(intent, includeOutOfStock);
      console.log(`🔍 Recommendation search - Tenant: ${this.tenant}, Filters:`, JSON.stringify(filters));
      
      // Step 4: Search vector store
      const vectorStoreProvider = getVectorStoreProvider(this.tenant);
      const searchResults = await vectorStoreProvider.search(queryVector, {
        topK: topK * 2, // Get more results to filter and boost
        includeMetadata: true,
        filter: filters
      });
      
      console.log(`📊 Vector search returned ${searchResults.length} results`);
      
      // Step 5: Apply business logic boosts and filters
      const boostedResults = this.applyBoosts(searchResults, intent);
      
      // Step 6: Convert to recommended products with explanations
      const recommendations = await Promise.all(
        boostedResults.slice(0, topK).map(result => 
          this.createRecommendation(result, intent)
        )
      );
      
      return recommendations;
      
    } catch (error) {
      console.error('Recommendation service error:', error);
      throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
  }
  
  /**
   * Build intent text for embedding
   */
  private buildIntentText(intent: ShopperIntent): string {
    const parts: string[] = [];
    
    // Add raw query if present
    if (intent.rawQuery) {
      parts.push(intent.rawQuery);
    }
    
    // Add structured preferences
    if (intent.firmness) {
      parts.push(`${intent.firmness} firmness`);
    }
    
    if (intent.sleepPosition) {
      parts.push(`${intent.sleepPosition} sleeper`);
    }
    
    if (intent.bodyType) {
      parts.push(`${intent.bodyType} build`);
    }
    
    if (intent.preferredMaterial) {
      parts.push(`${intent.preferredMaterial} mattress`);
    }
    
    if (intent.coolingPreference) {
      parts.push('cooling features temperature regulation');
    }
    
    if (intent.motionIsolation) {
      parts.push('motion isolation partner disturbance');
    }
    
    if (intent.edgeSupport) {
      parts.push('edge support perimeter reinforcement');
    }
    
    if (intent.organic) {
      parts.push('organic natural materials eco-friendly');
    }
    
    // Add sleep issues
    if (intent.sleepIssues && intent.sleepIssues.length > 0) {
      parts.push(intent.sleepIssues.join(' '));
    }
    
    // Add certifications
    if (intent.certifications && intent.certifications.length > 0) {
      parts.push(intent.certifications.join(' '));
    }
    
    return parts.join(' | ');
  }
  
  /**
   * Build metadata filters for vector search
   */
  private buildFilters(intent: ShopperIntent, includeOutOfStock: boolean): Record<string, any> {
    const filters: Record<string, any> = {
      tenant_id: this.tenant
    };
    
    // Filter by availability
    if (!includeOutOfStock) {
      filters.available_for_sale = true;
    }
    
    // Filter by budget
    if (intent.budget) {
      if (intent.budget.min !== undefined) {
        filters.price = { $gte: intent.budget.min };
      }
      if (intent.budget.max !== undefined) {
        filters.price = { ...filters.price, $lte: intent.budget.max };
      }
    }
    
    // Filter by material (if specified)
    if (intent.preferredMaterial) {
      filters.material = intent.preferredMaterial;
    }
    
    return filters;
  }
  
  /**
   * Apply business logic boosts to search results
   */
  private applyBoosts(results: any[], intent: ShopperIntent): any[] {
    return results
      .map(result => {
        let boostMultiplier = 1.0;
        const metadata = result.metadata || {};
        
        try {
          const enrichedProfile = JSON.parse(metadata.enriched_profile || '{}');
          
          // Boost for firmness match
          if (intent.firmness && enrichedProfile.firmness === intent.firmness) {
            boostMultiplier *= 1.5;
          }
          
          // Boost for cooling features
          if (intent.coolingPreference && enrichedProfile.features) {
            const features = Array.isArray(enrichedProfile.features) 
              ? enrichedProfile.features 
              : JSON.parse(enrichedProfile.features || '[]');
            
            if (features.includes('cooling-gel') || 
                features.includes('temperature-regulation') ||
                features.includes('graphite-infused') ||
                features.includes('copper-infused')) {
              boostMultiplier *= 1.3;
            }
          }
          
          // Boost for motion isolation
          if (intent.motionIsolation && enrichedProfile.features) {
            const features = Array.isArray(enrichedProfile.features)
              ? enrichedProfile.features
              : JSON.parse(enrichedProfile.features || '[]');
            
            if (features.includes('motion-isolation')) {
              boostMultiplier *= 1.3;
            }
          }
          
          // Boost for edge support
          if (intent.edgeSupport && enrichedProfile.features) {
            const features = Array.isArray(enrichedProfile.features)
              ? enrichedProfile.features
              : JSON.parse(enrichedProfile.features || '[]');
            
            if (features.includes('edge-support')) {
              boostMultiplier *= 1.2;
            }
          }
          
          // Boost for organic materials
          if (intent.organic && enrichedProfile.features) {
            const features = Array.isArray(enrichedProfile.features)
              ? enrichedProfile.features
              : JSON.parse(enrichedProfile.features || '[]');
            
            if (features.includes('organic-materials')) {
              boostMultiplier *= 1.3;
            }
          }
          
          // Boost for certifications match
          if (intent.certifications && intent.certifications.length > 0 && enrichedProfile.certifications) {
            const certs = Array.isArray(enrichedProfile.certifications)
              ? enrichedProfile.certifications
              : JSON.parse(enrichedProfile.certifications || '[]');
            
            const matchingCerts = intent.certifications.filter(cert => certs.includes(cert));
            if (matchingCerts.length > 0) {
              boostMultiplier *= (1.0 + (matchingCerts.length * 0.1));
            }
          }
          
        } catch (error) {
          console.error('Error applying boosts:', error);
        }
        
        return {
          ...result,
          boostedScore: result.score * boostMultiplier
        };
      })
      .sort((a, b) => b.boostedScore - a.boostedScore);
  }
  
  /**
   * Create a recommended product with explanation
   */
  private async createRecommendation(
    result: any,
    intent: ShopperIntent
  ): Promise<RecommendedProduct> {
    const metadata = result.metadata || {};
    
    let enrichedProfile: any = {};
    try {
      enrichedProfile = JSON.parse(metadata.enriched_profile || '{}');
    } catch (error) {
      console.error('Failed to parse enriched profile:', error);
    }
    
    // Build "why it fits" explanations
    const whyItFits = this.buildExplanations(enrichedProfile, intent);
    
    // Calculate fit score (0-100)
    const fitScore = this.calculateFitScore(enrichedProfile, intent);
    
    return {
      productId: metadata.shopify_product_id || result.id,
      title: metadata.title || 'Unknown Product',
      vendor: metadata.vendor,
      productType: metadata.product_type,
      score: result.score,
      
      // Enriched attributes
      firmness: enrichedProfile.firmness,
      height: enrichedProfile.height,
      material: enrichedProfile.material,
      certifications: this.parseJsonField(enrichedProfile.certifications),
      features: this.parseJsonField(enrichedProfile.features),
      supportFeatures: this.parseJsonField(enrichedProfile.supportFeatures),
      
      // Explanation
      whyItFits,
      fitScore,
      
      // Metadata (price of 0 means no price available)
      price: metadata.price > 0 ? metadata.price : undefined,
      availableForSale: metadata.available_for_sale,
      imageUrl: metadata.image_url,
      url: metadata.product_url
    };
  }
  
  /**
   * Build explanations for why a product fits
   */
  private buildExplanations(enrichedProfile: any, intent: ShopperIntent): string[] {
    const explanations: string[] = [];
    
    // Firmness match
    if (intent.firmness && enrichedProfile.firmness === intent.firmness) {
      explanations.push(`Matches your preferred ${intent.firmness} firmness level`);
    }
    
    // Sleep position match
    if (intent.sleepPosition && enrichedProfile.firmness) {
      const idealFirmness = this.getIdealFirmnessForPosition(intent.sleepPosition);
      if (enrichedProfile.firmness === idealFirmness) {
        explanations.push(`Ideal firmness for ${intent.sleepPosition} sleepers`);
      }
    }
    
    // Cooling features
    if (intent.coolingPreference) {
      const features = this.parseJsonField(enrichedProfile.features);
      const coolingFeatures = features.filter(f => 
        ['cooling-gel', 'temperature-regulation', 'graphite-infused', 'copper-infused', 'moisture-wicking'].includes(f)
      );
      if (coolingFeatures.length > 0) {
        explanations.push('Includes cooling technology to keep you comfortable');
      }
    }
    
    // Motion isolation
    if (intent.motionIsolation) {
      const features = this.parseJsonField(enrichedProfile.features);
      if (features.includes('motion-isolation')) {
        explanations.push('Excellent motion isolation for undisturbed sleep');
      }
    }
    
    // Edge support
    if (intent.edgeSupport) {
      const features = this.parseJsonField(enrichedProfile.features);
      if (features.includes('edge-support')) {
        explanations.push('Strong edge support for sitting and sleeping near the edge');
      }
    }
    
    // Organic materials
    if (intent.organic) {
      const features = this.parseJsonField(enrichedProfile.features);
      if (features.includes('organic-materials')) {
        explanations.push('Made with organic and natural materials');
      }
    }
    
    // Certifications
    if (intent.certifications && intent.certifications.length > 0) {
      const certs = this.parseJsonField(enrichedProfile.certifications);
      const matchingCerts = intent.certifications.filter(cert => certs.includes(cert));
      if (matchingCerts.length > 0) {
        explanations.push(`Certified: ${matchingCerts.join(', ')}`);
      }
    }
    
    // Sleep issues
    if (intent.sleepIssues && intent.sleepIssues.length > 0) {
      const features = this.parseJsonField(enrichedProfile.features);
      
      if (intent.sleepIssues.includes('back-pain') && features.includes('pressure-relief')) {
        explanations.push('Pressure relief technology helps with back pain');
      }
      
      if (intent.sleepIssues.includes('hot-sleeper') && 
          (features.includes('cooling-gel') || features.includes('temperature-regulation'))) {
        explanations.push('Cooling features help hot sleepers stay comfortable');
      }
      
      if (intent.sleepIssues.includes('partner-disturbance') && features.includes('motion-isolation')) {
        explanations.push('Motion isolation reduces partner disturbance');
      }
    }
    
    // Default explanation based on score
    if (explanations.length === 0) {
      explanations.push('Highly rated match based on your preferences');
    }
    
    return explanations;
  }
  
  /**
   * Calculate fit score (0-100)
   */
  private calculateFitScore(enrichedProfile: any, intent: ShopperIntent): number {
    let score = 60; // Base score
    let maxPoints = 40;
    let earnedPoints = 0;
    
    // Firmness match (10 points)
    if (intent.firmness && enrichedProfile.firmness === intent.firmness) {
      earnedPoints += 10;
    }
    
    // Material match (8 points)
    if (intent.preferredMaterial && enrichedProfile.material === intent.preferredMaterial) {
      earnedPoints += 8;
    }
    
    // Cooling match (7 points)
    if (intent.coolingPreference) {
      const features = this.parseJsonField(enrichedProfile.features);
      if (features.some(f => ['cooling-gel', 'temperature-regulation', 'graphite-infused', 'copper-infused'].includes(f))) {
        earnedPoints += 7;
      }
    }
    
    // Motion isolation match (5 points)
    if (intent.motionIsolation) {
      const features = this.parseJsonField(enrichedProfile.features);
      if (features.includes('motion-isolation')) {
        earnedPoints += 5;
      }
    }
    
    // Edge support match (5 points)
    if (intent.edgeSupport) {
      const features = this.parseJsonField(enrichedProfile.features);
      if (features.includes('edge-support')) {
        earnedPoints += 5;
      }
    }
    
    // Organic match (5 points)
    if (intent.organic) {
      const features = this.parseJsonField(enrichedProfile.features);
      if (features.includes('organic-materials')) {
        earnedPoints += 5;
      }
    }
    
    return Math.round(score + earnedPoints);
  }
  
  /**
   * Get ideal firmness for sleep position
   */
  private getIdealFirmnessForPosition(position: string): string {
    const mapping: Record<string, string> = {
      'side': 'medium-soft',
      'back': 'medium',
      'stomach': 'medium-firm',
      'combination': 'medium'
    };
    
    return mapping[position] || 'medium';
  }
  
  /**
   * Parse JSON field safely
   */
  private parseJsonField(field: any): any[] {
    if (Array.isArray(field)) {
      return field;
    }
    
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return [];
      }
    }
    
    return [];
  }
}

/**
 * Factory function to create recommendation service
 */
export function createRecommendationService(tenant: string): RecommendationService {
  return new RecommendationService(tenant);
}

/**
 * Main recommendation function
 */
export async function getProductRecommendations(
  tenant: string,
  intent: ShopperIntent,
  options?: { topK?: number; includeOutOfStock?: boolean }
): Promise<RecommendedProduct[]> {
  const service = createRecommendationService(tenant);
  return await service.getRecommendations(intent, options);
}
