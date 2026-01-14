/**
 * Stripe Integration
 * 
 * Handles subscription billing, metered usage for ad spend percentage,
 * and webhook processing for subscription lifecycle events.
 */

import Stripe from "stripe";
import type { PlanTier, SubscriptionPlan } from "../types";
import { 
  updateSubscriptionTier, 
  updateSubscriptionStatus, 
  updateStripeIds,
  updateBillingPeriod,
  resetMonthlyAdSpend,
  getSubscription 
} from "../subscription/subscriptionService";
import { PLAN_CONFIGS } from "../subscription/plans";
import { calculateMonthlySummary, markEntriesAsSynced } from "./adSpendTracker";

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    })
  : null;

/**
 * Create a Stripe customer for an account
 */
export const createStripeCustomer = async (
  accountId: string,
  email: string,
  name?: string
): Promise<string> => {
  if (!stripe) {
    throw new Error("Stripe not initialized");
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      accountId,
    },
  });

  await updateStripeIds(accountId, customer.id);

  return customer.id;
};

/**
 * Get or create Stripe customer
 */
export const getOrCreateStripeCustomer = async (
  accountId: string,
  email: string,
  name?: string
): Promise<string> => {
  const subscription = await getSubscription(accountId);
  
  if (subscription?.stripeCustomerId) {
    return subscription.stripeCustomerId;
  }

  return createStripeCustomer(accountId, email, name);
};

/**
 * Create a checkout session for subscription upgrade
 */
export const createCheckoutSession = async (
  accountId: string,
  tier: PlanTier,
  customerId: string,
  successUrl: string,
  cancelUrl: string,
  isAnnual: boolean = false
): Promise<string> => {
  if (!stripe) {
    throw new Error("Stripe not initialized");
  }

  const config = PLAN_CONFIGS[tier];
  const priceId = isAnnual ? config.stripeAnnualPriceId : config.stripePriceId;

  if (!priceId) {
    throw new Error(`No price configured for tier: ${tier}`);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      accountId,
      tier,
    },
    subscription_data: {
      metadata: {
        accountId,
        tier,
      },
    },
  });

  return session.url || "";
};

/**
 * Create a billing portal session for managing subscription
 */
export const createBillingPortalSession = async (
  customerId: string,
  returnUrl: string
): Promise<string> => {
  if (!stripe) {
    throw new Error("Stripe not initialized");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
};

/**
 * Report metered usage (ad spend fee) to Stripe
 */
export const reportAdSpendUsage = async (
  accountId: string,
  month: string // "YYYY-MM" format
): Promise<void> => {
  if (!stripe) {
    throw new Error("Stripe not initialized");
  }

  const subscription = await getSubscription(accountId);
  
  if (!subscription?.stripeSubscriptionId) {
    console.log(`No Stripe subscription for account ${accountId}, skipping usage report`);
    return;
  }

  // Calculate the monthly summary
  const summary = await calculateMonthlySummary(accountId, month);

  if (summary.totalFee <= 0) {
    console.log(`No ad spend fee for account ${accountId} in ${month}`);
    return;
  }

  // Get the subscription items to find the metered price
  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscription.stripeSubscriptionId
  );

  // Find the metered usage item (ad spend percentage)
  const meteredItem = stripeSubscription.items.data.find(
    (item) => item.price.recurring?.usage_type === "metered"
  );

  if (!meteredItem) {
    console.log(`No metered item found for subscription ${subscription.stripeSubscriptionId}`);
    return;
  }

  // Report usage (fee in cents)
  const usageRecord = await stripe.subscriptionItems.createUsageRecord(
    meteredItem.id,
    {
      quantity: Math.round(summary.totalFee * 100), // Convert to cents
      timestamp: Math.floor(Date.now() / 1000),
      action: "set",
    }
  );

  // Mark entries as synced
  await markEntriesAsSynced(accountId, month);

  console.log(`Reported ${summary.totalFee} ad spend fee for ${accountId}: ${usageRecord.id}`);
};

/**
 * Handle Stripe webhook events
 */
