import { json } from '@remix-run/node';
import { authenticateAdmin } from '~/lib/shopify/auth.server';
import { getFunnelData, getSessionAnalytics, getLeadAnalytics } from '~/lib/analytics/analytics.service.server';

/**
 * GET /admin/analytics/funnel
 * Returns funnel analytics for a date range
 */
export const loader = async ({ request }) => {
  try {
    const auth = await authenticateAdmin(request);
    const { shop } = auth;

    const url = new URL(request.url);
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');

    // Default to last 7 days
    const to = toParam ? new Date(toParam) : new Date();
    const from = fromParam ? new Date(fromParam) : new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [funnel, sessions, leads] = await Promise.all([
      getFunnelData(shop, from, to),
      getSessionAnalytics(shop, from, to),
      getLeadAnalytics(shop, from, to)
    ]);

    return json({
      success: true,
      dateRange: {
        from: from.toISOString(),
        to: to.toISOString()
      },
      funnel,
      sessions,
      leads
    });
  } catch (error) {
    console.error('Error fetching funnel analytics:', error);

    if (error.status) {
      return error;
    }

    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

