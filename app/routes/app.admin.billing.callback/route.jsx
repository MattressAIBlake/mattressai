import { redirect } from '@remix-run/node';
import { authenticate } from '~/shopify.server';

/**
 * Billing Callback Route
 * Handles the return from Shopify's billing approval page
 * Processes charge acceptance/decline and updates tenant plan
 * 
 * Note: This uses authenticate.admin which will handle the OAuth flow
 * if the session is expired, ensuring smooth redirect from Shopify
 */
export const loader = async ({ request }) => {
  const { upgradePlan, PLAN_CONFIGS } = await import('~/lib/billing/billing.service.server');
  
  try {
    // Use authenticate.admin which handles OAuth flow for returning users
    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop;
    const url = new URL(request.url);

    // Get parameters from URL
    const chargeId = url.searchParams.get('charge_id');
    const planName = url.searchParams.get('plan');
    const isReinstall = url.searchParams.get('reinstall') === 'true';

    console.log('Billing callback received:', {
      shop,
      chargeId,
      planName,
      isReinstall
    });

    // Validate plan name
    if (!planName || !PLAN_CONFIGS[planName]) {
      console.error('Invalid plan name:', planName);
      return redirect('/app/admin/plans?error=invalid_plan');
    }

    // If no charge_id, user declined the charge
    if (!chargeId) {
      console.log('No charge_id - user declined billing');
      return redirect('/app/admin/plans?status=declined');
    }

    // Query Shopify to confirm subscription status
    const response = await admin.graphql(
      `#graphql
        query GetSubscription($id: ID!) {
          node(id: $id) {
            ... on AppSubscription {
              id
              name
              status
              test
              lineItems {
                id
                plan {
                  pricingDetails {
                    ... on AppRecurringPricing {
                      price {
                        amount
                        currencyCode
                      }
                      interval
                    }
                  }
                }
              }
            }
          }
        }`,
      {
        variables: {
          id: `gid://shopify/AppSubscription/${chargeId}`
        }
      }
    );

    const data = await response.json();
    
    // Check for GraphQL errors (like "cannot accept charge")
    if (data.errors && data.errors.length > 0) {
      const errorMessage = data.errors[0].message;
      console.log('GraphQL error when querying subscription:', errorMessage);
      
      // If it's a "cannot accept" error, user likely declined
      if (errorMessage.includes('cannot accept') || errorMessage.includes('not found')) {
        console.log('Subscription was declined or not found');
        return redirect('/app/admin/plans?status=declined');
      }
      
      // Other errors
      throw new Error(errorMessage);
    }
    
    const subscription = data.data?.node;
    
    // Handle case where subscription is null (declined/deleted)
    if (!subscription) {
      console.log('Subscription not found - likely declined');
      return redirect('/app/admin/plans?status=declined');
    }

    console.log('Subscription status:', {
      id: subscription?.id,
      status: subscription?.status,
      name: subscription?.name
    });

    // Check if subscription is active
    if (subscription?.status === 'ACTIVE') {
      // Get current plan before upgrading
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const tenant = await prisma.tenant.findUnique({
        where: { shop }
      });
      const previousPlan = tenant?.planName || 'starter';
      const { PLAN_CONFIGS } = await import('~/lib/billing/billing.service.server');
      const planConfig = PLAN_CONFIGS[planName] || {};
      await prisma.$disconnect();
      
      // Upgrade the tenant plan
      await upgradePlan(shop, planName, chargeId);
      
      console.log(`Successfully upgraded ${shop} to ${planName} plan`);
      
      // Send lifecycle email for plan upgrade
      try {
        const { sendLifecycleEmail } = await import('~/lib/lifecycle-emails/lifecycle-email.service.server');
        
        await sendLifecycleEmail('plan_upgraded', shop, {
          shopDomain: shop,
          planName: planName,
          previousPlan: previousPlan,
          tokensPerMonth: planConfig.quotas?.maxTokensPerDay || 0,
          alertsPerHour: planConfig.quotas?.maxAlertsPerHour || 0,
          vectorQueries: planConfig.quotas?.maxVectorQueries || 0,
          indexJobs: planConfig.quotas?.maxIndexJobs || 0,
          smsEnabled: planName !== 'starter',
          prioritySupport: planName === 'enterprise'
        });
        
        console.log(`Lifecycle email sent for plan_upgraded: ${shop}`);
      } catch (error) {
        console.error('Error sending lifecycle email:', error);
        // Don't block the upgrade flow
      }
      
      const message = isReinstall 
        ? 'Welcome back! Your plan has been restored.'
        : 'Successfully upgraded to ' + planName.charAt(0).toUpperCase() + planName.slice(1) + ' plan!';
      
      return redirect(`/app/admin/plans?status=success&message=${encodeURIComponent(message)}`);
    } else if (subscription?.status === 'DECLINED') {
      console.log('Subscription was declined by user');
      return redirect('/app/admin/plans?status=declined');
    } else if (subscription?.status === 'PENDING') {
      console.log('Subscription is still pending');
      return redirect('/app/admin/plans?status=pending');
    } else {
      console.error('Unexpected subscription status:', subscription?.status);
      return redirect('/app/admin/plans?status=error&message=Unexpected+subscription+status');
    }
  } catch (authError) {
    // If authentication fails, this might be a redirect from Shopify
    // The authenticate.admin() will throw a Response to start OAuth
    console.error('Authentication or processing error:', authError);
    
    // If it's a Response object (redirect), let it through
    if (authError instanceof Response) {
      throw authError;
    }
    
    // Otherwise, redirect to plans with error
    return redirect(`/app/admin/plans?status=error&message=${encodeURIComponent(authError.message || 'Authentication failed')}`);
  }
};

