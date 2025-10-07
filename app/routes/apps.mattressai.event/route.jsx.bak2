import { json } from '@remix-run/node';
import { verifyProxyHmac } from '~/lib/shopify/verifyProxyHmac.server';
import { trackEvent } from '~/lib/analytics/analytics.service';

export const action = async ({ request }) => {
  // Verify App Proxy HMAC
  const shopifySecret = process.env.SHOPIFY_APP_SECRET;
  if (!shopifySecret || !verifyProxyHmac(request.url, shopifySecret)) {
    throw new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { tenantId, sessionId, type, metadata, clickId } = body;

    if (!tenantId || !type) {
      return json(
        { error: 'tenantId and type are required' },
        { status: 400 }
      );
    }

    // Validate event type
    const validTypes = [
      'widget_viewed',
      'opened',
      'first_message',
      'data_point_captured',
      'recommendation_shown',
      'recommendation_clicked',
      'add_to_cart',
      'checkout_started',
      'order_placed'
    ];

    if (!validTypes.includes(type)) {
      return json(
        { error: `Invalid event type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Track the event
    await trackEvent(tenantId, sessionId || null, type, metadata || {}, clickId);

    return json({
      ok: true,
      type,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error tracking event:', error);
    return json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
};

