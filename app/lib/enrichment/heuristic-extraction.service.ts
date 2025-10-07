import type { ProductProfile } from './product-profile.schema';

/**
 * Heuristic extraction service for mattress attributes using regex and keyword rules
 */
export class HeuristicExtractionService {
  private rules: HeuristicRule[];

  constructor() {
    this.rules = this.initializeRules();
  }

  /**
   * Extract mattress attributes from product content using heuristic rules
   */
  extractAttributes(content: {
    title: string;
    description?: string;
    tags?: string[];
    vendor?: string;
    productType?: string;
  }): Partial<ProductProfile> {
    const allText = this.combineContent(content);
    const results: HeuristicExtractionResult[] = [];

    // Apply all heuristic rules
    for (const rule of this.rules) {
      const matches = rule.extract(allText);
      results.push(...matches);
    }

    // Aggregate results by attribute type
    const aggregated = this.aggregateResults(results);

    return {
      ...aggregated,
      enrichmentMethod: 'heuristic',
      confidence: this.calculateOverallConfidence(results),
      sourceEvidence: results.map(r => ({
        source: r.ruleName,
        evidence: r.matchedText,
        confidence: r.confidence
      }))
    };
  }

  /**
   * Combine all product content into a single searchable text
   */
  private combineContent(content: {
    title: string;
    description?: string;
    tags?: string[];
    vendor?: string;
    productType?: string;
  }): string {
    const parts = [
      content.title,
      content.description,
      content.vendor,
      content.productType,
      ...(content.tags || [])
    ].filter(Boolean);

    return parts.join(' ').toLowerCase();
  }

