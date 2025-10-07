import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * A/B Testing Service
 * Handles variant assignment, tracking, and experiment management
 */

export interface ExperimentConfig {
  id?: string;
  tenantId: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  startAt?: Date;
  endAt?: Date | null;
  variants: VariantConfig[];
}

export interface VariantConfig {
  id?: string;
  name: string;
  splitPercent: number;
  promptVersionId?: string;
  rulesOverrideJson?: string;
}

export interface VariantAssignment {
  variantId: string;
  variantName: string;
  experimentId: string;
  promptVersionId?: string;
  rulesOverride?: any;
}

/**
 * Get active experiment for a tenant
 */
export async function getActiveExperiment(tenantId: string) {
  const experiment = await prisma.experiment.findFirst({
    where: {
      tenantId,
      status: 'active',
      startAt: { lte: new Date() },
      OR: [
        { endAt: null },
        { endAt: { gte: new Date() } }
      ]
    },
    include: {
      variants: true
    }
  });

  return experiment;
}

/**
 * Assign a variant to a session using weighted random distribution
 */
export async function assignVariant(tenantId: string): Promise<VariantAssignment | null> {
  const experiment = await getActiveExperiment(tenantId);
  
  if (!experiment || !experiment.variants || experiment.variants.length === 0) {
    return null;
  }

  // Weighted random selection
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const variant of experiment.variants) {
    cumulative += variant.splitPercent;
    if (random <= cumulative) {
      return {
        variantId: variant.id,
        variantName: variant.name,
        experimentId: experiment.id,
        promptVersionId: variant.promptVersionId || undefined,
        rulesOverride: variant.rulesOverrideJson ? JSON.parse(variant.rulesOverrideJson) : undefined
      };
    }
  }

  // Fallback to first variant (should not happen if splits sum to 100)
  const fallbackVariant = experiment.variants[0];
  return {
    variantId: fallbackVariant.id,
    variantName: fallbackVariant.name,
    experimentId: experiment.id,
    promptVersionId: fallbackVariant.promptVersionId || undefined,
    rulesOverride: fallbackVariant.rulesOverrideJson ? JSON.parse(fallbackVariant.rulesOverrideJson) : undefined
  };
}

/**
 * Create a new experiment
 */
export async function createExperiment(config: ExperimentConfig) {
  // Validate split percentages sum to 100
  const totalSplit = config.variants.reduce((sum, v) => sum + v.splitPercent, 0);
  if (totalSplit !== 100) {
    throw new Error(`Variant split percentages must sum to 100, got ${totalSplit}`);
  }

  const experiment = await prisma.experiment.create({
    data: {
      tenantId: config.tenantId,
      name: config.name,
      status: config.status,
      startAt: config.startAt || new Date(),
      endAt: config.endAt,
      variants: {
        create: config.variants.map(v => ({
          name: v.name,
          splitPercent: v.splitPercent,
          promptVersionId: v.promptVersionId,
          rulesOverrideJson: v.rulesOverrideJson
        }))
      }
    },
    include: {
      variants: true
    }
  });

  return experiment;
}

/**
 * Update experiment status
 */
export async function updateExperimentStatus(
  experimentId: string,
  status: 'active' | 'paused' | 'completed'
) {
  const experiment = await prisma.experiment.update({
    where: { id: experimentId },
    data: { 
      status,
      ...(status === 'completed' ? { endAt: new Date() } : {})
    }
  });

  return experiment;
}

/**
 * Get experiment metrics
 */
export async function getExperimentMetrics(experimentId: string) {
  const experiment = await prisma.experiment.findUnique({
    where: { id: experimentId },
    include: { variants: true }
  });

  if (!experiment) {
    throw new Error('Experiment not found');
  }

  const variantIds = experiment.variants.map(v => v.id);

  // Get metrics for each variant
  const metrics = await Promise.all(
    experiment.variants.map(async (variant) => {
      // Sessions
      const sessionCount = await prisma.chatSession.count({
        where: { variantId: variant.id }
      });

      // Leads
      const leadCount = await prisma.lead.count({
        where: { variantId: variant.id }
      });

      // Events
      const addToCartCount = await prisma.event.count({
        where: { 
          variantId: variant.id,
          type: 'add_to_cart'
        }
      });

      const checkoutCount = await prisma.event.count({
        where: { 
          variantId: variant.id,
          type: 'checkout_started'
        }
      });

      const orderCount = await prisma.event.count({
        where: { 
          variantId: variant.id,
          type: 'order_placed'
        }
      });

      return {
        variantId: variant.id,
        variantName: variant.name,
        splitPercent: variant.splitPercent,
        sessions: sessionCount,
        leads: leadCount,
        leadRate: sessionCount > 0 ? (leadCount / sessionCount) * 100 : 0,
        addToCarts: addToCartCount,
        addToCartRate: sessionCount > 0 ? (addToCartCount / sessionCount) * 100 : 0,
        checkouts: checkoutCount,
        checkoutRate: sessionCount > 0 ? (checkoutCount / sessionCount) * 100 : 0,
        orders: orderCount,
        conversionRate: sessionCount > 0 ? (orderCount / sessionCount) * 100 : 0
      };
    })
  );

  return {
    experiment,
    metrics
  };
}

/**
 * Calculate statistical significance (simple two-proportion z-test)
 */
export function calculateSignificance(
  variant1: { successes: number; trials: number },
  variant2: { successes: number; trials: number }
): { zScore: number; pValue: number; significant: boolean } {
  const p1 = variant1.trials > 0 ? variant1.successes / variant1.trials : 0;
  const p2 = variant2.trials > 0 ? variant2.successes / variant2.trials : 0;

  if (variant1.trials === 0 || variant2.trials === 0) {
    return { zScore: 0, pValue: 1, significant: false };
  }

  const pooledP = (variant1.successes + variant2.successes) / (variant1.trials + variant2.trials);
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / variant1.trials + 1 / variant2.trials));

  if (se === 0) {
    return { zScore: 0, pValue: 1, significant: false };
  }

  const zScore = (p1 - p2) / se;
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore))); // Two-tailed test

  return {
    zScore,
    pValue,
    significant: pValue < 0.05
  };
}

/**
 * Normal cumulative distribution function (approximation)
 */
function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - prob : prob;
}

/**
 * List experiments for a tenant
 */
export async function listExperiments(tenantId: string, includeCompleted = false) {
  const where: any = { tenantId };
  
  if (!includeCompleted) {
    where.status = { in: ['active', 'paused'] };
  }

  const experiments = await prisma.experiment.findMany({
    where,
    include: { variants: true },
    orderBy: { createdAt: 'desc' }
  });

  return experiments;
}


