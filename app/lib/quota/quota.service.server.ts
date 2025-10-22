/**
 * Quota limits for different tenant tiers
 */

// Lazy-load prisma
const getPrisma = async () => {
  const { prisma } = await import('~/db.server');
  return prisma;
};
export interface QuotaLimits {
  // Indexing quotas
  maxIndexingJobsPerDay: number;
  maxIndexingJobsPerWeek: number;
  maxProductsPerIndexingJob: number;
  maxIndexingJobsPerHour: number;

  // Token quotas
  maxTokensPerDay: number;
  maxTokensPerHour: number;

  // Cost quotas
  maxCostPerDay: number;
  maxCostPerMonth: number;

  // Rate limits
  maxRequestsPerMinute: number;
  maxConcurrentJobs: number;
}

/**
 * Default quota limits by tier
 */
const DEFAULT_QUOTAS: Record<string, QuotaLimits> = {
  'starter': {
    maxIndexingJobsPerDay: 1,
    maxIndexingJobsPerWeek: 1,
    maxProductsPerIndexingJob: 100,
    maxIndexingJobsPerHour: 1,
    maxTokensPerDay: 100000,
    maxTokensPerHour: 10000,
    maxCostPerDay: 10.0,
    maxCostPerMonth: 100.0,
    maxRequestsPerMinute: 30,
    maxConcurrentJobs: 2
  },
  'professional': {
    maxIndexingJobsPerDay: 5,
    maxIndexingJobsPerWeek: 1,
    maxProductsPerIndexingJob: 1000,
    maxIndexingJobsPerHour: 2,
    maxTokensPerDay: 500000,
    maxTokensPerHour: 50000,
    maxCostPerDay: 50.0,
    maxCostPerMonth: 500.0,
    maxRequestsPerMinute: 60,
    maxConcurrentJobs: 5
  },
  'enterprise': {
    maxIndexingJobsPerDay: -1,
    maxIndexingJobsPerWeek: 1,
    maxProductsPerIndexingJob: 10000,
    maxIndexingJobsPerHour: -1,
    maxTokensPerDay: 2000000,
    maxTokensPerHour: 200000,
    maxCostPerDay: -1,
    maxCostPerMonth: -1,
    maxRequestsPerMinute: 120,
    maxConcurrentJobs: -1
  }
};

/**
 * Quota enforcement service
 */
export class QuotaService {
  private tenant: string;

  constructor(tenant: string) {
    this.tenant = tenant;
  }

  /**
   * Check if tenant can start a new indexing job
   */
  async canStartIndexingJob(): Promise<{ allowed: boolean; reason?: string; limits?: QuotaLimits }> {
    const limits = await this.getTenantLimits();

    // Check concurrent jobs limit (-1 means unlimited)
    if (limits.maxConcurrentJobs !== -1) {
      const concurrentJobs = await this.getConcurrentJobsCount();
      if (concurrentJobs >= limits.maxConcurrentJobs) {
        return {
          allowed: false,
          reason: `Maximum concurrent jobs (${limits.maxConcurrentJobs}) reached`,
          limits
        };
      }
    }

    // Check hourly indexing jobs limit (-1 means unlimited)
    if (limits.maxIndexingJobsPerHour !== -1) {
      const hourlyJobs = await this.getIndexingJobsCount('hour');
      if (hourlyJobs >= limits.maxIndexingJobsPerHour) {
        return {
          allowed: false,
          reason: `Maximum indexing jobs per hour (${limits.maxIndexingJobsPerHour}) reached`,
          limits
        };
      }
    }

    // Check weekly indexing jobs limit (-1 means unlimited)
    if (limits.maxIndexingJobsPerWeek !== -1) {
      const weeklyJobs = await this.getIndexingJobsCount('week');
      if (weeklyJobs >= limits.maxIndexingJobsPerWeek) {
        return {
          allowed: false,
          reason: `Maximum indexing jobs per week (${limits.maxIndexingJobsPerWeek}) reached. Please wait before running another catalog indexing job.`,
          limits
        };
      }
    }

    // Check daily indexing jobs limit (-1 means unlimited)
    if (limits.maxIndexingJobsPerDay !== -1) {
      const dailyJobs = await this.getIndexingJobsCount('day');
      if (dailyJobs >= limits.maxIndexingJobsPerDay) {
        return {
          allowed: false,
          reason: `Maximum indexing jobs per day (${limits.maxIndexingJobsPerDay}) reached`,
          limits
        };
      }
    }

    return { allowed: true, limits };
  }

  /**
   * Check if tenant can process tokens
   */
  async canUseTokens(tokenCount: number): Promise<{ allowed: boolean; reason?: string }> {
    const limits = await this.getTenantLimits();

    // Check hourly token limit
    const hourlyTokens = await this.getTokensUsed('hour');
    if (hourlyTokens + tokenCount > limits.maxTokensPerHour) {
      return {
        allowed: false,
        reason: `Hourly token limit (${limits.maxTokensPerHour}) would be exceeded`
      };
    }

    // Check daily token limit
    const dailyTokens = await this.getTokensUsed('day');
    if (dailyTokens + tokenCount > limits.maxTokensPerDay) {
      return {
        allowed: false,
        reason: `Daily token limit (${limits.maxTokensPerDay}) would be exceeded`
      };
    }

    return { allowed: true };
  }

