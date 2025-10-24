import { useState, useCallback, useEffect } from 'react';
import { json } from '@remix-run/node';
import { useFetcher } from '@remix-run/react';
import {
  Page,
  Layout,
  InlineStack,
  BlockStack,
  Button,
  ButtonGroup
} from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';
import { authenticate } from '~/shopify.server';
import MetricCard from '~/components/analytics/MetricCard';
import TimeSeriesChart from '~/components/analytics/TimeSeriesChart';

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return json({});
};

export default function AnalyticsDashboard() {
  const fetcher = useFetcher();
  const [period, setPeriod] = useState('30d');

  const loadAnalytics = useCallback(() => {
    const params = new URLSearchParams({ period });
    fetcher.load(`/app/admin/analytics/funnel?${params.toString()}`);
  }, [period, fetcher]);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  // Extract data from fetcher
  const metrics = fetcher.data?.metrics || null;
  const timeSeries = fetcher.data?.timeSeries || [];
  const currentPeriodLabel = fetcher.data?.currentPeriodLabel || '';
  const previousPeriodLabel = fetcher.data?.previousPeriodLabel || '';
  const isLoading = fetcher.state === 'loading';

  // Period selector handler
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  // Format numbers for display
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '—';
    return num.toLocaleString();
  };

  // Format currency
  const formatCurrency = (num) => {
    if (num === null || num === undefined) return '—';
    return `$${num.toLocaleString()}`;
  };

  // Format percentage
  const formatPercent = (num) => {
    if (num === null || num === undefined) return '—';
    return `${num}%`;
  };

  return (
    <Page>
      <TitleBar title="Analytics Dashboard" />
      <Layout>
        {/* Header with period selector */}
        <Layout.Section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <ButtonGroup variant="segmented">
                <Button
                  pressed={period === '7d'}
                  onClick={() => handlePeriodChange('7d')}
                >
                  Last 7 days
                </Button>
                <Button
                  pressed={period === '30d'}
                  onClick={() => handlePeriodChange('30d')}
                >
                  Last 30 days
                </Button>
                <Button
                  pressed={period === '90d'}
                  onClick={() => handlePeriodChange('90d')}
                >
                  Last 90 days
                </Button>
              </ButtonGroup>
            </div>
          </div>
        </Layout.Section>

        {/* Metric Cards */}
        {metrics && (
          <Layout.Section>
            <InlineStack gap="400" wrap={false}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <MetricCard
                  label="Sessions"
                  value={formatNumber(metrics.current.sessions)}
                  changePercent={metrics.change.sessions}
                  isPositive={metrics.change.sessions >= 0}
                />
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <MetricCard
                  label="Total sales"
                  value={formatCurrency(metrics.current.sales)}
                  changePercent={metrics.change.sales}
                  isPositive={metrics.change.sales >= 0}
                />
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <MetricCard
                  label="Orders"
                  value={formatNumber(metrics.current.orders)}
                  changePercent={metrics.change.orders}
                  isPositive={metrics.change.orders >= 0}
                />
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <MetricCard
                  label="Conversion rate"
                  value={formatPercent(metrics.current.conversionRate)}
                  changePercent={metrics.change.conversionRate}
                  isPositive={metrics.change.conversionRate >= 0}
                />
              </div>
            </InlineStack>
          </Layout.Section>
        )}

        {/* Loading State for Metrics */}
        {isLoading && !metrics && (
          <Layout.Section>
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <BlockStack gap="200">
                <div>Loading analytics...</div>
              </BlockStack>
            </div>
          </Layout.Section>
        )}

        {/* Time Series Chart */}
        {timeSeries.length > 0 && (
          <Layout.Section>
            <TimeSeriesChart
              data={timeSeries}
              currentPeriodLabel={currentPeriodLabel}
              previousPeriodLabel={previousPeriodLabel}
            />
          </Layout.Section>
        )}

        {/* Empty State */}
        {!isLoading && !metrics && (
          <Layout.Section>
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <BlockStack gap="200">
                <div>No analytics data available yet.</div>
                <div style={{ color: '#6d7175', fontSize: '14px' }}>
                  Start tracking events to see your analytics here.
                </div>
              </BlockStack>
            </div>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
