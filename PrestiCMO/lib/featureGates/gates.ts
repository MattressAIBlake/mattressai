/**
 * Gate Definitions
 * 
 * Defines which features/routes require which gates.
 * Used as a reference for applying gates consistently across the app.
 */

import type { FeatureKey, PlanLimits } from "../types";

export interface RouteGate {
  path: string;
  feature?: FeatureKey;
  limitKey?: keyof PlanLimits;
  description: string;
}

/**
 * API routes that require feature gates
 */
export const API_GATES: RouteGate[] = [
  // Advanced Analytics
  {
    path: "/api/insights/brand",
    feature: "brand_pulse",
    description: "Brand Pulse analytics endpoint",
  },
  {
    path: "/api/insights/creative",
    feature: "creative_insights",
    description: "Creative insights analysis",
  },
  
  // Automation
  {
    path: "/api/automation/rules",
    feature: "automation_rules",
    description: "Automation rules management",
  },
  {
    path: "/api/optimization/auto-apply",
    feature: "automation_rules",
    description: "Auto-apply optimizations",
  },
  
  // Integrations
  {
    path: "/api/integrations/shopify",
    feature: "shopify_integration",
    description: "Shopify integration endpoints",
  },
  {
    path: "/api/integrations/storis",
    feature: "erp_integration",
    description: "STORIS ERP integration",
  },
  {
    path: "/api/integrations/furniture-wizard",
    feature: "erp_integration",
    description: "Furniture Wizard ERP integration",
  },
  
  // Video generation
  {
    path: "/api/video",
    feature: "video_generation",
    description: "AI video generation",
  },
];

/**
 * Page routes that require feature gates
 */
export const PAGE_GATES: RouteGate[] = [
  {
    path: "/insights/brand",
    feature: "brand_pulse",
    description: "Brand Pulse dashboard",
  },
  {
    path: "/insights/creative",
    feature: "creative_insights",
    description: "Creative Insights dashboard",
  },
  {
    path: "/automation/rules",
    feature: "automation_rules",
    description: "Automation rules page",
  },
];

/**
 * Usage-limited actions
 */
export const USAGE_GATES: Array<{
  action: string;
  limitKey: keyof PlanLimits;
  description: string;
}> = [
  {
    action: "create_campaign",
    limitKey: "maxCampaignsPerMonth",
    description: "Creating a new campaign",
  },
  {
    action: "upload_asset",
    limitKey: "maxAssetsTotal",
    description: "Uploading a new asset",
  },
  {
    action: "invite_member",
    limitKey: "maxTeamMembers",
    description: "Inviting a team member",
  },
  {
    action: "connect_integration",
    limitKey: "maxIntegrations",
    description: "Connecting a new integration",
  },
];

/**
 * Get the gate for a specific API path
 */
export const getApiGate = (path: string): RouteGate | undefined => {
  return API_GATES.find((gate) => path.startsWith(gate.path));
};

/**
 * Get the gate for a specific page path
 */
export const getPageGate = (path: string): RouteGate | undefined => {
  return PAGE_GATES.find((gate) => path.startsWith(gate.path));
};

/**
 * Get the usage gate for a specific action
 */
export const getUsageGate = (action: string) => {
  return USAGE_GATES.find((gate) => gate.action === action);
};

/**
 * Check if a path requires a gate
 */
export const pathRequiresGate = (path: string): boolean => {
  return !!getApiGate(path) || !!getPageGate(path);
};
