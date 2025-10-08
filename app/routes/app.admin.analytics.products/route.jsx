import { json } from '@remix-run/node';
import { authenticateAdmin } from '~/lib/shopify/auth.server';
import { getProductInsights } from '~/lib/analytics/analytics.service';

/**
 * GET /admin/analytics/products
 * Returns product performance insights
 */
export const loader = async ({ request }) => {
  try {
    const auth = await authenticateAdmin(request);
    const { shop } = auth;

    const url = new URL(request.url);
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    // Default to last 7 days
    const to = toParam ? new Date(toParam) : new Date();
    const from = fromParam ? new Date(fromParam) : new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);

    const products = await getProductInsights(shop, from, to, limit);

    return json({
      success: true,
      dateRange: {
        from: from.toISOString(),
        to: to.toISOString()
      },
      products
    });
  } catch (error) {
    console.error('Error fetching product insights:', error);

    if (error.status) {
      return error;
    }

    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

