/**
 * Billing Engine
 * 
 * Calculates billing amounts, projections, and handles billing-related operations.
 */

import type { PlanTier, SubscriptionPlan, AdSpendSummary } from "../types";
import { PLAN_CONFIGS } from "../subscription/plans";
import { getOrCreateSubscription } from "../subscription/subscriptionService";
import { getCurrentPeriodSpend, calculateMonthlySummary, getTotalAdSpend } from "./adSpendTracker";

export interface BillingBreakdown {
  baseFee: number;
  adSpendFee: number;
  totalDue: number;
  managedSpend: number;
  adSpendPercentage: number;
}

export interface BillingProjection {
  projectedBaseFee: number;
  projectedAdSpendFee: number;
  projectedTotal: number;
  currentSpend: number;
  daysRemaining: number;
  averageDailySpend: number;
}

/**
 * Calculate billing breakdown for an account
 */
export const calculateBillingBreakdown = async (
  accountId: string
): Promise<BillingBreakdown> => {
  const subscription = await getOrCreateSubscription(accountId);
  const config = PLAN_CONFIGS[subscription.tier];
  
  const baseFee = config.monthlyPrice / 100; // Convert from cents
  const managedSpend = subscription.managedAdSpendThisMonth;
  const adSpendFee = subscription.platformFeeThisMonth;

  return {
    baseFee,
    adSpendFee,
    totalDue: baseFee + adSpendFee,
    managedSpend,
    adSpendPercentage: config.adSpendPercentage,
  };
};

/**
 * Project billing for the rest of the billing period
 */
export const projectBilling = async (
  accountId: string
): Promise<BillingProjection> => {
  const subscription = await getOrCreateSubscription(accountId);
  const config = PLAN_CONFIGS[subscription.tier];
  const { totalSpend, totalFee } = await getCurrentPeriodSpend(accountId);

  const now = new Date();
  const periodStart = subscription.currentPeriodStart;
  const periodEnd = subscription.currentPeriodEnd;
  
  const daysPassed = Math.max(1, Math.ceil((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const totalDays = daysPassed + daysRemaining;

  const averageDailySpend = totalSpend / daysPassed;
  const projectedMonthlySpend = averageDailySpend * totalDays;
  const projectedAdSpendFee = projectedMonthlySpend * config.adSpendPercentage;

  return {
    projectedBaseFee: config.monthlyPrice / 100,
    projectedAdSpendFee,
    projectedTotal: (config.monthlyPrice / 100) + projectedAdSpendFee,
    currentSpend: totalSpend,
    daysRemaining,
    averageDailySpend,
  };
};

/**
 * Calculate savings if upgraded to a different tier
 */
export const calculateUpgradeSavings = async (
  accountId: string,
  targetTier: PlanTier
): Promise<{
  currentCost: number;
  newCost: number;
  savings: number;
  savingsPercent: number;
}> => {
  const subscription = await getOrCreateSubscription(accountId);
  const currentConfig = PLAN_CONFIGS[subscription.tier];
  const targetConfig = PLAN_CONFIGS[targetTier];

  const managedSpend = subscription.managedAdSpendThisMonth || 0;

  const currentBaseFee = currentConfig.monthlyPrice / 100;
  const currentAdFee = managedSpend * currentConfig.adSpendPercentage;
  const currentCost = currentBaseFee + currentAdFee;

  const newBaseFee = targetConfig.monthlyPrice / 100;
  const newAdFee = managedSpend * targetConfig.adSpendPercentage;
  const newCost = newBaseFee + newAdFee;

  const savings = currentCost - newCost;
  const savingsPercent = currentCost > 0 ? (savings / currentCost) * 100 : 0;

  return {
    currentCost,
    newCost,
    savings,
    savingsPercent,
  };
};

/**
 * Get billing history summary
 */
export const getBillingHistory = async (
  accountId: string,
  months: number = 6
): Promise<Array<{
  month: string;
  baseFee: number;
  adSpendFee: number;
  totalSpend: number;
  total: number;
}>> => {
  const subscription = await getOrCreateSubscription(accountId);
  const config = PLAN_CONFIGS[subscription.tier];
  const history: Array<{
    month: string;
    baseFee: number;
    adSpendFee: number;
    totalSpend: number;
    total: number;
  }> = [];

  const now = new Date();
  
  for (let i = 0; i < months; i++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;
    
    try {
      const summary = await calculateMonthlySummary(accountId, month);
      history.push({
        month,
        baseFee: config.monthlyPrice / 100,
        adSpendFee: summary.totalFee,
        totalSpend: summary.totalSpend,
        total: (config.monthlyPrice / 100) + summary.totalFee,
      });
    } catch {
      // No data for this month
      history.push({
        month,
        baseFee: config.monthlyPrice / 100,
        adSpendFee: 0,
        totalSpend: 0,
        total: config.monthlyPrice / 100,
      });
    }
  }

  return history;
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number, currency: string = "USD"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

/**
 * Format percentage for display
 */
export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

/**
 * Calculate break-even point for upgrade
 * Returns the monthly ad spend at which upgrade becomes worthwhile
 */
export const calculateBreakEvenSpend = (
  currentTier: PlanTier,
  targetTier: PlanTier
): number => {
  const currentConfig = PLAN_CONFIGS[currentTier];
  const targetConfig = PLAN_CONFIGS[targetTier];

  const baseDiff = (targetConfig.monthlyPrice - currentConfig.monthlyPrice) / 100;
  const rateDiff = currentConfig.adSpendPercentage - targetConfig.adSpendPercentage;

  if (rateDiff <= 0) {
    return Infinity; // Upgrade never saves money on ad spend
  }

  return baseDiff / rateDiff;
};

/**
 * Get lifetime value metrics for an account
 */
export const getAccountLifetimeValue = async (
  accountId: string
): Promise<{
  totalRevenue: number;
  totalAdSpend: number;
  totalFees: number;
  monthsActive: number;
  averageMonthlyValue: number;
}> => {
  const subscription = await getOrCreateSubscription(accountId);
  const config = PLAN_CONFIGS[subscription.tier];
  const { allTimeSpend, allTimeFees } = await getTotalAdSpend(accountId);

  const createdAt = subscription.createdAt;
  const now = new Date();
  const monthsActive = Math.max(1, Math.ceil(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
  ));

  const baseRevenue = (config.monthlyPrice / 100) * monthsActive;
  const totalRevenue = baseRevenue + allTimeFees;

  return {
    totalRevenue,
    totalAdSpend: allTimeSpend,
    totalFees: allTimeFees,
    monthsActive,
    averageMonthlyValue: totalRevenue / monthsActive,
  };
};