  /**
   * Check if tenant can incur cost
   */
  async canIncurCost(cost: number): Promise<{ allowed: boolean; reason?: string }> {
    const limits = await this.getTenantLimits();

    // Check daily cost limit (-1 means unlimited)
    if (limits.maxCostPerDay !== -1) {
      const dailyCost = await this.getCostIncurred('day');
      if (dailyCost + cost > limits.maxCostPerDay) {
        return {
          allowed: false,
          reason: `Daily cost limit ($${limits.maxCostPerDay}) would be exceeded`
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Check rate limit for API requests
   */
  async checkRateLimit(): Promise<{ allowed: boolean; reason?: string; resetTime?: Date }> {
    const limits = await this.getTenantLimits();
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    // Count requests in the last minute
    const recentRequests = await this.getRequestCount(oneMinuteAgo);

    if (recentRequests >= limits.maxRequestsPerMinute) {
      // Calculate when the rate limit resets (next minute)
      const resetTime = new Date(now.getTime() + 60 * 1000);
      return {
        allowed: false,
        reason: `Rate limit (${limits.maxRequestsPerMinute} requests/minute) exceeded`,
        resetTime
      };
    }

    return { allowed: true };
  }

  /**
   * Record token usage
   */
  async recordTokenUsage(tokenCount: number, cost: number): Promise<void> {
    // In a real implementation, you'd want a more sophisticated tracking system
    // For now, we'll just log it
    console.log(`Tenant ${this.tenant} used ${tokenCount} tokens costing $${cost}`);

    // TODO: Implement proper usage tracking with time windows
  }

  /**
   * Get tenant quota limits
   */
  private async getTenantLimits(): Promise<QuotaLimits> {
    try {
      const prisma = await getPrisma();
      const tenant = await prisma.tenant.findUnique({
        where: { shop: this.tenant },
        select: { planName: true }
      });

      // If tenant found and plan exists in quotas, return it
      if (tenant && tenant.planName && DEFAULT_QUOTAS[tenant.planName]) {
        return DEFAULT_QUOTAS[tenant.planName];
      }

      // Fallback to starter tier for safety (most restrictive)
      console.warn(`Tenant ${this.tenant} not found or invalid plan, defaulting to starter tier`);
      return DEFAULT_QUOTAS.starter;
    } catch (error) {
      console.error(`Error fetching tenant limits for ${this.tenant}:`, error);
      // On error, default to starter tier for safety
      return DEFAULT_QUOTAS.starter;
    }
  }

  /**
   * Get count of concurrent running jobs
   */
  private async getConcurrentJobsCount(): Promise<number> {
    const prisma = await getPrisma();
    const runningJobs = await prisma.indexJob.count({
      where: {
        tenant: this.tenant,
        status: 'running'
      }
    });

    return runningJobs;
  }

  /**
   * Get count of indexing jobs in time window
   */
  private async getIndexingJobsCount(timeWindow: 'hour' | 'day' | 'week'): Promise<number> {
    const prisma = await getPrisma();
    const now = new Date();
    let windowStart: Date;
    
    if (timeWindow === 'hour') {
      windowStart = new Date(now.getTime() - 60 * 60 * 1000);
    } else if (timeWindow === 'day') {
      windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else {
      // week = 7 days
      windowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const jobCount = await prisma.indexJob.count({
      where: {
        tenant: this.tenant,
        startedAt: {
          gte: windowStart,
          lte: now
        }
      }
    });

    return jobCount;
  }

  /**
   * Get tokens used in time window
   */
  private async getTokensUsed(timeWindow: 'hour' | 'day'): Promise<number> {
    const prisma = await getPrisma();
    const now = new Date();
    const windowStart = timeWindow === 'hour'
      ? new Date(now.getTime() - 60 * 60 * 1000)
      : new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const result = await prisma.indexJob.aggregate({
      where: {
        tenant: this.tenant,
        startedAt: {
          gte: windowStart,
          lte: now
        }
      },
      _sum: {
        tokensUsed: true
      }
    });

    return result._sum.tokensUsed || 0;
  }

  /**
   * Get cost incurred in time window
   */
  private async getCostIncurred(timeWindow: 'day' | 'month'): Promise<number> {
    const prisma = await getPrisma();
    const now = new Date();
    const windowStart = timeWindow === 'day'
      ? new Date(now.getTime() - 24 * 60 * 60 * 1000)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.indexJob.aggregate({
      where: {
        tenant: this.tenant,
        startedAt: {
          gte: windowStart,
          lte: now
        }
      },
      _sum: {
        actualCost: true
      }
    });

    return result._sum.actualCost || 0;
  }

  /**
   * Get request count in time window
   */
  private async getRequestCount(since: Date): Promise<number> {
    // In a real implementation, this would track API requests
    // For now, return 0 as we don't have request tracking implemented
    return 0;
  }
}

/**
 * Factory function to create quota service
 */
export function createQuotaService(tenant: string): QuotaService {
  return new QuotaService(tenant);
}

/**
 * Middleware function to check quotas before processing
 */
export async function checkIndexingQuota(tenant: string): Promise<{ allowed: boolean; reason?: string }> {
  const quotaService = createQuotaService(tenant);
  return await quotaService.canStartIndexingJob();
}

/**
 * Middleware function to check token quota
 */
export async function checkTokenQuota(tenant: string, tokenCount: number): Promise<{ allowed: boolean; reason?: string }> {
  const quotaService = createQuotaService(tenant);
  return await quotaService.canUseTokens(tokenCount);
}

/**
 * Middleware function to check rate limits
 */
export async function checkRateLimit(tenant: string): Promise<{ allowed: boolean; reason?: string; resetTime?: Date }> {
  const quotaService = createQuotaService(tenant);
  return await quotaService.checkRateLimit();
}


