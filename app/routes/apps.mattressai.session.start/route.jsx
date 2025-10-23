import { json } from '@remix-run/node';
import { verifyProxyHmac } from '~/lib/shopify/verifyProxyHmac';
import { createOrGetSession } from '~/lib/session/session-orchestrator.service.server';

export const action = async ({ request }) => {
  // Verify App Proxy HMAC (optional for widget requests)
  const shopifySecret = process.env.SHOPIFY_APP_SECRET;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Try to verify HMAC if secret is available and params are present
  if (shopifySecret) {
    const url = new URL(request.url);
    const hasHmacParams = url.searchParams.has('signature') || url.searchParams.has('hmac');
    
    // Only validate HMAC if params are present
    if (hasHmacParams) {
      const isValidHmac = verifyProxyHmac(request.url, shopifySecret);
      
      if (!isValidHmac) {
        console.error('Invalid HMAC signature for session start request');
        throw new Response('Unauthorized', { status: 401 });
      }
    } else {
      // No HMAC params - this is a direct widget request, which is allowed
      if (!isDevelopment) {
        console.log('Session start request from widget (no HMAC validation)');
      }
    }
  } else if (!isDevelopment) {
    console.warn('SHOPIFY_APP_SECRET not configured - HMAC verification disabled');
  }

  try {
    const body = await request.json();
    const { tenantId, conversationId } = body;

    if (!tenantId) {
      return json({ error: 'tenantId is required' }, { status: 400 });
    }

    // Create or get session (now with A/B variant assignment)
    const { sessionId, variantAssignment } = await createOrGetSession(tenantId, conversationId);

    return json({
      ok: true,
      sessionId,
      conversationId,
      variantId: variantAssignment?.variantId,
      variantName: variantAssignment?.variantName,
      experimentId: variantAssignment?.experimentId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error starting session:', error);
    return json(
      { error: 'Failed to start session' },
      { status: 500 }
    );
  }
};
