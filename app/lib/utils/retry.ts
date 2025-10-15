/**
 * Retry Utilities
 * Provides retry logic with exponential backoff
 */

import { logger } from '../logger';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  onRetry: () => {}
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this was the last attempt, throw the error
      if (attempt === opts.maxRetries) {
        logger.error('Retry exhausted', lastError, {
          attempt,
          maxRetries: opts.maxRetries
        });
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelay
      );

      logger.warn('Retrying after error', {
        attempt: attempt + 1,
        maxRetries: opts.maxRetries,
        delay_ms: delay,
        error: lastError.message
      });

      // Call retry callback if provided
      opts.onRetry(attempt + 1, lastError);

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError!;
}

/**
 * Retry a function with linear backoff
 */
export async function retryWithLinearBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  return retryWithBackoff(fn, {
    maxRetries,
    initialDelay: delay,
    backoffMultiplier: 1 // Linear backoff
  });
}

/**
 * Retry a function with fixed delay
 */
export async function retryWithFixedDelay<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        throw lastError;
      }

      logger.warn('Retrying after error (fixed delay)', {
        attempt: attempt + 1,
        maxRetries,
        delay_ms: delay,
        error: lastError.message
      });

      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const retryablePatterns = [
    /ECONNRESET/,
    /ETIMEDOUT/,
    /ENOTFOUND/,
    /rate limit/i,
    /too many requests/i,
    /503/,
    /502/,
    /504/,
    /timeout/i
  ];

  const errorMessage = error.message || '';
  return retryablePatterns.some(pattern => pattern.test(errorMessage));
}

/**
 * Retry only if the error is retryable
 */
export async function retryIfRetryable<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    if (isRetryableError(err)) {
      logger.info('Error is retryable, attempting retry', {
        error: err.message
      });
      return retryWithBackoff(fn, options);
    }
    
    throw err;
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Batch retry - retry multiple operations independently
 */
export async function retryBatch<T>(
  items: T[],
  fn: (item: T) => Promise<any>,
  options: RetryOptions = {}
): Promise<{ successful: T[]; failed: Array<{ item: T; error: Error }> }> {
  const results = await Promise.allSettled(
    items.map(item =>
      retryWithBackoff(() => fn(item), options).then(() => ({ item, success: true }))
    )
  );

  const successful: T[] = [];
  const failed: Array<{ item: T; error: Error }> = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successful.push(items[index]);
    } else {
      failed.push({
        item: items[index],
        error: result.reason
      });
    }
  });

  return { successful, failed };
}

