import { json } from '@remix-run/node';
import { PrismaClient } from '@prisma/client';
import { verifyWebhookHmac } from '~/lib/shopify/verifyWebhookHmac';
import { upgradePlan, downgradePlan } from '~/lib/billing/billing.service';

const prisma = new PrismaClient();

/**
 * POST /webhooks/app_subscriptions/update
 * Handles Shopify app subscription update webhooks
 */
export const action = async ({ request }) => {
  try {
    // Verify webhook HMAC
    const isValid = verifyWebhookHmac(request);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await request.json();
    const { app_subscription } = body;

    // Get shop domain from webhook headers
    const shopDomain = request.headers.get('X-Shopify-Shop-Domain');
    if (!shopDomain) {
      console.error('Missing shop domain');
      return json({ error: 'Missing shop domain' }, { status: 400 });
    }

    console.log(`Processing app subscription update webhook for ${shopDomain}`, {
      status: app_subscription.status,
      name: app_subscription.name,
      id: app_subscription.id
    });

    // Handle subscription status changes
    if (app_subscription.status === 'ACTIVE') {
      // Subscription is active - upgrade the plan
      const planName = app_subscription.name.toLowerCase().replace(' plan', '');
      
      if (planName === 'pro' || planName === 'enterprise') {
        await upgradePlan(shopDomain, planName, app_subscription.id);
        console.log(`Upgraded ${shopDomain} to ${planName} plan`);
      }
    } else if (app_subscription.status === 'CANCELLED' || app_subscription.status === 'EXPIRED') {
      // Subscription cancelled or expired - downgrade to starter
      await downgradePlan(shopDomain);
      console.log(`Downgraded ${shopDomain} to starter plan`);
    }

    return json({ success: true, processed: true });

  } catch (error) {
    console.error('App subscription update webhook error:', error);

    if (error.status) {
      return error;
    }

    return json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
};

