import { json } from '@remix-run/node';
import { verifyProxyHmac } from '~/lib/shopify/verifyProxyHmac';
import { endSession } from '~/lib/session/session-orchestrator.service.server';

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
        console.error('Invalid HMAC signature for session close request');
        throw new Response('Unauthorized', { status: 401 });
      }
    } else {
      // No HMAC params - this is a direct widget request, which is allowed
      if (!isDevelopment) {
        console.log('Session close request from widget (no HMAC validation)');
      }
    }
  } else if (!isDevelopment) {
    console.warn('SHOPIFY_API_SECRET not configured - HMAC verification disabled');
  }

  try {
    const body = await request.json();
    const { sessionId, tenantId, conversationId, consent } = body;

    if (!sessionId || !tenantId) {
      return json(
        { error: 'sessionId and tenantId are required' },
        { status: 400 }
      );
    }

    // End the session
    await endSession({
      sessionId,
      tenantId,
      conversationId,
      endReason: 'explicit_close',
      consent
    });

    return json({
      ok: true,
      sessionId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error closing session:', error);
    return json(
      { error: 'Failed to close session' },
      { status: 500 }
    );
  }
};
