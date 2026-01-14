/**
 * Feature Gate Middleware
 * 
 * Server-side middleware for protecting API routes based on subscription tier.
 * Enforces feature access and usage limits at the API level.
 */

import { NextResponse } from "next/server";
import type { FeatureKey, PlanLimits, PlanTier } from "../types";
import { getOrCreateSubscription, getAccountLimits } from "../subscription/subscriptionService";
import { PLAN_LIMITS, isTierHigherOrEqual, getRequiredTierForFeature } from "../subscription/plans";
import { FEATURES, getUpgradeMessage } from "../subscription/featureFlags";

/**
 * Error class for paywall rejections
 */
export class PaywallError extends Error {
  public readonly requiredTier: PlanTier;
  public readonly feature: FeatureKey;
  public readonly statusCode: number = 403;

  constructor(feature: FeatureKey, requiredTier: PlanTier) {
    super(getUpgradeMessage(feature));
    this.name = "PaywallError";
    this.feature = feature;
    this.requiredTier = requiredTier;
  }
}

/**
 * Error class for usage limit exceeded
 */
export class UsageLimitError extends Error {
  public readonly limit: number;
  public readonly currentUsage: number;
  public readonly limitKey: keyof PlanLimits;
  public readonly statusCode: number = 429;

  constructor(limitKey: keyof PlanLimits, limit: number, currentUsage: number) {
    super(`You've reached your ${limitKey} limit of ${limit}. Please upgrade to continue.`);
    this.name = "UsageLimitError";
    this.limitKey = limitKey;
    this.limit = limit;
    this.currentUsage = currentUsage;
  }
}

/**
 * Check if an account has access to a feature
 * @throws PaywallError if access is denied
 */
export const requireFeature = async (
  accountId: string,
  feature: FeatureKey
): Promise<void> => {
  const subscription = await getOrCreateSubscription(accountId);
  const featureDef = FEATURES[feature];
  const requiredTier = featureDef.requiredTier;

  if (!isTierHigherOrEqual(subscription.tier, requiredTier)) {
    throw new PaywallError(feature, requiredTier);
  }
};

/**
 * Check if an account is within a usage limit
 * @throws UsageLimitError if limit is exceeded
 */
export const requireWithinLimit = async (
  accountId: string,
  limitKey: keyof PlanLimits,
  currentUsage: number
): Promise<void> => {
  const limits = await getAccountLimits(accountId);
  const limit = limits[limitKey];

  if (typeof limit !== "number") {
    return; // Not a numeric limit
  }

  // -1 means unlimited
  if (limit === -1) {
    return;
  }

  if (currentUsage >= limit) {
    throw new UsageLimitError(limitKey, limit, currentUsage);
  }
};

/**
 * Check feature access and return result (non-throwing)
 */
export const checkFeatureAccess = async (
  accountId: string,
  feature: FeatureKey
): Promise<{
  hasAccess: boolean;
  requiredTier?: PlanTier;
  message?: string;
}> => {
  try {
    await requireFeature(accountId, feature);
    return { hasAccess: true };
  } catch (error) {
    if (error instanceof PaywallError) {
      return {
        hasAccess: false,
        requiredTier: error.requiredTier,
        message: error.message,
      };
    }
    throw error;
  }
};

/**
 * Check usage limit and return result (non-throwing)
 */
export const checkUsageLimit = async (
  accountId: string,
  limitKey: keyof PlanLimits,
  currentUsage: number
): Promise<{
  withinLimit: boolean;
  limit: number;
  currentUsage: number;
  message?: string;
}> => {
  const limits = await getAccountLimits(accountId);
  const limit = limits[limitKey];

  if (typeof limit !== "number") {
    return {
      withinLimit: true,
      limit: -1,
      currentUsage,
    };
  }

  if (limit === -1) {
    return {
      withinLimit: true,
      limit: -1,
      currentUsage,
    };
  }

  const withinLimit = currentUsage < limit;

  return {
    withinLimit,
    limit,
    currentUsage,
    message: withinLimit ? undefined : `You've reached your limit of ${limit}. Please upgrade.`,
  };
};

/**
 * Create a standard paywall response
 */
export const createPaywallResponse = (error: PaywallError): NextResponse => {
  return NextResponse.json(
    {
      error: "feature_locked",
      message: error.message,
      requiredTier: error.requiredTier,
      feature: error.feature,
      upgradeUrl: `/settings?tab=billing&upgrade=${error.requiredTier}`,
    },
    { status: 403 }
  );
};

/**
 * Create a standard usage limit response
 */
export const createUsageLimitResponse = (error: UsageLimitError): NextResponse => {
  return NextResponse.json(
    {
      error: "usage_limit_exceeded",
      message: error.message,
      limitKey: error.limitKey,
      limit: error.limit,
      currentUsage: error.currentUsage,
      upgradeUrl: "/settings?tab=billing",
    },
    { status: 429 }
  );
};

/**
 * Wrapper to handle feature gate errors in API routes
 */
export const withFeatureGate = <T>(
  handler: () => Promise<T>,
  onPaywallError?: (error: PaywallError) => NextResponse,
  onUsageLimitError?: (error: UsageLimitError) => NextResponse
): Promise<T | NextResponse> => {
  return handler().catch((error) => {
    if (error instanceof PaywallError) {
      return onPaywallError ? onPaywallError(error) : createPaywallResponse(error);
    }
    if (error instanceof UsageLimitError) {
      return onUsageLimitError ? onUsageLimitError(error) : createUsageLimitResponse(error);
    }
    throw error;
  });
};

/**
 * Get current tier for an account
 */
export const getAccountTier = async (accountId: string): Promise<PlanTier> => {
  const subscription = await getOrCreateSubscription(accountId);
  return subscription.tier;
};

/**
 * Check if account is on paid plan
 */
export const isOnPaidPlan = async (accountId: string): Promise<boolean> => {
  const tier = await getAccountTier(accountId);
  return tier !== "free";
};

/**
 * Batch check multiple features
 */
export const checkMultipleFeatures = async (
  accountId: string,
  features: FeatureKey[]
): Promise<Record<FeatureKey, boolean>> => {
  const subscription = await getOrCreateSubscription(accountId);
  
  return features.reduce((acc, feature) => {
    const featureDef = FEATURES[feature];
    acc[feature] = isTierHigherOrEqual(subscription.tier, featureDef.requiredTier);
    return acc;
  }, {} as Record<FeatureKey, boolean>);
};
