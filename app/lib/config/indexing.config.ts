/**
 * Indexing Configuration
 * Centralized configuration for product indexing operations
 */

export const INDEXING_CONFIG = {
  // Product processing batch size
  PRODUCT_BATCH_SIZE: 50,
  
  // AI classification batch size (for uncertain products)
  AI_CLASSIFICATION_BATCH_SIZE: 15,
  
  // Maximum attempts to poll Shopify bulk operation
  MAX_POLL_ATTEMPTS: 60,
  
  // Interval between bulk operation polls (10 seconds)
  POLL_INTERVAL_MS: 10000,
  
  // Maximum job duration before marking as stale (30 minutes)
  MAX_JOB_DURATION_MS: 30 * 60 * 1000,
  
  // Delay between product batches (100ms)
  BATCH_DELAY_MS: 100,
  
  // Delay between AI classification batches (250ms for rate limiting)
  AI_BATCH_DELAY_MS: 250,
  
  // Threshold for considering a job stale (30 minutes)
  STALE_JOB_THRESHOLD_MS: 30 * 60 * 1000,
  
  // Maximum number of uncertain products to send to AI (cost control)
  MAX_UNCERTAIN_PRODUCTS_FOR_AI: 200,
  
  // Default confidence threshold for AI enrichment
  DEFAULT_CONFIDENCE_THRESHOLD: 0.7,
  
  // Maximum retries for failed operations
  MAX_RETRIES: 3,
} as const;

export type IndexingConfig = typeof INDEXING_CONFIG;

