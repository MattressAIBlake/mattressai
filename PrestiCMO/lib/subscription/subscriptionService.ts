/**
 * Subscription Service
 * 
 * CRUD operations for subscription plans and billing management.
 * Integrates with Firestore for persistence and Stripe for payments.
 */

import { adminDb } from "../firebaseAdmin";
import type { SubscriptionPlan, PlanTier, PlanLimits, AdSpendSummary } from "../types";
import { PLAN_LIMITS, PLAN_CONFIGS, calculateAdSpendFee } from "./plans";

const SUBSCRIPTIONS_COLLECTION = "subscriptions";
const AD_SPEND_SUMMARY_COLLECTION = "adSpendSummaries";

/**
 * Get the current subscription plan for an account
 */
export const getSubscription = async (accountId: string): Promise<SubscriptionPlan | null> => {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  const docRef = adminDb.collection(SUBSCRIPTIONS_COLLECTION).doc(accountId);
  const doc = await docRef.get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  return {
    ...data,
    currentPeriodStart: data?.currentPeriodStart?.toDate() || new Date(),
    currentPeriodEnd: data?.currentPeriodEnd?.toDate() || new Date(),
    trialEndsAt: data?.trialEndsAt?.toDate(),
    canceledAt: data?.canceledAt?.toDate(),
    createdAt: data?.createdAt?.toDate() || new Date(),
    updatedAt: data?.updatedAt?.toDate() || new Date(),
  } as SubscriptionPlan;
};

/**
 * Create a new subscription for an account (defaults to free tier)
 */
export const createSubscription = async (
  accountId: string,
  tier: PlanTier = "free",
  options?: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    trialDays?: number;
  }
): Promise<SubscriptionPlan> => {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const trialEndsAt = options?.trialDays
    ? new Date(now.getTime() + options.trialDays * 24 * 60 * 60 * 1000)
    : undefined;

  const subscription: SubscriptionPlan = {
    id: accountId, // Use accountId as the subscription ID for simplicity
    accountId,
    tier,
    status: trialEndsAt ? "trialing" : "active",
    stripeCustomerId: options?.stripeCustomerId,
    stripeSubscriptionId: options?.stripeSubscriptionId,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    adSpendPercentage: PLAN_CONFIGS[tier].adSpendPercentage,
    managedAdSpendThisMonth: 0,
    platformFeeThisMonth: 0,
    limits: PLAN_LIMITS[tier],
    trialEndsAt,
    createdAt: now,
    updatedAt: now,
  };

  await adminDb.collection(SUBSCRIPTIONS_COLLECTION).doc(accountId).set(subscription);

  return subscription;
};

/**
 * Get or create subscription (ensures every account has a subscription)
 */
export const getOrCreateSubscription = async (accountId: string): Promise<SubscriptionPlan> => {
  const existing = await getSubscription(accountId);
  if (existing) {
    return existing;
  }
  return createSubscription(accountId, "free");
};

/**
 * Update subscription tier (upgrade/downgrade)
 */
export const updateSubscriptionTier = async (
  accountId: string,
  newTier: PlanTier,
  stripeSubscriptionId?: string
): Promise<SubscriptionPlan> => {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  const subscription = await getOrCreateSubscription(accountId);

  const updates: Partial<SubscriptionPlan> = {
    tier: newTier,
    limits: PLAN_LIMITS[newTier],
    adSpendPercentage: PLAN_CONFIGS[newTier].adSpendPercentage,
    updatedAt: new Date(),
  };

  if (stripeSubscriptionId) {
    updates.stripeSubscriptionId = stripeSubscriptionId;
  }

  // If moving from trialing or canceled to active
  if (subscription.status === "trialing" || subscription.status === "canceled") {
    updates.status = "active";
  }

  await adminDb.collection(SUBSCRIPTIONS_COLLECTION).doc(accountId).update(updates);

  return { ...subscription, ...updates } as SubscriptionPlan;
};

/**
 * Update subscription status (e.g., from Stripe webhook)
 */
export const updateSubscriptionStatus = async (
  accountId: string,
  status: SubscriptionPlan["status"],
  options?: {
    cancelAtPeriodEnd?: boolean;
    canceledAt?: Date;
  }
): Promise<void> => {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  const updates: Partial<SubscriptionPlan> = {
    status,
    updatedAt: new Date(),
    ...options,
  };

  await adminDb.collection(SUBSCRIPTIONS_COLLECTION).doc(accountId).update(updates);
};

/**
 * Update Stripe customer/subscription IDs
 */
export const updateStripeIds = async (
  accountId: string,
  stripeCustomerId: string,
  stripeSubscriptionId?: string
): Promise<void> => {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  const updates: Partial<SubscriptionPlan> = {
    stripeCustomerId,
    updatedAt: new Date(),
  };

  if (stripeSubscriptionId) {
    updates.stripeSubscriptionId = stripeSubscriptionId;
  }

  await adminDb.collection(SUBSCRIPTIONS_COLLECTION).doc(accountId).update(updates);
};

