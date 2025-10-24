import type { ProductProfile } from './product-profile.schema';

/**
 * Metafield type that can be either GraphQL edges format or flat array
 */
type MetafieldInput = Array<{ key: string; value: string; namespace: string }> 
  | { edges: Array<{ node: { key: string; value: string; namespace: string } }> }
  | null
  | undefined;

/**
 * Normalize metafields from either GraphQL edges format or flat array format
 * Handles both Shopify GraphQL bulk operation format and direct API format
 */
export const normalizeMetafields = (metafields: MetafieldInput): Array<{ key: string; value: string; namespace: string }> => {
  if (!metafields) {
    return [];
  }

  // Check if it's GraphQL edges format
  if ('edges' in metafields && Array.isArray(metafields.edges)) {
    return metafields.edges.map(edge => edge.node);
  }

  // It's already a flat array
  if (Array.isArray(metafields)) {
    return metafields;
  }

  // Fallback to empty array for unexpected formats
  return [];
};

/**
 * Default metafield mapping configuration
 * Maps Shopify metafields to mattress attributes
 */
const DEFAULT_METAFIELD_MAPPINGS = {
  firmness: [
    'firmness',
    'comfort_level',
    'feel',
    'softness_rating'
  ],
  height: [
    'height',
    'thickness',
    'depth',
    'profile_height'
  ],
  material: [
    'material',
    'construction',
    'foam_type',
    'core_material'
  ],
  certifications: [
    'certifications',
    'certification',
    'certified_by',
    'standards'
  ]
};

/**
 * Tenant-specific metafield mappings (can be customized per shop)
 */
const TENANT_METAFIELD_MAPPINGS: Record<string, Record<string, string[]>> = {};

/**
 * Shopify product data structure
 * Note: metafields can be in either GraphQL edges format or flat array format
 */
export interface ShopifyProduct {
  id: string;
  title: string;
  description?: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  metafields?: Array<{
    key: string;
    value: string;
    namespace: string;
  }> | { edges: Array<{ node: { key: string; value: string; namespace: string } }> };
  body?: string; // Alias for description used by some services
}

/**
 * Deterministic mapping service for extracting mattress attributes from metafields
 */
export class DeterministicMappingService {
  private mappings: Record<string, string[]>;

  constructor(tenant?: string) {
    this.mappings = this.getMappingsForTenant(tenant);
  }

  /**
   * Extract mattress attributes from Shopify product using metafield mappings
   */
  extractAttributes(product: ShopifyProduct): Partial<ProductProfile> {
    const metafields = normalizeMetafields(product.metafields);
    const metafieldMap = this.createMetafieldMap(metafields);

    const profile: Partial<ProductProfile> = {
      enrichmentMethod: 'mapping',
      confidence: 1.0, // Deterministic mapping has 100% confidence
      sourceEvidence: []
    };

    // Extract firmness
    profile.firmness = this.extractFirmness(metafieldMap);

    // Extract height
    profile.height = this.extractHeight(metafieldMap);

    // Extract material
    profile.material = this.extractMaterial(metafieldMap);

    // Extract certifications
    profile.certifications = this.extractCertifications(metafieldMap);

    // Extract features from tags and description
    profile.features = this.extractFeaturesFromTags(product.tags || []);
    profile.features = profile.features.concat(this.extractFeaturesFromDescription(product.description || ''));

    return profile;
  }

  /**
   * Create a map of metafield keys to values for easy lookup
   */
  private createMetafieldMap(metafields: Array<{ key: string; value: string; namespace: string }>) {
    const map = new Map<string, string>();

    metafields.forEach(field => {
      const key = `${field.namespace}.${field.key}`.toLowerCase();
      map.set(key, field.value);
    });

    return map;
  }

