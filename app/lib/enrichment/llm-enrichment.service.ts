import { OpenAI } from 'openai';
import { ProductProfile, ProductProfileSchema } from './product-profile.schema';
import { normalizeMetafields } from './deterministic-mapping.service';

/**
 * Shopify product data for LLM enrichment
 * Note: metafields can be in either GraphQL edges format or flat array format
 */
export interface ProductForEnrichment {
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
}

/**
 * LLM enrichment service using OpenAI structured output
 */
export class LLMEnrichmentService {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, options: { model?: string } = {}) {
    this.client = new OpenAI({ apiKey });
    this.model = options.model || 'gpt-4o-mini';
  }

  /**
   * Enrich product attributes using LLM with structured output
   */
  async enrichProduct(product: ProductForEnrichment): Promise<Partial<ProductProfile>> {
    try {
      const prompt = this.buildPrompt(product);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a mattress product expert. Extract mattress attributes from the product information.

EXTRACTION RULES:
1. Use explicit information when clearly stated in the description
2. If explicit info is missing, make REASONABLE INFERENCES from:
   - Product title and brand name
   - Common industry standards for mattresses
   - Typical mattress specifications
3. For firmness: If not stated, infer "medium" (most common standard)
4. For material: Look for clues in title (Memory Foam, Latex, Hybrid, etc.)
5. For height: If not stated, use typical range "10-12 inches"
6. Always provide source_evidence explaining your reasoning (can be "inferred from title" or "industry standard")

IMPORTANT: Respond ONLY with valid JSON matching this exact schema. Do not include any explanatory text.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'product_profile',
            schema: {
              type: 'object',
              properties: {
                firmness: {
                  type: 'string',
                  enum: ['soft', 'medium-soft', 'medium', 'medium-firm', 'firm'],
                  description: 'The firmness level of the mattress'
                },
                height: {
                  type: 'string',
                  description: 'The height/thickness of the mattress (e.g., "12 inches", "10-14 inches")'
                },
                material: {
                  type: 'string',
                  enum: ['memory-foam', 'latex', 'innerspring', 'hybrid', 'gel-foam', 'polyurethane'],
                  description: 'The primary material/construction type'
                },
                certifications: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['CertiPUR-US', 'OEKO-TEX', 'GREENGUARD', 'GOTS', 'GOLS', 'FSC', 'Rainforest Alliance', 'Cradle to Cradle', 'Fair Trade', 'USDA Organic', 'Made Safe', 'Global Organic Textile Standard']
                  },
                  description: 'List of certifications the product has'
                },
                features: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: [
                      'cooling-gel', 'pressure-relief', 'motion-isolation', 'edge-support',
                      'zoned-support', 'adjustable-firmness', 'organic-materials',
                      'hypoallergenic', 'antimicrobial', 'copper-infused', 'graphite-infused',
                      'bamboo-cover', 'temperature-regulation', 'moisture-wicking',
                      'lumbar-support', 'pillow-top', 'euro-top', 'tight-top',
                      'platform-bed-compatible'
                    ]
                  },
                  description: 'List of mattress features'
                },
                supportFeatures: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: [
                      'pocketed-coils', 'bonnell-coils', 'continuous-coils', 'offset-coils',
                      'micro-coils', 'high-coil-count', 'perimeter-edge-support',
                      'center-support-beam', 'corner-guards', 'reinforced-edges',
                      'individual-pocket-springs', 'tempered-steel-coils', 'caliber-coil-system',
                      'individually-pocket-springs', 'individually-wrapped-coils', 'individually-wrapped-springs',
                      'wrapped-coils', 'pocket-springs', 'edge-support', 'edge-reinforcement',
                      'zoned-support', 'targeted-support', 'lumbar-zone', 'dual-support', 'progressive-support'
                    ]
                  },
                  description: 'List of support system features'
                },
                source_evidence: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      source: { type: 'string', description: 'The source of the evidence' },
                      evidence: { type: 'string', description: 'The specific text that supports this attribute' },
                      confidence: { type: 'number', minimum: 0.0, maximum: 1.0, description: 'Confidence in this extraction' }
                    },
                    required: ['source', 'evidence', 'confidence'],
                    additionalProperties: false
                  },
                  description: 'Evidence for each extracted attribute'
                }
              },
              additionalProperties: false,
              required: []
            }
          }
        },
        temperature: 0.1, // Low temperature for consistent structured output
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from LLM');
      }

      const parsed = JSON.parse(content);

      // Validate the response against our schema
      const validated = ProductProfileSchema.partial().parse(parsed);

      // Apply fallback defaults for null/missing values
      const enriched = this.applyFallbackDefaults(validated, product);

      return {
        ...enriched,
        enrichmentMethod: 'llm',
        confidence: this.calculateConfidence(enriched),
        modelVersion: this.model
      };

    } catch (error) {
      console.error('LLM enrichment error:', error);
      throw new Error(`LLM enrichment failed: ${error.message}`);
    }
  }

  /**
   * Build the prompt for LLM enrichment
   */
  private buildPrompt(product: ProductForEnrichment): string {
    const normalizedMetafields = normalizeMetafields(product.metafields);
    const sections = [
      `Product Title: ${product.title}`,
      product.description ? `Description: ${product.description}` : null,
      product.vendor ? `Vendor: ${product.vendor}` : null,
      product.productType ? `Product Type: ${product.productType}` : null,
      product.tags && product.tags.length > 0 ? `Tags: ${product.tags.join(', ')}` : null,
      normalizedMetafields.length > 0
        ? `Metafields:\n${normalizedMetafields.map(field => `${field.namespace}.${field.key}: ${field.value}`).join('\n')}`
        : null
    ].filter(Boolean);

    return `Please analyze this mattress product and extract specific attributes:

${sections.join('\n\n')}

Extract mattress attributes using available information and reasonable inferences. For each attribute, provide evidence showing where you found this information or how you inferred it.

If information is missing:
- Firmness: Default to "medium" (industry standard)
- Height: Default to "10-12 inches" (typical mattress range)
- Material: Infer from title keywords if possible

Provide source_evidence for all attributes, including inferred ones.`;
  }

  /**
   * Calculate overall confidence based on extracted attributes
   */
  private calculateConfidence(profile: Partial<ProductProfile>): number {
    const extractedFields = [
      profile.firmness,
      profile.height,
      profile.material,
      profile.certifications?.length,
      profile.features?.length,
      profile.supportFeatures?.length
    ].filter(Boolean);

    if (extractedFields.length === 0) return 0.0;

    // Base confidence on number of fields extracted and evidence quality
    const fieldConfidence = extractedFields.length / 6; // Max 6 field types
    const evidenceConfidence = profile.sourceEvidence?.length ? 0.2 : 0;

    return Math.min(fieldConfidence + evidenceConfidence, 1.0);
  }

  /**
   * Apply fallback defaults for null/missing attributes
   */
  private applyFallbackDefaults(profile: Partial<ProductProfile>, product: ProductForEnrichment): Partial<ProductProfile> {
    const result = { ...profile };

    // Default firmness to medium if missing
    if (!result.firmness) {
      result.firmness = 'medium';
    }

    // Default height if missing
    if (!result.height) {
      result.height = '10-12 inches';
    }

    // Infer material from title if missing
    if (!result.material && product.title) {
      const titleLower = product.title.toLowerCase();
      if (titleLower.includes('memory foam') || titleLower.includes('memory-foam')) {
        result.material = 'memory-foam';
      } else if (titleLower.includes('latex')) {
        result.material = 'latex';
      } else if (titleLower.includes('spring') || titleLower.includes('coil')) {
        result.material = 'innerspring';
      } else if (titleLower.includes('hybrid')) {
        result.material = 'hybrid';
      } else if (titleLower.includes('gel')) {
        result.material = 'gel-foam';
      }
    }

    return result;
  }
}

/**
 * Factory function to create LLM enrichment service
 */
export function createLLMEnrichmentService(): LLMEnrichmentService {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required for LLM enrichment');
  }

  return new LLMEnrichmentService(apiKey, {
    model: process.env.OPENAI_LLM_MODEL || 'gpt-4o-mini'
  });
}


