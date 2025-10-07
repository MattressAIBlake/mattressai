import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Shopify Billing Service
 * Handles subscription plans, usage tracking, and billing guards
 */

export interface PlanConfig {
  name: 'starter' | 'pro' | 'enterprise';
  price: number;
  features: {
    tokens: number;
    alertsPerHour: number;
    smsEnabled: boolean;
    vectorQueries: number;
    indexJobs: number;
    priorityIndexing: boolean;
  };
}

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  starter: {
    name: 'starter',
    price: 0,
    features: {
      tokens: 100000,
      alertsPerHour: 20,
      smsEnabled: false,
      vectorQueries: 10000,
      indexJobs: 5,
      priorityIndexing: false
    }
  },
  pro: {
    name: 'pro',
    price: 49,
    features: {
      tokens: 500000,
      alertsPerHour: 100,
      smsEnabled: true,
      vectorQueries: 50000,
      indexJobs: 20,
      priorityIndexing: false
    }
  },
  enterprise: {
    name: 'enterprise',
    price: 199,
    features: {
      tokens: 2000000,
      alertsPerHour: 500,
      smsEnabled: true,
      vectorQueries: 200000,
      indexJobs: 100,
      priorityIndexing: true
    }
  }
};

/**
 * Initialize default plans in database
 */
export async function initializePlans() {
  for (const config of Object.values(PLAN_CONFIGS)) {
    await prisma.plan.upsert({
      where: { name: config.name },
      update: {
        price: config.price,
        features: JSON.stringify(config.features)
      },
      create: {
        name: config.name,
        price: config.price,
        features: JSON.stringify(config.features)
      }
    });
  }
}

/**
 * Get or create tenant record
 */
export async function getOrCreateTenant(shop: string) {
  let tenant = await prisma.tenant.findUnique({
    where: { shop }
  });

  if (!tenant) {
    // Create new tenant with starter plan and 14-day trial
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    tenant = await prisma.tenant.create({
      data: {
        id: shop,
        shop,
        planName: 'starter',
        trialEndsAt,
        quotas: JSON.stringify(PLAN_CONFIGS.starter.features)
      }
    });
  }

  return tenant;
}

/**
 * Get tenant's current plan
 */
export async function getTenantPlan(shop: string): Promise<PlanConfig> {
  const tenant = await getOrCreateTenant(shop);
  return PLAN_CONFIGS[tenant.planName] || PLAN_CONFIGS.starter;
}

/**
 * Check if tenant has access to a feature
 */
export async function checkFeatureAccess(
  shop: string,
  feature: 'smsEnabled' | 'priorityIndexing'
): Promise<boolean> {
  const plan = await getTenantPlan(shop);
  return plan.features[feature] || false;
}

/**
 * Check if tenant is within quota
 */
export async function checkQuota(
  shop: string,
  quotaType: 'tokens' | 'alertsPerHour' | 'vectorQueries' | 'indexJobs',
  currentUsage: number
): Promise<{ withinQuota: boolean; limit: number; usage: number }> {
  const plan = await getTenantPlan(shop);
  const limit = plan.features[quotaType];

  return {
    withinQuota: currentUsage < limit,
    limit,
    usage: currentUsage
  };
}

/**
 * Upgrade tenant plan
 */
export async function upgradePlan(shop: string, planName: 'pro' | 'enterprise', billingId?: string) {
  const config = PLAN_CONFIGS[planName];
  
  if (!config) {
    throw new Error(`Invalid plan: ${planName}`);
  }

  await prisma.tenant.update({
    where: { shop },
    data: {
      planName,
      billingId,
      quotas: JSON.stringify(config.features)
    }
  });
}

/**
 * Downgrade tenant plan
 */
export async function downgradePlan(shop: string) {
  await prisma.tenant.update({
    where: { shop },
    data: {
      planName: 'starter',
      billingId: null,
      quotas: JSON.stringify(PLAN_CONFIGS.starter.features)
    }
  });
}

/**
 * Get usage statistics for tenant
 */
export async function getUsageStats(tenantId: string, period: 'current_month' | 'last_30_days' = 'current_month') {
  const now = new Date();
  let startDate: Date;

  if (period === 'current_month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Get token usage from index jobs
  const indexJobs = await prisma.indexJob.findMany({
    where: {
      tenant: tenantId,
      createdAt: { gte: startDate }
    }
  });

  const tokensUsed = indexJobs.reduce((sum, job) => sum + job.tokensUsed, 0);
  const totalCost = indexJobs.reduce((sum, job) => sum + (job.actualCost || 0), 0);

  // Get alert counts
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const alertsLastHour = await prisma.alert.count({
    where: {
      tenantId,
      createdAt: { gte: oneHourAgo }
    }
  });

  const totalAlerts = await prisma.alert.count({
    where: {
      tenantId,
      createdAt: { gte: startDate }
    }
  });

  // Get session counts
  const totalSessions = await prisma.chatSession.count({
    where: {
      tenantId,
      startedAt: { gte: startDate }
    }
  });

  // Get lead counts
  const totalLeads = await prisma.lead.count({
    where: {
      tenantId,
      createdAt: { gte: startDate }
    }
  });

  // Get event counts
  const totalEvents = await prisma.event.count({
    where: {
      tenantId,
      timestamp: { gte: startDate }
    }
  });

  // Get index job counts
  const totalIndexJobs = indexJobs.length;
  const runningIndexJobs = indexJobs.filter(j => j.status === 'running').length;

  return {
    period,
    startDate: startDate.toISOString(),
    endDate: now.toISOString(),
    tokensUsed,
    totalCost,
    alertsLastHour,
    totalAlerts,
    totalSessions,
    totalLeads,
    totalEvents,
    totalIndexJobs,
    runningIndexJobs
  };
}

/**
 * Plan comparison for upgrade UI
 */
export function getPlanComparison() {
  return Object.entries(PLAN_CONFIGS).map(([key, config]) => ({
    name: config.name,
    displayName: config.name.charAt(0).toUpperCase() + config.name.slice(1),
    price: config.price,
    priceDisplay: config.price === 0 ? 'Free' : `$${config.price}/mo`,
    features: {
      tokens: `${(config.features.tokens / 1000).toLocaleString()}K tokens/month`,
      alertsPerHour: `${config.features.alertsPerHour} alerts/hour`,
      smsAlerts: config.features.smsEnabled ? 'Included' : 'Not included',
      vectorQueries: `${(config.features.vectorQueries / 1000).toLocaleString()}K queries/month`,
      indexJobs: `${config.features.indexJobs} concurrent jobs`,
      priorityIndexing: config.features.priorityIndexing ? 'Yes' : 'No'
    }
  }));
}

/**
 * Check if plan upgrade is required
 */
export function requiresPlanUpgrade(currentPlan: string, requiredPlan: 'pro' | 'enterprise'): boolean {
  const planHierarchy = ['starter', 'pro', 'enterprise'];
  const currentIndex = planHierarchy.indexOf(currentPlan);
  const requiredIndex = planHierarchy.indexOf(requiredPlan);
  
  return currentIndex < requiredIndex;
}