  /**
   * Extract firmness from metafields
   */
  private extractFirmness(metafieldMap: Map<string, string>): ProductProfile['firmness'] {
    const firmnessKeys = this.mappings.firmness || [];

    for (const key of firmnessKeys) {
      const value = metafieldMap.get(key);
      if (value) {
        const firmness = this.normalizeFirmness(value);
        if (firmness) {
          return firmness;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract height from metafields
   */
  private extractHeight(metafieldMap: Map<string, string>): string | undefined {
    const heightKeys = this.mappings.height || [];

    for (const key of heightKeys) {
      const value = metafieldMap.get(key);
      if (value) {
        const height = this.normalizeHeight(value);
        if (height) {
          return height;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract material from metafields
   */
  private extractMaterial(metafieldMap: Map<string, string>): ProductProfile['material'] {
    const materialKeys = this.mappings.material || [];

    for (const key of materialKeys) {
      const value = metafieldMap.get(key);
      if (value) {
        const material = this.normalizeMaterial(value);
        if (material) {
          return material;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract certifications from metafields
   */
  private extractCertifications(metafieldMap: Map<string, string>): string[] {
    const certKeys = this.mappings.certifications || [];
    const certifications: string[] = [];

    for (const key of certKeys) {
      const value = metafieldMap.get(key);
      if (value) {
        const certs = this.parseCertifications(value);
        certifications.push(...certs);
      }
    }

    return [...new Set(certifications)]; // Remove duplicates
  }

  /**
   * Extract features from product tags
   */
  private extractFeaturesFromTags(tags: string[]): string[] {
    const features: string[] = [];

    for (const tag of tags) {
      const feature = this.mapTagToFeature(tag.toLowerCase());
      if (feature) {
        features.push(feature);
      }
    }

    return [...new Set(features)];
  }

  /**
   * Extract features from product description
   */
  private extractFeaturesFromDescription(description: string): string[] {
    const features: string[] = [];
    const lowerDesc = description.toLowerCase();

    // Look for cooling features
    if (/\b(gel|cooling|pcm|graphite|copper|temperature|breathable)\b/.test(lowerDesc)) {
      features.push('cooling-gel');
    }

    // Look for pressure relief
    if (/\b(pressure.relief|contour|body.conforming|memory.foam)\b/.test(lowerDesc)) {
      features.push('pressure-relief');
    }

    // Look for motion isolation
    if (/\b(motion.isolation|motion.transfer|partner.disturbance)\b/.test(lowerDesc)) {
      features.push('motion-isolation');
    }

    // Look for edge support
    if (/\b(edge.support|perimeter|edge.to.edge|sitting.edge)\b/.test(lowerDesc)) {
      features.push('edge-support');
    }

    // Look for zoned support
    if (/\b(zoned|zone|targeted.support|variable.firmness)\b/.test(lowerDesc)) {
      features.push('zoned-support');
    }

    return features;
  }

  /**
   * Normalize firmness value to enum
   */
  private normalizeFirmness(value: string): ProductProfile['firmness'] {
    const normalized = value.toLowerCase().trim();

    if (normalized.includes('soft') || normalized.includes('plush')) {
      return 'soft';
    }
    if (normalized.includes('medium soft') || normalized.includes('medium-soft')) {
      return 'medium-soft';
    }
    if (normalized.includes('medium')) {
      return 'medium';
    }
    if (normalized.includes('medium firm') || normalized.includes('medium-firm')) {
      return 'medium-firm';
    }
    if (normalized.includes('firm') || normalized.includes('extra firm')) {
      return 'firm';
    }

    return undefined;
  }

  /**
   * Normalize height value to string format
   */
  private normalizeHeight(value: string): string | undefined {
    const normalized = value.toLowerCase().trim();

    // Extract numbers and units
    const matches = normalized.match(/(\d+(?:\.\d+)?)\s*(inch|inches|in|cm|centimeter|centimeters)?/);

    if (matches) {
      const number = matches[1];
      const unit = matches[2] || 'inches';

      if (unit.startsWith('cm')) {
        // Convert cm to inches (approximate)
        const inches = Math.round(parseFloat(number) / 2.54);
        return `${inches} inches`;
      } else {
        return `${number} inches`;
      }
    }

    return undefined;
  }

  /**
   * Normalize material value to enum
   */
  private normalizeMaterial(value: string): ProductProfile['material'] {
    const normalized = value.toLowerCase().trim();

    if (normalized.includes('memory foam') || normalized.includes('memory-foam')) {
      return 'memory-foam';
    }
    if (normalized.includes('latex') || normalized.includes('natural latex')) {
      return 'latex';
    }
    if (normalized.includes('innerspring') || normalized.includes('coil') || normalized.includes('spring')) {
      return 'innerspring';
    }
    if (normalized.includes('hybrid') || (normalized.includes('foam') && normalized.includes('coil'))) {
      return 'hybrid';
    }
    if (normalized.includes('gel foam') || normalized.includes('gel-foam')) {
      return 'gel-foam';
    }

    return undefined;
  }

  /**
   * Parse certifications from string value
   */
  private parseCertifications(value: string): string[] {
    const certifications: string[] = [];
    const normalized = value.toLowerCase();

    if (normalized.includes('certipur') || normalized.includes('certi-pur')) {
      certifications.push('CertiPUR-US');
    }
    if (normalized.includes('oeko') || normalized.includes('oeko-tex')) {
      certifications.push('OEKO-TEX');
    }
    if (normalized.includes('greenguard')) {
      certifications.push('GREENGUARD');
    }
    if (normalized.includes('gots') || normalized.includes('global organic')) {
      certifications.push('GOTS');
    }
    if (normalized.includes('gols') || normalized.includes('global organic latex')) {
      certifications.push('GOLS');
    }

    return certifications;
  }

  /**
   * Map tag to feature enum value
   */
  private mapTagToFeature(tag: string): string | undefined {
    const tagMap: Record<string, string> = {
      'cooling': 'cooling-gel',
      'gel': 'cooling-gel',
      'pressure relief': 'pressure-relief',
      'motion isolation': 'motion-isolation',
      'edge support': 'edge-support',
      'zoned': 'zoned-support',
      'organic': 'organic-materials',
      'hypoallergenic': 'hypoallergenic',
      'antimicrobial': 'antimicrobial',
      'copper': 'copper-infused',
      'graphite': 'graphite-infused',
      'bamboo': 'bamboo-cover',
      'temperature': 'temperature-regulation',
      'moisture': 'moisture-wicking',
      'lumbar': 'lumbar-support',
      'pillow top': 'pillow-top',
      'euro top': 'euro-top'
    };

    return tagMap[tag] || undefined;
  }

  /**
   * Get metafield mappings for a tenant
   */
  private getMappingsForTenant(tenant?: string): Record<string, string[]> {
    if (tenant && TENANT_METAFIELD_MAPPINGS[tenant]) {
      return { ...DEFAULT_METAFIELD_MAPPINGS, ...TENANT_METAFIELD_MAPPINGS[tenant] };
    }

    return DEFAULT_METAFIELD_MAPPINGS;
  }
}

/**
 * Factory function to create a deterministic mapping service
 */
export function createDeterministicMappingService(tenant?: string): DeterministicMappingService {
  return new DeterministicMappingService(tenant);
}
