import { json } from '@remix-run/node';
import { authenticateAdmin } from '~/lib/shopify/auth.server';
import { getComparisonMetrics, getTimeSeriesData } from '~/lib/analytics/analytics.service.server';

/**
 * GET /admin/analytics/funnel
 * Returns analytics with period comparison and time series data
 */
export const loader = async ({ request }) => {
  try {
    const auth = await authenticateAdmin(request);
    const { shop } = auth;

    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '7d';

    // Calculate date ranges for current and previous periods
    const currentTo = new Date();
    let currentFrom = new Date();
    let periodDays = 7;

    if (period === '7d') {
      periodDays = 7;
      currentFrom.setDate(currentFrom.getDate() - 7);
    } else if (period === '30d') {
      periodDays = 30;
      currentFrom.setDate(currentFrom.getDate() - 30);
    } else if (period === '90d') {
      periodDays = 90;
      currentFrom.setDate(currentFrom.getDate() - 90);
    }

    // Calculate previous period dates (same length as current period)
    const previousTo = new Date(currentFrom.getTime() - 1);
    const previousFrom = new Date(previousTo);
    previousFrom.setDate(previousFrom.getDate() - periodDays);

    // Fetch comparison metrics and time series data
    const [comparisonMetrics, timeSeries] = await Promise.all([
      getComparisonMetrics(shop, currentFrom, currentTo, previousFrom, previousTo),
      getTimeSeriesData(shop, currentFrom, currentTo, previousFrom, previousTo)
    ]);

    // Format period labels for display
    const formatDateLabel = (date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const currentPeriodLabel = `${formatDateLabel(currentFrom)}–${formatDateLabel(currentTo)}`;
    const previousPeriodLabel = `${formatDateLabel(previousFrom)}–${formatDateLabel(previousTo)}`;

    return json({
      success: true,
      period,
      currentPeriodLabel,
      previousPeriodLabel,
      dateRange: {
        current: {
          from: currentFrom.toISOString(),
          to: currentTo.toISOString()
        },
        previous: {
          from: previousFrom.toISOString(),
          to: previousTo.toISOString()
        }
      },
      metrics: comparisonMetrics,
      timeSeries
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);

    if (error.status) {
      return error;
    }

    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

