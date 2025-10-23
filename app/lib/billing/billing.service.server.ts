/**
 * Shopify Billing Service
 * Handles subscription plans, usage tracking, and billing guards
 */

// Lazy-load prisma to avoid bundling issues
const getPrisma = async () => {
  const { prisma } = await import('~/db.server');
  return prisma;
};

export interface PlanConfig {
  name: 'starter' | 'pro' | 'enterprise';
  price: number;
  features: {
    tokens: number;
    alertsPerDay: number;
    smsEnabled: boolean;
    vectorQueries: number;
    indexJobs: number;
    priorityIndexing: boolean;
  };
  guidance: string;
}

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  starter: {
    name: 'starter',
    price: 0,
    features: {
      tokens: 100000,
      alertsPerDay: 2,
      smsEnabled: false,
      vectorQueries: 10000,
      indexJobs: 2,
      priorityIndexing: false
    },
    guidance: 'Best for stores with 0-75 unique visitors per day'
  },
  pro: {
    name: 'pro',
    price: 49,
    features: {
      tokens: 500000,
      alertsPerDay: 50,
      smsEnabled: true,
      vectorQueries: 50000,
      indexJobs: 5,
      priorityIndexing: false
    },
    guidance: 'Best for stores with 75-250 unique visitors per day'
  },
  enterprise: {
    name: 'enterprise',
    price: 199,
    features: {
      tokens: 2000000,
      alertsPerDay: -1,
      smsEnabled: true,
      vectorQueries: 200000,
      indexJobs: -1,
      priorityIndexing: true
    },
    guidance: 'Best for stores with 250+ unique visitors per day'
  }
};

/**
 * Initialize default plans in database
 */
export async function initializePlans() {
  const prisma = await getPrisma();
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
  const prisma = await getPrisma();
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
  const prisma = await getPrisma();
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
  quotaType: 'tokens' | 'alertsPerDay' | 'vectorQueries' | 'indexJobs',
  currentUsage: number
): Promise<{ withinQuota: boolean; limit: number; usage: number }> {
  const plan = await getTenantPlan(shop);
  const limit = plan.features[quotaType];

  // Unlimited plans (indicated by -1) are always within quota
  if (limit === -1) {
    return {
      withinQuota: true,
      limit: -1,
      usage: currentUsage
    };
  }

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
  const prisma = await getPrisma();
  const config = PLAN_CONFIGS[planName];
  
  if (!config) {
    throw new Error(`Invalid plan: ${planName}`);
  }

  await prisma.tenant.update({
    where: { shop },
    data: {
      planName,
      billingId,
      billingStatus: 'ACTIVE',
      quotas: JSON.stringify(config.features)
    }
  });
}

/**
 * Downgrade tenant plan
 */
export async function downgradePlan(shop: string) {
  const prisma = await getPrisma();
  await prisma.tenant.update({
    where: { shop },
    data: {
      planName: 'starter',
      billingId: null,
      billingStatus: null,
      quotas: JSON.stringify(PLAN_CONFIGS.starter.features)
    }
  });
}

/**
 * Get usage statistics for tenant
 */
export async function getUsageStats(tenantId: string, period: 'current_month' | 'last_30_days' = 'current_month') {
  const prisma = await getPrisma();
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
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const alertsToday = await prisma.alert.count({
    where: {
      tenantId,
      createdAt: { gte: oneDayAgo }
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
    alertsToday,
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
    guidance: config.guidance,
    features: {
      tokens: `${(config.features.tokens / 1000).toLocaleString()}K tokens/month`,
      alertsPerDay: config.features.alertsPerDay === -1 ? 'Unlimited alerts/day' : `${config.features.alertsPerDay} alerts/day`,
      smsAlerts: config.features.smsEnabled ? 'Included' : 'Not included',
      vectorQueries: `${(config.features.vectorQueries / 1000).toLocaleString()}K queries/month`,
      indexJobs: config.features.indexJobs === -1 ? 'Unlimited concurrent jobs' : `${config.features.indexJobs} concurrent jobs`,
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

/**
 * Get active subscription from Shopify
 * Returns the current active subscription if it exists
 */
export async function getActiveSubscription(shop: string, admin: any) {
  const prisma = await getPrisma();
  try {
    const response = await admin.graphql(
      `#graphql
        query {
          currentAppInstallation {
            activeSubscriptions {
              id
              name
              status
              test
              lineItems {
                id
                plan {
                  pricingDetails {
                    ... on AppRecurringPricing {
                      price {
                        amount
                        currencyCode
                      }
                      interval
                    }
                  }
                }
              }
            }
          }
        }`
    );

    const data = await response.json();
    const subscriptions = data.data?.currentAppInstallation?.activeSubscriptions || [];
    
    // Return the first active subscription (there should only be one)
    return subscriptions.find((sub: any) => sub.status === 'ACTIVE');
  } catch (error) {
    console.error('Error fetching active subscription:', error);
    return null;
  }
}

/**
 * Cancel an existing subscription
 */
export async function cancelSubscription(shop: string, admin: any, subscriptionId: string) {
  const response = await admin.graphql(
    `#graphql
      mutation AppSubscriptionCancel($id: ID!) {
        appSubscriptionCancel(id: $id) {
          userErrors {
            field
            message
          }
          appSubscription {
            id
            status
          }
        }
      }`,
    {
      variables: {
        id: subscriptionId
      }
    }
  );
  
  const data = await response.json();
  const result = data.data?.appSubscriptionCancel;
  
  if (result?.userErrors && result.userErrors.length > 0) {
    throw new Error(`Cancel failed: ${result.userErrors.map((e: any) => e.message).join(', ')}`);
  }
  
  return result?.appSubscription;
}

/**
 * Request billing approval for a plan
 * Creates a subscription and returns the confirmation URL
 */
export async function requestBillingApproval(
  shop: string,
  admin: any,
  planName: 'pro' | 'enterprise',
  returnUrl: string
) {
  const planConfigs = {
    pro: { price: 49, name: 'Pro Plan' },
    enterprise: { price: 199, name: 'Enterprise Plan' }
  };

  const planConfig = planConfigs[planName];
  
  if (!planConfig) {
    throw new Error(`Invalid plan: ${planName}`);
  }

  const response = await admin.graphql(
    `#graphql
      mutation AppSubscriptionCreate($name: String!, $returnUrl: URL!, $test: Boolean, $lineItems: [AppSubscriptionLineItemInput!]!) {
        appSubscriptionCreate(
          name: $name
          returnUrl: $returnUrl
          test: $test
          lineItems: $lineItems
        ) {
          userErrors {
            field
            message
          }
          confirmationUrl
          appSubscription {
            id
            status
          }
        }
      }`,
    {
      variables: {
        name: planConfig.name,
        returnUrl: returnUrl,
        test: null,
        lineItems: [
          {
            plan: {
              appRecurringPricingDetails: {
                price: { amount: planConfig.price, currencyCode: 'USD' },
                interval: 'EVERY_30_DAYS'
              }
            }
          }
        ]
      }
    }
  );

  const data = await response.json();
  const result = data.data?.appSubscriptionCreate;

  if (result?.userErrors && result.userErrors.length > 0) {
    throw new Error(`Billing API error: ${result.userErrors.map((e: any) => e.message).join(', ')}`);
  }

  return {
    confirmationUrl: result?.confirmationUrl,
    subscriptionId: result?.appSubscription?.id
  };
}


