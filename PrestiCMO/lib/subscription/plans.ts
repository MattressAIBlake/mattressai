/**
 * Subscription Plan Definitions
 * 
 * Defines the feature limits and pricing for each subscription tier.
 * Based on Marketer.com hybrid model: base subscription + % of managed ad spend.
 */

import type { PlanTier, PlanLimits, FeatureKey } from "../types";

export interface PlanConfig {
  tier: PlanTier;
  name: string;
  description: string;
  monthlyPrice: number; // Base price in cents
  annualPrice: number; // Annual price in cents (typically ~20% discount)
  adSpendPercentage: number; // e.g., 0.02 for 2%
  limits: PlanLimits;
  features: string[]; // Human-readable feature list for marketing
  stripePriceId?: string; // Stripe price ID for checkout
  stripeAnnualPriceId?: string;
}

/**
 * Default limits for each plan tier
 */
export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    maxCampaignsPerMonth: 5,
    maxAssetsTotal: 50,
    maxTeamMembers: 1,
    maxIntegrations: 1,
    hasAdvancedAnalytics: false,
    hasBrandPulse: false,
    hasCreativeInsights: false,
    hasAutomationRules: false,
    hasShopifyIntegration: false,
    hasERPIntegration: false,
    hasPrioritySupport: false,
    hasAICMO: true, // Basic AICMO available on free
    hasVideoGeneration: false,
  },
  starter: {
    maxCampaignsPerMonth: 20,
    maxAssetsTotal: 500,
    maxTeamMembers: 3,
    maxIntegrations: 3,
    hasAdvancedAnalytics: false,
    hasBrandPulse: false,
    hasCreativeInsights: false,
    hasAutomationRules: false,
    hasShopifyIntegration: true,
    hasERPIntegration: false,
    hasPrioritySupport: false,
    hasAICMO: true,
    hasVideoGeneration: true,
  },
  pro: {
    maxCampaignsPerMonth: -1, // Unlimited
    maxAssetsTotal: 2000,
    maxTeamMembers: 10,
    maxIntegrations: 10,
    hasAdvancedAnalytics: true,
    hasBrandPulse: true,
    hasCreativeInsights: true,
    hasAutomationRules: true,
    hasShopifyIntegration: true,
    hasERPIntegration: true,
    hasPrioritySupport: false,
    hasAICMO: true,
    hasVideoGeneration: true,
  },
  enterprise: {
    maxCampaignsPerMonth: -1, // Unlimited
    maxAssetsTotal: -1, // Unlimited
    maxTeamMembers: -1, // Unlimited
    maxIntegrations: -1, // Unlimited
    hasAdvancedAnalytics: true,
    hasBrandPulse: true,
    hasCreativeInsights: true,
    hasAutomationRules: true,
    hasShopifyIntegration: true,
    hasERPIntegration: true,
    hasPrioritySupport: true,
    hasAICMO: true,
    hasVideoGeneration: true,
  },
};

/**
 * Full plan configurations with pricing
 */
export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  free: {
    tier: "free",
    name: "Free",
    description: "Get started with AI-powered marketing",
    monthlyPrice: 0,
    annualPrice: 0,
    adSpendPercentage: 0,
    limits: PLAN_LIMITS.free,
    features: [
      "5 campaigns per month",
      "50 assets",
      "1 team member",
      "Basic AICMO assistant",
      "1 ad platform integration",
      "Dashboard & reporting",
    ],
  },
  starter: {
    tier: "starter",
    name: "Starter",
    description: "For growing businesses ready to scale",
    monthlyPrice: 9900, // $99
    annualPrice: 95000, // $950/year (~20% off)
    adSpendPercentage: 0.02, // 2%
    limits: PLAN_LIMITS.starter,
    features: [
      "20 campaigns per month",
      "500 assets",
      "3 team members",
      "Shopify integration",
      "AI video generation",
      "3 ad platform integrations",
      "Email support",
    ],
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
    stripeAnnualPriceId: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
  },
  pro: {
    tier: "pro",
    name: "Pro",
    description: "Advanced features for marketing teams",
    monthlyPrice: 29900, // $299
    annualPrice: 287000, // $2,870/year (~20% off)
    adSpendPercentage: 0.025, // 2.5%
    limits: PLAN_LIMITS.pro,
    features: [
      "Unlimited campaigns",
      "2,000 assets",
      "10 team members",
      "Brand Pulse analytics",
      "Creative Insights",
      "Automation rules",
      "ERP integrations (STORIS, Furniture Wizard)",
      "All ad platforms",
      "Priority email support",
    ],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    stripeAnnualPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  },
  enterprise: {
    tier: "enterprise",
    name: "Enterprise",
    description: "Custom solutions for large organizations",
    monthlyPrice: -1, // Custom pricing
    annualPrice: -1,
    adSpendPercentage: 0.015, // 1.5% (lower rate for high volume)
    limits: PLAN_LIMITS.enterprise,
    features: [
      "Everything in Pro",
      "Unlimited assets",
      "Unlimited team members",
      "Unlimited integrations",
      "Dedicated account manager",
      "Priority support & SLA",
      "Custom onboarding",
      "API access",
    ],
  },
};