/**
 * Update ad spend tracking for current month
 */
export const updateAdSpendTracking = async (
  accountId: string,
  spendDelta: number
): Promise<void> => {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  const subscription = await getOrCreateSubscription(accountId);
  const feeDelta = calculateAdSpendFee(spendDelta, subscription.tier);

  await adminDb.collection(SUBSCRIPTIONS_COLLECTION).doc(accountId).update({
    managedAdSpendThisMonth: subscription.managedAdSpendThisMonth + spendDelta,
    platformFeeThisMonth: subscription.platformFeeThisMonth + feeDelta,
    updatedAt: new Date(),
  });
};

/**
 * Reset monthly ad spend counters (called at start of billing period)
 */
export const resetMonthlyAdSpend = async (accountId: string): Promise<void> => {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  await adminDb.collection(SUBSCRIPTIONS_COLLECTION).doc(accountId).update({
    managedAdSpendThisMonth: 0,
    platformFeeThisMonth: 0,
    updatedAt: new Date(),
  });
};

/**
 * Update billing period dates (called from Stripe webhook)
 */
export const updateBillingPeriod = async (
  accountId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<void> => {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  await adminDb.collection(SUBSCRIPTIONS_COLLECTION).doc(accountId).update({
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    updatedAt: new Date(),
  });
};

/**
 * Get plan limits for an account
 */
export const getAccountLimits = async (accountId: string): Promise<PlanLimits> => {
  const subscription = await getOrCreateSubscription(accountId);
  return subscription.limits;
};

/**
 * Check if account can use a feature
 */
export const canAccessFeature = async (
  accountId: string,
  feature: keyof PlanLimits
): Promise<boolean> => {
  const limits = await getAccountLimits(accountId);
  const value = limits[feature];
  
  // Boolean features
  if (typeof value === "boolean") {
    return value;
  }
  
  // Numeric limits: -1 means unlimited, otherwise check if > 0
  if (typeof value === "number") {
    return value === -1 || value > 0;
  }
  
  return false;
};

/**
 * Get ad spend summary for a specific month
 */
export const getAdSpendSummary = async (
  accountId: string,
  month: string // "YYYY-MM" format
): Promise<AdSpendSummary | null> => {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  const docRef = adminDb
    .collection(AD_SPEND_SUMMARY_COLLECTION)
    .doc(`${accountId}_${month}`);
  const doc = await docRef.get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  return {
    ...data,
    calculatedAt: data?.calculatedAt?.toDate() || new Date(),
  } as AdSpendSummary;
};

/**
 * Save ad spend summary for a month
 */
export const saveAdSpendSummary = async (summary: AdSpendSummary): Promise<void> => {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  const docId = `${summary.accountId}_${summary.month}`;
  await adminDb.collection(AD_SPEND_SUMMARY_COLLECTION).doc(docId).set(summary);
};

/**
 * Cancel subscription at period end
 */
export const cancelSubscription = async (accountId: string): Promise<void> => {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  await adminDb.collection(SUBSCRIPTIONS_COLLECTION).doc(accountId).update({
    cancelAtPeriodEnd: true,
    canceledAt: new Date(),
    updatedAt: new Date(),
  });
};

/**
 * Reactivate a canceled subscription
 */
export const reactivateSubscription = async (accountId: string): Promise<void> => {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  await adminDb.collection(SUBSCRIPTIONS_COLLECTION).doc(accountId).update({
    cancelAtPeriodEnd: false,
    canceledAt: null,
    status: "active",
    updatedAt: new Date(),
  });
};

/**
 * Get all subscriptions (admin only)
 */
export const getAllSubscriptions = async (): Promise<SubscriptionPlan[]> => {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  const snapshot = await adminDb.collection(SUBSCRIPTIONS_COLLECTION).get();
  
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      currentPeriodStart: data?.currentPeriodStart?.toDate() || new Date(),
      currentPeriodEnd: data?.currentPeriodEnd?.toDate() || new Date(),
      trialEndsAt: data?.trialEndsAt?.toDate(),
      canceledAt: data?.canceledAt?.toDate(),
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || new Date(),
    } as SubscriptionPlan;
  });
};

/**
 * Get subscriptions by tier (admin only)
 */
export const getSubscriptionsByTier = async (tier: PlanTier): Promise<SubscriptionPlan[]> => {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  const snapshot = await adminDb
    .collection(SUBSCRIPTIONS_COLLECTION)
    .where("tier", "==", tier)
    .get();
  
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      currentPeriodStart: data?.currentPeriodStart?.toDate() || new Date(),
      currentPeriodEnd: data?.currentPeriodEnd?.toDate() || new Date(),
      trialEndsAt: data?.trialEndsAt?.toDate(),
      canceledAt: data?.canceledAt?.toDate(),
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || new Date(),
    } as SubscriptionPlan;
  });
};
