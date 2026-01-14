"use client";

/**
 * Feature Gate Hook
 * 
 * Client-side hook for checking feature access based on subscription tier.
 * Provides real-time feature gating with upgrade prompts.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { FeatureKey, FeatureGateResult, PlanTier, SubscriptionPlan, PlanLimits } from "../types";
import { PLAN_LIMITS, getRequiredTierForFeature, isTierHigherOrEqual, formatLimit } from "../subscription/plans";
import { FEATURES, getUpgradeMessage } from "../subscription/featureFlags";

interface UseFeatureGateReturn extends FeatureGateResult {
  isLoading: boolean;
  subscription: SubscriptionPlan | null;
  checkFeature: (feature: FeatureKey) => FeatureGateResult;
  checkLimit: (limitKey: keyof PlanLimits, currentUsage: number) => FeatureGateResult;
}

/**
 * Hook to check feature access for the current account
 */
export const useFeatureGate = (feature?: FeatureKey): UseFeatureGateReturn => {
  const { currentAccount } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!currentAccount?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/subscription?accountId=${currentAccount.id}`);
        if (response.ok) {
          const data = await response.json();
          setSubscription(data.subscription);
        }
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [currentAccount?.id]);

  /**
   * Check access to a specific feature
   */
  const checkFeature = useCallback((featureToCheck: FeatureKey): FeatureGateResult => {
    if (!subscription) {
      // Default to free tier limits if subscription not loaded
      return checkFeatureAccess("free", featureToCheck);
    }
    return checkFeatureAccess(subscription.tier, featureToCheck);
  }, [subscription]);

  /**
   * Check a numeric limit
   */
  const checkLimit = useCallback((
    limitKey: keyof PlanLimits,
    currentUsage: number
  ): FeatureGateResult => {
    const tier = subscription?.tier || "free";
    const limits = PLAN_LIMITS[tier];
    const limit = limits[limitKey];

    if (typeof limit !== "number") {
      return {
        hasAccess: true,
        upgradeRequired: false,
      };
    }

    // -1 means unlimited
    if (limit === -1) {
      return {
        hasAccess: true,
        currentUsage,
        limit: -1,
        upgradeRequired: false,
      };
    }

    const hasAccess = currentUsage < limit;
    const requiredTier = hasAccess ? undefined : getNextTierWithHigherLimit(tier, limitKey);

    return {
      hasAccess,
      currentUsage,
      limit,
      upgradeRequired: !hasAccess,
      requiredTier,
      message: hasAccess ? undefined : `You've reached your limit of ${formatLimit(limit)}. Upgrade to get more.`,
    };
  }, [subscription]);

  // Default result for the specified feature
  const defaultResult = feature ? checkFeature(feature) : {
    hasAccess: true,
    upgradeRequired: false,
  };

  return {
    ...defaultResult,
    isLoading,
    subscription,
    checkFeature,
    checkLimit,
  };
};

/**
 * Check feature access for a given tier
 */
const checkFeatureAccess = (tier: PlanTier, feature: FeatureKey): FeatureGateResult => {
  const featureDef = FEATURES[feature];
  const requiredTier = featureDef.requiredTier;
  const hasAccess = isTierHigherOrEqual(tier, requiredTier);

  if (hasAccess) {
    // Check if it's a numeric limit feature
    if (featureDef.limitType === "numeric" && featureDef.limitKey) {
      const limits = PLAN_LIMITS[tier];
      const limit = limits[featureDef.limitKey];
      return {
        hasAccess: true,
        limit: typeof limit === "number" ? limit : undefined,
        upgradeRequired: false,
      };
    }

    return {
      hasAccess: true,
      upgradeRequired: false,
    };
  }

  return {
    hasAccess: false,
    upgradeRequired: true,
    requiredTier,
    message: getUpgradeMessage(feature),
  };
};

/**
 * Get the next tier that has a higher limit for a given limit key
 */
const getNextTierWithHigherLimit = (
  currentTier: PlanTier,
  limitKey: keyof PlanLimits
): PlanTier | undefined => {
  const tiers: PlanTier[] = ["free", "starter", "pro", "enterprise"];
  const currentIndex = tiers.indexOf(currentTier);
  const currentLimit = PLAN_LIMITS[currentTier][limitKey];

  for (let i = currentIndex + 1; i < tiers.length; i++) {
    const tierLimit = PLAN_LIMITS[tiers[i]][limitKey];
    
    // Check if next tier has higher or unlimited (-1) limit
    if (typeof tierLimit === "number" && typeof currentLimit === "number") {
      if (tierLimit === -1 || tierLimit > currentLimit) {
        return tiers[i];
      }
    }
  }

  return undefined;
};

/**
 * Hook to check multiple features at once
 */
export const useFeatureGates = (features: FeatureKey[]): {
  isLoading: boolean;
  results: Record<FeatureKey, FeatureGateResult>;
  hasAllAccess: boolean;
  missingFeatures: FeatureKey[];
} => {
  const { checkFeature, isLoading } = useFeatureGate();

  const results = features.reduce((acc, feature) => {
    acc[feature] = checkFeature(feature);
    return acc;
  }, {} as Record<FeatureKey, FeatureGateResult>);

  const missingFeatures = features.filter((f) => !results[f].hasAccess);
  const hasAllAccess = missingFeatures.length === 0;

  return {
    isLoading,
    results,
    hasAllAccess,
    missingFeatures,
  };
};

/**
 * Hook specifically for usage limits
 */
export const useUsageLimits = (): {
  isLoading: boolean;
  limits: {
    campaigns: { used: number; limit: number; percentage: number };
    assets: { used: number; limit: number; percentage: number };
    teamMembers: { used: number; limit: number; percentage: number };
    integrations: { used: number; limit: number; percentage: number };
  } | null;
  refetch: () => void;
} => {
  const { currentAccount } = useAuth();
  const [limits, setLimits] = useState<{
    campaigns: { used: number; limit: number; percentage: number };
    assets: { used: number; limit: number; percentage: number };
    teamMembers: { used: number; limit: number; percentage: number };
    integrations: { used: number; limit: number; percentage: number };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLimits = useCallback(async () => {
    if (!currentAccount?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/billing/usage?accountId=${currentAccount.id}`);
      if (response.ok) {
        const data = await response.json();
        setLimits(data.usage);
      }
    } catch (error) {
      console.error("Failed to fetch usage limits:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentAccount?.id]);

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  return {
    isLoading,
    limits,
    refetch: fetchLimits,
  };
};

/**
 * Simple hook to check a single feature's access
 */
export const useHasFeature = (feature: FeatureKey): boolean => {
  const { hasAccess, isLoading } = useFeatureGate(feature);
  return !isLoading && hasAccess;
};

export default useFeatureGate;