/**
 * Maps feature keys to plan limits property names
 */
export const FEATURE_TO_LIMIT_MAP: Record<FeatureKey, keyof PlanLimits | null> = {
  advanced_analytics: "hasAdvancedAnalytics",
  brand_pulse: "hasBrandPulse",
  creative_insights: "hasCreativeInsights",
  automation_rules: "hasAutomationRules",
  shopify_integration: "hasShopifyIntegration",
  erp_integration: "hasERPIntegration",
  priority_support: "hasPrioritySupport",
  aicmo: "hasAICMO",
  video_generation: "hasVideoGeneration",
  unlimited_campaigns: null, // Checked via maxCampaignsPerMonth
  unlimited_assets: null, // Checked via maxAssetsTotal
  unlimited_team_members: null, // Checked via maxTeamMembers
};

/**
 * Get the minimum tier required for a feature
 */
export const getRequiredTierForFeature = (feature: FeatureKey): PlanTier => {
  const tiers: PlanTier[] = ["free", "starter", "pro", "enterprise"];
  
  for (const tier of tiers) {
    const limits = PLAN_LIMITS[tier];
    const limitKey = FEATURE_TO_LIMIT_MAP[feature];
    
    if (limitKey && limits[limitKey] === true) {
      return tier;
    }
    
    // Handle numeric limits
    if (feature === "unlimited_campaigns" && limits.maxCampaignsPerMonth === -1) {
      return tier;
    }
    if (feature === "unlimited_assets" && limits.maxAssetsTotal === -1) {
      return tier;
    }
    if (feature === "unlimited_team_members" && limits.maxTeamMembers === -1) {
      return tier;
    }
  }
  
  return "enterprise"; // Default to enterprise if not found
};

/**
 * Check if a limit is "unlimited" (-1)
 */
export const isUnlimited = (value: number): boolean => value === -1;

/**
 * Format limit for display
 */
export const formatLimit = (value: number): string => {
  if (value === -1) return "Unlimited";
  return value.toLocaleString();
};

/**
 * Get plan config by tier
 */
export const getPlanConfig = (tier: PlanTier): PlanConfig => {
  return PLAN_CONFIGS[tier];
};

/**
 * Get plan limits by tier
 */
export const getPlanLimits = (tier: PlanTier): PlanLimits => {
  return PLAN_LIMITS[tier];
};

/**
 * Check if an upgrade is available from current tier
 */
export const getNextTier = (currentTier: PlanTier): PlanTier | null => {
  const tierOrder: PlanTier[] = ["free", "starter", "pro", "enterprise"];
  const currentIndex = tierOrder.indexOf(currentTier);
  
  if (currentIndex < tierOrder.length - 1) {
    return tierOrder[currentIndex + 1];
  }
  
  return null;
};

/**
 * Calculate ad spend fee for a given spend amount
 */
export const calculateAdSpendFee = (spend: number, tier: PlanTier): number => {
  const config = PLAN_CONFIGS[tier];
  return spend * config.adSpendPercentage;
};

/**
 * Get all features available for a tier
 */
export const getAvailableFeatures = (tier: PlanTier): FeatureKey[] => {
  const limits = PLAN_LIMITS[tier];
  const features: FeatureKey[] = [];
  
  if (limits.hasAdvancedAnalytics) features.push("advanced_analytics");
  if (limits.hasBrandPulse) features.push("brand_pulse");
  if (limits.hasCreativeInsights) features.push("creative_insights");
  if (limits.hasAutomationRules) features.push("automation_rules");
  if (limits.hasShopifyIntegration) features.push("shopify_integration");
  if (limits.hasERPIntegration) features.push("erp_integration");
  if (limits.hasPrioritySupport) features.push("priority_support");
  if (limits.hasAICMO) features.push("aicmo");
  if (limits.hasVideoGeneration) features.push("video_generation");
  if (limits.maxCampaignsPerMonth === -1) features.push("unlimited_campaigns");
  if (limits.maxAssetsTotal === -1) features.push("unlimited_assets");
  if (limits.maxTeamMembers === -1) features.push("unlimited_team_members");
  
  return features;
};

/**
 * Compare two tiers and determine if tier A is higher than tier B
 */
export const isTierHigherOrEqual = (tierA: PlanTier, tierB: PlanTier): boolean => {
  const tierOrder: PlanTier[] = ["free", "starter", "pro", "enterprise"];
  return tierOrder.indexOf(tierA) >= tierOrder.indexOf(tierB);
};
