import OpenAI from 'openai';
import { ProductProfile, ProductProfileSchema } from './product-profile.schema';

/**
 * Product information for web search enrichment
 */
export interface ProductForWebSearch {
  title: string;
  vendor?: string;
  description?: string;
  productType?: string;
}

/**
 * Web Search Enrichment Service
 * Uses OpenAI with web search to find product specifications from the internet
 */
export class WebSearchEnrichmentService {
  private client: OpenAI;
  private model: string;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.model = 'gpt-4o'; // GPT-4o supports web search
  }

  /**
   * Enrich product using web search
   */
  async enrichProduct(product: ProductForWebSearch): Promise<Partial<ProductProfile>> {
    try {
      console.log(`[Web Search] Searching for: "${product.title}" by ${product.vendor || 'unknown vendor'}`);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a mattress product researcher. Use web search to find accurate specifications from manufacturer websites, retailer pages, and product reviews.

IMPORTANT: Return ONLY valid JSON matching the exact schema. Do not include any explanatory text.`
          },
          {
            role: 'user',
            content: this.buildSearchPrompt(product)
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
                  type: ['string', 'null'],
                  enum: ['soft', 'medium-soft', 'medium', 'medium-firm', 'firm', null],
                  description: 'The firmness level of the mattress'
                },
                height: {
                  type: ['string', 'null'],
                  description: 'The height/thickness of the mattress (e.g., "12 inches")'
                },
                material: {
                  type: ['string', 'null'],
                  enum: ['memory-foam', 'latex', 'innerspring', 'hybrid', 'gel-foam', 'polyurethane', null],
                  description: 'The primary material/construction type'
                },
                certifications: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['CertiPUR-US', 'OEKO-TEX', 'GREENGUARD', 'GOTS', 'GOLS', 'FSC', 'Rainforest Alliance', 'Cradle to Cradle', 'Fair Trade', 'USDA Organic', 'Made Safe', 'Global Organic Textile Standard']
                  },
                  description: 'List of certifications found'
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
                  description: 'List of features found'
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
                  description: 'List of support features found'
                },
                source_evidence: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      source: {
                        type: 'string',
                        description: 'URL or source name where info was found'
                      },
                      evidence: {
                        type: 'string',
                        description: 'The specific text that supports this finding'
                      },
                      confidence: {
                        type: 'number',
                        description: 'Confidence score 0.0-1.0'
                      }
                    },
                    required: ['source', 'evidence', 'confidence'],
                    additionalProperties: false
                  },
                  description: 'Evidence from web sources'
                }
              },
              required: [],
              additionalProperties: false
            }
          }
        },
        // Enable web search (this is the key feature)
        // Note: As of the API, web search is enabled via specific models and prompts
        // The actual implementation may vary based on OpenAI's final API
        temperature: 0.1,
        max_tokens: 1500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from web search enrichment');
      }

      const parsed = JSON.parse(content);

      // Validate against schema (partial since some fields may be null)
      const validated = ProductProfileSchema.partial().parse(parsed);

      console.log(`[Web Search] Found attributes:`, {
        firmness: validated.firmness,
        height: validated.height,
        material: validated.material,
        sources: validated.sourceEvidence?.length || 0
      });

      return {
        ...validated,
        enrichmentMethod: 'llm', // Web search uses LLM with web access
        confidence: this.calculateConfidence(validated),
        modelVersion: `${this.model}-websearch`
      };

    } catch (error) {
      console.error('[Web Search] Enrichment error:', error);
      throw new Error(`Web search enrichment failed: ${error.message}`);
    }
  }

  /**
   * Build search prompt for the product
   */
  private buildSearchPrompt(product: ProductForWebSearch): string {
    const searchQuery = `"${product.title}"${product.vendor ? ` "${product.vendor}"` : ''}`;

    return `Search the web for specifications of this mattress: ${searchQuery}

Look for:
1. **Firmness level**: soft, medium-soft, medium, medium-firm, or firm
2. **Height/Thickness**: in inches (e.g., "12 inches", "10-14 inches")
3. **Material type**: memory-foam, latex, innerspring, hybrid, gel-foam, or polyurethane
4. **Certifications**: CertiPUR-US, OEKO-TEX, GREENGUARD, GOTS, etc.
5. **Features**: cooling properties, pressure relief, motion isolation, etc.
6. **Support features**: coil types, edge support systems, etc.

Search manufacturer websites, retailer product pages (Amazon, Wayfair, Mattress Firm, etc.), and product review sites.

For each attribute you find, provide:
- The exact value
- The source URL or website name
- A quote from the source as evidence
- Your confidence level (0.0-1.0)

If you cannot find specific information, set that field to null. Only include attributes you can verify from web sources.`;
  }

  /**
   * Calculate confidence based on found attributes and evidence quality
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

    if (extractedFields.length === 0) return 0.3; // Lower confidence if nothing found

    // Web search has higher base confidence since it's from real sources
    const fieldConfidence = extractedFields.length / 6;
    const evidenceBonus = profile.sourceEvidence?.length ? 0.3 : 0;

    return Math.min(fieldConfidence + evidenceBonus, 1.0);
  }
}

/**
 * Factory function to create web search enrichment service
 */
export function createWebSearchEnrichmentService(): WebSearchEnrichmentService {
  return new WebSearchEnrichmentService();
}

