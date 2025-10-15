import { json } from '@remix-run/node';
import { getTenantPlan, requiresPlanUpgrade, type PlanConfig } from './billing.service.server';

/**
 * Billing Middleware
 * Protects routes that require specific plan levels
 */

export interface BillingContext {
  shop: string;
  plan: PlanConfig;
}

/**
 * Require a specific plan or higher
 */
export async function requirePlan(
  shop: string,
  minPlan: 'pro' | 'enterprise'
): Promise<{ allowed: boolean; plan: PlanConfig; error?: any }> {
  const plan = await getTenantPlan(shop);
  
  const upgradeRequired = requiresPlanUpgrade(plan.name, minPlan);
  
  if (upgradeRequired) {
    return {
      allowed: false,
      plan,
      error: json(
        {
          error: 'Plan upgrade required',
          message: `This feature requires the ${minPlan} plan or higher`,
          currentPlan: plan.name,
          requiredPlan: minPlan,
          upgradeUrl: `/admin/plans`
        },
        { status: 403 }
      )
    };
  }
  
  return { allowed: true, plan };
}

/**
 * Check if feature is enabled for tenant
 */
export async function requireFeature(
  shop: string,
  feature: 'smsEnabled' | 'priorityIndexing'
): Promise<{ allowed: boolean; plan: PlanConfig; error?: any }> {
  const plan = await getTenantPlan(shop);
  
  if (!plan.features[feature]) {
    return {
      allowed: false,
      plan,
      error: json(
        {
          error: 'Feature not available',
          message: `This feature is not available on your current plan`,
          currentPlan: plan.name,
          upgradeUrl: `/admin/plans`
        },
        { status: 403 }
      )
    };
  }
  
  return { allowed: true, plan };
}

/**
 * Get billing context from shop
 */
export async function getBillingContext(shop: string): Promise<BillingContext> {
  const plan = await getTenantPlan(shop);
  
  return {
    shop,
    plan
  };
}