export const handleStripeWebhook = async (
  event: Stripe.Event
): Promise<void> => {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const accountId = session.metadata?.accountId;
      const tier = session.metadata?.tier as PlanTier;

      if (accountId && tier) {
        await updateSubscriptionTier(accountId, tier, session.subscription as string);
        await updateStripeIds(accountId, session.customer as string, session.subscription as string);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const accountId = subscription.metadata?.accountId;

      if (accountId) {
        const status = mapStripeStatus(subscription.status);
        await updateSubscriptionStatus(accountId, status, {
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });
        await updateBillingPeriod(
          accountId,
          new Date(subscription.current_period_start * 1000),
          new Date(subscription.current_period_end * 1000)
        );
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const accountId = subscription.metadata?.accountId;

      if (accountId) {
        // Downgrade to free tier
        await updateSubscriptionTier(accountId, "free");
        await updateSubscriptionStatus(accountId, "canceled", {
          canceledAt: new Date(),
        });
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscription = invoice.subscription as string;
      
      if (subscription) {
        const stripeSubscription = await stripe!.subscriptions.retrieve(subscription);
        const accountId = stripeSubscription.metadata?.accountId;
        
        if (accountId) {
          // Reset monthly ad spend counters for the new billing period
          await resetMonthlyAdSpend(accountId);
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscription = invoice.subscription as string;
      
      if (subscription) {
        const stripeSubscription = await stripe!.subscriptions.retrieve(subscription);
        const accountId = stripeSubscription.metadata?.accountId;
        
        if (accountId) {
          await updateSubscriptionStatus(accountId, "past_due");
        }
      }
      break;
    }

    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }
};

/**
 * Map Stripe subscription status to our status
 */
const mapStripeStatus = (
  stripeStatus: Stripe.Subscription.Status
): SubscriptionPlan["status"] => {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "canceled";
    case "trialing":
      return "trialing";
    default:
      return "active";
  }
};

/**
 * Cancel subscription at period end
 */
export const cancelSubscription = async (
  stripeSubscriptionId: string
): Promise<void> => {
  if (!stripe) {
    throw new Error("Stripe not initialized");
  }

  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
};

/**
 * Resume a subscription that was set to cancel
 */
export const resumeSubscription = async (
  stripeSubscriptionId: string
): Promise<void> => {
  if (!stripe) {
    throw new Error("Stripe not initialized");
  }

  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: false,
  });
};

/**
 * Update subscription to a different plan
 */
export const updateSubscription = async (
  stripeSubscriptionId: string,
  newTier: PlanTier,
  isAnnual: boolean = false
): Promise<void> => {
  if (!stripe) {
    throw new Error("Stripe not initialized");
  }

  const config = PLAN_CONFIGS[newTier];
  const priceId = isAnnual ? config.stripeAnnualPriceId : config.stripePriceId;

  if (!priceId) {
    throw new Error(`No price configured for tier: ${newTier}`);
  }

  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  
  // Find the main subscription item (not metered)
  const mainItem = subscription.items.data.find(
    (item) => item.price.recurring?.usage_type !== "metered"
  );

  if (!mainItem) {
    throw new Error("No main subscription item found");
  }

  await stripe.subscriptions.update(stripeSubscriptionId, {
    items: [
      {
        id: mainItem.id,
        price: priceId,
      },
    ],
    metadata: {
      tier: newTier,
    },
    proration_behavior: "create_prorations",
  });
};

/**
 * Get subscription details from Stripe
 */
export const getStripeSubscription = async (
  stripeSubscriptionId: string
): Promise<Stripe.Subscription | null> => {
  if (!stripe) {
    return null;
  }

  try {
    return await stripe.subscriptions.retrieve(stripeSubscriptionId);
  } catch {
    return null;
  }
};

/**
 * Get upcoming invoice preview
 */
export const getUpcomingInvoice = async (
  customerId: string
): Promise<Stripe.UpcomingInvoice | null> => {
  if (!stripe) {
    return null;
  }

  try {
    return await stripe.invoices.retrieveUpcoming({
      customer: customerId,
    });
  } catch {
    return null;
  }
};

/**
 * Verify webhook signature
 */
export const constructWebhookEvent = (
  payload: string | Buffer,
  signature: string
): Stripe.Event => {
  if (!stripe) {
    throw new Error("Stripe not initialized");
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error("Stripe webhook secret not configured");
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
};