  /**
   * Initialize heuristic extraction rules
   */
  private initializeRules(): HeuristicRule[] {
    return [
      // Firmness rules
      new RegexRule('firmness', 'Firmness', [
        { pattern: /\b(plush|soft|gentle|cloud)\b/, value: 'soft', confidence: 0.9 },
        { pattern: /\b(medium.soft|medium soft|medium plush)\b/, value: 'medium-soft', confidence: 0.9 },
        { pattern: /\b(medium|balanced|universal)\b/, value: 'medium', confidence: 0.8 },
        { pattern: /\b(medium.firm|medium firm|firm.medium)\b/, value: 'medium-firm', confidence: 0.9 },
        { pattern: /\b(firm|extra.firm|extra firm|supportive)\b/, value: 'firm', confidence: 0.9 }
      ]),

      // Height rules
      new RegexRule('height', 'Height', [
        { pattern: /(\d+(?:\.\d+)?)\s*(?:inch|inches|in|")\b/, value: '${1} inches', confidence: 0.95 },
        { pattern: /(\d+(?:\.\d+)?)\s*(?:cm|centimeter|centimeters)\b/, value: (match) => `${Math.round(parseFloat(match[1]) / 2.54)} inches`, confidence: 0.9 }
      ]),

      // Material rules
      new RegexRule('material', 'Material', [
        { pattern: /\b(memory.foam|memory foam|visco.?elastic)\b/, value: 'memory-foam', confidence: 0.95 },
        { pattern: /\b(natural.latex|100%.latex|organic.latex)\b/, value: 'latex', confidence: 0.9 },
        { pattern: /\b(inner.spring|coil.spring|traditional.spring)\b/, value: 'innerspring', confidence: 0.9 },
        { pattern: /\b(hybrid|foam.*coil|coil.*foam)\b/, value: 'hybrid', confidence: 0.85 },
        { pattern: /\b(gel.foam|gel.memory|gel infused)\b/, value: 'gel-foam', confidence: 0.9 }
      ]),

      // Certification rules
      new RegexRule('certifications', 'Certifications', [
        { pattern: /\b(certipur.?us|certi.?pur)\b/, value: 'CertiPUR-US', confidence: 0.95 },
        { pattern: /\b(oeko.?tex|oeko tex)\b/, value: 'OEKO-TEX', confidence: 0.95 },
        { pattern: /\b(greenguard|green guard)\b/, value: 'GREENGUARD', confidence: 0.95 },
        { pattern: /\b(gots|global organic textile)\b/, value: 'GOTS', confidence: 0.9 },
        { pattern: /\b(gols|global organic latex)\b/, value: 'GOLS', confidence: 0.9 }
      ]),

      // Feature rules - cooling
      new RegexRule('features', 'Cooling Features', [
        { pattern: /\b(gel|gel.memory|cooling.gel|temperature.regulating)\b/, value: 'cooling-gel', confidence: 0.8 },
        { pattern: /\b(pcm|phase.change|thermal)\b/, value: 'cooling-gel', confidence: 0.9 },
        { pattern: /\b(graphite|carbon|conductive)\b/, value: 'graphite-infused', confidence: 0.8 },
        { pattern: /\b(copper|metallic|conducting)\b/, value: 'copper-infused', confidence: 0.8 }
      ]),

      // Feature rules - pressure relief
      new RegexRule('features', 'Pressure Relief', [
        { pattern: /\b(pressure.relief|body.contouring|contour|conforming)\b/, value: 'pressure-relief', confidence: 0.85 },
        { pattern: /\b(memory.foam|visco)\b/, value: 'pressure-relief', confidence: 0.7 }
      ]),

      // Feature rules - motion isolation
      new RegexRule('features', 'Motion Isolation', [
        { pattern: /\b(motion.isolation|motion.transfer|partner.disturbance|undisturbed.sleep)\b/, value: 'motion-isolation', confidence: 0.9 }
      ]),

      // Feature rules - edge support
      new RegexRule('features', 'Edge Support', [
        { pattern: /\b(edge.support|edge.to.edge|perimeter.support|sitting.edge)\b/, value: 'edge-support', confidence: 0.9 }
      ]),

      // Feature rules - zoned support
      new RegexRule('features', 'Zoned Support', [
        { pattern: /\b(zoned|zone|targeted.support|variable.firmness|body.mapping)\b/, value: 'zoned-support', confidence: 0.9 }
      ]),

      // Feature rules - organic materials
      new RegexRule('features', 'Organic Materials', [
        { pattern: /\b(organic|natural|100%.natural|chemical.free)\b/, value: 'organic-materials', confidence: 0.8 }
      ]),

      // Support feature rules
      new RegexRule('supportFeatures', 'Coil Systems', [
        { pattern: /\b(pocketed.coil|pocket.coil|individual.coil)\b/, value: 'pocketed-coils', confidence: 0.9 },
        { pattern: /\b(bonnell.coil|hourglass.coil)\b/, value: 'bonnell-coils', confidence: 0.9 },
        { pattern: /\b(continuous.coil|helical.coil)\b/, value: 'continuous-coils', confidence: 0.9 },
        { pattern: /\b(offset.coil|figure.8.coil)\b/, value: 'offset-coils', confidence: 0.9 }
      ]),

      new RegexRule('supportFeatures', 'Support Features', [
        { pattern: /\b(perimeter|edge.reinforcement|edge.guard)\b/, value: 'perimeter-edge-support', confidence: 0.85 },
        { pattern: /\b(center.support|center.beam|middle.support)\b/, value: 'center-support-beam', confidence: 0.9 }
      ])
    ];
  }

  /**
   * Aggregate extraction results by attribute type
   */
  private aggregateResults(results: HeuristicExtractionResult[]): Partial<ProductProfile> {
    const aggregated: Partial<ProductProfile> = {};

    // Group results by attribute type
    const grouped = new Map<string, HeuristicExtractionResult[]>();

    for (const result of results) {
      if (!grouped.has(result.attributeType)) {
        grouped.set(result.attributeType, []);
      }
      grouped.get(result.attributeType)!.push(result);
    }

    // Aggregate each attribute type
    for (const [attributeType, typeResults] of grouped) {
      switch (attributeType) {
        case 'firmness':
          aggregated.firmness = this.aggregateFirmness(typeResults);
          break;

        case 'height':
          aggregated.height = this.aggregateHeight(typeResults);
          break;

        case 'material':
          aggregated.material = this.aggregateMaterial(typeResults);
          break;

        case 'certifications':
          aggregated.certifications = this.aggregateCertifications(typeResults);
          break;

        case 'features':
          aggregated.features = this.aggregateFeatures(typeResults);
          break;

        case 'supportFeatures':
          aggregated.supportFeatures = this.aggregateSupportFeatures(typeResults);
          break;
      }
    }

    return aggregated;
  }

  /**
   * Calculate overall confidence from all results
   */
  private calculateOverallConfidence(results: HeuristicExtractionResult[]): number {
    if (results.length === 0) return 0;

    const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0);
    return Math.min(totalConfidence / results.length, 1.0);
  }

  // Aggregation methods for each attribute type
  private aggregateFirmness(results: HeuristicExtractionResult[]): ProductProfile['firmness'] {
    // Take the highest confidence firmness value
    return results.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    ).extractedValue as ProductProfile['firmness'];
  }

