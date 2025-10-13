import { json, redirect } from '@remix-run/node';
import { useLoaderData, useSubmit, useActionData, useNavigation, useSearchParams } from '@remix-run/react';
import { useEffect } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineGrid,
  InlineStack,
  Button,
  Badge,
  ProgressBar,
  List,
  Divider,
  Banner
} from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';
import { authenticate } from '~/shopify.server';
import { getTenantPlan, getUsageStats, getPlanComparison, getOrCreateTenant } from '~/lib/billing/billing.service';

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const tenant = await getOrCreateTenant(shop);
  const currentPlan = await getTenantPlan(shop);
  const usage = await getUsageStats(shop, 'current_month');
  const plans = getPlanComparison();

  // Check if in trial
  const now = new Date();
  const inTrial = tenant.trialEndsAt && tenant.trialEndsAt > now;
  const trialDaysLeft = inTrial 
    ? Math.ceil((tenant.trialEndsAt - now) / (1000 * 60 * 60 * 24))
    : 0;

  return json({
    currentPlan: currentPlan.name,
    inTrial,
    trialDaysLeft,
    usage,
    plans,
    quotas: currentPlan.features
  });
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const action = formData.get('action');
  const planName = formData.get('planName');

  if (action === 'upgrade') {
    // Get plan config
    const planConfigs = {
      pro: { price: 49, name: 'Pro Plan' },
      enterprise: { price: 199, name: 'Enterprise Plan' }
    };

    const planConfig = planConfigs[planName];
    
    if (!planConfig) {
      return json({ error: 'Invalid plan' }, { status: 400 });
    }

    try {
      // Get the app URL from environment
      const appUrl = process.env.SHOPIFY_APP_URL || process.env.HOST || 'mattressaishopify.vercel.app';
      const returnUrl = `https://${appUrl}/app/admin/billing/callback?plan=${planName}`;
      
      // Create app subscription using GraphQL Admin API
      const response = await admin.graphql(
        `#graphql
          mutation AppSubscriptionCreate($name: String!, $returnUrl: URL!, $test: Boolean, $lineItems: [AppSubscriptionLineItemInput!]!) {
            appSubscriptionCreate(
              name: $name
              returnUrl: $returnUrl
              test: $test
              lineItems: $lineItems
            ) {
              userErrors {
                field
                message
              }
              confirmationUrl
              appSubscription {
                id
                status
              }
            }
          }`,
        {
          variables: {
            name: planConfig.name,
            returnUrl: returnUrl,
            test: process.env.NODE_ENV !== 'production',
            lineItems: [
              {
                plan: {
                  appRecurringPricingDetails: {
                    price: { amount: planConfig.price, currencyCode: 'USD' },
                    interval: 'EVERY_30_DAYS'
                  }
                }
              }
            ]
          }
        }
      );

      const data = await response.json();
      
      // Log the full response for debugging
      console.log('GraphQL Response:', JSON.stringify(data, null, 2));
      
      const result = data.data?.appSubscriptionCreate;

      // Check for errors
      if (result?.userErrors && result.userErrors.length > 0) {
        console.error('Subscription creation errors:', result.userErrors);
        const errorDetails = result.userErrors.map(e => `${e.field}: ${e.message}`).join(', ');
        return json({ 
          error: 'Failed to create subscription',
          details: errorDetails,
          userErrors: result.userErrors
        }, { status: 400 });
      }
      
      // Check if data is missing
      if (!result) {
        console.error('No result from GraphQL:', data);
        return json({
          error: 'GraphQL request failed',
          details: 'No subscription data returned',
          response: data
        }, { status: 400 });
      }

      // Return confirmation URL to client for App Bridge redirect
      if (result.confirmationUrl) {
        return json({ 
          confirmationUrl: result.confirmationUrl,
          redirectToShopify: true 
        });
      }

      // If no confirmation URL, subscription might already be active
      return json({ success: true, message: 'Subscription already active' });
    } catch (error) {
      console.error('Billing error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        shop,
        planName,
        planConfig
      });
      return json({ 
        error: 'Failed to create billing charge', 
        details: error.message 
      }, { status: 500 });
    }
  }

  return json({ success: true });
};

