import { OpenAI } from 'openai';
import { ProductProfile, ProductProfileSchema } from './product-profile.schema';

/**
 * Shopify product data for LLM enrichment
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
  }>;
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
            content: `You are a mattress product expert. Extract ONLY factual mattress attributes from the product description. If uncertain about any attribute, respond with null for that field. Include source_evidence for each extracted attribute.

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
            strict: true,
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
                    enum: ['CertiPUR-US', 'OEKO-TEX', 'GREENGUARD', 'GOTS', 'GOLS', 'FSC', 'Rainforest Alliance', 'Cradle to Cradle']
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
                      'individual-pocket-springs', 'tempered-steel-coils', 'caliber-coil-system'
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
                    required: ['source', 'evidence', 'confidence']
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

      return {
        ...validated,
        enrichmentMethod: 'llm',
        confidence: this.calculateConfidence(validated),
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
    const sections = [
      `Product Title: ${product.title}`,
      product.description ? `Description: ${product.description}` : null,
      product.vendor ? `Vendor: ${product.vendor}` : null,
      product.productType ? `Product Type: ${product.productType}` : null,
      product.tags && product.tags.length > 0 ? `Tags: ${product.tags.join(', ')}` : null,
      product.metafields && product.metafields.length > 0
        ? `Metafields:\n${product.metafields.map(field => `${field.namespace}.${field.key}: ${field.value}`).join('\n')}`
        : null
    ].filter(Boolean);

    return `Please analyze this mattress product and extract specific attributes:

${sections.join('\n\n')}

Focus on extracting factual mattress attributes only. For each attribute you extract, provide evidence from the product description showing where you found this information. If you're not confident about an attribute or if the information isn't clearly stated, set it to null.

Remember: Only extract attributes that are explicitly mentioned or can be clearly inferred from the product information. Do not make assumptions or add attributes that aren't supported by the text.`;
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


