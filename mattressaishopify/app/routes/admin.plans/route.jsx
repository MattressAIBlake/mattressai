import { json, redirect } from '@remix-run/node';
import { useLoaderData, useSubmit } from '@remix-run/react';
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
  Divider
} from '@shopify/polaris';
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
  const { session, billing } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const action = formData.get('action');
  const planName = formData.get('planName');

  if (action === 'upgrade') {
    // In production, this would create a Shopify billing charge
    // For now, we'll simulate it
    
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
      // Create Shopify billing charge
      const billingResponse = await billing.request({
        plan: planConfig.name,
        price: planConfig.price,
        currencyCode: 'USD',
        interval: billing.BillingInterval.Every30Days,
        returnUrl: `https://${shop}/admin/apps/mattressai/admin/plans`
      });

      // Redirect to Shopify confirmation page
      return redirect(billingResponse.confirmationUrl);
    } catch (error) {
      console.error('Billing error:', error);
      return json({ error: 'Failed to create billing charge' }, { status: 500 });
    }
  }

  return json({ success: true });
};

export default function PlansPage() {
  const { currentPlan, inTrial, trialDaysLeft, usage, plans, quotas } = useLoaderData();
  const submit = useSubmit();

  const handleUpgrade = (planName) => {
    const formData = new FormData();
    formData.append('action', 'upgrade');
    formData.append('planName', planName);
    submit(formData, { method: 'post' });
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
    <Page
      title="Plans & Usage"
      subtitle="Manage your subscription and monitor usage"
    >
      <Layout>
        {/* Current Plan & Trial */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingLg">
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
              <Text as="h2" variant="headingMd">
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
                    Alerts (Last Hour)
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {usage.alertsLastHour} / {quotas.alertsPerHour}
                  </Text>
                </InlineStack>
                <ProgressBar
                  progress={getUsagePercent(usage.alertsLastHour, quotas.alertsPerHour)}
                  tone={getUsageTone(getUsagePercent(usage.alertsLastHour, quotas.alertsPerHour))}
                />
              </BlockStack>

              <Divider />

              {/* Index Jobs */}
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">
                    Indexing Jobs
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {usage.runningIndexJobs} running / {quotas.indexJobs} max
                  </Text>
                </InlineStack>
                <ProgressBar
                  progress={getUsagePercent(usage.runningIndexJobs, quotas.indexJobs)}
                  tone={getUsageTone(getUsagePercent(usage.runningIndexJobs, quotas.indexJobs))}
                />
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
          <Text as="h2" variant="headingLg">
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
                  </BlockStack>

                  <Divider />

                  <List type="bullet">
                    <List.Item>{plan.features.tokens}</List.Item>
                    <List.Item>{plan.features.alertsPerHour}</List.Item>
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

