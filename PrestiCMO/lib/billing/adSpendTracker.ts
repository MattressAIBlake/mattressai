/**
 * Ad Spend Tracker
 * 
 * Aggregates ad spend from all connected platforms for billing calculations.
 * Integrates with platform adapters to fetch spend data and calculate platform fees.
 */

import { adminDb } from "../firebaseAdmin";
import type { 
  AdSpendEntry, 
  AdSpendSummary, 
  AdSpendPlatform, 
  Integration, 
  IntegrationType,
  SubscriptionPlan 
} from "../types";
import { getOrCreateSubscription, updateAdSpendTracking, saveAdSpendSummary } from "../subscription/subscriptionService";
import { calculateAdSpendFee } from "../subscription/plans";

const AD_SPEND_COLLECTION = "adSpendLedger";

/**
 * Map integration types to ad spend platforms
 */
const INTEGRATION_TO_PLATFORM: Record<string, AdSpendPlatform | null> = {
  meta_ads: "meta",
  google_ads: "google_ads",
  tiktok_ads: "tiktok_ads",
  pinterest: "pinterest",
  google_analytics: null,
  shopify: null,
  storis: null,
  furniture_wizard: null,
  sftp: null,
};

/**
 * Record ad spend entry from a platform sync
 */
export const recordAdSpend = async (
  accountId: string,
  platform: AdSpendPlatform,
  integrationId: string,
  spend: number,
  date: Date,
  externalCampaignId?: string
): Promise<AdSpendEntry> => {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  const subscription = await getOrCreateSubscription(accountId);
  const calculatedFee = calculateAdSpendFee(spend, subscription.tier);

  const entry: AdSpendEntry = {
    id: `${accountId}_${platform}_${date.toISOString().split("T")[0]}_${integrationId}`,
    accountId,
    date,
    platform,
    spend,
    currency: "USD",
    calculatedFee,
    integrationId,
    externalCampaignId,
    synced: false,
    createdAt: new Date(),
  };

  await adminDb.collection(AD_SPEND_COLLECTION).doc(entry.id).set(entry);

  // Update the running total on the subscription
  await updateAdSpendTracking(accountId, spend);

  return entry;
};

/**
 * Record multiple ad spend entries in a batch
 */
export const recordAdSpendBatch = async (
  accountId: string,
  entries: Array<{
    platform: AdSpendPlatform;
    integrationId: string;
    spend: number;
    date: Date;
    externalCampaignId?: string;
  }>
): Promise<void> => {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  const subscription = await getOrCreateSubscription(accountId);
  const batch = adminDb.batch();
  let totalSpend = 0;

  for (const entry of entries) {
    const docId = `${accountId}_${entry.platform}_${entry.date.toISOString().split("T")[0]}_${entry.integrationId}`;
    const docRef = adminDb.collection(AD_SPEND_COLLECTION).doc(docId);
    
    const calculatedFee = calculateAdSpendFee(entry.spend, subscription.tier);
    totalSpend += entry.spend;

    const adSpendEntry: AdSpendEntry = {
      id: docId,
      accountId,
      date: entry.date,
      platform: entry.platform,
      spend: entry.spend,
      currency: "USD",
      calculatedFee,
      integrationId: entry.integrationId,
      externalCampaignId: entry.externalCampaignId,
      synced: false,
      createdAt: new Date(),
    };

    batch.set(docRef, adSpendEntry, { merge: true });
  }

  await batch.commit();
  
  // Update the running total
  if (totalSpend > 0) {
    await updateAdSpendTracking(accountId, totalSpend);
  }
};

/**
 * Get ad spend entries for an account within a date range
 */
export const getAdSpendEntries = async (
  accountId: string,
  startDate: Date,
  endDate: Date,
  platform?: AdSpendPlatform
): Promise<AdSpendEntry[]> => {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  let query = adminDb
    .collection(AD_SPEND_COLLECTION)
    .where("accountId", "==", accountId)
    .where("date", ">=", startDate)
    .where("date", "<=", endDate);

  if (platform) {
    query = query.where("platform", "==", platform);
  }

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      date: data.date?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
    } as AdSpendEntry;
  });
};

/**
 * Calculate monthly ad spend summary
 */
