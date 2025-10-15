/**
 * Indexing Error Handling
 * Standardized error types and severity levels for indexing operations
 */

export enum ErrorSeverity {
  /** Critical error - fail entire job immediately */
  CRITICAL = 'critical',
  
  /** Batch error - skip current batch, continue with next */
  BATCH = 'batch',
  
  /** Product error - skip single product, continue with others */
  PRODUCT = 'product'
}

/**
 * Base indexing error class with severity and context
 */
export class IndexingError extends Error {
  constructor(
    message: string,
    public severity: ErrorSeverity,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'IndexingError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Shopify API error - typically critical
 */
export class ShopifyAPIError extends IndexingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorSeverity.CRITICAL, context);
    this.name = 'ShopifyAPIError';
  }
}

/**
 * Bulk operation error - critical
 */
export class BulkOperationError extends IndexingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorSeverity.CRITICAL, context);
    this.name = 'BulkOperationError';
  }
}

/**
 * Product enrichment error - product level
 */
export class ProductEnrichmentError extends IndexingError {
  constructor(message: string, productId: string, context?: Record<string, any>) {
    super(message, ErrorSeverity.PRODUCT, { ...context, productId });
    this.name = 'ProductEnrichmentError';
  }
}

/**
 * Vector store error - batch or product level depending on operation
 */
export class VectorStoreError extends IndexingError {
  constructor(message: string, severity: ErrorSeverity = ErrorSeverity.BATCH, context?: Record<string, any>) {
    super(message, severity, context);
    this.name = 'VectorStoreError';
  }
}

/**
 * AI classification error - batch level (can fallback)
 */
export class AIClassificationError extends IndexingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorSeverity.BATCH, context);
    this.name = 'AIClassificationError';
  }
}

/**
 * Helper function to handle errors based on severity
 */
export function handleIndexingError(
  error: Error | IndexingError,
  defaultSeverity: ErrorSeverity = ErrorSeverity.CRITICAL
): { shouldContinue: boolean; severity: ErrorSeverity } {
  if (error instanceof IndexingError) {
    console.error(`[${error.severity.toUpperCase()}] ${error.name}: ${error.message}`, error.context);
    
    return {
      shouldContinue: error.severity !== ErrorSeverity.CRITICAL,
      severity: error.severity
    };
  }
  
  // Unknown errors are treated as default severity
  console.error(`[${defaultSeverity.toUpperCase()}] Unexpected error:`, error);
  
  return {
    shouldContinue: defaultSeverity !== ErrorSeverity.CRITICAL,
    severity: defaultSeverity
  };
}

/**
 * Error counter for tracking failures by severity
 */
export class ErrorCounter {
  private counts: Map<ErrorSeverity, number> = new Map();
  
  constructor() {
    this.counts.set(ErrorSeverity.CRITICAL, 0);
    this.counts.set(ErrorSeverity.BATCH, 0);
    this.counts.set(ErrorSeverity.PRODUCT, 0);
  }
  
  increment(severity: ErrorSeverity): void {
    const current = this.counts.get(severity) || 0;
    this.counts.set(severity, current + 1);
  }
  
  get(severity: ErrorSeverity): number {
    return this.counts.get(severity) || 0;
  }
  
  getTotal(): number {
    return Array.from(this.counts.values()).reduce((sum, count) => sum + count, 0);
  }
  
  getSummary(): { critical: number; batch: number; product: number; total: number } {
    return {
      critical: this.get(ErrorSeverity.CRITICAL),
      batch: this.get(ErrorSeverity.BATCH),
      product: this.get(ErrorSeverity.PRODUCT),
      total: this.getTotal()
    };
  }
}