export default function PlansPage() {
  const { currentPlan, inTrial, trialDaysLeft, usage, plans, quotas } = useLoaderData();
  const submit = useSubmit();
  const actionData = useActionData();
  const navigation = useNavigation();

  // Get status from URL params (from billing callback)
  const [searchParams] = useSearchParams();
  const billingStatus = searchParams.get('status');
  const billingMessage = searchParams.get('message');

  // Handle redirect to Shopify billing confirmation
  useEffect(() => {
    if (actionData?.redirectToShopify && actionData?.confirmationUrl) {
      console.log('🔵 Redirecting to Shopify billing:', actionData.confirmationUrl);
      // Use top.location to break out of iframe
      window.top.location.href = actionData.confirmationUrl;
    }
  }, [actionData]);

  const handleUpgrade = (planName) => {
    console.log('🔵 Button clicked! Plan:', planName);
    console.log('🔵 Submit function:', typeof submit);
    
    try {
      const formData = new FormData();
      formData.append('action', 'upgrade');
      formData.append('planName', planName);
      console.log('🔵 FormData created:', Array.from(formData.entries()));
      
      submit(formData, { method: 'post' });
      console.log('🔵 Submit called successfully');
    } catch (error) {
      console.error('🔴 Error in handleUpgrade:', error);
      alert('Error: ' + error.message);
    }
  };

  const getUsagePercent = (used, limit) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageTone = (percent) => {
    if (percent >= 90) return 'critical';
    if (percent >= 75) return 'warning';
    return 'success';
  };

  return (
    <Page>
      <TitleBar 
        title="Plans & Billing"
        primaryAction={null}
        secondaryActions={[
          {
            content: 'Back to Dashboard',
            onAction: () => window.location.href = '/app'
          }
        ]}
      />
      <Layout>
        {/* Billing Status Messages */}
        {billingStatus && (
          <Layout.Section>
            {billingStatus === 'success' && (
              <Banner tone="success" onDismiss={() => window.history.replaceState({}, '', '/app/admin/plans')}>
                <p>{billingMessage || 'Plan upgraded successfully!'}</p>
              </Banner>
            )}
            {billingStatus === 'declined' && (
              <Banner tone="warning" onDismiss={() => window.history.replaceState({}, '', '/app/admin/plans')}>
                <p>Billing approval was declined. You can upgrade your plan anytime.</p>
              </Banner>
            )}
            {billingStatus === 'pending' && (
              <Banner tone="info" onDismiss={() => window.history.replaceState({}, '', '/app/admin/plans')}>
                <p>Your billing approval is still pending. Please complete the approval process.</p>
              </Banner>
            )}
            {billingStatus === 'error' && (
              <Banner tone="critical" onDismiss={() => window.history.replaceState({}, '', '/app/admin/plans')}>
                <p>{billingMessage || 'An error occurred while processing your billing. Please try again.'}</p>
              </Banner>
            )}
          </Layout.Section>
        )}

        {/* Current Plan & Trial */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingLg" fontWeight="bold">
                    Current Plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                  </Text>
                  {inTrial && (
                    <Badge tone="info">
                      Trial: {trialDaysLeft} days remaining
                    </Badge>
                  )}
                </BlockStack>
                {currentPlan !== 'enterprise' && (
                  <Button
                    variant="primary"
                    onClick={() => handleUpgrade(currentPlan === 'starter' ? 'pro' : 'enterprise')}
                  >
                    Upgrade Plan
                  </Button>
                )}
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Usage Stats */}
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <Text as="h2" variant="headingMd" fontWeight="semibold">
                Current Usage (This Month)
              </Text>

              {/* Tokens */}
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">
                    AI Tokens
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {usage.tokensUsed.toLocaleString()} / {quotas.tokens.toLocaleString()}
                  </Text>
                </InlineStack>
                <ProgressBar
                  progress={getUsagePercent(usage.tokensUsed, quotas.tokens)}
                  tone={getUsageTone(getUsagePercent(usage.tokensUsed, quotas.tokens))}
                />
              </BlockStack>

              <Divider />

              {/* Alerts */}
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">
                    Alerts (Today)
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {usage.alertsToday} / {quotas.alertsPerDay === -1 ? 'Unlimited' : quotas.alertsPerDay}
                  </Text>
                </InlineStack>
                {quotas.alertsPerDay !== -1 && (
                  <ProgressBar
                    progress={getUsagePercent(usage.alertsToday, quotas.alertsPerDay)}
                    tone={getUsageTone(getUsagePercent(usage.alertsToday, quotas.alertsPerDay))}
                  />
                )}
              </BlockStack>

              <Divider />

              {/* Index Jobs */}
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">
                    Indexing Jobs
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {usage.runningIndexJobs} running / {quotas.indexJobs === -1 ? 'Unlimited' : quotas.indexJobs} max
                  </Text>
                </InlineStack>
                {quotas.indexJobs !== -1 && (
                  <ProgressBar
                    progress={getUsagePercent(usage.runningIndexJobs, quotas.indexJobs)}
                    tone={getUsageTone(getUsagePercent(usage.runningIndexJobs, quotas.indexJobs))}
                  />
                )}
              </BlockStack>

              <Divider />

              {/* Activity Stats */}
              <InlineGrid columns={3} gap="400">
                <Card>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Sessions
                    </Text>
                    <Text as="p" variant="headingLg">
                      {usage.totalSessions.toLocaleString()}
                    </Text>
                  </BlockStack>
                </Card>
                <Card>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Leads Captured
                    </Text>
                    <Text as="p" variant="headingLg">
                      {usage.totalLeads.toLocaleString()}
                    </Text>
                  </BlockStack>
                </Card>
                <Card>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Total Cost
                    </Text>
                    <Text as="p" variant="headingLg">
                      ${usage.totalCost.toFixed(2)}
                    </Text>
                  </BlockStack>
                </Card>
              </InlineGrid>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Plan Comparison */}
        <Layout.Section>
          <Text as="h2" variant="headingLg" fontWeight="semibold">
            Available Plans
          </Text>
        </Layout.Section>

        <Layout.Section>
          <InlineGrid columns={3} gap="400">
            {plans.map((plan) => (
              <Card key={plan.name}>
                <BlockStack gap="400">
                  <BlockStack gap="200">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="h3" variant="headingMd">
                        {plan.displayName}
                      </Text>
                      {plan.name === currentPlan && (
                        <Badge tone="success">Current</Badge>
                      )}
                    </InlineStack>
                    <Text as="p" variant="headingLg">
                      {plan.priceDisplay}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {plan.guidance}
                    </Text>
                  </BlockStack>

                  <Divider />

                  <List type="bullet">
                    <List.Item>{plan.features.tokens}</List.Item>
                    <List.Item>{plan.features.alertsPerDay}</List.Item>
                    <List.Item>SMS Alerts: {plan.features.smsAlerts}</List.Item>
                    <List.Item>{plan.features.vectorQueries}</List.Item>
                    <List.Item>{plan.features.indexJobs}</List.Item>
                    <List.Item>Priority Indexing: {plan.features.priorityIndexing}</List.Item>
                  </List>

                  {plan.name !== currentPlan && plan.name !== 'starter' && (
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => handleUpgrade(plan.name)}
                    >
                      Upgrade to {plan.displayName}
                    </Button>
                  )}
                </BlockStack>
              </Card>
            ))}
          </InlineGrid>
        </Layout.Section>
      </Layout>
    </Page>
  );
}