export const calculateMonthlySummary = async (
  accountId: string,
  month: string // "YYYY-MM" format
): Promise<AdSpendSummary> => {
  const [year, monthNum] = month.split("-").map(Number);
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0, 23, 59, 59);

  const entries = await getAdSpendEntries(accountId, startDate, endDate);
  const subscription = await getOrCreateSubscription(accountId);

  const platformBreakdown: Record<AdSpendPlatform, { spend: number; fee: number }> = {
    meta: { spend: 0, fee: 0 },
    google_ads: { spend: 0, fee: 0 },
    tiktok_ads: { spend: 0, fee: 0 },
    pinterest: { spend: 0, fee: 0 },
  };

  let totalSpend = 0;
  let totalFee = 0;

  for (const entry of entries) {
    totalSpend += entry.spend;
    totalFee += entry.calculatedFee;
    platformBreakdown[entry.platform].spend += entry.spend;
    platformBreakdown[entry.platform].fee += entry.calculatedFee;
  }

  const summary: AdSpendSummary = {
    accountId,
    month,
    totalSpend,
    totalFee,
    platformBreakdown,
    reportedToStripe: false,
    calculatedAt: new Date(),
  };

  // Save the summary
  await saveAdSpendSummary(summary);

  return summary;
};

/**
 * Mark ad spend entries as synced to Stripe
 */
export const markEntriesAsSynced = async (
  accountId: string,
  month: string
): Promise<void> => {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  const [year, monthNum] = month.split("-").map(Number);
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0, 23, 59, 59);

  const snapshot = await adminDb
    .collection(AD_SPEND_COLLECTION)
    .where("accountId", "==", accountId)
    .where("date", ">=", startDate)
    .where("date", "<=", endDate)
    .get();

  const batch = adminDb.batch();

  for (const doc of snapshot.docs) {
    batch.update(doc.ref, { synced: true });
  }

  await batch.commit();
};

/**
 * Get total ad spend for current billing period
 */
export const getCurrentPeriodSpend = async (accountId: string): Promise<{
  totalSpend: number;
  totalFee: number;
  platformBreakdown: Record<AdSpendPlatform, number>;
}> => {
  const subscription = await getOrCreateSubscription(accountId);
  const startDate = subscription.currentPeriodStart;
  const endDate = subscription.currentPeriodEnd;

  const entries = await getAdSpendEntries(accountId, startDate, endDate);

  const platformBreakdown: Record<AdSpendPlatform, number> = {
    meta: 0,
    google_ads: 0,
    tiktok_ads: 0,
    pinterest: 0,
  };

  let totalSpend = 0;
  let totalFee = 0;

  for (const entry of entries) {
    totalSpend += entry.spend;
    totalFee += entry.calculatedFee;
    platformBreakdown[entry.platform] += entry.spend;
  }

  return { totalSpend, totalFee, platformBreakdown };
};

/**
 * Sync ad spend from performance metrics
 * Called after platform metrics are synced
 */
export const syncAdSpendFromMetrics = async (
  accountId: string,
  integrationId: string,
  integrationType: IntegrationType,
  metrics: Array<{
    date: Date;
    spend: number;
    externalCampaignId?: string;
  }>
): Promise<void> => {
  const platform = INTEGRATION_TO_PLATFORM[integrationType];
  
  if (!platform) {
    // Not an ad platform, skip
    return;
  }

  const entries = metrics
    .filter((m) => m.spend > 0)
    .map((m) => ({
      platform,
      integrationId,
      spend: m.spend,
      date: m.date,
      externalCampaignId: m.externalCampaignId,
    }));

  if (entries.length > 0) {
    await recordAdSpendBatch(accountId, entries);
  }
};

/**
 * Get ad spend trend data for charts
 */
export const getAdSpendTrend = async (
  accountId: string,
  days: number = 30
): Promise<Array<{ date: string; spend: number; fee: number }>> => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const entries = await getAdSpendEntries(accountId, startDate, endDate);

  // Group by date
  const byDate: Record<string, { spend: number; fee: number }> = {};

  for (const entry of entries) {
    const dateKey = entry.date.toISOString().split("T")[0];
    if (!byDate[dateKey]) {
      byDate[dateKey] = { spend: 0, fee: 0 };
    }
    byDate[dateKey].spend += entry.spend;
    byDate[dateKey].fee += entry.calculatedFee;
  }

  // Convert to array and sort
  return Object.entries(byDate)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Get account's all-time ad spend
 */
export const getTotalAdSpend = async (accountId: string): Promise<{
  allTimeSpend: number;
  allTimeFees: number;
}> => {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  const snapshot = await adminDb
    .collection(AD_SPEND_COLLECTION)
    .where("accountId", "==", accountId)
    .get();

  let allTimeSpend = 0;
  let allTimeFees = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    allTimeSpend += data.spend || 0;
    allTimeFees += data.calculatedFee || 0;
  }

  return { allTimeSpend, allTimeFees };
};
