import { z } from 'zod';

/**
 * Zod schema for mattress product profile enrichment results
 */
export const ProductProfileSchema = z.object({
  // Mattress-specific attributes
  firmness: z.enum(['soft', 'medium-soft', 'medium', 'medium-firm', 'firm']).optional(),
  height: z.string().optional(), // e.g., "12 inches", "10-14 inches"
  material: z.enum(['memory-foam', 'latex', 'innerspring', 'hybrid', 'gel-foam', 'polyurethane']).optional(),
  certifications: z.array(z.enum([
    'CertiPUR-US',
    'OEKO-TEX',
    'GREENGUARD',
    'GOTS',
    'GOLS',
    'FSC',
    'Rainforest Alliance',
    'Cradle to Cradle'
  ])).optional(),
  features: z.array(z.enum([
    'cooling-gel',
    'pressure-relief',
    'motion-isolation',
    'edge-support',
    'zoned-support',
    'adjustable-firmness',
    'organic-materials',
    'hypoallergenic',
    'antimicrobial',
    'copper-infused',
    'graphite-infused',
    'bamboo-cover',
    'temperature-regulation',
    'moisture-wicking',
    'lumbar-support',
    'pillow-top',
    'euro-top',
    'tight-top',
    'platform-bed-compatible'
  ])).optional(),
  supportFeatures: z.array(z.enum([
    'pocketed-coils',
    'bonnell-coils',
    'continuous-coils',
    'offset-coils',
    'micro-coils',
    'high-coil-count',
    'perimeter-edge-support',
    'center-support-beam',
    'corner-guards',
    'reinforced-edges',
    'individual-pocket-springs',
    'tempered-steel-coils',
    'caliber-coil-system'
  ])).optional(),

  // Enrichment metadata
  enrichmentMethod: z.enum(['mapping', 'heuristic', 'llm']),
  confidence: z.number().min(0.0).max(1.0),
  sourceEvidence: z.array(z.object({
    source: z.string(),
    evidence: z.string(),
    confidence: z.number().min(0.0).max(1.0)
  })).optional(),
  modelVersion: z.string().optional(),

  // Override flags
  lockedFirmness: z.boolean().default(false),
  lockedHeight: z.boolean().default(false),
  lockedMaterial: z.boolean().default(false),
  lockedCertifications: z.boolean().default(false),
  lockedFeatures: z.boolean().default(false),
  lockedSupportFeatures: z.boolean().default(false)
});

export type ProductProfile = z.infer<typeof ProductProfileSchema>;

/**
 * Validates a product profile object
 */
export function validateProductProfile(data: unknown): ProductProfile {
  return ProductProfileSchema.parse(data);
}

/**
 * Creates an empty product profile with default values
 */
export function createEmptyProductProfile(): ProductProfile {
  return {
    enrichmentMethod: 'mapping',
    confidence: 0.0,
    lockedFirmness: false,
    lockedHeight: false,
    lockedMaterial: false,
    lockedCertifications: false,
    lockedFeatures: false,
    lockedSupportFeatures: false
  };
}

/**
 * Merges two product profiles, preferring higher confidence values
 */
export function mergeProductProfiles(
  base: ProductProfile,
  overlay: ProductProfile
): ProductProfile {
  const result = { ...base };

  // For each field, use the value with higher confidence
  const fields = ['firmness', 'height', 'material', 'certifications', 'features', 'supportFeatures'] as const;

  for (const field of fields) {
    const baseValue = base[field];
    const overlayValue = overlay[field];

    if (overlayValue !== undefined && overlayValue !== null) {
      if (baseValue === undefined || baseValue === null) {
        result[field] = overlayValue;
      } else if (Array.isArray(baseValue) && Array.isArray(overlayValue)) {
        // Merge arrays, removing duplicates
        result[field] = [...new Set([...baseValue, ...overlayValue])];
      } else {
        // For scalar fields, use the one with higher confidence
        const baseConf = base.confidence || 0;
        const overlayConf = overlay.confidence || 0;

        if (overlayConf > baseConf) {
          result[field] = overlayValue;
        }
      }
    }
  }

  // Update metadata
  result.confidence = Math.max(base.confidence || 0, overlay.confidence || 0);
  result.enrichmentMethod = overlay.confidence > base.confidence ? overlay.enrichmentMethod : base.enrichmentMethod;

  if (overlay.sourceEvidence) {
    result.sourceEvidence = [
      ...(base.sourceEvidence || []),
      ...overlay.sourceEvidence
    ];
  }

  return result;
}


