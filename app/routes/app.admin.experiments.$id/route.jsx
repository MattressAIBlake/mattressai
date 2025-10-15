import { json } from '@remix-run/node';
import { useLoaderData, useNavigate, useSubmit } from '@remix-run/react';
import {
  Page,
  Layout,
  Card,
  DataTable,
  Badge,
  Button,
  Text,
  BlockStack,
  InlineGrid,
  InlineStack,
  ProgressBar
} from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';
import { authenticate } from '~/shopify.server';
import { getExperimentMetrics, updateExperimentStatus, calculateSignificance } from '~/lib/experiments/ab-testing.service.server';

export const loader = async ({ request, params }) => {
  const { session } = await authenticate.admin(request);
  const { id } = params;

  const { experiment, metrics } = await getExperimentMetrics(id);

  // Calculate statistical significance between variants
  let significance = null;
  if (metrics.length === 2) {
    significance = calculateSignificance(
      { successes: metrics[0].leads, trials: metrics[0].sessions },
      { successes: metrics[1].leads, trials: metrics[1].sessions }
    );
  }

  return json({
    experiment: {
      id: experiment.id,
      name: experiment.name,
      status: experiment.status,
      startAt: experiment.startAt.toISOString(),
      endAt: experiment.endAt?.toISOString()
    },
    metrics,
    significance
  });
};

export const action = async ({ request, params }) => {
  const { session } = await authenticate.admin(request);
  const { id } = params;
  const formData = await request.formData();
  const action = formData.get('action');

  if (action === 'pause') {
    await updateExperimentStatus(id, 'paused');
  } else if (action === 'resume') {
    await updateExperimentStatus(id, 'active');
  } else if (action === 'complete') {
    await updateExperimentStatus(id, 'completed');
  }

  return json({ success: true });
};

export default function ExperimentDetailPage() {
  const { experiment, metrics, significance } = useLoaderData();
  const navigate = useNavigate();
  const submit = useSubmit();

  const handleAction = (actionType) => {
    const formData = new FormData();
    formData.append('action', actionType);
    submit(formData, { method: 'post' });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: 'success',
      paused: 'warning',
      completed: 'info'
    };

    return (
      <Badge tone={statusMap[status] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const primaryAction = () => {
    if (experiment.status === 'active') {
      return {
        content: 'Pause Experiment',
        onAction: () => handleAction('pause')
      };
    } else if (experiment.status === 'paused') {
      return {
        content: 'Resume Experiment',
        onAction: () => handleAction('resume')
      };
    }
    return null;
  };

  const secondaryActions = () => {
    const actions = [
      {
        content: 'Back to Experiments',
        onAction: () => navigate('/app/admin/experiments')
      }
    ];

    if (experiment.status !== 'completed') {
      actions.push({
        content: 'Complete Experiment',
        onAction: () => handleAction('complete'),
        destructive: true
      });
    }

    return actions;
  };

  // Find best performing variant
  const bestVariant = metrics.reduce((best, current) => 
    current.conversionRate > (best?.conversionRate || 0) ? current : best
  , null);

  const rows = metrics.map((metric) => [
    <InlineStack gap="200" key={metric.variantId}>
      <Text as="span" fontWeight="semibold">{metric.variantName}</Text>
      {metric.variantId === bestVariant?.variantId && (
        <Badge tone="success">Best</Badge>
      )}
    </InlineStack>,
    `${metric.splitPercent}%`,
    metric.sessions.toLocaleString(),
    metric.leads.toLocaleString(),
    `${metric.leadRate.toFixed(1)}%`,
    metric.addToCarts.toLocaleString(),
    `${metric.addToCartRate.toFixed(1)}%`,
    metric.orders.toLocaleString(),
    `${metric.conversionRate.toFixed(1)}%`
  ]);

  return (
    <Page>
      <TitleBar 
        title={experiment.name}
        primaryAction={primaryAction()}
      />
      <Layout>
        {/* Overview Cards */}
        <Layout.Section>
          <InlineGrid columns={4} gap="400">
            {metrics.map((metric) => (
              <Card key={metric.variantId}>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    {metric.variantName}
                  </Text>
                  <Text as="p" variant="bodyLg" fontWeight="semibold">
                    {metric.conversionRate.toFixed(1)}%
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Conversion Rate
                  </Text>
                  <ProgressBar
                    progress={Math.min(metric.conversionRate, 100)}
                    tone="primary"
                  />
                  <Text as="p" variant="bodySm" tone="subdued">
                    {metric.sessions.toLocaleString()} sessions
                  </Text>
                </BlockStack>
              </Card>
            ))}
          </InlineGrid>
        </Layout.Section>

        {/* Statistical Significance */}
        {significance && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Statistical Significance
                </Text>
                <InlineStack gap="400">
                  <div>
                    <Text as="p" variant="bodySm" tone="subdued">
                      P-Value
                    </Text>
                    <Text as="p" variant="bodyLg" fontWeight="semibold">
                      {significance.pValue.toFixed(4)}
                    </Text>
                  </div>
                  <div>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Z-Score
                    </Text>
                    <Text as="p" variant="bodyLg" fontWeight="semibold">
                      {significance.zScore.toFixed(2)}
                    </Text>
                  </div>
                  <div>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Significant?
                    </Text>
                    <Badge tone={significance.significant ? 'success' : 'warning'}>
                      {significance.significant ? 'Yes (p < 0.05)' : 'Not yet'}
                    </Badge>
                  </div>
                </InlineStack>
                <Text as="p" variant="bodySm">
                  {significance.significant
                    ? 'The difference between variants is statistically significant.'
                    : 'Continue running the experiment to gather more data for statistical significance.'}
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* Detailed Metrics */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Variant Performance
              </Text>
              <DataTable
                columnContentTypes={[
                  'text',
                  'text',
                  'numeric',
                  'numeric',
                  'numeric',
                  'numeric',
                  'numeric',
                  'numeric',
                  'numeric'
                ]}
                headings={[
                  'Variant',
                  'Traffic Split',
                  'Sessions',
                  'Leads',
                  'Lead Rate',
                  'Add to Carts',
                  'Cart Rate',
                  'Orders',
                  'Conversion'
                ]}
                rows={rows}
              />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}