  private aggregateHeight(results: HeuristicExtractionResult[]): string {
    // Take the most common height value
    const heightCounts = new Map<string, number>();

    for (const result of results) {
      const height = result.extractedValue as string;
      heightCounts.set(height, (heightCounts.get(height) || 0) + 1);
    }

    return Array.from(heightCounts.entries()).reduce((best, current) =>
      current[1] > best[1] ? current : best
    )[0];
  }

  private aggregateMaterial(results: HeuristicExtractionResult[]): ProductProfile['material'] {
    // Take the highest confidence material value
    return results.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    ).extractedValue as ProductProfile['material'];
  }

  private aggregateCertifications(results: HeuristicExtractionResult[]): string[] {
    const certs = new Set<string>();

    for (const result of results) {
      if (Array.isArray(result.extractedValue)) {
        (result.extractedValue as string[]).forEach(cert => certs.add(cert));
      } else {
        certs.add(result.extractedValue as string);
      }
    }

    return Array.from(certs);
  }

  private aggregateFeatures(results: HeuristicExtractionResult[]): string[] {
    const features = new Set<string>();

    for (const result of results) {
      if (Array.isArray(result.extractedValue)) {
        (result.extractedValue as string[]).forEach(feature => features.add(feature));
      } else {
        features.add(result.extractedValue as string);
      }
    }

    return Array.from(features);
  }

  private aggregateSupportFeatures(results: HeuristicExtractionResult[]): string[] {
    const supportFeatures = new Set<string>();

    for (const result of results) {
      if (Array.isArray(result.extractedValue)) {
        (result.extractedValue as string[]).forEach(feature => supportFeatures.add(feature));
      } else {
        supportFeatures.add(result.extractedValue as string);
      }
    }

    return Array.from(supportFeatures);
  }
}

/**
 * Interface for heuristic extraction rules
 */
interface HeuristicRule {
  attributeType: keyof ProductProfile;
  ruleName: string;
  extract(text: string): HeuristicExtractionResult[];
}

/**
 * Regex-based heuristic rule
 */
class RegexRule implements HeuristicRule {
  attributeType: keyof ProductProfile;
  ruleName: string;
  patterns: Array<{
    pattern: RegExp;
    value: string | ((match: RegExpExecArray) => string);
    confidence: number;
  }>;

  constructor(
    attributeType: keyof ProductProfile,
    ruleName: string,
    patterns: Array<{
      pattern: RegExp;
      value: string | ((match: RegExpExecArray) => string);
      confidence: number;
    }>
  ) {
    this.attributeType = attributeType;
    this.ruleName = ruleName;
    this.patterns = patterns;
  }

  extract(text: string): HeuristicExtractionResult[] {
    const results: HeuristicExtractionResult[] = [];

    for (const { pattern, value, confidence } of this.patterns) {
      const matches = [...text.matchAll(pattern)];

      for (const match of matches) {
        const extractedValue = typeof value === 'function' ? value(match) : value;
        const matchedText = match[0];

        results.push({
          attributeType: this.attributeType,
          ruleName: this.ruleName,
          extractedValue,
          confidence,
          matchedText
        });
      }
    }

    return results;
  }
}

/**
 * Result of heuristic extraction
 */
interface HeuristicExtractionResult {
  attributeType: keyof ProductProfile;
  ruleName: string;
  extractedValue: any;
  confidence: number;
  matchedText: string;
}

/**
 * Factory function to create heuristic extraction service
 */
export function createHeuristicExtractionService(): HeuristicExtractionService {
  return new HeuristicExtractionService();
}
