import { useState, useCallback, useEffect } from 'react';
import { json } from '@remix-run/node';
import { useFetcher } from '@remix-run/react';
import {
  Page,
  Card,
  Layout,
  Text,
  Select,
  DataTable,
  BlockStack,
  InlineStack,
  ProgressBar
} from '@shopify/polaris';
import { authenticate } from '~/shopify.server';

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return json({});
};

export default function AnalyticsDashboard() {
  const funnelFetcher = useFetcher();
  const productsFetcher = useFetcher();

  const [dateRange, setDateRange] = useState('7d');

  const loadAnalytics = useCallback(() => {
    const to = new Date();
    let from = new Date();
    if (dateRange === '7d') from.setDate(from.getDate() - 7);
    else if (dateRange === '30d') from.setDate(from.getDate() - 30);
    else if (dateRange === '90d') from.setDate(from.getDate() - 90);

    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString()
    });

    funnelFetcher.load(`/admin/analytics/funnel?${params.toString()}`);
    productsFetcher.load(`/admin/analytics/products?${params.toString()}`);
  }, [dateRange, funnelFetcher, productsFetcher]);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const funnel = funnelFetcher.data?.funnel || null;
  const sessions = funnelFetcher.data?.sessions || null;
  const leads = funnelFetcher.data?.leads || null;
  const products = productsFetcher.data?.products || [];

  const funnelSteps = funnel ? [
    { label: 'Widget Viewed', count: funnel.widget_viewed, rate: 100 },
    { label: 'Chat Opened', count: funnel.opened, rate: funnel.conversionRates.viewToOpen },
    { label: 'First Message', count: funnel.first_message, rate: funnel.conversionRates.openToMessage },
    { label: 'Data Captured', count: funnel.data_point_captured, rate: funnel.conversionRates.messageToData },
    { label: 'Recs Shown', count: funnel.recommendation_shown, rate: funnel.conversionRates.dataToRecs },
    { label: 'Recs Clicked', count: funnel.recommendation_clicked, rate: funnel.conversionRates.recsToClick },
    { label: 'Added to Cart', count: funnel.add_to_cart, rate: funnel.conversionRates.clickToCart },
    { label: 'Checkout', count: funnel.checkout_started, rate: funnel.conversionRates.cartToCheckout },
    { label: 'Order Placed', count: funnel.order_placed, rate: funnel.conversionRates.checkoutToOrder }
  ] : [];

  const productRows = products.map((product) => [
    product.productTitle,
    product.recommendedCount,
    product.clickedCount,
    product.addedToCartCount,
    product.orderedCount,
    `${product.conversionRate}%`
  ]);

  return (
    <Page
      title="Analytics Dashboard"
      subtitle="Track conversion funnel performance and product insights"
    >
      <Layout>
        <Layout.Section>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <Select
              label="Date Range"
              labelHidden
              options={[
                { label: 'Last 7 days', value: '7d' },
                { label: 'Last 30 days', value: '30d' },
                { label: 'Last 90 days', value: '90d' }
              ]}
              value={dateRange}
              onChange={setDateRange}
            />
          </div>
        </Layout.Section>

        {/* Session Stats */}
        {sessions && (
          <Layout.Section>
            <InlineStack gap="400">
              <Card>
                <div style={{ padding: '16px', minWidth: '200px' }}>
                  <Text variant="bodyMd" as="p" tone="subdued">Total Sessions</Text>
                  <Text variant="heading2xl" as="h3">{sessions.totalSessions}</Text>
                </div>
              </Card>
              <Card>
                <div style={{ padding: '16px', minWidth: '200px' }}>
                  <Text variant="bodyMd" as="p" tone="subdued">Active Sessions</Text>
                  <Text variant="heading2xl" as="h3">{sessions.activeSessions}</Text>
                </div>
              </Card>
              <Card>
                <div style={{ padding: '16px', minWidth: '200px' }}>
                  <Text variant="bodyMd" as="p" tone="subdued">Avg Intent Score</Text>
                  <Text variant="heading2xl" as="h3">{sessions.avgIntentScore}</Text>
                </div>
              </Card>
            </InlineStack>
          </Layout.Section>
        )}

        {/* Lead Stats */}
        {leads && (
          <Layout.Section>
            <InlineStack gap="400">
              <Card>
                <div style={{ padding: '16px', minWidth: '200px' }}>
                  <Text variant="bodyMd" as="p" tone="subdued">Total Leads</Text>
                  <Text variant="heading2xl" as="h3">{leads.totalLeads}</Text>
                </div>
              </Card>
              <Card>
                <div style={{ padding: '16px', minWidth: '200px' }}>
                  <Text variant="bodyMd" as="p" tone="subdued">Consent Rate</Text>
                  <Text variant="heading2xl" as="h3">{leads.consentRate}%</Text>
                </div>
              </Card>
              <Card>
                <div style={{ padding: '16px', minWidth: '200px' }}>
                  <Text variant="bodyMd" as="p" tone="subdued">Won Leads</Text>
                  <Text variant="heading2xl" as="h3">{leads.statusBreakdown?.won || 0}</Text>
                </div>
              </Card>
            </InlineStack>
          </Layout.Section>
        )}

        {/* Funnel Chart */}
        <Layout.Section>
          <Card>
            <div style={{ padding: '16px' }}>
              <Text variant="headingMd" as="h2" fontWeight="semibold">Conversion Funnel</Text>
              <div style={{ marginTop: '24px' }}>
                {funnelSteps.length > 0 ? (
                  <BlockStack gap="400">
                    {funnelSteps.map((step, index) => (
                      <div key={index} style={{ padding: '12px', border: '1px solid #e1e3e5', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <Text variant="bodyMd" as="p" fontWeight="semibold">
                            {step.label}
                          </Text>
                          <Text variant="bodyMd" as="p">
                            {step.count} ({step.rate}%)
                          </Text>
                        </div>
                        <ProgressBar progress={step.rate} size="small" />
                      </div>
                    ))}
                  </BlockStack>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <Text variant="bodyMd" as="p">Loading funnel data...</Text>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </Layout.Section>

        {/* Product Insights */}
        <Layout.Section>
          <Card>
            <div style={{ padding: '16px' }}>
              <Text variant="headingMd" as="h2" fontWeight="semibold">Top Products</Text>
              <div style={{ marginTop: '16px' }}>
                {productRows.length > 0 ? (
                  <DataTable
                    columnContentTypes={['text', 'numeric', 'numeric', 'numeric', 'numeric', 'text']}
                    headings={[
                      'Product',
                      'Recommended',
                      'Clicked',
                      'Added to Cart',
                      'Ordered',
                      'Conv. Rate'
                    ]}
                    rows={productRows}
                  />
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <Text variant="bodyMd" as="p">
                      {productsFetcher.state === 'loading' 
                        ? 'Loading product insights...' 
                        : 'No product data available yet'}
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </Layout.Section>

        {/* End Reasons Breakdown */}
        {sessions?.endReasons && Object.keys(sessions.endReasons).length > 0 && (
          <Layout.Section>
            <Card>
              <div style={{ padding: '16px' }}>
                <Text variant="headingMd" as="h2" fontWeight="semibold">Session End Reasons</Text>
                <div style={{ marginTop: '16px' }}>
                  <BlockStack gap="300">
                    {Object.entries(sessions.endReasons).map(([reason, count]) => (
                      <div key={reason} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text variant="bodyMd" as="p">
                          {reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Text>
                        <Text variant="bodyMd" as="p" fontWeight="semibold">
                          {count}
                        </Text>
                      </div>
                    ))}
                  </BlockStack>
                </div>
              </div>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}

