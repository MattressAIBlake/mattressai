import { json } from '@remix-run/node';
import { verifyProxyHmac } from '~/lib/shopify/verifyProxyHmac';
import { trackEvent } from '~/lib/analytics/analytics.service.server';

export const action = async ({ request }) => {
  // Verify App Proxy HMAC (optional for widget requests)
  const shopifySecret = process.env.SHOPIFY_API_SECRET;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Try to verify HMAC if secret is available and params are present
  if (shopifySecret) {
    const url = new URL(request.url);
    const hasHmacParams = url.searchParams.has('signature') || url.searchParams.has('hmac');
    
    // Only validate HMAC if params are present
    if (hasHmacParams) {
      const isValidHmac = verifyProxyHmac(request.url, shopifySecret);
      
      if (!isValidHmac) {
        console.error('Invalid HMAC signature for event tracking request');
        throw new Response('Unauthorized', { status: 401 });
      }
    } else {
      // No HMAC params - this is a direct widget request, which is allowed
      if (!isDevelopment) {
        console.log('Event tracking request from widget (no HMAC validation)');
      }
    }
  } else if (!isDevelopment) {
    console.warn('SHOPIFY_API_SECRET not configured - HMAC verification disabled');
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

