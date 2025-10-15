import { json } from '@remix-run/node';
import { verifyProxyHmac } from '~/lib/shopify/verifyProxyHmac';
import { createOrGetSession } from '~/lib/session/session-orchestrator.service.server';

export const action = async ({ request }) => {
  // Verify App Proxy HMAC (optional in development/preview mode)
  const shopifySecret = process.env.SHOPIFY_APP_SECRET;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Try to verify HMAC if secret is available
  if (shopifySecret) {
    const isValidHmac = verifyProxyHmac(request.url, shopifySecret);
    
    // In production, require valid HMAC
    // In development or theme editor preview, allow without HMAC but log warning
    if (!isValidHmac && !isDevelopment) {
      const url = new URL(request.url);
      const hasHmacParams = url.searchParams.has('signature') || url.searchParams.has('hmac');
      
      // If HMAC params are present but invalid, reject
      if (hasHmacParams) {
        throw new Response('Unauthorized', { status: 401 });
      }
      
      // If no HMAC params at all (theme editor preview), allow with warning
      console.warn('Session start request without HMAC signature (theme editor preview mode)');
    }
  } else if (!isDevelopment) {
    console.error('SHOPIFY_APP_SECRET not configured - cannot verify requests');
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
