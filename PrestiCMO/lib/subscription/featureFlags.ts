/**
 * Feature Flags
 * 
 * Centralized feature flag definitions and utilities.
 * Used by both client and server components for feature gating.
 */

import type { FeatureKey, PlanTier, PlanLimits } from "../types";
import { PLAN_LIMITS, getRequiredTierForFeature, isTierHigherOrEqual } from "./plans";

export interface FeatureDefinition {
  key: FeatureKey;
  name: string;
  description: string;
  requiredTier: PlanTier;
  limitType: "boolean" | "numeric";
  limitKey?: keyof PlanLimits;
}

/**
 * All feature definitions
 */
export const FEATURES: Record<FeatureKey, FeatureDefinition> = {
  advanced_analytics: {
    key: "advanced_analytics",
    name: "Advanced Analytics",
    description: "In-depth performance analytics and reporting",
    requiredTier: "pro",
    limitType: "boolean",
    limitKey: "hasAdvancedAnalytics",
  },
  brand_pulse: {
    key: "brand_pulse",
    name: "Brand Pulse",
    description: "Real-time brand health monitoring and alerts",
    requiredTier: "pro",
    limitType: "boolean",
    limitKey: "hasBrandPulse",
  },
  creative_insights: {
    key: "creative_insights",
    name: "Creative Insights",
    description: "AI-powered creative performance analysis",
    requiredTier: "pro",
    limitType: "boolean",
    limitKey: "hasCreativeInsights",
  },
  automation_rules: {
    key: "automation_rules",
    name: "Automation Rules",
    description: "Automated budget and campaign optimization rules",
    requiredTier: "pro",
    limitType: "boolean",
    limitKey: "hasAutomationRules",
  },
  shopify_integration: {
    key: "shopify_integration",
    name: "Shopify Integration",
    description: "Connect your Shopify store for seamless product syncing",
    requiredTier: "starter",
    limitType: "boolean",
    limitKey: "hasShopifyIntegration",
  },
  erp_integration: {
    key: "erp_integration",
    name: "ERP Integration",
    description: "Connect to STORIS, Furniture Wizard, and other ERPs",
    requiredTier: "pro",
    limitType: "boolean",
    limitKey: "hasERPIntegration",
  },
  priority_support: {
    key: "priority_support",
    name: "Priority Support",
    description: "Dedicated support with guaranteed response times",
    requiredTier: "enterprise",
    limitType: "boolean",
    limitKey: "hasPrioritySupport",
  },
  aicmo: {
    key: "aicmo",
    name: "AI CMO Assistant",
    description: "AI-powered marketing assistant",
    requiredTier: "free",
    limitType: "boolean",
    limitKey: "hasAICMO",
  },
  video_generation: {
    key: "video_generation",
    name: "Video Generation",
    description: "AI-powered video content creation",
    requiredTier: "starter",
    limitType: "boolean",
    limitKey: "hasVideoGeneration",
  },
  unlimited_campaigns: {
    key: "unlimited_campaigns",
    name: "Unlimited Campaigns",
    description: "Create unlimited marketing campaigns",
    requiredTier: "pro",
    limitType: "numeric",
    limitKey: "maxCampaignsPerMonth",
  },
  unlimited_assets: {
    key: "unlimited_assets",
    name: "Unlimited Assets",
    description: "Store unlimited marketing assets",
    requiredTier: "enterprise",
    limitType: "numeric",
    limitKey: "maxAssetsTotal",
  },
  unlimited_team_members: {
    key: "unlimited_team_members",
    name: "Unlimited Team Members",
    description: "Add unlimited team members to your account",
    requiredTier: "enterprise",
    limitType: "numeric",
    limitKey: "maxTeamMembers",
  },
};

/**
 * Check if a tier has access to a feature
 */
export const tierHasFeature = (tier: PlanTier, feature: FeatureKey): boolean => {
  const featureDef = FEATURES[feature];
  return isTierHigherOrEqual(tier, featureDef.requiredTier);
};

/**
 * Get the numeric limit for a feature
 */
export const getFeatureLimit = (tier: PlanTier, feature: FeatureKey): number => {
  const featureDef = FEATURES[feature];
  const limits = PLAN_LIMITS[tier];
  
  if (featureDef.limitType === "boolean" || !featureDef.limitKey) {
    return -1; // Not applicable
  }
  
  const value = limits[featureDef.limitKey];
  return typeof value === "number" ? value : -1;
};

/**
 * Get all features available for a tier
 */
export const getFeaturesForTier = (tier: PlanTier): FeatureDefinition[] => {
  return Object.values(FEATURES).filter((feature) =>
    tierHasFeature(tier, feature.key)
  );
};

/**
 * Get all features locked for a tier (available on higher tiers)
 */
export const getLockedFeaturesForTier = (tier: PlanTier): FeatureDefinition[] => {
  return Object.values(FEATURES).filter((feature) =>
    !tierHasFeature(tier, feature.key)
  );
};

/**
 * Get upgrade message for a locked feature
 */
export const getUpgradeMessage = (feature: FeatureKey): string => {
  const featureDef = FEATURES[feature];
  const tierNames: Record<PlanTier, string> = {
    free: "Free",
    starter: "Starter",
    pro: "Pro",
    enterprise: "Enterprise",
  };
  
  return `${featureDef.name} is available on the ${tierNames[featureDef.requiredTier]} plan and above.`;
};

/**
 * Feature categories for UI grouping
 */
export const FEATURE_CATEGORIES = {
  analytics: ["advanced_analytics", "brand_pulse", "creative_insights"] as FeatureKey[],
  automation: ["automation_rules"] as FeatureKey[],
  integrations: ["shopify_integration", "erp_integration"] as FeatureKey[],
  limits: ["unlimited_campaigns", "unlimited_assets", "unlimited_team_members"] as FeatureKey[],
  ai: ["aicmo", "video_generation"] as FeatureKey[],
  support: ["priority_support"] as FeatureKey[],
};

/**
 * Get feature by key
 */
export const getFeatureDefinition = (key: FeatureKey): FeatureDefinition => {
  return FEATURES[key];
};
